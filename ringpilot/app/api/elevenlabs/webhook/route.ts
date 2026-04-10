import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendCallSummaryEmail } from '@/lib/resend'

// ElevenLabs Conversational AI sends webhook events after each conversation
// POST /api/elevenlabs/webhook
// Configure this URL in your ElevenLabs ConvAI dashboard under Agent → Webhooks
export async function POST(request: Request) {
  const body = await request.json()

  // ElevenLabs ConvAI post-call webhook payload shape:
  // { type, conversation_id, agent_id, status, metadata, transcript, analysis, conversation_duration_secs }
  const {
    type,
    conversation_id,
    agent_id: elAgentId,
    metadata,
    transcript,
    analysis,
    conversation_duration_secs,
  } = body

  // We only handle the post-call summary event
  // ElevenLabs fires: "conversation_ended" or "post_call_transcription"
  if (!conversation_id && !elAgentId) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  // Look up our agent by its ElevenLabs agent_id (stored in retell_agent_id column)
  const { data: agent } = await supabase
    .from('agents')
    .select('id, user_id, name, sms_followup_enabled, vertical')
    .eq('retell_agent_id', elAgentId)
    .single()

  if (!agent) {
    // Unknown agent — acknowledge but don't error
    return NextResponse.json({ received: true })
  }

  // Extract phone numbers from metadata
  const fromNumber: string | null = metadata?.phone_call?.from ?? metadata?.caller_id ?? null
  const toNumber: string | null = metadata?.phone_call?.to ?? metadata?.called_number ?? null

  // Build transcript text
  const transcriptText = Array.isArray(transcript)
    ? transcript
        .map((t: any) => `${t.role === 'agent' ? 'AI' : 'Caller'}: ${t.message ?? t.text ?? ''}`)
        .join('\n')
    : typeof transcript === 'string'
    ? transcript
    : null

  // Summary from ElevenLabs analysis block
  const summary: string | null = analysis?.transcript_summary ?? analysis?.summary ?? null
  const sentimentRaw: string | null = analysis?.user_sentiment ?? analysis?.sentiment ?? null
  const sentiment = normalizeSentiment(sentimentRaw)
  const duration = conversation_duration_secs ? Math.round(conversation_duration_secs) : null

  // Upsert the call record (insert on first event, update on subsequent)
  const { data: existingCall } = await supabase
    .from('calls')
    .select('id')
    .eq('call_id', conversation_id)
    .maybeSingle()

  if (existingCall) {
    // Update existing row with final data
    await supabase
      .from('calls')
      .update({
        duration_seconds: duration,
        transcript: transcriptText,
        summary,
        sentiment,
      })
      .eq('call_id', conversation_id)
  } else {
    // Insert new row
    await supabase.from('calls').insert({
      agent_id: agent.id,
      user_id: agent.user_id,
      call_id: conversation_id,
      from_number: fromNumber,
      to_number: toNumber,
      duration_seconds: duration,
      transcript: transcriptText,
      summary,
      sentiment,
    })
  }

  // Increment monthly call count
  await supabase.rpc('increment_calls', { agent_id: agent.id }).then(null, () => {})

  // Email summary to owner
  if (summary) {
    const { data: userProfile } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', agent.user_id)
      .single()

    if (userProfile?.email) {
      sendCallSummaryEmail(
        userProfile.email,
        summary,
        agent.name || 'Your AI',
        fromNumber || 'Unknown caller'
      ).catch(console.error)
    }
  }

  // SMS follow-up to caller
  if (agent.sms_followup_enabled && fromNumber) {
    sendSmsFollowup(
      fromNumber,
      agent.name || 'Your AI Receptionist',
      summary,
      agent.vertical
    ).catch(console.error)
  }

  // Smart notification
  if (summary) {
    const lower = summary.toLowerCase()
    const isBooking = lower.includes('reservation') || lower.includes('book') || lower.includes('appointment')
    const isLead = lower.includes('interest') || lower.includes('trial') || lower.includes('membership')
    const notifType = isBooking ? 'booking' : isLead ? 'lead' : sentiment === 'negative' ? 'missed_call' : null

    if (notifType) {
      await supabase.from('notifications').insert({
        user_id: agent.user_id,
        type: notifType,
        message: buildNotifMessage(notifType, fromNumber, summary),
      }).then(null, console.error)
    }
  }

  return NextResponse.json({ received: true })
}

function normalizeSentiment(s?: string | null): 'positive' | 'neutral' | 'negative' | null {
  if (!s) return null
  const lower = s.toLowerCase()
  if (lower.includes('positive')) return 'positive'
  if (lower.includes('negative')) return 'negative'
  return 'neutral'
}

function buildNotifMessage(type: string, fromNumber: string | null, summary: string): string {
  const caller = fromNumber || 'A caller'
  const short = summary.length > 80 ? summary.slice(0, 80) + '…' : summary
  if (type === 'booking') return `New booking from ${caller}: ${short}`
  if (type === 'lead') return `New lead from ${caller}: ${short}`
  return `Missed call from ${caller}`
}

async function sendSmsFollowup(
  toNumber: string,
  agentName: string,
  summary: string | null,
  vertical: string
): Promise<void> {
  const sid   = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from  = process.env.TWILIO_FROM_NUMBER

  if (!sid || !token || !from || sid === 'ACplaceholder') return

  const body = vertical === 'restaurant' ? buildRestaurantSms(summary) : buildGymSms(summary)
  const params = new URLSearchParams({ From: from, To: toNumber, Body: body })

  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })
}

function buildRestaurantSms(summary: string | null): string {
  if (summary?.toLowerCase().includes('reservation')) {
    return `Thanks for calling! Your reservation request has been noted. We'll confirm the details shortly. Reply STOP to opt out.`
  }
  return `Thanks for calling! If you had any questions, reply here and we'll get back to you. Reply STOP to opt out.`
}

function buildGymSms(summary: string | null): string {
  if (summary?.toLowerCase().includes('trial') || summary?.toLowerCase().includes('membership')) {
    return `Thanks for your interest! Your free trial request has been noted. We'll be in touch shortly. Reply STOP to opt out.`
  }
  return `Thanks for calling! Feel free to reply here with any questions. We'd love to help you reach your fitness goals. Reply STOP to opt out.`
}
