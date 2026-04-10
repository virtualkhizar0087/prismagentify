'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Phone, UtensilsCrossed, Dumbbell, Check, Loader2, ArrowLeft, ArrowRight, Sparkles, Languages, MessageSquare, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { cn, formatPhone } from '@/lib/utils'
import { VOICES } from '@/lib/elevenlabs'

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
const DAY_LABELS: Record<string, string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' }

const DEFAULT_HOURS = Object.fromEntries(
  DAYS.map(d => [d, { open: d !== 'sun', from: '09:00', to: '22:00' }])
)

interface WizardData {
  vertical: 'restaurant' | 'gym' | ''
  businessName: string
  ownerPhone: string
  address: string
  website: string
  hours: Record<string, { open: boolean; from: string; to: string }>
  voiceId: string
  customInstructions: string
  language: 'en' | 'es' | 'bilingual'
  smsFollowup: boolean
  menuItems: string
}

const STEPS = ['Business Type', 'Business Info', 'Hours', 'Customize AI', 'Go Live']

export default function NewAgentPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [agentId, setAgentId] = useState<string | null>(null)
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null)
  const [error, setError] = useState('')

  const [data, setData] = useState<WizardData>({
    vertical: '',
    businessName: '',
    ownerPhone: '',
    address: '',
    website: '',
    hours: DEFAULT_HOURS,
    voiceId: 'EXAVITQu4vr4xnSDxMaL', // Sarah — ElevenLabs default
    customInstructions: '',
    language: 'en',
    smsFollowup: false,
    menuItems: '',
  })

  function update(patch: Partial<WizardData>) {
    setData(d => ({ ...d, ...patch }))
  }

  async function handleFinish() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create agent')
      setAgentId(json.agent.id)
      setPhoneNumber(json.agent.twilio_phone_number)
      setStep(5)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Your AI Receptionist</h1>
        <p className="text-gray-500 mt-1">5 quick steps. Live in 10 minutes.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => {
          const n = i + 1
          const done = step > n
          const active = step === n
          return (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0',
                done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
              )}>
                {done ? <Check className="h-4 w-4" /> : n}
              </div>
              <span className={cn('text-xs hidden sm:block', active ? 'text-blue-600 font-medium' : 'text-gray-400')}>{label}</span>
              {i < STEPS.length - 1 && <div className={cn('flex-1 h-0.5', done ? 'bg-green-500' : 'bg-gray-200')} />}
            </div>
          )
        })}
      </div>

      {/* Step content */}
      <Card className="shadow-sm">
        <CardContent className="p-8">

          {/* Step 1: Vertical */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">What type of business are you?</h2>
                <p className="text-gray-500 text-sm">We'll load the right AI template for your business.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {([
                  { value: 'restaurant', label: 'Restaurant', icon: UtensilsCrossed, desc: 'Reservations, FAQs, hours', color: 'orange' },
                  { value: 'gym', label: 'Gym', icon: Dumbbell, desc: 'Memberships, trials, classes', color: 'purple' },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { update({ vertical: opt.value }); setStep(2) }}
                    className={cn(
                      'p-6 rounded-xl border-2 text-left transition-all hover:shadow-md',
                      data.vertical === opt.value
                        ? opt.value === 'restaurant' ? 'border-orange-500 bg-orange-50' : 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${opt.value === 'restaurant' ? 'bg-orange-100' : 'bg-purple-100'}`}>
                      <opt.icon className={`h-6 w-6 ${opt.value === 'restaurant' ? 'text-orange-600' : 'text-purple-600'}`} />
                    </div>
                    <p className="font-semibold text-gray-900">{opt.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Business Info */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Tell us about your business</h2>
                <p className="text-gray-500 text-sm">Your AI will use this information to answer customer questions.</p>
              </div>
              <div className="space-y-2">
                <Label>Business Name *</Label>
                <Input value={data.businessName} onChange={e => update({ businessName: e.target.value })} placeholder="e.g. Mario's Trattoria" />
              </div>
              <div className="space-y-2">
                <Label>Your Private Phone Number *</Label>
                <Input value={data.ownerPhone} onChange={e => update({ ownerPhone: e.target.value })} placeholder="+1 (555) 000-0000" type="tel" />
                <p className="text-xs text-gray-400">This stays private. The AI will transfer urgent calls here.</p>
              </div>
              <div className="space-y-2">
                <Label>Business Address (optional)</Label>
                <Input value={data.address} onChange={e => update({ address: e.target.value })} placeholder="123 Main St, San Francisco, CA" />
              </div>
              <div className="space-y-2">
                <Label>Website (optional)</Label>
                <Input value={data.website} onChange={e => update({ website: e.target.value })} placeholder="https://www.yourbusiness.com" type="url" />
              </div>
            </div>
          )}

          {/* Step 3: Hours */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">What are your business hours?</h2>
                <p className="text-gray-500 text-sm">Your AI will use these to answer "when are you open?" questions.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const base = { ...data.hours.mon }
                  update({ hours: Object.fromEntries(DAYS.map(d => [d, { ...base }])) })
                }}
                className="text-xs text-blue-600 hover:underline"
              >
                Same hours every day
              </button>
              <div className="space-y-3">
                {DAYS.map(day => (
                  <div key={day} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={data.hours[day]?.open ?? true}
                      onChange={e => update({ hours: { ...data.hours, [day]: { ...data.hours[day], open: e.target.checked } } })}
                      className="h-4 w-4 text-blue-600 rounded shrink-0"
                    />
                    <span className="w-8 text-sm text-gray-600 font-medium">{DAY_LABELS[day]}</span>
                    {data.hours[day]?.open ? (
                      <div className="flex items-center gap-2">
                        <Input type="time" value={data.hours[day]?.from || '09:00'} onChange={e => update({ hours: { ...data.hours, [day]: { ...data.hours[day], from: e.target.value } } })} className="w-28 text-sm" />
                        <span className="text-gray-400 text-sm">–</span>
                        <Input type="time" value={data.hours[day]?.to || '22:00'} onChange={e => update({ hours: { ...data.hours, [day]: { ...data.hours[day], to: e.target.value } } })} className="w-28 text-sm" />
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm italic">Closed</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Customize */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Customize your AI voice</h2>
                <p className="text-gray-500 text-sm">Choose how your AI sounds and any special instructions.</p>
              </div>
              <div className="space-y-2">
                <Label>AI Voice</Label>
                <div className="grid gap-3">
                  {VOICES.map(voice => (
                    <button
                      key={voice.id}
                      onClick={() => update({ voiceId: voice.id })}
                      className={cn(
                        'p-4 rounded-xl border-2 text-left transition-all',
                        data.voiceId === voice.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{voice.name}</p>
                          <p className="text-xs text-gray-500">{voice.description}</p>
                        </div>
                        {data.voiceId === voice.id && <Check className="h-5 w-5 text-blue-600" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              {/* Menu — restaurant only */}
              {data.vertical === 'restaurant' && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-orange-500" />
                    Your Menu
                    <span className="text-xs text-orange-600 font-semibold bg-orange-50 px-2 py-0.5 rounded-full">Restaurant</span>
                  </Label>
                  <Textarea
                    value={data.menuItems}
                    onChange={e => update({ menuItems: e.target.value })}
                    placeholder={`Paste your full menu or key items. Example:\n\nSTARTERS\n- Garlic Bread — $6\n- Soup of the Day — $8 (vegan available)\n\nMAINS\n- Margherita Pizza — $14 (vegetarian)\n- Chicken Alfredo — $18\n- Grilled Salmon — $22 (gluten-free)\n\nDESSERTS\n- Tiramisu — $7\n- Chocolate Lava Cake — $8\n\nDRINKS\n- Soft drinks — $3\n- House wine — $9/glass`}
                    rows={8}
                    className="text-sm font-mono"
                  />
                  <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <BookOpen className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-orange-700">
                      The AI will use this to answer <strong>any menu question</strong> — dishes, prices, dietary options, allergens, specials. The more detail you add, the better your AI performs.
                    </p>
                  </div>
                </div>
              )}

              {/* Language */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Languages className="h-4 w-4" />Language</Label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: 'en', label: 'English', desc: 'English only' },
                    { value: 'es', label: 'Español', desc: 'Spanish only' },
                    { value: 'bilingual', label: 'Bilingual', desc: 'Auto-detect' },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => update({ language: opt.value })}
                      className={cn(
                        'p-3 rounded-lg border-2 text-left transition-all',
                        data.language === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <p className="font-semibold text-sm text-gray-900">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* SMS follow-up */}
              <div
                onClick={() => update({ smsFollowup: !data.smsFollowup })}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
                  data.smsFollowup ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <MessageSquare className={`h-5 w-5 shrink-0 ${data.smsFollowup ? 'text-green-600' : 'text-gray-400'}`} />
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-900">SMS Follow-up</p>
                  <p className="text-xs text-gray-500">Automatically text the caller a confirmation after every call</p>
                </div>
                <div className={cn('w-10 h-6 rounded-full transition-colors relative', data.smsFollowup ? 'bg-green-500' : 'bg-gray-300')}>
                  <div className={cn('w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow', data.smsFollowup ? 'translate-x-5' : 'translate-x-1')} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Special Instructions (optional)</Label>
                <Textarea
                  value={data.customInstructions}
                  onChange={e => update({ customInstructions: e.target.value })}
                  placeholder={data.vertical === 'restaurant'
                    ? 'e.g. We are halal certified. Always mention our free parking on Main St.'
                    : 'e.g. We have a pool and sauna. Ladies-only sessions on Monday mornings.'}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 5: Go Live */}
          {step === 5 && (
            <div className="space-y-6 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="h-10 w-10 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Your AI is live! 🎉</h2>
                <p className="text-gray-500">Your AI receptionist is now answering calls.</p>
              </div>

              {phoneNumber && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
                  <p className="text-sm text-blue-600 font-medium mb-2">Your AI Phone Number</p>
                  <p className="text-3xl font-bold text-blue-900 font-mono">{formatPhone(phoneNumber)}</p>
                  <p className="text-xs text-blue-500 mt-2">Update this number on Google Maps, your website, and business cards</p>
                </div>
              )}

              <div className="text-left space-y-3">
                <p className="font-semibold text-gray-900 text-sm">Next steps:</p>
                {[
                  'Update your Google Business listing with your new AI number',
                  'Update your website contact number',
                  'Test the AI by calling your new number',
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                    <p className="text-sm text-gray-700">{step}</p>
                  </div>
                ))}
              </div>

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 h-12"
                onClick={() => router.push(agentId ? `/agents/${agentId}` : '/dashboard')}
              >
                Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Error */}
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mt-4">{error}</p>}
        </CardContent>
      </Card>

      {/* Navigation */}
      {step < 5 && (
        <div className="flex justify-between">
          <Button
            variant="ghost"
            onClick={() => step > 1 ? setStep(s => s - 1) : router.push('/agents')}
            disabled={loading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>

          {step < 4 && (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={
                (step === 1 && !data.vertical) ||
                (step === 2 && (!data.businessName || !data.ownerPhone))
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          {step === 4 && (
            <Button onClick={handleFinish} disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating AI…</> : <>Launch My AI <Sparkles className="ml-2 h-4 w-4" /></>}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
