'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Plus, Trash2, Save, Loader2, HelpCircle, GripVertical, Sparkles } from 'lucide-react'
import type { AgentFaq } from '@/types/database'

const STARTERS: Record<string, { q: string; a: string }[]> = {
  restaurant: [
    { q: 'Do you take reservations?',          a: 'Yes! I can book a table for you right now. What date and time works for you?' },
    { q: 'What are your hours?',               a: 'We\'re open Monday–Friday 11am–10pm and weekends 10am–11pm.' },
    { q: 'Do you have parking?',               a: 'Yes, we have free parking on the street and a lot behind the building.' },
    { q: 'Is your food halal/kosher/vegan?',   a: 'We have vegan and vegetarian options. Please mention any dietary needs when booking.' },
    { q: 'Do you do private events?',          a: 'Yes! We have a private dining room for up to 30 guests. Shall I take your details?' },
  ],
  gym: [
    { q: 'How much does membership cost?',     a: 'We have plans starting from $29/month. I can book you a free tour to go over all options.' },
    { q: 'Do you offer a free trial?',         a: 'Yes! Your first session is completely free. Would you like to book one right now?' },
    { q: 'What are your opening hours?',       a: 'We\'re open 5am–11pm weekdays and 7am–9pm weekends.' },
    { q: 'Do you have personal trainers?',     a: 'Yes, certified personal trainers are available. Book a free consultation through me.' },
    { q: 'Is there a joining fee?',            a: 'No joining fee this month — just your first month\'s membership.' },
  ],
}

export default function AgentFaqPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const [faqs, setFaqs] = useState<AgentFaq[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [vertical, setVertical] = useState<'restaurant' | 'gym'>('restaurant')
  const [newQ, setNewQ] = useState('')
  const [newA, setNewA] = useState('')
  const [adding, setAdding] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: agent }, { data: faqData }] = await Promise.all([
        supabase.from('agents').select('vertical').eq('id', id).single(),
        supabase.from('agent_faqs').select('*').eq('agent_id', id).order('order_index'),
      ])
      if (agent) setVertical(agent.vertical as 'restaurant' | 'gym')
      setFaqs((faqData as AgentFaq[]) ?? [])
      setLoading(false)
    }
    load()
  }, [id])

  async function addFaq() {
    if (!newQ.trim() || !newA.trim()) return
    setAdding(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('agent_faqs').insert({
      agent_id: id,
      user_id: user!.id,
      question: newQ.trim(),
      answer: newA.trim(),
      order_index: faqs.length,
    }).select().single()
    if (data) {
      setFaqs(f => [...f, data as AgentFaq])
      setNewQ('')
      setNewA('')
      setShowAdd(false)
    }
    setAdding(false)
  }

  async function addStarter(q: string, a: string) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('agent_faqs').insert({
      agent_id: id, user_id: user!.id, question: q, answer: a, order_index: faqs.length,
    }).select().single()
    if (data) setFaqs(f => [...f, data as AgentFaq])
  }

  async function updateFaq(faq: AgentFaq) {
    setSaving(faq.id)
    await supabase.from('agent_faqs').update({ question: faq.question, answer: faq.answer }).eq('id', faq.id)
    setSaving(null)
  }

  async function deleteFaq(faqId: string) {
    await supabase.from('agent_faqs').delete().eq('id', faqId)
    setFaqs(f => f.filter(x => x.id !== faqId))
  }

  function updateLocal(id: string, field: 'question' | 'answer', value: string) {
    setFaqs(fs => fs.map(f => f.id === id ? { ...f, [field]: value } : f))
  }

  const starters = STARTERS[vertical] ?? []
  const starterQs = new Set(faqs.map(f => f.question))

  if (loading) return (
    <div className="space-y-3 animate-pulse max-w-2xl">
      {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-lg" />)}
    </div>
  )

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/agents/${id}`}>
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FAQ Knowledge Base</h1>
          <p className="text-gray-500 text-sm">Your AI memorises these Q&amp;As and uses them to answer callers instantly.</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <HelpCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-900">How it works</p>
          <p className="text-sm text-blue-700">Each Q&amp;A pair is injected directly into your AI's knowledge. When a caller asks a matching question, the AI answers confidently with your exact answer — no hallucinating, no guessing.</p>
        </div>
      </div>

      {/* Starter templates */}
      {starters.some(s => !starterQs.has(s.q)) && (
        <Card className="border-dashed border-purple-200 bg-purple-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-purple-700">
              <Sparkles className="h-4 w-4" />
              Quick-add starter Q&amp;As for {vertical}s
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {starters.filter(s => !starterQs.has(s.q)).map(s => (
              <div key={s.q} className="flex items-start justify-between gap-3 bg-white rounded-lg p-3 border border-purple-100">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{s.q}</p>
                  <p className="text-xs text-gray-500 truncate">{s.a}</p>
                </div>
                <Button size="sm" variant="outline" className="shrink-0 text-purple-600 border-purple-200" onClick={() => addStarter(s.q, s.a)}>
                  <Plus className="h-3 w-3 mr-1" />Add
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Existing FAQs */}
      {faqs.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{faqs.length} Q&amp;A{faqs.length !== 1 ? 's' : ''} in knowledge base</p>
          {faqs.map((faq) => (
            <Card key={faq.id} className="group">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <GripVertical className="h-4 w-4 text-gray-300 mt-2 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Question</label>
                      <Input
                        value={faq.question}
                        onChange={e => updateLocal(faq.id, 'question', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Answer</label>
                      <Textarea
                        value={faq.answer}
                        onChange={e => updateLocal(faq.id, 'answer', e.target.value)}
                        rows={2}
                        className="mt-1 text-sm"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteFaq(faq.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />Delete
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateFaq(faq)}
                        disabled={saving === faq.id}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {saving === faq.id
                          ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Saving…</>
                          : <><Save className="h-3 w-3 mr-1" />Save</>}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add new */}
      {showAdd ? (
        <Card className="border-blue-200">
          <CardContent className="p-4 space-y-3">
            <p className="font-semibold text-sm text-gray-900">New Q&amp;A</p>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Question the caller might ask</label>
              <Input value={newQ} onChange={e => setNewQ(e.target.value)} placeholder="e.g. Do you have vegan options?" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">How your AI should answer</label>
              <Textarea value={newA} onChange={e => setNewA(e.target.value)} placeholder="e.g. Yes! We have several vegan dishes including…" rows={3} className="mt-1 text-sm" />
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => { setShowAdd(false); setNewQ(''); setNewA('') }}>Cancel</Button>
              <Button onClick={addFaq} disabled={adding || !newQ.trim() || !newA.trim()} className="bg-blue-600 hover:bg-blue-700">
                {adding ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Adding…</> : <><Plus className="h-4 w-4 mr-2" />Add Q&amp;A</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setShowAdd(true)} variant="outline" className="w-full border-dashed border-2 h-12 text-gray-500 hover:text-blue-600 hover:border-blue-300">
          <Plus className="h-4 w-4 mr-2" />Add Custom Q&amp;A
        </Button>
      )}

      {faqs.length === 0 && !showAdd && (
        <p className="text-center text-sm text-gray-400 py-4">No Q&amp;As yet — add one above or use the starter templates.</p>
      )}
    </div>
  )
}
