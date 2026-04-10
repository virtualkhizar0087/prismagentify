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

  // Fetch the current case to get its category, statutes, keywords
  const { data: currentCase, error: caseError } = await supabase
    .from('precedents')
    .select('law_category, statutes, keywords')
    .eq('id', id)
    .single()

  if (caseError || !currentCase) {
    return NextResponse.json({ cases: [] })
  }

  // Find related cases with same law_category, excluding current
  const { data: related, error } = await supabase
    .from('precedents')
    .select('id, case_name, citation, citation_type, court, court_code, year, law_category, law_subcategory, headnotes, is_landmark, outcome')
    .eq('law_category', currentCase.law_category)
    .neq('id', id)
    .order('is_landmark', { ascending: false })
    .order('year', { ascending: false })
    .limit(4)

  if (error) {
    return NextResponse.json({ cases: [] })
  }

  return NextResponse.json({ cases: related ?? [] })
}
