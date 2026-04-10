import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Fetch the case
  const { data: precedent, error } = await supabase
    .from('precedents')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !precedent) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 })
  }

  // Increment view count (fire and forget)
  supabase
    .from('precedents')
    .update({ view_count: (precedent.view_count ?? 0) + 1 })
    .eq('id', id)
    .then(() => {})

  // Check if user has saved this case
  const { data: savedRecord } = await supabase
    .from('saved_precedents')
    .select('id, notes')
    .eq('user_id', user.id)
    .eq('precedent_id', id)
    .maybeSingle()

  return NextResponse.json({
    case: precedent,
    isSaved: !!savedRecord,
    savedNotes: savedRecord?.notes ?? null,
  })
}
