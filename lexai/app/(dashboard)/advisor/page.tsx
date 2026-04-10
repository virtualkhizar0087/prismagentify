'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Scale, Loader2, Copy, Check, FileText, AlertTriangle } from 'lucide-react'

const SITUATION_TYPES = [
  { value: 'unpaid_invoice', label: 'Unpaid Invoice / Non-Payment' },
  { value: 'contract_breach', label: 'Contract Breach / Violation' },
  { value: 'employment_dispute', label: 'Employment Dispute' },
  { value: 'property_dispute', label: 'Property / Rent Dispute' },
  { value: 'business_partner', label: 'Business Partner Dispute' },
  { value: 'ip_theft', label: 'IP Theft / Copyright Violation' },
  { value: 'consumer_complaint', label: 'Consumer Complaint / Defective Product' },
  { value: 'cyber_crime', label: 'Cyber Crime / Online Fraud' },
  { value: 'family_law', label: 'Family / Inheritance Matter' },
  { value: 'tax_issue', label: 'Tax / FBR Issue' },
  { value: 'startup_legal', label: 'Startup / Company Registration' },
  { value: 'other', label: 'Other Legal Matter' },
]

export default function AdvisorPage() {
  const [form, setForm] = useState({
    situationType: '',
    description: '',
    facts: '',
    desiredOutcome: '',
    language: 'en',
  })
  const [loading, setLoading] = useState(false)
  const [brief, setBrief] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.situationType || !form.description.trim()) return
    setLoading(true)
    setBrief('')
    setError('')

    try {
      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        setBrief(data.brief)
      } else {
        setError(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    }
    setLoading(false)
  }

  function copy() {
    navigator.clipboard.writeText(brief)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-lexai-50">
            <Scale className="h-5 w-5 text-lexai-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">AI Legal Advisor</h1>
        </div>
        <p className="text-gray-500 ml-12">
          Describe your legal situation — get a structured brief with applicable Pakistani law, your rights, and recommended actions.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800">
          <strong>AI tool — not a licensed attorney.</strong> This brief is for informational guidance only. For court proceedings or high-stakes matters, always consult a qualified Pakistani lawyer.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <div className="rounded-xl bg-white p-6 ring-1 ring-gray-200">
          <h2 className="mb-4 font-semibold text-gray-900">Describe Your Situation</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Situation type */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Type of Legal Issue <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={form.situationType}
                onChange={(e) => setForm({ ...form, situationType: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-lexai-500"
              >
                <option value="">Select a category…</option>
                {SITUATION_TYPES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                What happened? <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={5}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe your situation in detail. E.g.: I completed a 3-month web development project for a client in Lahore. We had a written contract for PKR 150,000. They received all deliverables in January but have not paid. Last contact was 2 weeks ago when they said they would pay 'soon'."
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-lexai-500 resize-none"
              />
            </div>

            {/* Key facts */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Key facts & evidence you have <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                rows={3}
                value={form.facts}
                onChange={(e) => setForm({ ...form, facts: e.target.value })}
                placeholder="E.g.: Written contract signed. WhatsApp messages acknowledging delivery. Invoice sent on Jan 15. No payment received. Amount: PKR 150,000."
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-lexai-500 resize-none"
              />
            </div>

            {/* Desired outcome */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                What do you want to achieve? <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={form.desiredOutcome}
                onChange={(e) => setForm({ ...form, desiredOutcome: e.target.value })}
                placeholder="E.g.: Recover the full payment. Avoid going to court if possible."
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-lexai-500"
              />
            </div>

            {/* Language */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Response language</label>
              <div className="flex gap-3">
                {[{ value: 'en', label: '🇺🇸 English' }, { value: 'ur', label: '🇵🇰 اردو' }].map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setForm({ ...form, language: l.value })}
                    className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                      form.language === l.value
                        ? 'border-lexai-500 bg-lexai-50 text-lexai-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !form.situationType || !form.description.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-lexai-600 py-3 text-sm font-semibold text-white hover:bg-lexai-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Generating legal brief…</>
              ) : (
                <><Scale className="h-4 w-4" />Get Legal Brief</>
              )}
            </button>
          </form>
        </div>

        {/* Output */}
        <div className="rounded-xl bg-white ring-1 ring-gray-200 flex flex-col">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-900">Legal Brief</span>
            </div>
            {brief && (
              <button
                onClick={copy}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {copied ? <><Check className="h-3.5 w-3.5 text-green-500" />Copied</> : <><Copy className="h-3.5 w-3.5" />Copy</>}
              </button>
            )}
          </div>

          <div className="flex-1 p-6">
            {loading && (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-lexai-500 mb-3" />
                <p className="text-sm font-medium text-gray-700">Analyzing your situation…</p>
                <p className="text-xs text-gray-400 mt-1">Reviewing applicable Pakistani law</p>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
            )}

            {!loading && !brief && !error && (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center text-gray-400">
                <Scale className="h-10 w-10 mb-3 text-gray-200" />
                <p className="text-sm font-medium">Your legal brief will appear here</p>
                <p className="text-xs mt-1 max-w-xs">Fill in the form and click &ldquo;Get Legal Brief&rdquo; — takes about 10 seconds</p>
              </div>
            )}

            {!loading && brief && (
              <div
                className="prose prose-sm max-w-none text-gray-700
                  prose-headings:text-gray-900 prose-headings:font-semibold
                  prose-h2:text-base prose-h2:mt-5 prose-h2:mb-2
                  prose-p:text-sm prose-p:leading-relaxed
                  prose-li:text-sm prose-li:leading-relaxed
                  prose-strong:text-gray-900
                  prose-ol:pl-4 prose-ul:pl-4"
              >
                <ReactMarkdown>{brief}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Example use cases */}
      {!brief && !loading && (
        <div className="rounded-xl bg-lexai-50 p-5 ring-1 ring-lexai-100">
          <p className="text-sm font-semibold text-lexai-700 mb-3">Common use cases</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              'Freelancer not paid after project delivery',
              'Employer withheld final salary / gratuity',
              'Landlord refusing to return security deposit',
              'Business partner withdrew funds without approval',
              'Client copied my software / design work',
              'Online seller sent damaged or fake products',
            ].map((example) => (
              <button
                key={example}
                onClick={() => setForm({ ...form, description: example, situationType: 'other' })}
                className="text-left rounded-lg bg-white px-3 py-2.5 text-xs text-lexai-700 hover:bg-lexai-100 transition-colors ring-1 ring-lexai-200"
              >
                → {example}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
