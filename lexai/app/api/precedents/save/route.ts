import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { precedentId, notes, folder = 'General', action } = await request.json()

  if (!precedentId) {
    return NextResponse.json({ error: 'precedentId is required' }, { status: 400 })
  }

  try {
    if (action === 'unsave') {
      const { error } = await supabase
        .from('saved_precedents')
        .delete()
        .eq('user_id', user.id)
        .eq('precedent_id', precedentId)

      if (error) throw error
      return NextResponse.json({ saved: false })
    }

    if (action === 'update') {
      const { error } = await supabase
        .from('saved_precedents')
        .update({ notes: notes ?? null, folder: folder ?? 'General' })
        .eq('user_id', user.id)
        .eq('precedent_id', precedentId)

      if (error) throw error
      return NextResponse.json({ saved: true, updated: true })
    }

    // Default: save
    const { error } = await supabase
      .from('saved_precedents')
      .upsert(
        {
          user_id: user.id,
          precedent_id: precedentId,
          notes: notes ?? null,
          folder: folder ?? 'General',
        },
        { onConflict: 'user_id,precedent_id' }
      )

    if (error) throw error
    return NextResponse.json({ saved: true })
  } catch (error: any) {
    console.error('Save precedent error:', error)
    return NextResponse.json({ error: 'Failed to save', details: error.message }, { status: 500 })
  }
}
