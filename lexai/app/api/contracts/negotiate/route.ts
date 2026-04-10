import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { negotiateClause } from '@/lib/claude'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Negotiation requires at least a Starter plan
  const { data: profile } = await supabase
    .from('users')
    .select('plan')
    .eq('id', user.id)
    .single()

  if (!profile || profile.plan === 'free') {
    return NextResponse.json(
      { error: 'Contract negotiation requires a paid plan. Please upgrade to Starter or above.' },
      { status: 403 }
    )
  }

  let body: { redFlag: string; contractText: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { redFlag, contractText } = body

  if (!redFlag || !contractText) {
    return NextResponse.json({ error: 'redFlag and contractText are required' }, { status: 400 })
  }

  try {
    const result = await negotiateClause({ redFlag, contractText })
    return NextResponse.json(result)
  } catch (err: unknown) {
    console.error('Negotiation error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Negotiation failed: ${message}` }, { status: 502 })
  }
}
