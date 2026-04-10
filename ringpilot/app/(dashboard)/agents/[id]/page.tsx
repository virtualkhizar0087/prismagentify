'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Phone, Settings, PhoneCall, Clock, TrendingUp, Pause, Play, Trash2, Loader2, HelpCircle, Radio } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { formatPhone, formatDate, formatDuration, sentimentColor } from '@/lib/utils'
import type { Agent, Call } from '@/types/database'

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [agent, setAgent] = useState<Agent | null>(null)
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [provisioning, setProvisioning] = useState(false)
  const [provisionError, setProvisionError] = useState('')

  useEffect(() => {
    async function load() {
      const [{ data: agentData }, { data: callsData }] = await Promise.all([
        supabase.from('agents').select('*').eq('id', id).single(),
        supabase.from('calls').select('*').eq('agent_id', id).order('created_at', { ascending: false }).limit(20),
      ])
      if (!agentData) { router.push('/agents'); return }
      setAgent(agentData as Agent)
      setCalls((callsData as Call[]) ?? [])
      setLoading(false)
    }
    load()
  }, [id])

  async function toggleStatus() {
    if (!agent) return
    setToggling(true)
    const newStatus = agent.status === 'active' ? 'paused' : 'active'
    const res = await fetch(`/api/agents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) setAgent(a => a ? { ...a, status: newStatus } : a)
    setToggling(false)
  }

  async function handleDelete() {
    setDeleting(true)
    await fetch(`/api/agents/${id}`, { method: 'DELETE' })
    router.push('/agents')
  }

  async function retryProvisioning() {
    if (!agent) return
    setProvisioning(true)
    setProvisionError('')
    try {
      const res = await fetch(`/api/agents/${id}/provision`, { method: 'POST' })
      const json = await res.json()
      if (json.agent) {
        setAgent(json.agent)
      } else {
        setProvisionError(json.error || 'Provisioning failed — check server logs.')
      }
    } catch (e: any) {
      setProvisionError(e.message || 'Network error')
    }
    setProvisioning(false)
  }

  const totalDuration = calls.reduce((s, c) => s + (c.duration_seconds ?? 0), 0)
  const avgDuration = calls.length ? Math.round(totalDuration / calls.length) : 0

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-lg" />)}
    </div>
  )

  if (!agent) return null

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${agent.status === 'active' ? 'bg-green-500' : agent.status === 'paused' ? 'bg-yellow-500' : 'bg-gray-400'}`} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{agent.name}</h1>
            <p className="text-gray-500 capitalize">{agent.vertical} AI agent</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={toggleStatus}
            disabled={toggling || agent.status === 'setup'}
            className={agent.status === 'active' ? 'text-yellow-600 border-yellow-300 hover:bg-yellow-50' : 'text-green-600 border-green-300 hover:bg-green-50'}
          >
            {toggling ? <Loader2 className="h-4 w-4 animate-spin" /> : agent.status === 'active' ? <><Pause className="h-4 w-4 mr-2" />Pause</> : <><Play className="h-4 w-4 mr-2" />Activate</>}
          </Button>
          {agent.retell_agent_id && (
            <Link href={`/agents/${id}/test`}>
              <Button variant="outline" className="text-green-600 border-green-300 hover:bg-green-50">
                <Radio className="h-4 w-4 mr-2" />Test Agent
              </Button>
            </Link>
          )}
          <Link href={`/agents/${id}/faq`}>
            <Button variant="outline"><HelpCircle className="h-4 w-4 mr-2" />FAQ</Button>
          </Link>
          <Link href={`/agents/${id}/settings`}>
            <Button variant="outline"><Settings className="h-4 w-4 mr-2" />Settings</Button>
          </Link>
          <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Status banner */}
      {agent.status === 'paused' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
          <Pause className="h-4 w-4 text-yellow-600 shrink-0" />
          <p className="text-sm text-yellow-800">This agent is <strong>paused</strong> — it won't answer calls until you activate it.</p>
        </div>
      )}

      {/* Phone number banner */}
      {agent.twilio_phone_number && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-blue-700 font-medium">Your AI Phone Number</p>
                <p className="text-xl font-bold text-blue-900 font-mono">{formatPhone(agent.twilio_phone_number)}</p>
              </div>
            </div>
            <p className="text-xs text-blue-500 max-w-xs text-right">Share this number on Google Maps, your website, and business cards</p>
          </CardContent>
        </Card>
      )}

      {/* Setup notice */}
      {agent.status === 'setup' && !agent.twilio_phone_number && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-orange-800">
                ⚠️ This agent hasn't been provisioned yet. Click <strong>Provision Now</strong> to connect it to ElevenLabs.
              </p>
              <Button
                size="sm"
                onClick={retryProvisioning}
                disabled={provisioning}
                className="shrink-0 bg-orange-600 hover:bg-orange-700 text-white"
              >
                {provisioning ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Provisioning…</> : 'Provision Now'}
              </Button>
            </div>
            {provisionError && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">{provisionError}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Calls This Month', value: agent.calls_this_month, icon: PhoneCall },
          { label: 'Avg Duration', value: formatDuration(avgDuration), icon: Clock },
          { label: 'Total Calls', value: calls.length, icon: TrendingUp },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className="h-5 w-5 text-blue-600 shrink-0" />
              <div>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent calls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Calls</CardTitle>
        </CardHeader>
        <CardContent>
          {!calls.length ? (
            <p className="text-gray-500 text-sm text-center py-6">No calls yet. Calls will appear here once your agent is live.</p>
          ) : (
            <div className="space-y-3">
              {calls.map(call => (
                <div key={call.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                  <PhoneCall className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{call.summary || 'Call recorded'}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      <span>{call.from_number ? formatPhone(call.from_number) : 'Unknown'}</span>
                      <span>·</span>
                      <span>{formatDate(call.created_at)}</span>
                      {call.duration_seconds && <span>· {formatDuration(call.duration_seconds)}</span>}
                    </div>
                  </div>
                  {call.sentiment && (
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${sentimentColor(call.sentiment)}`}>
                      {call.sentiment}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>


      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-700">Delete Agent</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong>{agent.name}</strong>? This will:
          </p>
          <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
            <li>Release your AI phone number permanently</li>
            <li>Delete all {calls.length} call records</li>
            <li>This action cannot be undone</li>
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting…</> : 'Delete Agent'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
