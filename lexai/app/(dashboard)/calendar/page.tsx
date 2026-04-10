import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CalendarDays, AlertTriangle, Clock, CheckCircle, ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import Link from 'next/link'

type DeadlineRow = {
  id: string
  contract_id: string | null
  contract_name: string
  deadline_type: 'renewal' | 'termination_notice' | 'payment' | 'expiry' | 'other'
  description: string
  deadline_date: string
  notice_period_days: number | null
}

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

const typeConfig = {
  renewal: { label: 'Auto-Renewal', dot: 'bg-blue-500' },
  termination_notice: { label: 'Notice Window', dot: 'bg-orange-500' },
  payment: { label: 'Payment Due', dot: 'bg-purple-500' },
  expiry: { label: 'Contract Expiry', dot: 'bg-red-500' },
  other: { label: 'Deadline', dot: 'bg-gray-400' },
}

function getUrgencyClass(days: number): string {
  if (days < 0) return 'border-gray-200 bg-gray-50'
  if (days <= 7) return 'border-red-200 bg-red-50'
  if (days <= 30) return 'border-orange-200 bg-orange-50'
  return 'border-blue-100 bg-blue-50'
}

function getUrgencyBadge(days: number) {
  if (days < 0) return { label: 'Passed', cls: 'bg-gray-100 text-gray-500', icon: <CheckCircle className="h-3 w-3" /> }
  if (days === 0) return { label: 'TODAY', cls: 'bg-red-100 text-red-700', icon: <AlertTriangle className="h-3 w-3" /> }
  if (days <= 7) return { label: `${days}d left`, cls: 'bg-red-100 text-red-700', icon: <AlertTriangle className="h-3 w-3" /> }
  if (days <= 30) return { label: `${days}d left`, cls: 'bg-orange-100 text-orange-700', icon: <Clock className="h-3 w-3" /> }
  return { label: `${days}d left`, cls: 'bg-blue-100 text-blue-700', icon: <Clock className="h-3 w-3" /> }
}

function buildCalendarGrid(year: number, month: number, deadlineMap: Map<string, DeadlineRow[]>) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()
  const cells: { day: number | null; deadlines: DeadlineRow[]; isToday: boolean; isPast: boolean }[] = []

  for (let i = 0; i < firstDay; i++) cells.push({ day: null, deadlines: [], isToday: false, isPast: false })

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d
    const isPast = new Date(dateStr) < today && !isToday
    cells.push({ day: d, deadlines: deadlineMap.get(dateStr) ?? [], isToday, isPast })
  }

  return cells
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const year = searchParams.year ? parseInt(searchParams.year) : now.getFullYear()
  const month = searchParams.month ? parseInt(searchParams.month) : now.getMonth()

  const startDate = new Date(year, month, 1).toISOString().slice(0, 10)
  const endDate = new Date(year, month + 1, 0).toISOString().slice(0, 10)

  const { data: deadlines } = await supabase
    .from('deadlines')
    .select('*')
    .eq('user_id', user.id)
    .gte('deadline_date', startDate)
    .lte('deadline_date', endDate)
    .order('deadline_date')

  // Also get all upcoming deadlines for the sidebar
  const { data: upcoming } = await supabase
    .from('deadlines')
    .select('*')
    .eq('user_id', user.id)
    .gte('deadline_date', now.toISOString().slice(0, 10))
    .order('deadline_date')
    .limit(10)

  const deadlineMap = new Map<string, DeadlineRow[]>()
  for (const d of deadlines ?? []) {
    const key = d.deadline_date.slice(0, 10)
    if (!deadlineMap.has(key)) deadlineMap.set(key, [])
    deadlineMap.get(key)!.push(d)
  }

  const cells = buildCalendarGrid(year, month, deadlineMap)

  const prevMonth = month === 0 ? 11 : month - 1
  const prevYear = month === 0 ? year - 1 : year
  const nextMonth = month === 11 ? 0 : month + 1
  const nextYear = month === 11 ? year + 1 : year

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Legal Calendar</h1>
          <p className="mt-1 text-gray-500">All contract deadlines in one view.</p>
        </div>
        <Link
          href="/deadlines"
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <FileText className="h-4 w-4" />
          List View
        </Link>
      </div>

      <div className="flex gap-6">
        {/* Calendar */}
        <div className="flex-1 rounded-xl bg-white ring-1 ring-gray-200 overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <Link
              href={`/calendar?month=${prevMonth}&year=${prevYear}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-gray-500" />
            </Link>
            <h2 className="text-lg font-semibold text-gray-900">
              {MONTH_NAMES[month]} {year}
            </h2>
            <Link
              href={`/calendar?month=${nextMonth}&year=${nextYear}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-gray-500" />
            </Link>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAY_NAMES.map((d) => (
              <div key={d} className="py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {cells.map((cell, i) => (
              <div
                key={i}
                className={`min-h-[90px] border-b border-r border-gray-100 p-2 last:border-r-0 ${
                  cell.isToday ? 'bg-lexai-50' : cell.isPast ? 'bg-gray-50/50' : ''
                }`}
              >
                {cell.day && (
                  <>
                    <div className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                      cell.isToday ? 'bg-lexai-600 text-white' : 'text-gray-700'
                    }`}>
                      {cell.day}
                    </div>
                    <div className="space-y-1">
                      {cell.deadlines.slice(0, 2).map((dl) => (
                        <div
                          key={dl.id}
                          className={`flex items-center gap-1 rounded px-1 py-0.5 text-[10px] font-medium leading-tight ${
                            daysUntil(dl.deadline_date) <= 7 ? 'bg-red-100 text-red-700' :
                            daysUntil(dl.deadline_date) <= 30 ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-100 text-blue-700'
                          }`}
                        >
                          <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${typeConfig[dl.deadline_type].dot}`} />
                          <span className="truncate">{dl.contract_name}</span>
                        </div>
                      ))}
                      {cell.deadlines.length > 2 && (
                        <div className="text-[10px] text-gray-400 px-1">+{cell.deadlines.length - 2} more</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming sidebar */}
        <div className="w-72 shrink-0 space-y-4">
          <div className="rounded-xl bg-white p-4 ring-1 ring-gray-200">
            <h3 className="mb-3 font-semibold text-gray-900">Upcoming Deadlines</h3>
            {!upcoming?.length ? (
              <div className="text-center py-6 text-sm text-gray-400">
                <CalendarDays className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                No upcoming deadlines
              </div>
            ) : (
              <div className="space-y-2">
                {upcoming.map((dl) => {
                  const days = daysUntil(dl.deadline_date)
                  const badge = getUrgencyBadge(days)
                  return (
                    <div key={dl.id} className={`rounded-lg border p-3 ${getUrgencyClass(days)}`}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-xs font-semibold text-gray-900 leading-tight">{dl.contract_name}</p>
                        <span className={`inline-flex items-center gap-1 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}>
                          {badge.icon}
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500">{typeConfig[dl.deadline_type].label}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {new Date(dl.deadline_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="rounded-xl bg-white p-4 ring-1 ring-gray-200">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Legend</h3>
            <div className="space-y-2">
              {Object.entries(typeConfig).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2 text-xs text-gray-600">
                  <div className={`h-2 w-2 rounded-full ${val.dot}`} />
                  {val.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
