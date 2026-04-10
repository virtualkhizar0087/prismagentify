import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { compareContracts } from '@/lib/claude'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check plan — free users limited to 1 comparison
  const { data: profile } = await supabase.from('users').select('plan').eq('id', user.id).single()
  const plan = profile?.plan ?? 'free'

  try {
    const body = await req.json()
    const { contractAText, contractBText, contractAName, contractBName } = body

    if (!contractAText || !contractBText) {
      return NextResponse.json({ error: 'Both contract texts are required' }, { status: 400 })
    }

    const comparison = await compareContracts({
      contractAText,
      contractBText,
      contractAName: contractAName || 'Contract A',
      contractBName: contractBName || 'Contract B',
    })

    return NextResponse.json({ comparison, plan })
  } catch (err) {
    console.error('Compare error:', err)
    return NextResponse.json({ error: 'Comparison failed. Please try again.' }, { status: 500 })
  }
}
