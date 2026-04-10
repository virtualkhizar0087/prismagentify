import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const {
    query,
    court,
    category,
    yearFrom,
    yearTo,
    landmarkOnly,
    limit = 20,
    offset = 0,
  } = await request.json()

  try {
    // If no query and no filters, return landmark cases
    if (!query?.trim() && !court && !category && !yearFrom && !yearTo && !landmarkOnly) {
      const { data, error, count } = await supabase
        .from('precedents')
        .select('*', { count: 'exact' })
        .eq('is_landmark', true)
        .order('year', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return NextResponse.json({ results: data ?? [], total: count ?? 0 })
    }

    // If there's a text query, use the search_precedents RPC
    if (query?.trim()) {
      const { data, error } = await supabase.rpc('search_precedents', {
        query_text: query.trim(),
        filter_court: court || null,
        filter_category: category || null,
        filter_year_from: yearFrom || null,
        filter_year_to: yearTo || null,
        filter_landmark: landmarkOnly || null,
        result_limit: limit,
        result_offset: offset,
      })

      if (error) throw error

      return NextResponse.json({
        results: data ?? [],
        total: data?.length ?? 0,
      })
    }

    // Filters only (no text query)
    let queryBuilder = supabase
      .from('precedents')
      .select('*', { count: 'exact' })

    if (court) queryBuilder = queryBuilder.eq('court_code', court)
    if (category) queryBuilder = queryBuilder.eq('law_category', category)
    if (yearFrom) queryBuilder = queryBuilder.gte('year', yearFrom)
    if (yearTo) queryBuilder = queryBuilder.lte('year', yearTo)
    if (landmarkOnly) queryBuilder = queryBuilder.eq('is_landmark', true)

    const { data, error, count } = await queryBuilder
      .order('is_landmark', { ascending: false })
      .order('year', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return NextResponse.json({ results: data ?? [], total: count ?? 0 })
  } catch (error: any) {
    console.error('Precedents search error:', error)
    return NextResponse.json({ error: 'Search failed', details: error.message }, { status: 500 })
  }
}
