'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Save, Loader2, ArrowLeft, Languages, MessageSquare, Link2, BookOpen, Moon, Mic } from 'lucide-react'
import Link from 'next/link'
import type { Agent } from '@/types/database'

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
const DAY_LABELS = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' }

export default function AgentSettingsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [name, setName] = useState('')
  const [instructions, setInstructions] = useState('')
  const [hours, setHours] = useState<Record<string, { open: boolean; from: string; to: string }>>({})
  const [language, setLanguage] = useState<'en' | 'es' | 'bilingual'>('en')
  const [smsFollowup, setSmsFollowup] = useState(false)
  const [escalationPhone, setEscalationPhone] = useState('')
  const [opentableId, setOpentableId] = useState('')
  const [mindbodySiteId, setMindbodySiteId] = useState('')
  const [posType, setPosType] = useState('none')
  const [menuItems, setMenuItems] = useState('')
  const [firstMessage, setFirstMessage] = useState('')
  const [afterHoursMessage, setAfterHoursMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('agents').select('*').eq('id', id).single()
      if (data) {
        setAgent(data as Agent)
        setName(data.name)
        setInstructions(data.custom_instructions || '')
        setHours((data.business_hours as any) || Object.fromEntries(
          DAYS.map(d => [d, { open: d !== 'sun', from: '09:00', to: '22:00' }])
        ))
        setLanguage(((data.language || 'en') as 'en' | 'es' | 'bilingual'))
        setSmsFollowup((data as Agent).sms_followup_enabled || false)
        setEscalationPhone((data as Agent).escalation_phone || '')
        setOpentableId((data as Agent).opentable_id || '')
        setMindbodySiteId((data as Agent).mindbody_site_id || '')
        setPosType((data as Agent).pos_type || 'none')
        setMenuItems((data as Agent).menu_items || '')
        setFirstMessage((data as Agent).first_message || '')
        setAfterHoursMessage((data as Agent).after_hours_message || '')
      }
    }
    load()
  }, [id])

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase
      .from('agents')
      .update({
        name,
        custom_instructions: instructions,
        business_hours: hours,
        language,
        sms_followup_enabled: smsFollowup,
        escalation_phone: escalationPhone || null,
        opentable_id: opentableId || null,
        mindbody_site_id: mindbodySiteId || null,
        pos_type: posType || 'none',
        menu_items: menuItems || null,
        first_message: firstMessage || null,
        after_hours_message: afterHoursMessage || null,
      })
      .eq('id', id)
    setSaving(false)
    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  if (!agent) return <div className="animate-pulse space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-lg" />)}</div>

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href={`/agents/${id}`}>
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agent Settings</h1>
          <p className="text-gray-500 text-sm">{agent.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Basic Info</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Agent Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Custom Instructions</Label>
            <Textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="e.g. We are halal certified. Always mention our free parking on Main St."
              rows={4}
            />
            <p className="text-xs text-gray-400">These instructions are added to your AI's behaviour. Be specific.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Business Hours</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {DAYS.map(day => (
            <div key={day} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={hours[day]?.open ?? true}
                onChange={e => setHours(h => ({ ...h, [day]: { ...h[day], open: e.target.checked } }))}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <span className="w-24 text-sm text-gray-700">{DAY_LABELS[day]}</span>
              {hours[day]?.open ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={hours[day]?.from || '09:00'}
                    onChange={e => setHours(h => ({ ...h, [day]: { ...h[day], from: e.target.value } }))}
                    className="w-32 text-sm"
                  />
                  <span className="text-gray-400 text-sm">to</span>
                  <Input
                    type="time"
                    value={hours[day]?.to || '22:00'}
                    onChange={e => setHours(h => ({ ...h, [day]: { ...h[day], to: e.target.value } }))}
                    className="w-32 text-sm"
                  />
                </div>
              ) : (
                <span className="text-gray-400 text-sm italic">Closed</span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Languages className="h-4 w-4" />Language</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-3 gap-2">
          {([
            { value: 'en', label: 'English', desc: 'English only' },
            { value: 'es', label: 'Español', desc: 'Spanish only' },
            { value: 'bilingual', label: 'Bilingual', desc: 'Auto-detect' },
          ] as const).map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setLanguage(opt.value)}
              className={`p-3 rounded-lg border-2 text-left transition-all ${language === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <p className="font-semibold text-sm text-gray-900">{opt.label}</p>
              <p className="text-xs text-gray-500">{opt.desc}</p>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* SMS Follow-up */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4" />SMS Follow-up</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div
            onClick={() => setSmsFollowup(v => !v)}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${smsFollowup ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <div className="flex-1">
              <p className="font-semibold text-sm text-gray-900">Auto-text callers after every call</p>
              <p className="text-xs text-gray-500">Sends a confirmation SMS with booking details or next steps</p>
            </div>
            <div className={`w-10 h-6 rounded-full transition-colors relative ${smsFollowup ? 'bg-green-500' : 'bg-gray-300'}`}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow ${smsFollowup ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Escalation Phone (transfers angry/urgent callers)</Label>
            <Input value={escalationPhone} onChange={e => setEscalationPhone(e.target.value)} placeholder="+1 (555) 000-0000" type="tel" />
          </div>
        </CardContent>
      </Card>

      {/* Greeting & After-Hours */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Mic className="h-4 w-4 text-indigo-500" />Greeting &amp; After-Hours</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Opening Greeting (first thing AI says)</Label>
            <Input
              value={firstMessage}
              onChange={e => setFirstMessage(e.target.value)}
              placeholder={`e.g. Thank you for calling ${agent.name}! How can I help you today?`}
            />
            <p className="text-xs text-gray-400">Leave blank to use the default greeting.</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-600 flex items-center gap-1"><Moon className="h-3 w-3" />After-Hours Message</Label>
            <Textarea
              value={afterHoursMessage}
              onChange={e => setAfterHoursMessage(e.target.value)}
              placeholder="e.g. Thanks for calling! We're currently closed. Our hours are Mon–Fri 9am–10pm. Please call back during business hours or leave your name and number and we'll call you back."
              rows={3}
            />
            <p className="text-xs text-gray-400">When callers ring outside your business hours, the AI delivers this message. Leave blank to answer calls 24/7.</p>
          </div>
        </CardContent>
      </Card>

      {/* Menu — restaurant only */}
      {agent.vertical === 'restaurant' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-orange-500" />
              Menu
              <span className="text-xs text-orange-600 font-semibold bg-orange-50 px-2 py-0.5 rounded-full ml-1">Restaurant</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={menuItems}
              onChange={e => setMenuItems(e.target.value)}
              placeholder={`Paste your full menu. Example:\n\nSTARTERS\n- Garlic Bread — $6\n- Soup of the Day — $8 (vegan)\n\nMAINS\n- Margherita Pizza — $14 (vegetarian)\n- Chicken Alfredo — $18\n- Grilled Salmon — $22 (gluten-free)\n\nDESSERTS\n- Tiramisu — $7\n\nDRINKS\n- Soft drinks — $3\n- House wine — $9/glass`}
              rows={10}
              className="text-sm font-mono"
            />
            <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
              <BookOpen className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
              <p className="text-xs text-orange-700">
                Your AI reads this menu to answer <strong>any caller question</strong> — dish names, prices, dietary options (halal, vegan, gluten-free), allergens, and daily specials. Keep it updated whenever your menu changes.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Integrations */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Link2 className="h-4 w-4" />Integrations</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {agent.vertical === 'restaurant' && (
            <>
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">OpenTable Restaurant ID</Label>
                <Input value={opentableId} onChange={e => setOpentableId(e.target.value)} placeholder="e.g. 12345" />
                <p className="text-xs text-gray-400">Find this in your OpenTable partner portal</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">POS System</Label>
                <select
                  value={posType}
                  onChange={e => setPosType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="none">None / Not connected</option>
                  <option value="toast">Toast POS</option>
                  <option value="square">Square</option>
                  <option value="clover">Clover</option>
                </select>
                <p className="text-xs text-gray-400">AI will mention your POS when handling phone orders</p>
              </div>
            </>
          )}
          {agent.vertical === 'gym' && (
            <div className="space-y-1">
              <Label className="text-xs text-gray-600">Mindbody Site ID</Label>
              <Input value={mindbodySiteId} onChange={e => setMindbodySiteId(e.target.value)} placeholder="e.g. -99999" />
              <p className="text-xs text-gray-400">Find this in your Mindbody dashboard under Settings → Locations</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 w-full">
        {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : saved ? '✓ Saved!' : <><Save className="h-4 w-4 mr-2" />Save Changes</>}
      </Button>
    </div>
  )
}
