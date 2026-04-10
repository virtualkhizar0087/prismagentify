'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Inbox, PhoneCall, AlertCircle, Clock, CheckCircle, ExternalLink } from 'lucide-react'
import { formatPhone, formatDuration, formatDate } from '@/lib/utils'
import Link from 'next/link'
import type { Call } from '@/types/database'

type CallWithAgent = Call & { agents?: { name: string; vertical: string } | null }

export default function InboxPage() {
  const supabase = createClient()
  const [calls, setCalls] = useState<CallWithAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load() {
      // Fetch calls needing attention:
      // - negative sentiment OR no summary (unanswered/dropped)
      // - last 7 days
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data } = await supabase
        .from('calls')
        .select('*, agents(name, vertical)')
        .gte('created_at', since)
        .or('sentiment.eq.negative,summary.is.null')
        .order('created_at', { ascending: false })
        .limit(50)
      setCalls((data as CallWithAgent[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  function dismiss(id: string) {
    setDismissed(d => { const s = new Set(Array.from(d)); s.add(id); return s })
  }

  const visible = calls.filter(c => !dismissed.has(c.id))
  const negative = visible.filter(c => c.sentiment === 'negative')
  const unanswered = visible.filter(c => !c.summary && c.sentiment !== 'negative')

  function Priority({ call }: { call: CallWithAgent }) {
    if (call.sentiment === 'negative') {
      return (
        <Badge className="bg-red-100 text-red-700 border-0 text-xs">
          <AlertCircle className="h-3 w-3 mr-1" />Negative
        </Badge>
      )
    }
    return (
      <Badge className="bg-yellow-100 text-yellow-700 border-0 text-xs">
        <Clock className="h-3 w-3 mr-1" />No Summary
      </Badge>
    )
  }

  function CallCard({ call }: { call: CallWithAgent }) {
    return (
      <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:shadow-sm transition-shadow">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${call.sentiment === 'negative' ? 'bg-red-100' : 'bg-yellow-100'}`}>
          <PhoneCall className={`h-5 w-5 ${call.sentiment === 'negative' ? 'text-red-500' : 'text-yellow-500'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900 text-sm">{formatPhone(call.from_number || '')}</span>
            <Priority call={call} />
          </div>
          {call.summary ? (
            <p className="text-sm text-gray-600 line-clamp-2">{call.summary}</p>
          ) : (
            <p className="text-sm text-gray-400 italic">No summary recorded — call may have dropped.</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            {call.agents?.name && <span>{call.agents.name}</span>}
            {call.duration_seconds != null && <span>{formatDuration(call.duration_seconds)}</span>}
            <span>{formatDate(call.created_at)}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          {call.from_number && (
            <a
              href={`tel:${call.from_number}`}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
            >
              <PhoneCall className="h-3 w-3" />Call back
            </a>
          )}
          <button
            onClick={() => dismiss(call.id)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <CheckCircle className="h-3 w-3" />Dismiss
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <Inbox className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attention Inbox</h1>
            <p className="text-gray-500 text-sm">Calls that may need your personal follow-up — last 7 days</p>
          </div>
        </div>
        <Link href="/calls">
          <Button variant="ghost" size="sm" className="text-gray-500">
            All calls <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle className="h-14 w-14 mx-auto mb-3 text-green-400" />
          <p className="text-xl font-semibold text-gray-700">Inbox zero! 🎉</p>
          <p className="text-sm text-gray-400 mt-1">No calls needing attention in the last 7 days.</p>
        </div>
      ) : (
        <>
          {negative.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <h2 className="font-semibold text-gray-800 text-sm">Unhappy callers — call back soon</h2>
                <span className="ml-auto text-xs text-red-600 font-medium">{negative.length}</span>
              </div>
              {negative.map(c => <CallCard key={c.id} call={c} />)}
            </section>
          )}

          {unanswered.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <h2 className="font-semibold text-gray-800 text-sm">Calls with no summary recorded</h2>
                <span className="ml-auto text-xs text-yellow-600 font-medium">{unanswered.length}</span>
              </div>
              {unanswered.map(c => <CallCard key={c.id} call={c} />)}
            </section>
          )}
        </>
      )}
    </div>
  )
}
