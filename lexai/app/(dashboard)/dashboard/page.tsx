import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  FileSearch, MessageSquare, FileText, ArrowRight,
  Bell, TrendingUp, AlertTriangle, Calendar,
} from 'lucide-react'
import { getRiskColor, getRiskLabel } from '@/lib/utils'
import { OnboardingChecklist } from '@/components/dashboard/OnboardingChecklist'

const PLAN_LIMITS: Record<string, { contracts: number; chats: number; docs: number }> = {
  free:    { contracts: 3,   chats: 5,   docs: 1   },
  starter: { contracts: 25,  chats: 50,  docs: 10  },
  pro:     { contracts: 100, chats: 200, docs: 50  },
  team:    { contracts: -1,  chats: -1,  docs: -1  },
}

function UsageMeter({
  label, used, limit, color,
}: { label: string; used: number; limit: number; color: string }) {
  const pct = limit === -1 ? 0 : Math.min(100, Math.round((used / limit) * 100))
  const isNearLimit = limit !== -1 && pct >= 80
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className={isNearLimit ? 'font-semibold text-red-600' : 'text-gray-500'}>
          {limit === -1 ? `${used} / ∞` : `${used} / ${limit}`}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-100">
        {limit === -1 ? (
          <div className="h-2 w-full rounded-full bg-emerald-400" />
        ) : (
          <div
            className={`h-2 rounded-full transition-all ${
              pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : color
            }`}
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
      {isNearLimit && limit !== -1 && (
        <p className="mt-1 text-xs text-red-500">{limit - used} remaining — consider upgrading</p>
      )}
    </div>
  )
}

function RiskBar({ score }: { score: number }) {
  return (
    <div className="h-5 w-full rounded bg-gray-100">
      <div
        className={`h-5 rounded text-right pr-1.5 text-[10px] font-bold leading-5 text-white ${
          score >= 70 ? 'bg-red-500' : score >= 40 ? 'bg-amber-400' : 'bg-emerald-500'
        }`}
        style={{ width: `${Math.max(score, 8)}%` }}
      >
        {score}
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const todayStr = new Date().toISOString().split('T')[0]

  const [
    { data: profile },
    { data: recentContracts },
    { count: contractCount },
    { count: contractMonthCount },
    { count: chatCount },
    { count: chatMonthCount },
    { count: docCount },
    { count: docMonthCount },
    { data: upcomingDeadlines },
  ] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('contracts').select('id, filename, risk_score, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(8),
    supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', thisMonthStart),
    supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', thisMonthStart),
    supabase.from('documents_generated').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('documents_generated').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', thisMonthStart),
    supabase.from('deadlines').select('*').eq('user_id', user.id).gte('deadline_date', todayStr).order('deadline_date', { ascending: true }).limit(5),
  ])

  const plan = (profile?.plan ?? 'free') as string
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  function daysUntil(dateStr: string) {
    const d = new Date(dateStr)
    d.setHours(0, 0, 0, 0)
    return Math.ceil((d.getTime() - today.getTime()) / 86400000)
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const contractsWithScores = (recentContracts ?? []).filter((c) => c.risk_score !== null).slice(0, 6)
  const avgRisk = contractsWithScores.length
    ? Math.round(contractsWithScores.reduce((a, c) => a + (c.risk_score ?? 0), 0) / contractsWithScores.length)
    : null

  const planBadge =
    plan === 'free' ? 'bg-gray-100 text-gray-600' :
    plan === 'starter' ? 'bg-blue-100 text-blue-700' :
    plan === 'pro' ? 'bg-lexai-100 text-lexai-700' :
    'bg-purple-100 text-purple-700'

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{greeting}, {firstName} 👋</h1>
        <p className="mt-1 text-gray-500">Your AI legal co-pilot is ready. What do you need today?</p>
      </div>

      {/* Onboarding checklist — shown until all 3 steps complete */}
      {(contractCount === 0 || chatCount === 0 || docCount === 0) && (
        <OnboardingChecklist
          contractCount={contractCount ?? 0}
          chatCount={chatCount ?? 0}
          docCount={docCount ?? 0}
          isPaid={plan !== 'free'}
        />
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { title: 'Analyze a Contract', description: 'Upload and get risk score + plain-English summary', icon: '📄', href: '/contracts', color: 'bg-blue-50 hover:bg-blue-100' },
          { title: 'Ask a Legal Question', description: 'Chat with your AI co-pilot about any legal topic', icon: '💬', href: '/chat', color: 'bg-purple-50 hover:bg-purple-100' },
          { title: 'Generate a Document', description: 'Create an NDA, service agreement, or more', icon: '📝', href: '/documents', color: 'bg-emerald-50 hover:bg-emerald-100' },
        ].map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className={`group rounded-xl p-5 transition-colors ${action.color} ring-1 ring-transparent hover:ring-gray-200`}
          >
            <div className="text-3xl mb-3">{action.icon}</div>
            <h3 className="font-semibold text-gray-900 group-hover:text-lexai-700">{action.title}</h3>
            <p className="mt-1 text-sm text-gray-500">{action.description}</p>
            <div className="mt-3 flex items-center gap-1 text-xs font-medium text-lexai-600">
              Get started <ArrowRight className="h-3 w-3" />
            </div>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Link href="/contracts" className="rounded-xl bg-white p-5 ring-1 ring-gray-200 hover:ring-lexai-300 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Contracts</p>
              <p className="mt-1 text-3xl font-bold text-blue-600">{contractCount ?? 0}</p>
              <p className="mt-0.5 text-xs text-gray-400">{contractMonthCount ?? 0} this month</p>
            </div>
            <div className="rounded-lg p-3 bg-blue-50"><FileSearch className="h-5 w-5 text-blue-600" /></div>
          </div>
        </Link>
        <Link href="/chat" className="rounded-xl bg-white p-5 ring-1 ring-gray-200 hover:ring-lexai-300 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">AI Conversations</p>
              <p className="mt-1 text-3xl font-bold text-purple-600">{chatCount ?? 0}</p>
              <p className="mt-0.5 text-xs text-gray-400">{chatMonthCount ?? 0} this month</p>
            </div>
            <div className="rounded-lg p-3 bg-purple-50"><MessageSquare className="h-5 w-5 text-purple-600" /></div>
          </div>
        </Link>
        <Link href="/documents" className="rounded-xl bg-white p-5 ring-1 ring-gray-200 hover:ring-lexai-300 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Docs Generated</p>
              <p className="mt-1 text-3xl font-bold text-emerald-600">{docCount ?? 0}</p>
              <p className="mt-0.5 text-xs text-gray-400">{docMonthCount ?? 0} this month</p>
            </div>
            <div className="rounded-lg p-3 bg-emerald-50"><FileText className="h-5 w-5 text-emerald-600" /></div>
          </div>
        </Link>
        <Link href="/contracts" className="rounded-xl bg-white p-5 ring-1 ring-gray-200 hover:ring-lexai-300 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Risk Score</p>
              <p className={`mt-1 text-3xl font-bold ${avgRisk !== null ? getRiskColor(avgRisk) : 'text-gray-400'}`}>
                {avgRisk !== null ? avgRisk : '—'}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">{avgRisk !== null ? getRiskLabel(avgRisk) : 'No data yet'}</p>
            </div>
            <div className={`rounded-lg p-3 ${avgRisk !== null && avgRisk >= 70 ? 'bg-red-50' : avgRisk !== null && avgRisk >= 40 ? 'bg-amber-50' : 'bg-emerald-50'}`}>
              <TrendingUp className={`h-5 w-5 ${avgRisk !== null ? getRiskColor(avgRisk) : 'text-gray-400'}`} />
            </div>
          </div>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: Usage meters + Risk trend */}
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-xl bg-white p-6 ring-1 ring-gray-200">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Monthly Usage</h2>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${planBadge}`}>{plan}</span>
            </div>
            <div className="space-y-5">
              <UsageMeter label="Contract Analyses" used={contractMonthCount ?? 0} limit={limits.contracts} color="bg-blue-500" />
              <UsageMeter label="AI Conversations" used={chatMonthCount ?? 0} limit={limits.chats} color="bg-purple-500" />
              <UsageMeter label="Documents Generated" used={docMonthCount ?? 0} limit={limits.docs} color="bg-emerald-500" />
            </div>
            {plan === 'free' && (
              <Link href="/billing" className="mt-5 flex items-center justify-center rounded-lg bg-lexai-600 py-2.5 text-sm font-medium text-white hover:bg-lexai-700 transition-colors">
                Upgrade to Starter — $49/mo
              </Link>
            )}
          </div>

          {contractsWithScores.length > 0 && (
            <div className="rounded-xl bg-white p-6 ring-1 ring-gray-200">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Recent Contract Risk Scores</h2>
                <Link href="/contracts" className="text-xs text-lexai-600 hover:underline">View all</Link>
              </div>
              <div className="space-y-3">
                {contractsWithScores.map((c) => (
                  <Link key={c.id} href={`/contracts/${c.id}`} className="group block">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="truncate text-gray-600 group-hover:text-lexai-700 max-w-xs">{c.filename}</span>
                      <span className={`font-semibold ml-2 shrink-0 ${getRiskColor(c.risk_score ?? 0)}`}>
                        {getRiskLabel(c.risk_score ?? 0)}
                      </span>
                    </div>
                    <RiskBar score={c.risk_score ?? 0} />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Upcoming Deadlines */}
        <div className="lg:col-span-2">
          <div className="rounded-xl bg-white p-6 ring-1 ring-gray-200 h-full">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-gray-500" />
                <h2 className="font-semibold text-gray-900">Upcoming Deadlines</h2>
              </div>
              <Link href="/deadlines" className="text-xs text-lexai-600 hover:underline">View all</Link>
            </div>

            {upcomingDeadlines && upcomingDeadlines.length > 0 ? (
              <div className="space-y-3">
                {upcomingDeadlines.map((d) => {
                  const days = daysUntil(d.deadline_date)
                  const isCritical = days <= 7
                  const isWarning = days > 7 && days <= 30
                  return (
                    <div key={d.id} className={`rounded-lg p-3 ${isCritical ? 'bg-red-50' : isWarning ? 'bg-amber-50' : 'bg-gray-50'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          {isCritical
                            ? <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                            : <Calendar className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isWarning ? 'text-amber-500' : 'text-gray-400'}`} />
                          }
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-gray-900">{d.description}</p>
                            <p className="text-xs text-gray-400">{d.contract_name}</p>
                          </div>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${isCritical ? 'bg-red-100 text-red-700' : isWarning ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
                        </span>
                      </div>
                      <p className="mt-1 pl-5 text-xs text-gray-400">
                        {new Date(d.deadline_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="mb-2 h-8 w-8 text-gray-200" />
                <p className="text-sm text-gray-500">No upcoming deadlines</p>
                <p className="mt-1 text-xs text-gray-400">Deadlines are extracted automatically when you analyze contracts</p>
                <Link href="/contracts" className="mt-3 text-xs text-lexai-600 hover:underline">Analyze a contract</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ROI Savings Widget */}
      {(contractCount ?? 0) > 0 && (
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 p-6 ring-1 ring-emerald-200">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">Estimated Legal Savings</p>
              <p className="mt-1 text-4xl font-bold text-emerald-800">
                ${((contractCount ?? 0) * 350 + (docCount ?? 0) * 250).toLocaleString()}
              </p>
              <p className="mt-1 text-sm text-emerald-600">
                vs. hiring a lawyer for every task
              </p>
            </div>
            <div className="flex gap-8 text-right">
              <div>
                <p className="text-2xl font-bold text-emerald-700">{contractCount ?? 0}</p>
                <p className="text-xs text-emerald-600">Contracts reviewed</p>
                <p className="text-xs text-gray-400">~$350 each</p>
              </div>
              {(docCount ?? 0) > 0 && (
                <div>
                  <p className="text-2xl font-bold text-emerald-700">{docCount ?? 0}</p>
                  <p className="text-xs text-emerald-600">Docs drafted</p>
                  <p className="text-xs text-gray-400">~$250 each</p>
                </div>
              )}
              {(chatCount ?? 0) > 0 && (
                <div>
                  <p className="text-2xl font-bold text-emerald-700">{chatCount ?? 0}</p>
                  <p className="text-xs text-emerald-600">Legal Q&amp;As</p>
                  <p className="text-xs text-gray-400">~$50 each</p>
                </div>
              )}
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-400">
            Estimates based on average US attorney hourly rates ($300–$450/hr). For reference only.
          </p>
        </div>
      )}

      {/* Upgrade banner for free plan */}
      {plan === 'free' && (
        <div className="rounded-xl bg-gradient-to-r from-lexai-600 to-lexai-700 p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-bold text-lg">Unlock the full power of Court of AI</p>
              <p className="mt-1 text-sm text-lexai-100">
                Starter plan gives you 25 contract analyses/mo, 50 AI chats, document generation, and AI clause negotiation.
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-lexai-100">
                {['25 contracts/mo', '50 AI chats', 'Document generator', 'Clause negotiation', 'Email reminders'].map((f) => (
                  <span key={f}>✓ {f}</span>
                ))}
              </div>
            </div>
            <Link href="/billing" className="shrink-0 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-lexai-700 hover:bg-lexai-50 transition-colors">
              Upgrade — $49/mo
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
