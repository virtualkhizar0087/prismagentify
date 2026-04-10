import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Bell, Calendar, AlertTriangle, Clock, CheckCircle, FileText } from 'lucide-react'

type DeadlineRow = {
  id: string
  contract_id: string | null
  contract_name: string
  deadline_type: 'renewal' | 'termination_notice' | 'payment' | 'expiry' | 'other'
  description: string
  deadline_date: string
  notice_period_days: number | null
  reminder_30_sent: boolean
  reminder_7_sent: boolean
  reminder_1_sent: boolean
  created_at: string
}

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

const typeConfig = {
  renewal: { label: 'Auto-Renewal', color: 'bg-blue-100 text-blue-700', icon: '🔄' },
  termination_notice: { label: 'Notice Window', color: 'bg-orange-100 text-orange-700', icon: '📋' },
  payment: { label: 'Payment Due', color: 'bg-purple-100 text-purple-700', icon: '💳' },
  expiry: { label: 'Contract Expiry', color: 'bg-red-100 text-red-700', icon: '⏰' },
  other: { label: 'Deadline', color: 'bg-gray-100 text-gray-600', icon: '📌' },
}

function UrgencyBadge({ days }: { days: number }) {
  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">
        <CheckCircle className="h-3 w-3" /> Passed
      </span>
    )
  }
  if (days <= 7) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700 animate-pulse">
        <AlertTriangle className="h-3 w-3" /> {days === 0 ? 'Today!' : `${days}d`}
      </span>
    )
  }
  if (days <= 30) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
        <Clock className="h-3 w-3" /> {days}d
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      <Calendar className="h-3 w-3" /> {days}d
    </span>
  )
}

export default async function DeadlinesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: deadlines } = await supabase
    .from('deadlines')
    .select('*')
    .eq('user_id', user.id)
    .order('deadline_date', { ascending: true })

  const rows = (deadlines ?? []) as DeadlineRow[]

  // Split into upcoming vs past
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const upcoming = rows.filter((d) => new Date(d.deadline_date) >= today)
  const past = rows.filter((d) => new Date(d.deadline_date) < today)

  // Stats
  const criticalCount = upcoming.filter((d) => daysUntil(d.deadline_date) <= 7).length
  const thisMonthCount = upcoming.filter((d) => daysUntil(d.deadline_date) <= 30).length
  const totalUpcoming = upcoming.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Contract Deadlines</h1>
        <p className="mt-1 text-sm text-gray-500">
          Key dates extracted automatically from your contracts — renewals, notices, payments, and more.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-red-50 p-5 ring-1 ring-red-100">
          <p className="text-sm font-medium text-red-600">Critical (≤7 days)</p>
          <p className="mt-1 text-4xl font-bold text-red-700">{criticalCount}</p>
        </div>
        <div className="rounded-xl bg-amber-50 p-5 ring-1 ring-amber-100">
          <p className="text-sm font-medium text-amber-600">This Month (≤30 days)</p>
          <p className="mt-1 text-4xl font-bold text-amber-700">{thisMonthCount}</p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-5 ring-1 ring-emerald-100">
          <p className="text-sm font-medium text-emerald-600">Total Upcoming</p>
          <p className="mt-1 text-4xl font-bold text-emerald-700">{totalUpcoming}</p>
        </div>
      </div>

      {/* Upcoming deadlines */}
      <div>
        <h2 className="mb-3 text-base font-semibold text-gray-800">
          Upcoming Deadlines
          {totalUpcoming > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-400">({totalUpcoming})</span>
          )}
        </h2>

        {upcoming.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
            <Bell className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="font-medium text-gray-500">No upcoming deadlines</p>
            <p className="mt-1 text-sm text-gray-400">
              Upload a contract on the{' '}
              <a href="/contracts" className="text-lexai-600 hover:underline">
                Contracts page
              </a>{' '}
              — Court of AI will automatically extract key dates.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {upcoming.map((d) => {
              const days = daysUntil(d.deadline_date)
              const cfg = typeConfig[d.deadline_type] ?? typeConfig.other
              const isUrgent = days <= 7

              return (
                <li
                  key={d.id}
                  className={`rounded-xl border p-4 transition-shadow hover:shadow-sm ${
                    isUrgent
                      ? 'border-red-200 bg-red-50'
                      : days <= 30
                      ? 'border-amber-100 bg-amber-50/40'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.color}`}
                        >
                          {cfg.icon} {cfg.label}
                        </span>
                        {d.notice_period_days && (
                          <span className="text-xs text-gray-400">
                            ⚠️ {d.notice_period_days}-day notice required
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900">{d.description}</p>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
                        <FileText className="h-3 w-3" />
                        <span className="truncate">{d.contract_name}</span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <UrgencyBadge days={days} />
                      <p className="text-xs text-gray-400">
                        {new Date(d.deadline_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Past deadlines (collapsed) */}
      {past.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-gray-400 hover:text-gray-600 select-none">
            Show {past.length} past deadline{past.length !== 1 ? 's' : ''}
          </summary>
          <ul className="mt-3 space-y-2">
            {past.map((d) => {
              const cfg = typeConfig[d.deadline_type] ?? typeConfig.other
              return (
                <li
                  key={d.id}
                  className="rounded-xl border border-gray-100 bg-gray-50 p-4 opacity-60"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.color} mb-1`}
                      >
                        {cfg.icon} {cfg.label}
                      </span>
                      <p className="text-sm text-gray-600">{d.description}</p>
                      <p className="mt-0.5 text-xs text-gray-400 truncate">{d.contract_name}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <UrgencyBadge days={daysUntil(d.deadline_date)} />
                      <p className="mt-1 text-xs text-gray-400">
                        {new Date(d.deadline_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </details>
      )}
    </div>
  )
}
