'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart2, TrendingUp, Clock, ThumbsUp } from 'lucide-react'
import { formatDuration } from '@/lib/utils'
import type { Call } from '@/types/database'

interface DayBucket { label: string; count: number }
interface HourBucket { hour: number; count: number }

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const SENTIMENTS = ['positive', 'neutral', 'negative'] as const
const SENTIMENT_COLOR: Record<string, string> = {
  positive: 'bg-green-500',
  neutral: 'bg-gray-400',
  negative: 'bg-red-500',
}
const SENTIMENT_TEXT: Record<string, string> = {
  positive: 'text-green-700',
  neutral: 'text-gray-600',
  negative: 'text-red-700',
}
const SENTIMENT_BG: Record<string, string> = {
  positive: 'bg-green-50',
  neutral: 'bg-gray-50',
  negative: 'bg-red-50',
}

export default function AnalyticsPage() {
  const supabase = createClient()
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const { data } = await supabase
        .from('calls')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true })
      setCalls((data as Call[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  // Calls per day (last 14 days)
  const last14Days: DayBucket[] = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    return {
      label: `${DAYS[d.getDay()]} ${d.getDate()}`,
      count: calls.filter(c => {
        const cd = new Date(c.created_at)
        return cd.toDateString() === d.toDateString()
      }).length,
    }
  })

  const maxDay = Math.max(...last14Days.map(d => d.count), 1)

  // Sentiment breakdown
  const sentimentCounts = SENTIMENTS.reduce((acc, s) => {
    acc[s] = calls.filter(c => c.sentiment === s).length
    return acc
  }, {} as Record<string, number>)
  const totalWithSentiment = SENTIMENTS.reduce((a, s) => a + sentimentCounts[s], 0)

  // Peak hours (0–23)
  const hourBuckets: HourBucket[] = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    count: calls.filter(c => new Date(c.created_at).getHours() === h).length,
  }))
  const maxHour = Math.max(...hourBuckets.map(h => h.count), 1)

  // Avg duration
  const durations = calls.filter(c => c.duration_seconds).map(c => c.duration_seconds!)
  const avgDuration = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0

  // Stats
  const stats = [
    { label: 'Calls (30 days)', value: calls.length, icon: BarChart2, color: 'text-blue-600' },
    { label: 'Avg Duration', value: formatDuration(avgDuration), icon: Clock, color: 'text-purple-600' },
    { label: 'Positive Rate', value: totalWithSentiment ? `${Math.round((sentimentCounts.positive / totalWithSentiment) * 100)}%` : '—', icon: ThumbsUp, color: 'text-green-600' },
    { label: 'Busiest Hour', value: hourBuckets.reduce((a, b) => b.count > a.count ? b : a, hourBuckets[0]).count > 0 ? formatHour(hourBuckets.reduce((a, b) => b.count > a.count ? b : a, hourBuckets[0]).hour) : '—', icon: TrendingUp, color: 'text-amber-600' },
  ]

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-xl" />)}
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Last 30 days of call activity</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-8 w-8 ${s.color} shrink-0`} />
              <div>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Calls per day bar chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Calls Per Day (Last 14 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {calls.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No call data yet. Calls will appear here once your agent is live.</p>
          ) : (
            <div className="flex items-end gap-1 h-40">
              {last14Days.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <span className="text-xs text-gray-500 font-medium">{d.count || ''}</span>
                  <div
                    className="w-full bg-blue-500 rounded-t-sm transition-all"
                    style={{ height: `${Math.max((d.count / maxDay) * 120, d.count > 0 ? 4 : 0)}px` }}
                  />
                  <span className="text-[9px] text-gray-400 truncate w-full text-center">{d.label}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Sentiment Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {totalWithSentiment === 0 ? (
              <p className="text-center text-gray-400 text-sm py-6">No sentiment data yet.</p>
            ) : (
              <div className="space-y-3">
                {SENTIMENTS.map(s => {
                  const pct = totalWithSentiment ? Math.round((sentimentCounts[s] / totalWithSentiment) * 100) : 0
                  return (
                    <div key={s} className={`flex items-center gap-3 p-3 rounded-lg ${SENTIMENT_BG[s]}`}>
                      <div className={`w-3 h-3 rounded-full ${SENTIMENT_COLOR[s]}`} />
                      <span className={`text-sm font-medium capitalize flex-1 ${SENTIMENT_TEXT[s]}`}>{s}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${SENTIMENT_COLOR[s]}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className={`text-sm font-bold w-10 text-right ${SENTIMENT_TEXT[s]}`}>{pct}%</span>
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right">{sentimentCounts[s]}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Peak hours heatmap */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Peak Call Hours</CardTitle>
          </CardHeader>
          <CardContent>
            {calls.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-6">No call data yet.</p>
            ) : (
              <div className="grid grid-cols-12 gap-1">
                {hourBuckets.map(({ hour, count }) => {
                  const intensity = count / maxHour
                  return (
                    <div
                      key={hour}
                      className="aspect-square rounded flex items-center justify-center cursor-default group relative"
                      style={{
                        backgroundColor: count === 0
                          ? '#f3f4f6'
                          : `rgba(59,130,246,${Math.max(0.1, intensity)})`,
                      }}
                      title={`${formatHour(hour)}: ${count} call${count !== 1 ? 's' : ''}`}
                    >
                      <span className="text-[9px] font-medium" style={{ color: intensity > 0.5 ? 'white' : '#6b7280' }}>
                        {count > 0 ? count : ''}
                      </span>
                    </div>
                  )
                })}
                <div className="col-span-12 grid grid-cols-12 gap-1 mt-1">
                  {hourBuckets.map(({ hour }) => (
                    <div key={hour} className="text-center text-[8px] text-gray-400">
                      {hour % 6 === 0 ? formatHour(hour) : ''}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function formatHour(h: number): string {
  if (h === 0) return '12am'
  if (h < 12) return `${h}am`
  if (h === 12) return '12pm'
  return `${h - 12}pm`
}
