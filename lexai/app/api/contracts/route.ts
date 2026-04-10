import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeContract, extractDeadlines } from '@/lib/claude'
import { sendContractAnalysisCompleteEmail } from '@/lib/resend'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check plan limits
  const { data: profile } = await supabase
    .from('users')
    .select('plan, email')
    .eq('id', user.id)
    .single()

  const planLimits = { free: 3, starter: 25, pro: 100, team: -1 }
  const limit = planLimits[profile?.plan as keyof typeof planLimits] ?? 3

  if (limit !== -1) {
    const { count } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())

    if ((count ?? 0) >= limit) {
      return NextResponse.json(
        { error: 'Monthly contract analysis limit reached. Please upgrade your plan.' },
        { status: 429 }
      )
    }
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const pastedText = formData.get('text') as string | null

  let content = ''
  let filename = 'Pasted Contract'

  if (file) {
    filename = file.name
    content = await file.text()
  } else if (pastedText) {
    content = pastedText
  } else {
    return NextResponse.json({ error: 'No contract provided' }, { status: 400 })
  }

  if (content.length < 100) {
    return NextResponse.json(
      { error: 'Contract text is too short to analyze' },
      { status: 400 }
    )
  }

  // Truncate very large contracts to 100k chars (Claude can handle more but this is safe)
  const truncated = content.slice(0, 100_000)

  // Run Claude analysis + deadline extraction in parallel
  let analysis
  let deadlines: Awaited<ReturnType<typeof extractDeadlines>> = []
  try {
    ;[analysis, deadlines] = await Promise.all([
      analyzeContract(truncated),
      extractDeadlines(truncated).catch((e) => {
        console.error('Deadline extraction failed (non-fatal):', e)
        return []
      }),
    ])
  } catch (err: unknown) {
    console.error('Claude analysis error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: `AI analysis failed: ${message}` },
      { status: 502 }
    )
  }

  // Save contract to database
  const { data: contract, error: dbError } = await supabase
    .from('contracts')
    .insert({
      user_id: user.id,
      filename,
      content: truncated,
      risk_score: analysis.riskScore,
      risk_summary: analysis.riskSummary,
      key_clauses: analysis.keyClauses,
      red_flags: analysis.redFlags,
      missing_protections: analysis.missingProtections,
      recommendations: analysis.recommendations,
      plain_english_summary: analysis.plainEnglishSummary,
    })
    .select()
    .single()

  if (dbError) {
    console.error('DB error saving contract:', dbError)
    return NextResponse.json({ error: 'Failed to save contract' }, { status: 500 })
  }

  // Save extracted deadlines (fire and forget — non-fatal)
  if (deadlines.length > 0 && contract) {
    const deadlineRows = deadlines.map((d) => ({
      user_id: user.id,
      contract_id: contract.id,
      contract_name: filename,
      deadline_type: d.deadlineType,
      description: d.description,
      deadline_date: d.deadlineDate,
      notice_period_days: d.noticePeriodDays ?? null,
    }))

    supabase.from('deadlines').insert(deadlineRows).then(({ error }) => {
      if (error) console.error('DB error saving deadlines:', error)
    })
  }

  // Send email notification (fire and forget)
  if (profile?.email) {
    sendContractAnalysisCompleteEmail(
      profile.email,
      filename,
      analysis.riskScore
    ).catch(console.error)
  }

  return NextResponse.json({ contract, analysis, deadlines })
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: contracts, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ contracts })
}
