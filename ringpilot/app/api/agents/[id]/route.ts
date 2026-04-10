import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteElevenLabsAgent, deleteElevenLabsPhoneNumber, updateElevenLabsAgent, buildSystemPrompt } from '@/lib/elevenlabs'
import { createClient as createAdminClient } from '@/lib/supabase/server'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const allowed = ['name', 'voice_id', 'business_hours', 'custom_instructions', 'status']
  const update = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))

  const { data, error } = await supabase
    .from('agents')
    .update(update)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  return NextResponse.json({ agent: data })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: agent } = await supabase
    .from('agents')
    .select('retell_agent_id, twilio_phone_number')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Release ElevenLabs resources
  if (agent.retell_agent_id) {
    deleteElevenLabsAgent(agent.retell_agent_id).catch(console.error)
  }
  if (agent.twilio_phone_number) {
    deleteElevenLabsPhoneNumber(agent.twilio_phone_number).catch(console.error)
  }

  await supabase.from('agents').delete().eq('id', params.id).eq('user_id', user.id)
  return NextResponse.json({ success: true })
}
