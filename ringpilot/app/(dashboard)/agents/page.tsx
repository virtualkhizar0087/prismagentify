import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Plus, Bot, Phone, Settings, Pause, Play } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPhone } from '@/lib/utils'

export default async function AgentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: agents } = await supabase
    .from('agents')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My AI Agents</h1>
          <p className="text-gray-500 mt-1">{agents?.length ?? 0} agent{agents?.length !== 1 ? 's' : ''} configured</p>
        </div>
        <Link href="/agents/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" /> New Agent
          </Button>
        </Link>
      </div>

      {!agents?.length ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bot className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">No agents yet</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              Create your first AI receptionist and start answering calls automatically.
            </p>
            <Link href="/agents/new">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" /> Create Your First Agent
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {agents.map(agent => (
            <Card key={agent.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full mt-0.5 ${agent.status === 'active' ? 'bg-green-500' : agent.status === 'paused' ? 'bg-yellow-500' : 'bg-gray-400'}`} />
                    <div>
                      <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                      <p className="text-xs text-gray-400 capitalize">{agent.vertical} AI</p>
                    </div>
                  </div>
                  <Badge variant={agent.status === 'active' ? 'success' : 'secondary'} className="capitalize">
                    {agent.status}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span className="font-mono">{agent.twilio_phone_number ? formatPhone(agent.twilio_phone_number) : 'Number pending'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Bot className="h-4 w-4 shrink-0" />
                    <span>{agent.calls_this_month} calls this month</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/agents/${agent.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">View Details</Button>
                  </Link>
                  <Link href={`/agents/${agent.id}/settings`}>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
