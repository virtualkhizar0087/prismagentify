import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Props {
  params: Promise<{ id: string }>
}

export async function GET(_req: Request, { params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: contract } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const score = contract.risk_score ?? 0
  const riskColor = score >= 70 ? '#dc2626' : score >= 40 ? '#d97706' : '#16a34a'
  const riskBg = score >= 70 ? '#fef2f2' : score >= 40 ? '#fffbeb' : '#f0fdf4'
  const riskLabel = score >= 70 ? 'High Risk' : score >= 40 ? 'Medium Risk' : 'Low Risk'
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  function listItems(items: string[] | null, color: string): string {
    if (!items || items.length === 0) return '<p style="color:#6b7280;font-style:italic;">None identified</p>'
    return `<ul style="margin:0;padding-left:20px;">${items.map(i => `<li style="margin-bottom:6px;color:#374151;">${i}</li>`).join('')}</ul>`
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Contract Analysis Report — ${contract.filename}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #111827; background: #fff; }
    .page { max-width: 800px; margin: 0 auto; padding: 48px 40px; }

    /* Print */
    @media print {
      body { background: #fff; }
      .no-print { display: none !important; }
      .page { padding: 20px 24px; }
      .section { page-break-inside: avoid; }
    }

    /* Header */
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 2px solid #e5e7eb; margin-bottom: 32px; }
    .logo { display: flex; align-items: center; gap: 10px; }
    .logo-icon { width: 36px; height: 36px; background: #4f46e5; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
    .logo-text { font-size: 22px; font-weight: 800; color: #4f46e5; }
    .meta { text-align: right; font-size: 13px; color: #6b7280; }
    .meta strong { display: block; font-size: 15px; color: #111827; margin-bottom: 2px; }

    /* Risk score */
    .risk-banner { border-radius: 12px; padding: 28px 32px; margin-bottom: 32px; display: flex; align-items: center; justify-content: space-between; }
    .risk-score { font-size: 64px; font-weight: 900; line-height: 1; }
    .risk-label { font-size: 18px; font-weight: 700; margin-top: 4px; }
    .risk-summary { font-size: 15px; color: #374151; line-height: 1.6; max-width: 480px; }

    /* Meter */
    .meter-wrap { margin: 24px 0; }
    .meter-bar-bg { height: 10px; background: #e5e7eb; border-radius: 99px; overflow: hidden; }
    .meter-bar { height: 10px; border-radius: 99px; }
    .meter-labels { display: flex; justify-content: space-between; font-size: 11px; color: #9ca3af; margin-top: 4px; }

    /* Sections */
    .section { margin-bottom: 28px; }
    .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #f3f4f6; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .card { background: #f9fafb; border-radius: 10px; padding: 20px; }

    /* Plain English */
    .plain-card { background: #f9fafb; border-radius: 10px; padding: 20px; font-size: 15px; color: #374151; line-height: 1.7; }

    /* Footer */
    .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }

    /* Print button */
    .print-btn { position: fixed; bottom: 24px; right: 24px; background: #4f46e5; color: #fff; border: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(79,70,229,0.3); }
    .print-btn:hover { background: #4338ca; }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="logo">
        <div class="logo-icon">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/>
          </svg>
        </div>
        <span class="logo-text">Court of AI</span>
      </div>
      <div class="meta">
        <strong>${contract.filename}</strong>
        Contract Analysis Report<br/>
        Generated ${today}
      </div>
    </div>

    <!-- Risk Score Banner -->
    <div class="risk-banner" style="background:${riskBg};">
      <div>
        <div class="risk-score" style="color:${riskColor};">${score}<span style="font-size:32px;">/100</span></div>
        <div class="risk-label" style="color:${riskColor};">${riskLabel}</div>
      </div>
      ${contract.risk_summary ? `<div class="risk-summary">${contract.risk_summary}</div>` : ''}
    </div>

    <!-- Risk Meter -->
    <div class="meter-wrap section">
      <div class="meter-bar-bg">
        <div class="meter-bar" style="width:${score}%;background:${riskColor};"></div>
      </div>
      <div class="meter-labels"><span>0 — Low Risk</span><span>50 — Medium</span><span>100 — High Risk</span></div>
    </div>

    <!-- Red Flags + Missing Protections -->
    <div class="grid-2 section">
      <div class="card">
        <div class="section-title" style="color:#dc2626;">🚩 Red Flags (${(contract.red_flags ?? []).length})</div>
        ${listItems(contract.red_flags, '#dc2626')}
      </div>
      <div class="card">
        <div class="section-title" style="color:#d97706;">⚠️ Missing Protections (${(contract.missing_protections ?? []).length})</div>
        ${listItems(contract.missing_protections, '#d97706')}
      </div>
    </div>

    <!-- Recommendations -->
    ${contract.recommendations && contract.recommendations.length > 0 ? `
    <div class="section">
      <div class="section-title">💡 Recommendations</div>
      <div class="card">
        ${listItems(contract.recommendations, '#4f46e5')}
      </div>
    </div>` : ''}

    <!-- Plain English -->
    ${contract.plain_english_summary ? `
    <div class="section">
      <div class="section-title">📖 Plain English Summary</div>
      <div class="plain-card">${contract.plain_english_summary}</div>
    </div>` : ''}

    <!-- Key Clauses (legacy) -->
    ${!contract.recommendations && contract.key_clauses && contract.key_clauses.length > 0 ? `
    <div class="section">
      <div class="section-title">📋 Key Clauses</div>
      <div class="card">
        ${listItems(contract.key_clauses, '#4f46e5')}
      </div>
    </div>` : ''}

    <!-- Footer -->
    <div class="footer">
      <p><strong>Disclaimer:</strong> This analysis is AI-generated by Court of AI and is for informational purposes only. It does not constitute legal advice. Always consult a licensed attorney before signing or relying on any contract.</p>
      <p style="margin-top:8px;">Report generated by Court of AI — AI Legal Co-Pilot | ${today}</p>
    </div>
  </div>

  <button class="print-btn no-print" onclick="window.print()">Save as PDF</button>
</body>
</html>`

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
