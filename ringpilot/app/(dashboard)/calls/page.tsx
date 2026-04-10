'use client'
import { useEffect, useState } from 'react'
import { PhoneCall, Search, Clock, Mic, User, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatDuration, formatDate, formatPhone, sentimentColor } from '@/lib/utils'
import type { Call } from '@/types/database'

type CallWithAgent = Call & { agents: { name: string } | null }

export default function CallsPage() {
  const supabase = createClient()
  const [calls, setCalls] = useState<CallWithAgent[]>([])
  const [filtered, setFiltered] = useState<CallWithAgent[]>([])
  const [search, setSearch] = useState('')
  const [selectedCall, setSelectedCall] = useState<CallWithAgent | null>(null)
  const [callerPhone, setCallerPhone] = useState<string | null>(null)
  const [callerHistory, setCallerHistory] = useState<CallWithAgent[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('calls')
        .select('*, agents(name)')
        .order('created_at', { ascending: false })
        .limit(100)
      setCalls((data as CallWithAgent[]) ?? [])
      setFiltered((data as CallWithAgent[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      calls.filter(c =>
        c.summary?.toLowerCase().includes(q) ||
        c.from_number?.includes(q) ||
        c.agents?.name?.toLowerCase().includes(q) ||
        c.transcript?.toLowerCase().includes(q)
      )
    )
  }, [search, calls])

  async function openCallerProfile(phone: string, e: React.MouseEvent) {
    e.stopPropagation()
    setCallerPhone(phone)
    setLoadingHistory(true)
    const { data } = await supabase
      .from('calls')
      .select('*, agents(name)')
      .eq('from_number', phone)
      .order('created_at', { ascending: false })
      .limit(20)
    setCallerHistory((data as CallWithAgent[]) ?? [])
    setLoadingHistory(false)
  }

  function SentimentIcon({ s }: { s: string | null }) {
    if (s === 'positive') return <TrendingUp className="h-3 w-3 text-green-500" />
    if (s === 'negative') return <TrendingDown className="h-3 w-3 text-red-500" />
    return <Minus className="h-3 w-3 text-gray-400" />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Call Log</h1>
          <p className="text-gray-500 mt-1">{calls.length} total calls recorded</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search calls, summaries, numbers…"
          className="pl-10"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : !filtered.length ? (
        <Card>
          <CardContent className="py-16 text-center">
            <PhoneCall className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{search ? 'No calls match your search.' : 'No calls recorded yet. Calls will appear here once your agent is live.'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(call => (
            <Card
              key={call.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedCall(call)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <PhoneCall className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {call.summary || 'Call recorded'}
                    </p>
                    {call.sentiment && (
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize shrink-0 ${sentimentColor(call.sentiment)}`}>
                        {call.sentiment}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <button
                      onClick={e => call.from_number && openCallerProfile(call.from_number, e)}
                      className="flex items-center gap-1 hover:text-blue-600 hover:underline transition-colors"
                    >
                      <User className="h-3 w-3" />
                      {call.from_number ? formatPhone(call.from_number) : 'Unknown caller'}
                    </button>
                    {call.agents?.name && <span>· {call.agents.name}</span>}
                    <span>· {formatDate(call.created_at)}</span>
                    {call.duration_seconds && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(call.duration_seconds)}
                      </span>
                    )}
                  </div>
                </div>
                {call.recording_url && (
                  <span title="Recording available"><Mic className="h-4 w-4 text-gray-300 shrink-0" /></span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Caller profile dialog */}
      <Dialog open={!!callerPhone} onOpenChange={() => setCallerPhone(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              Caller Profile — {callerPhone ? formatPhone(callerPhone) : ''}
            </DialogTitle>
          </DialogHeader>
          {loadingHistory ? (
            <div className="space-y-2 animate-pulse">
              {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg" />)}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-blue-700">{callerHistory.length}</p>
                  <p className="text-xs text-blue-500">Total calls</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-green-700">
                    {callerHistory.filter(c => c.sentiment === 'positive').length}
                  </p>
                  <p className="text-xs text-green-500">Positive</p>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-red-700">
                    {callerHistory.filter(c => c.sentiment === 'negative').length}
                  </p>
                  <p className="text-xs text-red-500">Negative</p>
                </div>
              </div>
              {/* Call history */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Call History</p>
                {callerHistory.map(c => (
                  <div
                    key={c.id}
                    onClick={() => { setCallerPhone(null); setSelectedCall(c) }}
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <SentimentIcon s={c.sentiment} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{c.summary || 'No summary'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(c.created_at)}{c.duration_seconds ? ` · ${formatDuration(c.duration_seconds)}` : ''}
                        {c.agents?.name ? ` · ${c.agents.name}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Call detail dialog */}
      <Dialog open={!!selectedCall} onOpenChange={() => setSelectedCall(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PhoneCall className="h-4 w-4 text-blue-600" />
              Call Detail
            </DialogTitle>
          </DialogHeader>
          {selectedCall && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">From:</span> <span className="font-medium">{selectedCall.from_number ? formatPhone(selectedCall.from_number) : 'Unknown'}</span></div>
                <div><span className="text-gray-500">Agent:</span> <span className="font-medium">{selectedCall.agents?.name || '—'}</span></div>
                <div><span className="text-gray-500">Duration:</span> <span className="font-medium">{selectedCall.duration_seconds ? formatDuration(selectedCall.duration_seconds) : '—'}</span></div>
                <div><span className="text-gray-500">Date:</span> <span className="font-medium">{formatDate(selectedCall.created_at)}</span></div>
              </div>

              {selectedCall.summary && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
                  <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">{selectedCall.summary}</p>
                </div>
              )}

              {selectedCall.action_taken && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Action Taken</h3>
                  <p className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg">{selectedCall.action_taken}</p>
                </div>
              )}

              {selectedCall.transcript && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Full Transcript</h3>
                  <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap font-mono text-xs max-h-64 overflow-y-auto">
                    {selectedCall.transcript}
                  </div>
                </div>
              )}

              {selectedCall.recording_url && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Recording</h3>
                  <audio controls className="w-full" src={selectedCall.recording_url} />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
