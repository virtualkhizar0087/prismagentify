'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { Plus, PhoneOutgoing, Users, Play, Pause, Loader2, MessageSquare } from 'lucide-react'
import type { Campaign } from '@/types/database'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  active: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-blue-100 text-blue-700',
}

const TEMPLATES = {
  re_engagement: {
    restaurant: `Hi {{name}}, this is {{business_name}}! We miss seeing you. Come back this week and enjoy 10% off your next visit. Call us or just reply YES to this message to book a table. We look forward to seeing you soon!`,
    gym: `Hi {{name}}, this is {{business_name}}! We noticed you haven't visited in a while and we miss you. Come back this week — your first session back is on us. Reply YES to confirm or call us to schedule. Let's get back on track together!`,
  },
  reminder: {
    restaurant: `Hi {{name}}, just a friendly reminder of your reservation at {{business_name}} tomorrow. Reply YES to confirm or call us if you need to reschedule. We look forward to seeing you!`,
    gym: `Hi {{name}}, reminder: your session at {{business_name}} is coming up. Reply YES to confirm or call us to reschedule. See you soon!`,
  },
  promo: {
    restaurant: `Hi {{name}}! {{business_name}} has a special offer just for you. Join us this weekend for our chef's special menu. Reservations filling fast — call us or reply to book your table today!`,
    gym: `Hi {{name}}! {{business_name}} is running a limited-time offer on memberships this month. Lock in the best rate before it ends. Call us or reply to learn more!`,
  },
}

export default function CampaignsPage() {
  const supabase = createClient()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [vertical, setVertical] = useState<'restaurant' | 'gym'>('gym')
  const [form, setForm] = useState({
    name: '',
    type: 're_engagement' as Campaign['type'],
    message_template: TEMPLATES.re_engagement.gym,
  })
  const [contacts, setContacts] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false })
    setCampaigns((data as Campaign[]) ?? [])
    setLoading(false)
  }

  function updateTemplate(type: Campaign['type'], v: 'restaurant' | 'gym') {
    const t = type as keyof typeof TEMPLATES
    setForm(f => ({ ...f, type, message_template: TEMPLATES[t]?.[v] ?? '' }))
  }

  async function createCampaign() {
    if (!form.name.trim()) return
    setSaving(true)

    const phoneLines = contacts
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 5)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .insert({
        name: form.name,
        type: form.type,
        vertical,
        message_template: form.message_template,
        total_contacts: phoneLines.length,
        status: 'draft',
        user_id: user.id,
      })
      .select()
      .single()

    if (!error && campaign && phoneLines.length > 0) {
      await supabase.from('campaign_contacts').insert(
        phoneLines.map(phone => ({
          campaign_id: campaign.id,
          user_id: user.id,
          phone,
        }))
      )
    }

    setSaving(false)
    if (!error) {
      setShowNew(false)
      setForm({ name: '', type: 're_engagement', message_template: TEMPLATES.re_engagement.gym })
      setContacts('')
      load()
    }
  }

  async function toggleStatus(c: Campaign) {
    const newStatus = c.status === 'active' ? 'paused' : 'active'
    await supabase.from('campaigns').update({ status: newStatus }).eq('id', c.id)
    setCampaigns(prev => prev.map(x => x.id === c.id ? { ...x, status: newStatus } : x))
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Outbound Campaigns</h1>
          <p className="text-gray-500 text-sm mt-1">Re-engage lapsed members and send reminders via AI calls + SMS</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Plus className="h-4 w-4" />New Campaign
        </Button>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <PhoneOutgoing className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-900">How Outbound Campaigns Work</p>
          <p className="text-sm text-blue-700 mt-0.5">
            Upload a list of phone numbers, choose a message template, and your AI will call each contact with a personalized message.
            Great for gym re-engagement, reservation reminders, and promotional offers.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
        </div>
      ) : campaigns.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <PhoneOutgoing className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No campaigns yet</p>
            <p className="text-gray-400 text-sm mt-1">Create your first campaign to start re-engaging customers</p>
            <Button onClick={() => setShowNew(true)} className="mt-4 bg-blue-600 hover:bg-blue-700 gap-2">
              <Plus className="h-4 w-4" />Create Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => (
            <Card key={c.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <PhoneOutgoing className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{c.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                        <span className="text-xs text-gray-400 capitalize">{c.type.replace('_', ' ')}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1"><Users className="h-3 w-3" />{c.total_contacts} contacts</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {c.total_contacts > 0 && (
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{c.sent_count}/{c.total_contacts}</p>
                        <p className="text-xs text-gray-400">called</p>
                      </div>
                    )}
                    {c.status !== 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleStatus(c)}
                        className="gap-1.5"
                      >
                        {c.status === 'active'
                          ? <><Pause className="h-3.5 w-3.5" />Pause</>
                          : <><Play className="h-3.5 w-3.5" />Activate</>}
                      </Button>
                    )}
                  </div>
                </div>
                {/* Progress bar */}
                {c.total_contacts > 0 && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.round((c.sent_count / c.total_contacts) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New campaign modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">New Campaign</h2>
                <p className="text-gray-500 text-sm mt-1">Set up your outbound AI calling campaign</p>
              </div>

              <div className="space-y-1">
                <Label>Campaign Name</Label>
                <Input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. March Lapsed Members Re-engagement"
                />
              </div>

              <div className="space-y-1">
                <Label>Business Vertical</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['gym', 'restaurant'] as const).map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => { setVertical(v); updateTemplate(form.type, v) }}
                      className={`p-3 rounded-lg border-2 text-sm font-medium capitalize transition-all ${vertical === v ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                      {v === 'gym' ? '🏋️ Gym' : '🍽️ Restaurant'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <Label>Campaign Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: 're_engagement', label: 'Re-engage' },
                    { value: 'reminder', label: 'Reminder' },
                    { value: 'promo', label: 'Promo' },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateTemplate(opt.value, vertical)}
                      className={`p-2.5 rounded-lg border-2 text-sm font-medium transition-all ${form.type === opt.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="flex items-center gap-2"><MessageSquare className="h-3.5 w-3.5" />Message Template</Label>
                <Textarea
                  value={form.message_template}
                  onChange={e => setForm(f => ({ ...f, message_template: e.target.value }))}
                  rows={4}
                />
                <p className="text-xs text-gray-400">Use {'{{name}}'} and {'{{business_name}}'} as placeholders</p>
              </div>

              <div className="space-y-1">
                <Label className="flex items-center gap-2"><Users className="h-3.5 w-3.5" />Contact Phone Numbers</Label>
                <Textarea
                  value={contacts}
                  onChange={e => setContacts(e.target.value)}
                  placeholder={"+1 555 000 0001\n+1 555 000 0002\n+1 555 000 0003"}
                  rows={5}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-400">One phone number per line. {contacts.split('\n').filter(l => l.trim().length > 5).length} contacts entered.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowNew(false)} className="flex-1">Cancel</Button>
                <Button
                  onClick={createCampaign}
                  disabled={saving || !form.name.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating…</> : 'Create Campaign'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
