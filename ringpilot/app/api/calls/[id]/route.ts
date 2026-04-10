import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: call } = await supabase
    .from('calls')
    .select('*, agents(name, vertical)')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!call) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ call })
}
