import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('saved_precedents')
    .select('*, precedents(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch saved cases' }, { status: 500 })
  }

  // Group by folder
  const byFolder: Record<string, typeof data> = {}
  for (const item of data ?? []) {
    const folder = item.folder || 'General'
    if (!byFolder[folder]) byFolder[folder] = []
    byFolder[folder].push(item)
  }

  return NextResponse.json({
    saved: data ?? [],
    byFolder,
    total: data?.length ?? 0,
  })
}
