import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PhoneCall, Bot, TrendingUp, Clock, Plus, ArrowRight, CheckCircle, AlertCircle, DollarSign, PhoneOutgoing } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDuration, formatDate, sentimentColor } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: agents }, { data: recentCalls }] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('agents').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('calls').select('*, agents(name)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
  ])

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [{ count: callsToday }, { count: callsThisWeek }, { data: activeCampaigns }] = await Promise.all([
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', today.toISOString()),
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', weekAgo.toISOString()),
    supabase.from('campaigns').select('id').eq('user_id', user.id).eq('status', 'active'),
  ])

  const activeAgents = agents?.filter(a => a.status === 'active') ?? []
  const callsThisMonth = agents?.reduce((s, a) => s + a.calls_this_month, 0) ?? 0
  // Savings: avg cost per missed call = $25 (industry avg); AI answers all
  const savingsEstimate = callsThisMonth * 25

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
            {profile?.full_name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-gray-500 mt-1">Here's what's happening with your AI receptionist today.</p>
        </div>
        <Link href="/agents/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" /> New Agent
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Calls Today', value: callsToday ?? 0, icon: PhoneCall, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Calls This Week', value: callsThisWeek ?? 0, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Active Agents', value: activeAgents.length, icon: Bot, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Est. Savings This Month', value: `$${savingsEstimate.toLocaleString()}`, icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`w-11 h-11 ${stat.bg} rounded-xl flex items-center justify-center`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Agents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Your AI Agents</CardTitle>
            <Link href="/agents" className="text-xs text-blue-600 hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {!agents?.length ? (
              <div className="text-center py-6">
                <Bot className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm mb-4">No agents yet. Create your first AI receptionist.</p>
                <Link href="/agents/new">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" /> Create Agent
                  </Button>
                </Link>
              </div>
            ) : (
              agents.map(agent => (
                <Link key={agent.id} href={`/agents/${agent.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`w-2.5 h-2.5 rounded-full ${agent.status === 'active' ? 'bg-green-500' : agent.status === 'paused' ? 'bg-yellow-500' : 'bg-gray-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{agent.name}</p>
                      <p className="text-xs text-gray-400">{agent.twilio_phone_number || 'Number not assigned'}</p>
                    </div>
                    <Badge variant={agent.status === 'active' ? 'success' : 'secondary'} className="text-xs capitalize">{agent.status}</Badge>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Calls */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Recent Calls</CardTitle>
            <Link href="/calls" className="text-xs text-blue-600 hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {!recentCalls?.length ? (
              <div className="text-center py-6">
                <PhoneCall className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No calls yet. Calls will appear here once your agent goes live.</p>
              </div>
            ) : (
              recentCalls.map((call: any) => (
                <div key={call.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                  <PhoneCall className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{call.summary || 'Call recorded'}</p>
                    <p className="text-xs text-gray-400">{formatDate(call.created_at)}</p>
                  </div>
                  {call.sentiment && (
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${sentimentColor(call.sentiment)}`}>
                      {call.sentiment}
                    </span>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active campaigns banner */}
      {(activeCampaigns?.length ?? 0) > 0 && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <PhoneOutgoing className="h-5 w-5 text-purple-600 shrink-0" />
              <p className="text-sm text-purple-800">
                <strong>{activeCampaigns!.length} outbound campaign{activeCampaigns!.length > 1 ? 's' : ''}</strong> currently running. Your AI is calling contacts now.
              </p>
            </div>
            <Link href="/campaigns" className="shrink-0">
              <Button size="sm" variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-100 whitespace-nowrap">
                View Campaigns <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Trial notice */}
      {profile?.plan === 'free' && profile?.trial_ends_at && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 shrink-0" />
              <p className="text-sm text-blue-800">
                Your free trial ends on <strong>{new Date(profile.trial_ends_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</strong>. Upgrade to keep your AI active.
              </p>
            </div>
            <Link href="/billing" className="shrink-0">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap">
                Upgrade Now <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
