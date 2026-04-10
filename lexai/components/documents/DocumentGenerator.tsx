'use client'

import { useState } from 'react'
import { FileText, AlertCircle, Download, Copy, Check, Edit3 } from 'lucide-react'
import type { Plan, DocumentType } from '@/types/database'

interface Props {
  userPlan: Plan
  initialContent?: string
  initialType?: DocumentType
}

const DOCUMENT_TYPES: { value: DocumentType; label: string; labelUr: string; description: string; descUr: string; icon: string }[] = [
  { value: 'nda', label: 'NDA', labelUr: 'رازداری معاہدہ', description: 'Non-Disclosure Agreement', descUr: 'کاروباری راز محفوظ کریں', icon: '🤝' },
  { value: 'service_agreement', label: 'Service Agreement', labelUr: 'سروس معاہدہ', description: 'For contractors & freelancers', descUr: 'فری لانسرز کے لیے', icon: '📋' },
  { value: 'employment_contract', label: 'Employment Contract', labelUr: 'ملازمت کا معاہدہ', description: 'Full-time or part-time hire', descUr: 'ملازمین کے لیے', icon: '👔' },
  { value: 'privacy_policy', label: 'Privacy Policy', labelUr: 'پرائیویسی پالیسی', description: 'Website & app privacy policy', descUr: 'ویب سائٹ / ایپ کے لیے', icon: '🔒' },
  { value: 'terms_of_service', label: 'Terms of Service', labelUr: 'شرائط و ضوابط', description: 'Website terms & conditions', descUr: 'ویب سائٹ کی شرائط', icon: '📜' },
  { value: 'cease_and_desist', label: 'Cease & Desist', labelUr: 'فوری بند کریں', description: 'Stop unauthorized use', descUr: 'غیر مجاز استعمال روکیں', icon: '🛑' },
]

const FORM_FIELDS: Record<DocumentType, { key: string; label: string; placeholder: string }[]> = {
  nda: [
    { key: 'disclosing_party', label: 'Disclosing Party (your company)', placeholder: 'Acme Corp' },
    { key: 'receiving_party', label: 'Receiving Party', placeholder: 'John Smith / XYZ LLC' },
    { key: 'purpose', label: 'Purpose of disclosure', placeholder: 'Evaluation of potential business partnership' },
    { key: 'duration', label: 'Confidentiality duration', placeholder: '2 years' },
    { key: 'governing_law', label: 'Governing state/law', placeholder: 'Delaware' },
  ],
  service_agreement: [
    { key: 'client_name', label: 'Client name', placeholder: 'Acme Corp' },
    { key: 'service_provider', label: 'Service provider name', placeholder: 'Jane Smith / Dev Studio LLC' },
    { key: 'services', label: 'Services to be provided', placeholder: 'Web development, UI/UX design' },
    { key: 'payment_amount', label: 'Payment amount', placeholder: '$5,000/month' },
    { key: 'start_date', label: 'Start date', placeholder: 'April 1, 2025' },
    { key: 'governing_law', label: 'Governing state', placeholder: 'California' },
  ],
  employment_contract: [
    { key: 'employer', label: 'Employer company', placeholder: 'Acme Corp' },
    { key: 'employee', label: 'Employee name', placeholder: 'John Smith' },
    { key: 'role', label: 'Job title / Role', placeholder: 'Senior Software Engineer' },
    { key: 'salary', label: 'Salary / Compensation', placeholder: '$120,000/year' },
    { key: 'start_date', label: 'Start date', placeholder: 'April 1, 2025' },
    { key: 'benefits', label: 'Benefits', placeholder: 'Health insurance, 401k, 20 days PTO' },
  ],
  privacy_policy: [
    { key: 'company_name', label: 'Company name', placeholder: 'Acme Corp' },
    { key: 'website_url', label: 'Website URL', placeholder: 'https://acmecorp.com' },
    { key: 'data_collected', label: 'Data you collect', placeholder: 'Name, email, payment info' },
    { key: 'contact_email', label: 'Contact email', placeholder: 'privacy@acmecorp.com' },
  ],
  terms_of_service: [
    { key: 'company_name', label: 'Company name', placeholder: 'Acme Corp' },
    { key: 'website_url', label: 'Website/product URL', placeholder: 'https://acmecorp.com' },
    { key: 'services_description', label: 'What your product/service does', placeholder: 'SaaS project management tool' },
    { key: 'governing_law', label: 'Governing state', placeholder: 'Delaware' },
  ],
  cease_and_desist: [
    { key: 'sender', label: 'Your name/company', placeholder: 'Acme Corp' },
    { key: 'recipient', label: 'Recipient name/company', placeholder: 'John Smith' },
    { key: 'infringement', label: 'What they are doing wrong', placeholder: 'Using our trademarked logo without permission' },
    { key: 'demand', label: 'What you want them to stop', placeholder: 'Immediately cease using our logo and destroy all materials' },
    { key: 'deadline', label: 'Response deadline', placeholder: '14 days from receipt' },
  ],
  demand_letter: [],
  invoice: [],
  other: [],
}

export function DocumentGenerator({ userPlan, initialContent, initialType }: Props) {
  const [selectedType, setSelectedType] = useState<DocumentType | null>(initialType ?? null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedDoc, setGeneratedDoc] = useState<string | null>(initialContent ?? null)
  const [editedDoc, setEditedDoc] = useState<string | null>(initialContent ?? null)
  const [isEditing, setIsEditing] = useState(false)
  const [copied, setCopied] = useState(false)

  const isPaid = userPlan !== 'free'

  async function handleGenerate() {
    if (!selectedType) return
    setIsGenerating(true)
    setError(null)
    setGeneratedDoc(null)
    setEditedDoc(null)
    setIsEditing(false)

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          title: `${selectedType.replace(/_/g, ' ')} - ${new Date().toLocaleDateString()}`,
          details: formData,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Generation failed'); return }
      setGeneratedDoc(data.document.content)
      setEditedDoc(data.document.content)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  function downloadDocument() {
    const content = editedDoc ?? generatedDoc
    if (!content || !selectedType) return
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedType.replace(/_/g, '-')}-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  function copyToClipboard() {
    const content = editedDoc ?? generatedDoc
    if (!content) return
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isPaid) {
    return (
      <div className="rounded-xl bg-lexai-50 p-6 ring-1 ring-lexai-200">
        <div className="flex items-start gap-4">
          <div className="text-3xl">📝</div>
          <div>
            <p className="font-semibold text-lexai-900">Document Generation requires a paid plan</p>
            <p className="mt-1 text-sm text-lexai-700">
              Upgrade to Starter ($49/mo) to generate NDAs, service agreements, privacy policies, and more.
            </p>
            <a href="/billing" className="mt-3 inline-block rounded-lg bg-lexai-600 px-4 py-2 text-sm font-medium text-white hover:bg-lexai-700 transition-colors">
              Upgrade now
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Document type picker */}
      <div className="grid gap-3 sm:grid-cols-3">
        {DOCUMENT_TYPES.map((doc) => (
          <button
            key={doc.value}
            onClick={() => {
              setSelectedType(doc.value)
              setFormData({})
              setGeneratedDoc(null)
              setEditedDoc(null)
              setError(null)
              setIsEditing(false)
            }}
            className={`rounded-xl p-4 text-left transition-all ring-1 ${
              selectedType === doc.value
                ? 'bg-lexai-50 ring-lexai-400 shadow-sm'
                : 'bg-white ring-gray-200 hover:ring-lexai-200'
            }`}
          >
            <div className="text-2xl mb-2">{doc.icon}</div>
            <p className="text-sm font-semibold text-gray-900">{doc.labelUr}</p>
            <p className="text-xs text-gray-400">{doc.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{doc.descUr}</p>
          </button>
        ))}
      </div>

      {/* Form */}
      {selectedType && FORM_FIELDS[selectedType]?.length > 0 && (
        <div className="rounded-xl bg-white p-6 ring-1 ring-gray-200">
          <h3 className="mb-4 font-semibold text-gray-900">
            {DOCUMENT_TYPES.find((d) => d.value === selectedType)?.label} Details
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {FORM_FIELDS[selectedType].map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                <input
                  type="text"
                  value={formData[field.key] ?? ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-lexai-500"
                />
              </div>
            ))}
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 ring-1 ring-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="mt-4 rounded-lg bg-lexai-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-lexai-700 disabled:opacity-50 transition-colors"
          >
            {isGenerating ? 'Generating…' : generatedDoc ? 'Regenerate' : 'Generate Document'}
          </button>
        </div>
      )}

      {/* Generated document — inline editor */}
      {(generatedDoc || editedDoc) && (
        <div className="animate-fade-in rounded-xl bg-white ring-1 ring-gray-200 overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">Generated Document</h3>
              {isEditing && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  Editing
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing((e) => !e)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  isEditing
                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Edit3 className="h-3.5 w-3.5" />
                {isEditing ? 'Done' : 'Edit'}
              </button>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={downloadDocument}
                className="flex items-center gap-1.5 rounded-lg bg-lexai-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-lexai-700 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </button>
            </div>
          </div>

          {/* Editor or Preview */}
          <div className="max-h-[600px] overflow-y-auto">
            {isEditing ? (
              <textarea
                value={editedDoc ?? ''}
                onChange={(e) => setEditedDoc(e.target.value)}
                className="w-full resize-none border-0 p-5 font-mono text-xs text-gray-700 leading-relaxed outline-none focus:ring-0"
                style={{ minHeight: '400px' }}
                spellCheck={false}
              />
            ) : (
              <pre className="whitespace-pre-wrap p-5 font-mono text-xs text-gray-700 leading-relaxed">
                {editedDoc ?? generatedDoc}
              </pre>
            )}
          </div>

          <div className="border-t border-gray-100 bg-amber-50 px-5 py-3 flex items-center justify-between">
            <p className="text-xs text-amber-700">
              ⚠️ AI-generated — for reference only. Have a licensed attorney review before signing.
            </p>
            {isEditing && (
              <p className="text-xs text-gray-500 shrink-0 ml-4">Edits saved locally</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
