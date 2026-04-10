import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendCallSummaryEmail } from '@/lib/resend'

// Retell sends webhook events when calls start, end, and are analyzed
export async function POST(request: Request) {
  const body = await request.json()
  const { event, call } = body

  if (!call?.call_id) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  if (event === 'call_started') {
    const { data: agent } = await supabase
      .from('agents')
      .select('id, user_id')
      .eq('twilio_phone_number', call.to_number)
      .single()

    if (agent) {
      await supabase.from('calls').insert({
        agent_id: agent.id,
        user_id: agent.user_id,
        call_id: call.call_id,
        from_number: call.from_number,
        to_number: call.to_number,
      })
    }
  }

  if (event === 'call_ended') {
    const transcript = call.transcript
      ? call.transcript.map((t: any) => `${t.role}: ${t.content}`).join('\n')
      : null

    await supabase
      .from('calls')
      .update({
        duration_seconds: call.duration_ms ? Math.round(call.duration_ms / 1000) : null,
        transcript,
        recording_url: call.recording_url || null,
      })
      .eq('call_id', call.call_id)

    // Increment monthly call count
    const { data: callRow } = await supabase
      .from('calls')
      .select('agent_id')
      .eq('call_id', call.call_id)
      .single()

    if (callRow) {
      await supabase.rpc('increment_calls', { agent_id: callRow.agent_id }).then(null, () => {})
    }
  }

  if (event === 'call_analyzed') {
    const summary = call.call_analysis?.call_summary || null
    const sentiment = normalizeSentiment(call.call_analysis?.user_sentiment)

    const { data: updated } = await supabase
      .from('calls')
      .update({ summary, sentiment })
      .eq('call_id', call.call_id)
      .select('user_id, from_number, agent_id')
      .single()

    if (updated) {
      const [{ data: userProfile }, { data: agent }] = await Promise.all([
        supabase.from('users').select('email, full_name').eq('id', updated.user_id).single(),
        supabase.from('agents').select('name, sms_followup_enabled, vertical').eq('id', updated.agent_id).single(),
      ])

      // Email summary to owner
      if (userProfile?.email && summary) {
        sendCallSummaryEmail(
          userProfile.email,
          summary,
          agent?.name || 'Your AI',
          updated.from_number || 'Unknown caller'
        ).catch(console.error)
      }

      // SMS follow-up to caller
      if (agent?.sms_followup_enabled && updated.from_number) {
        sendSmsFollowup(
          updated.from_number,
          agent.name || 'Your AI Receptionist',
          summary,
          agent.vertical
        ).catch(console.error)
      }

      // Create notification for missed call or booking detected in summary
      if (summary) {
        const lowerSummary = summary.toLowerCase()
        const isBooking = lowerSummary.includes('reservation') || lowerSummary.includes('book') || lowerSummary.includes('appointment')
        const isLead = lowerSummary.includes('interest') || lowerSummary.includes('trial') || lowerSummary.includes('membership')

        const notifType = isBooking ? 'booking' : isLead ? 'lead' : sentiment === 'negative' ? 'missed_call' : null
        if (notifType) {
          await supabase.from('notifications').insert({
            user_id: updated.user_id,
            type: notifType,
            message: buildNotifMessage(notifType, updated.from_number, summary),
          }).then(null, console.error)
        }
      }
    }
  }

  return NextResponse.json({ received: true })
}

function normalizeSentiment(s?: string): 'positive' | 'neutral' | 'negative' | null {
  if (!s) return null
  const lower = s.toLowerCase()
  if (lower.includes('positive')) return 'positive'
  if (lower.includes('negative')) return 'negative'
  return 'neutral'
}

function buildNotifMessage(type: string, fromNumber: string | null, summary: string): string {
  const caller = fromNumber ? fromNumber : 'A caller'
  const shortSummary = summary.length > 80 ? summary.slice(0, 80) + '…' : summary
  if (type === 'booking') return `New booking from ${caller}: ${shortSummary}`
  if (type === 'lead') return `New lead from ${caller}: ${shortSummary}`
  return `Missed call from ${caller}`
}

async function sendSmsFollowup(
  toNumber: string,
  agentName: string,
  summary: string | null,
  vertical: string
): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_FROM_NUMBER

  if (!sid || !token || !from || sid.startsWith('AC_placeholder') || sid === 'ACplaceholder') return

  const body = vertical === 'restaurant'
    ? buildRestaurantSms(summary)
    : buildGymSms(summary)

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
  return `Thanks for calling! If you had any questions we couldn't fully answer, reply to this message and we'll get back to you. Reply STOP to opt out.`
}

function buildGymSms(summary: string | null): string {
  if (summary?.toLowerCase().includes('trial') || summary?.toLowerCase().includes('membership')) {
    return `Thanks for your interest! Your free trial request has been noted. We'll be in touch shortly to confirm your visit. Reply STOP to opt out.`
  }
  return `Thanks for calling! Feel free to reply here with any questions. We'd love to help you reach your fitness goals. Reply STOP to opt out.`
}
