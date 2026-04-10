import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createElevenLabsAgent, createElevenLabsPhoneNumber, buildSystemPrompt } from '@/lib/elevenlabs'

// Map old Retell voice names → ElevenLabs voice IDs
const VOICE_FALLBACK: Record<string, string> = {
  sarah:  'EXAVITQu4vr4xnSDxMaL',
  rachel: '21m00Tcm4TlvDq8ikWAM',
  aria:   '9BWtsMINqrJLrRacOk9x',
  james:  'IKne3meq5aSn9XLyUdCD',
  george: 'JBFqnCBsd6RMkjVDRZzb',
}

function resolveVoiceId(storedId: string): string {
  // If it's a short Retell name like 'sarah', map to real ElevenLabs ID
  return VOICE_FALLBACK[storedId.toLowerCase()] ?? storedId
}

// POST /api/agents/[id]/provision
// Re-tries ElevenLabs provisioning for agents stuck in 'setup' status
export async function POST(_: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: agent } = await supabase
    .from('agents')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (agent.retell_agent_id) return NextResponse.json({ error: 'Already provisioned' }, { status: 400 })

  // Get base prompt template
  const { data: template } = await supabase
    .from('agent_templates')
    .select('system_prompt')
    .eq('vertical', agent.vertical)
    .single()

  // Build hours text from stored business_hours JSONB
  const hours = agent.business_hours as Record<string, { open: boolean; from: string; to: string }> | null
  const hoursText = hours
    ? Object.entries(hours)
        .filter(([, v]) => v.open)
        .map(([d, v]) => `${d}: ${v.from}–${v.to}`)
        .join(', ')
    : 'Please ask the owner'

  const systemPrompt = buildSystemPrompt({
    businessName: agent.name.replace(' AI', ''),
    vertical: agent.vertical,
    hours: hoursText,
    address: '',
    customInstructions: agent.custom_instructions || '',
    basePrompt: template?.system_prompt || `You are a helpful receptionist for ${agent.name}. Answer customer questions and take messages.`,
    language: (agent.language || 'en') as 'en' | 'es' | 'bilingual',
    smsFollowup: agent.sms_followup_enabled,
    menuItems: agent.menu_items,
    escalationPhone: agent.escalation_phone,
    opentableId: agent.opentable_id,
    mindbodySiteId: agent.mindbody_site_id,
    posType: agent.pos_type,
  })

  try {
    const elAgent = await createElevenLabsAgent({
      agentName: agent.name,
      voiceId: resolveVoiceId(agent.voice_id),
      systemPrompt,
      language: (agent.language || 'en') as 'en' | 'es' | 'bilingual',
    })

    // Get user phone for Twilio registration
    const { data: profile } = await supabase.from('users').select('phone').eq('id', user.id).single()

    const phone = await createElevenLabsPhoneNumber(
      elAgent.agent_id,
      profile?.phone || '',
      agent.name
    )

    const { data: updated } = await supabase
      .from('agents')
      .update({
        retell_agent_id: elAgent.agent_id,
        twilio_phone_number: phone.phone_number,
        status: 'active',
      })
      .eq('id', params.id)
      .select()
      .single()

    return NextResponse.json({ agent: updated })
  } catch (err: any) {
    console.error('ElevenLabs provisioning error:', err)
    return NextResponse.json({ error: err.message || 'Provisioning failed' }, { status: 500 })
  }
}
