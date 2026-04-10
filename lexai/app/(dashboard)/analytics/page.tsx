import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BarChart2, TrendingUp, FileSearch, MessageSquare, FileText, AlertTriangle, Shield, Clock } from 'lucide-react'
import Link from 'next/link'

function RiskBar({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-red-500' : score >= 40 ? 'bg-amber-400' : 'bg-green-500'
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 rounded-full bg-gray-100">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="w-8 text-right text-xs font-semibold text-gray-700">{score}</span>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub: string; color: string
}) {
  return (
    <div className="rounded-xl bg-white p-5 ring-1 ring-gray-200">
      <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="mt-0.5 text-sm font-medium text-gray-700">{label}</div>
      <div className="mt-0.5 text-xs text-gray-400">{sub}</div>
    </div>
  )
}

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [contractsRes, conversationsRes, documentsRes, deadlinesRes, profileRes] = await Promise.all([
    supabase.from('contracts').select('id, risk_score, created_at, filename').eq('user_id', user.id).order('created_at'),
    supabase.from('conversations').select('id, created_at').eq('user_id', user.id),
    supabase.from('documents_generated').select('id, type, created_at').eq('user_id', user.id),
    supabase.from('deadlines').select('id, deadline_date, deadline_type').eq('user_id', user.id),
    supabase.from('users').select('plan, created_at').eq('id', user.id).single(),
  ])

  const contracts = contractsRes.data ?? []
  const conversations = conversationsRes.data ?? []
  const documents = documentsRes.data ?? []
  const deadlines = deadlinesRes.data ?? []
  const profile = profileRes.data

  // Risk distribution
  const riskBuckets = { low: 0, medium: 0, high: 0 }
  for (const c of contracts) {
    if ((c.risk_score ?? 0) < 40) riskBuckets.low++
    else if ((c.risk_score ?? 0) < 70) riskBuckets.medium++
    else riskBuckets.high++
  }

  const avgRisk = contracts.length
    ? Math.round(contracts.reduce((s, c) => s + (c.risk_score ?? 0), 0) / contracts.length)
    : 0

  // Monthly contract activity (last 6 months)
  const now = new Date()
  const months: { label: string; count: number; avgRisk: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    const monthContracts = contracts.filter((c) => {
      const cd = new Date(c.created_at)
      return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear()
    })
    const avg = monthContracts.length
      ? Math.round(monthContracts.reduce((s, c) => s + (c.risk_score ?? 0), 0) / monthContracts.length)
      : 0
    months.push({ label, count: monthContracts.length, avgRisk: avg })
  }

  const maxCount = Math.max(...months.map((m) => m.count), 1)

  // Document types breakdown
  const docTypes: Record<string, number> = {}
  for (const d of documents) {
    docTypes[d.type] = (docTypes[d.type] ?? 0) + 1
  }
  const docTypeSorted = Object.entries(docTypes).sort((a, b) => b[1] - a[1])

  // Upcoming deadlines
  const today = new Date().toISOString().slice(0, 10)
  const urgentDeadlines = deadlines.filter((d) => {
    const days = Math.round((new Date(d.deadline_date).getTime() - Date.now()) / 86400000)
    return days >= 0 && days <= 30
  }).length

  // ROI savings (rough estimate)
  const savedHours = contracts.length * 3
  const savedMoney = savedHours * 150

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-gray-500">Your legal activity, risk trends, and usage at a glance.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={FileSearch} label="Contracts Analyzed" value={contracts.length} sub="Total uploaded" color="bg-lexai-50 text-lexai-600" />
        <StatCard icon={MessageSquare} label="AI Conversations" value={conversations.length} sub="Chat sessions" color="bg-blue-50 text-blue-600" />
        <StatCard icon={FileText} label="Documents Generated" value={documents.length} sub="AI-drafted docs" color="bg-purple-50 text-purple-600" />
        <StatCard icon={AlertTriangle} label="Urgent Deadlines" value={urgentDeadlines} sub="Due within 30 days" color={urgentDeadlines > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contract activity */}
        <div className="rounded-xl bg-white p-6 ring-1 ring-gray-200">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Contract Activity</h2>
              <p className="text-xs text-gray-400">Contracts per month — last 6 months</p>
            </div>
            <BarChart2 className="h-5 w-5 text-gray-300" />
          </div>
          {contracts.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-gray-400">
              No contracts yet. <Link href="/contracts" className="ml-1 text-lexai-600 hover:underline">Upload your first →</Link>
            </div>
          ) : (
            <div className="flex h-40 items-end gap-3">
              {months.map((m) => (
                <div key={m.label} className="flex flex-1 flex-col items-center gap-1">
                  <div className="w-full flex flex-col items-center justify-end" style={{ height: '120px' }}>
                    <div
                      className="w-full rounded-t-md bg-lexai-500 transition-all"
                      style={{ height: `${Math.max((m.count / maxCount) * 100, m.count > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                  <div className="text-[10px] font-medium text-gray-500">{m.label}</div>
                  <div className="text-[10px] font-bold text-gray-700">{m.count || '—'}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Risk distribution */}
        <div className="rounded-xl bg-white p-6 ring-1 ring-gray-200">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Risk Distribution</h2>
              <p className="text-xs text-gray-400">Across all {contracts.length} analyzed contracts</p>
            </div>
            <div className="text-right">
              <div className={`text-xl font-bold ${avgRisk >= 70 ? 'text-red-600' : avgRisk >= 40 ? 'text-amber-500' : 'text-green-600'}`}>
                {contracts.length ? avgRisk : '—'}
              </div>
              <div className="text-[10px] text-gray-400">avg risk score</div>
            </div>
          </div>
          {contracts.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-gray-400">No data yet.</div>
          ) : (
            <div className="space-y-5">
              {[
                { label: 'High Risk (70–100)', count: riskBuckets.high, color: 'bg-red-500', textColor: 'text-red-600' },
                { label: 'Medium Risk (40–69)', count: riskBuckets.medium, color: 'bg-amber-400', textColor: 'text-amber-600' },
                { label: 'Low Risk (0–39)', count: riskBuckets.low, color: 'bg-green-500', textColor: 'text-green-600' },
              ].map((b) => (
                <div key={b.label}>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="font-medium text-gray-700">{b.label}</span>
                    <span className={`font-bold ${b.textColor}`}>{b.count} contracts</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-100">
                    <div
                      className={`h-2.5 rounded-full ${b.color}`}
                      style={{ width: `${contracts.length ? (b.count / contracts.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent contracts risk scores */}
        <div className="rounded-xl bg-white p-6 ring-1 ring-gray-200">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Recent Risk Scores</h2>
              <p className="text-xs text-gray-400">Last 8 analyzed contracts</p>
            </div>
            <TrendingUp className="h-5 w-5 text-gray-300" />
          </div>
          {contracts.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-gray-400">No contracts analyzed yet.</div>
          ) : (
            <div className="space-y-3">
              {[...contracts].reverse().slice(0, 8).map((c) => (
                <div key={c.id}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="truncate font-medium text-gray-700 max-w-[200px]">{c.filename || 'Contract'}</span>
                    <span className="text-gray-400">{new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <RiskBar score={c.risk_score ?? 0} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Documents & ROI */}
        <div className="space-y-4">
          {/* Document types */}
          <div className="rounded-xl bg-white p-6 ring-1 ring-gray-200">
            <h2 className="mb-4 font-semibold text-gray-900">Documents Generated</h2>
            {docTypeSorted.length === 0 ? (
              <p className="text-sm text-gray-400">No documents generated yet.</p>
            ) : (
              <div className="space-y-2">
                {docTypeSorted.map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm capitalize text-gray-600">{type.replace(/_/g, ' ')}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full bg-purple-400"
                          style={{ width: `${(count / documents.length) * 100}%` }}
                        />
                      </div>
                      <span className="w-4 text-right text-xs font-bold text-gray-700">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ROI card */}
          <div className="rounded-xl bg-gradient-to-br from-lexai-600 to-lexai-800 p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-5 w-5 text-lexai-200" />
              <h2 className="font-semibold">Estimated Savings</h2>
            </div>
            <div className="text-3xl font-bold mb-1">${savedMoney.toLocaleString()}</div>
            <p className="text-sm text-lexai-200 mb-3">
              vs. hiring a lawyer (~$150/hr × {savedHours} hrs saved)
            </p>
            <div className="flex items-center gap-2 text-xs text-lexai-200">
              <Clock className="h-3.5 w-3.5" />
              {savedHours} lawyer hours saved across {contracts.length} contracts
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
