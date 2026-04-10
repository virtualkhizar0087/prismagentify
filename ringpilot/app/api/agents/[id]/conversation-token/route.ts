import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { makeElevenLabsAgentShareable } from '@/lib/elevenlabs'

// Returns the ElevenLabs agent_id (and makes it shareable so the browser widget works)
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify agent belongs to this user
  const { data: agent } = await supabase
    .from('agents')
    .select('retell_agent_id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!agent?.retell_agent_id) {
    return NextResponse.json({ error: 'Agent not found or not provisioned' }, { status: 404 })
  }

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 500 })

  // Make the agent shareable so the browser widget works with agent-id directly
  try {
    await makeElevenLabsAgentShareable(agent.retell_agent_id)
  } catch (e) {
    console.warn('Could not make agent shareable:', e)
    // Non-fatal — fall back to signed URL below
  }

  // Also get a signed URL as fallback (valid for ~1 hour)
  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agent.retell_agent_id}`,
      { headers: { 'xi-api-key': apiKey } }
    )
    if (res.ok) {
      const { signed_url } = await res.json()
      return NextResponse.json({ agentId: agent.retell_agent_id, signedUrl: signed_url })
    }
  } catch (e) {
    console.warn('Could not get signed URL:', e)
  }

  // Return agent-id only (widget will work since we made it shareable)
  return NextResponse.json({ agentId: agent.retell_agent_id })
}
