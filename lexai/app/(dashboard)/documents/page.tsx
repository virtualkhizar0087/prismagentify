'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DocumentGenerator } from '@/components/documents/DocumentGenerator'
import { formatDate } from '@/lib/utils'
import type { DocumentType, Plan, DocumentGenerated } from '@/types/database'
import { Copy, Check, FileText, X, Download } from 'lucide-react'

const documentTypeLabels: Record<DocumentType, string> = {
  nda: 'NDA',
  service_agreement: 'Service Agreement',
  employment_contract: 'Employment Contract',
  privacy_policy: 'Privacy Policy',
  terms_of_service: 'Terms of Service',
  invoice: 'Invoice',
  cease_and_desist: 'Cease & Desist',
  demand_letter: 'Demand Letter',
  other: 'Other',
}

function ViewModal({ doc, onClose }: { doc: DocumentGenerated; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(doc.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function download() {
    const blob = new Blob([doc.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.type.replace(/_/g, '-')}-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <p className="font-semibold text-gray-900">{doc.title}</p>
            <p className="text-xs text-gray-400">
              {documentTypeLabels[doc.type as DocumentType]} · {formatDate(doc.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copy}
              className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={download}
              className="flex items-center gap-1.5 rounded-lg bg-lexai-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-lexai-700 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="max-h-[500px] overflow-y-auto p-5">
          <pre className="whitespace-pre-wrap font-mono text-xs text-gray-700 leading-relaxed">
            {doc.content}
          </pre>
        </div>
      </div>
    </div>
  )
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentGenerated[]>([])
  const [plan, setPlan] = useState<Plan>('free')
  const [viewDoc, setViewDoc] = useState<DocumentGenerated | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: docs }, { data: profile }] = await Promise.all([
        supabase.from('documents_generated').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('users').select('plan').eq('id', user.id).single(),
      ])
      setDocuments((docs ?? []) as DocumentGenerated[])
      setPlan(((profile as { plan?: string })?.plan ?? 'free') as Plan)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="animate-fade-in space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Generator</h1>
          <p className="mt-1 text-gray-500">Generate professional legal documents tailored to your business in minutes.</p>
        </div>
        <div className="h-32 rounded-xl bg-gray-50 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-8">
      {viewDoc && <ViewModal doc={viewDoc} onClose={() => setViewDoc(null)} />}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Document Generator</h1>
        <p className="mt-1 text-gray-500">
          Generate professional legal documents tailored to your business in minutes.
        </p>
      </div>

      <DocumentGenerator userPlan={plan} />

      {documents.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Generated Documents ({documents.length})
          </h2>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="rounded-xl bg-white p-4 ring-1 ring-gray-200 flex items-center justify-between hover:ring-lexai-200 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                    <FileText className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{doc.title}</p>
                    <p className="text-xs text-gray-400">
                      {documentTypeLabels[doc.type as DocumentType]} · {formatDate(doc.created_at)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewDoc(doc)}
                  className="shrink-0 rounded-lg bg-lexai-50 px-3 py-1.5 text-xs font-medium text-lexai-700 hover:bg-lexai-100 transition-colors"
                >
                  View & Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
