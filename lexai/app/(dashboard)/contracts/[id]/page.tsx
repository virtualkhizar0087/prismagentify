import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, FileText, AlertTriangle, ShieldCheck, Lightbulb, BookOpen, Bell, Download } from 'lucide-react'
import { formatDate, getRiskColor, getRiskLabel } from '@/lib/utils'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ContractDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: contract } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!contract) notFound()

  const { data: deadlines } = await supabase
    .from('deadlines')
    .select('*')
    .eq('contract_id', id)
    .order('deadline_date', { ascending: true })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  function daysUntil(dateStr: string) {
    const d = new Date(dateStr)
    d.setHours(0, 0, 0, 0)
    return Math.ceil((d.getTime() - today.getTime()) / 86400000)
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Back + header */}
      <div>
        <Link
          href="/contracts"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Contracts
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
              <FileText className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{contract.filename}</h1>
              <p className="text-sm text-gray-400">Analyzed {formatDate(contract.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`/api/contracts/${id}/report`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg bg-lexai-600 px-4 py-2 text-sm font-medium text-white hover:bg-lexai-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Download Report
            </a>
          </div>
          {contract.risk_score !== null && (
            <div className="text-right">
              <p className={`text-4xl font-bold ${getRiskColor(contract.risk_score)}`}>
                {contract.risk_score}
                <span className="text-xl">/100</span>
              </p>
              <p className={`text-sm font-semibold ${getRiskColor(contract.risk_score)}`}>
                {getRiskLabel(contract.risk_score)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Risk summary banner */}
      {contract.risk_summary && (
        <div
          className={`rounded-xl p-5 ${
            (contract.risk_score ?? 0) >= 70
              ? 'bg-red-50 ring-1 ring-red-200'
              : (contract.risk_score ?? 0) >= 40
              ? 'bg-amber-50 ring-1 ring-amber-200'
              : 'bg-emerald-50 ring-1 ring-emerald-200'
          }`}
        >
          <p className="text-sm font-medium text-gray-700">{contract.risk_summary}</p>
        </div>
      )}

      {/* Risk meter bar */}
      {contract.risk_score !== null && (
        <div className="rounded-xl bg-white p-5 ring-1 ring-gray-200">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Risk Score</span>
            <span className={`font-bold ${getRiskColor(contract.risk_score)}`}>
              {contract.risk_score} / 100
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-gray-100">
            <div
              className={`h-3 rounded-full transition-all ${
                contract.risk_score >= 70
                  ? 'bg-red-500'
                  : contract.risk_score >= 40
                  ? 'bg-amber-400'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${contract.risk_score}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-xs text-gray-400">
            <span>Low Risk</span>
            <span>Medium Risk</span>
            <span>High Risk</span>
          </div>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {/* Red flags */}
        <div className="rounded-xl bg-white p-5 ring-1 ring-gray-200">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <h3 className="font-semibold text-gray-900">Red Flags</h3>
            {contract.red_flags && contract.red_flags.length > 0 && (
              <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                {contract.red_flags.length}
              </span>
            )}
          </div>
          {contract.red_flags && contract.red_flags.length > 0 ? (
            <ul className="space-y-2">
              {contract.red_flags.map((flag, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                  {flag}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No major red flags found.</p>
          )}
        </div>

        {/* Missing protections */}
        <div className="rounded-xl bg-white p-5 ring-1 ring-gray-200">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-amber-500" />
            <h3 className="font-semibold text-gray-900">Missing Protections</h3>
            {contract.missing_protections && contract.missing_protections.length > 0 && (
              <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                {contract.missing_protections.length}
              </span>
            )}
          </div>
          {contract.missing_protections && contract.missing_protections.length > 0 ? (
            <ul className="space-y-2">
              {contract.missing_protections.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">All standard protections are present.</p>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {contract.recommendations && contract.recommendations.length > 0 && (
        <div className="rounded-xl bg-white p-5 ring-1 ring-gray-200">
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-lexai-500" />
            <h3 className="font-semibold text-gray-900">Recommendations</h3>
          </div>
          <ul className="space-y-2">
            {contract.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lexai-400" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Plain English summary */}
      {contract.plain_english_summary && (
        <div className="rounded-xl bg-gray-50 p-5 ring-1 ring-gray-200">
          <div className="mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-gray-500" />
            <h3 className="font-semibold text-gray-900">Plain English Summary</h3>
          </div>
          <p className="text-sm leading-relaxed text-gray-700">{contract.plain_english_summary}</p>
        </div>
      )}

      {/* Key clauses (legacy fallback) */}
      {!contract.recommendations && contract.key_clauses && contract.key_clauses.length > 0 && (
        <div className="rounded-xl bg-white p-5 ring-1 ring-gray-200">
          <h3 className="mb-3 font-semibold text-gray-900">Key Clauses</h3>
          <ul className="space-y-2">
            {contract.key_clauses.map((clause, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lexai-400" />
                {clause}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Deadlines */}
      {deadlines && deadlines.length > 0 && (
        <div className="rounded-xl bg-white p-5 ring-1 ring-gray-200">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-gray-500" />
              <h3 className="font-semibold text-gray-900">
                Contract Deadlines ({deadlines.length})
              </h3>
            </div>
            <Link href="/deadlines" className="text-xs text-lexai-600 hover:underline">
              View all deadlines
            </Link>
          </div>
          <div className="space-y-3">
            {deadlines.map((d) => {
              const days = daysUntil(d.deadline_date)
              const isPast = days < 0
              const isCritical = days >= 0 && days <= 7
              const isWarning = days > 7 && days <= 30
              return (
                <div
                  key={d.id}
                  className={`flex items-start justify-between rounded-lg px-4 py-3 ${
                    isPast
                      ? 'bg-gray-50'
                      : isCritical
                      ? 'bg-red-50'
                      : isWarning
                      ? 'bg-amber-50'
                      : 'bg-emerald-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Calendar
                      className={`h-4 w-4 shrink-0 ${
                        isPast ? 'text-gray-400' : isCritical ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-emerald-500'
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{d.description}</p>
                      <p className="text-xs text-gray-400">
                        {formatDate(d.deadline_date)} ·{' '}
                        <span className="capitalize">{d.deadline_type.replace('_', ' ')}</span>
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      isPast
                        ? 'bg-gray-200 text-gray-500'
                        : isCritical
                        ? 'bg-red-100 text-red-700'
                        : isWarning
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {isPast ? 'Passed' : days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Negotiate CTA */}
      <div className="rounded-xl bg-lexai-50 p-5 ring-1 ring-lexai-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold text-lexai-900">Want to negotiate risky clauses?</p>
            <p className="mt-1 text-sm text-lexai-700">
              Re-upload this contract on the Contracts page to use AI negotiation on each red flag.
            </p>
          </div>
          <Link
            href="/contracts"
            className="shrink-0 rounded-lg bg-lexai-600 px-4 py-2 text-sm font-medium text-white hover:bg-lexai-700 transition-colors"
          >
            Go to Contracts
          </Link>
        </div>
      </div>
    </div>
  )
}
