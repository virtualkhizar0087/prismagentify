import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createElevenLabsAgent, createElevenLabsPhoneNumber, buildSystemPrompt } from '@/lib/elevenlabs'
import { sendWelcomeEmail } from '@/lib/resend'
import { getCallLimit } from '@/lib/stripe'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()

  // Enforce agent limit per plan
  const agentLimits: Record<string, number> = { free: 1, starter: 1, pro: 3, agency: 10 }
  const limit = agentLimits[profile?.plan ?? 'free'] ?? 1
  const { count } = await supabase.from('agents').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
  if ((count ?? 0) >= limit) {
    return NextResponse.json({ error: `Your plan allows up to ${limit} agent(s). Please upgrade to create more.` }, { status: 429 })
  }

  const body = await request.json()
  const { vertical, businessName, ownerPhone, address, website, hours, voiceId, customInstructions,
    language, smsFollowup, menuItems, escalationPhone } = body

  if (!vertical || !businessName || !ownerPhone) {
    return NextResponse.json({ error: 'Missing required fields: vertical, businessName, ownerPhone' }, { status: 400 })
  }

  // Get base prompt template
  const { data: template } = await supabase
    .from('agent_templates')
    .select('system_prompt')
    .eq('vertical', vertical)
    .single()

  // Build the AI system prompt
  const hoursText = Object.entries(hours || {})
    .filter(([, v]: any) => v.open)
    .map(([d, v]: any) => `${d}: ${v.from}–${v.to}`)
    .join(', ')

  const systemPrompt = buildSystemPrompt({
    businessName,
    vertical,
    hours: hoursText || 'Please ask the owner',
    address: address || '',
    customInstructions: customInstructions || '',
    basePrompt: template?.system_prompt || `You are a helpful receptionist for ${businessName}. Answer customer questions and take messages.`,
    language: language || 'en',
    smsFollowup: !!smsFollowup,
    menuItems: menuItems || null,
    escalationPhone: escalationPhone || null,
  })

  // Create agent in DB first (without Retell IDs) so we have an ID
  const { data: agent, error: dbError } = await supabase
    .from('agents')
    .insert({
      user_id: user.id,
      name: `${businessName} AI`,
      vertical,
      voice_id: voiceId || 'EXAVITQu4vr4xnSDxMaL',
      business_hours: hours,
      custom_instructions: customInstructions,
      language: language || 'en',
      sms_followup_enabled: !!smsFollowup,
      menu_items: menuItems || null,
      escalation_phone: escalationPhone || null,
      status: 'setup',
    })
    .select()
    .single()

  if (dbError || !agent) {
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 })
  }

  // Try to provision ElevenLabs agent + phone number
  try {
    const elAgent = await createElevenLabsAgent({
      agentName: `${businessName} AI`,
      voiceId: voiceId || 'EXAVITQu4vr4xnSDxMaL', // Sarah default
      systemPrompt,
      language: body.language || 'en',
    })

    const phone = await createElevenLabsPhoneNumber(
      elAgent.agent_id,
      body.ownerPhone,           // Twilio number to register
      `${businessName} AI`
    )

    await supabase.from('agents').update({
      retell_agent_id: elAgent.agent_id,   // reuse column for ElevenLabs agent_id
      twilio_phone_number: phone.phone_number,
      status: 'active',
    }).eq('id', agent.id)

    agent.retell_agent_id = elAgent.agent_id
    agent.twilio_phone_number = phone.phone_number
    agent.status = 'active'
  } catch (err) {
    // ElevenLabs provisioning failed — agent stays in 'setup' status
    console.error('ElevenLabs provisioning failed:', err)
  }

  // Update user's business info on first agent
  supabase.from('users').update({
    business_name: businessName,
    business_type: vertical,
    phone: ownerPhone,
  }).eq('id', user.id).then(() => {})

  // Send welcome email
  if (profile?.email) {
    sendWelcomeEmail(profile.email, profile.full_name || '').catch(console.error)
  }

  return NextResponse.json({ agent })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: agents } = await supabase
    .from('agents')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ agents })
}
