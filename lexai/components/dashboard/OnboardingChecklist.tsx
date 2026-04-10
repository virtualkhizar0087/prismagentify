'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle, Circle, X, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'

interface Step {
  id: string
  title: string
  description: string
  href: string
  cta: string
  done: boolean
}

interface Props {
  contractCount: number
  chatCount: number
  docCount: number
  isPaid: boolean
}

export function OnboardingChecklist({ contractCount, chatCount, docCount, isPaid }: Props) {
  const [dismissed, setDismissed] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    setDismissed(localStorage.getItem('lexai_onboarding_dismissed') === 'true')
  }, [])

  const steps: Step[] = [
    {
      id: 'contract',
      title: 'Analyze your first contract',
      description: 'Upload any contract and get an instant AI risk score, red flags, and plain-English summary.',
      href: '/contracts',
      cta: 'Analyze a contract',
      done: contractCount > 0,
    },
    {
      id: 'chat',
      title: 'Ask a legal question',
      description: 'Chat with your AI legal co-pilot. Ask anything — contract terms, employee rights, liability, and more.',
      href: '/chat',
      cta: 'Start a conversation',
      done: chatCount > 0,
    },
    {
      id: 'document',
      title: 'Generate a legal document',
      description: 'Create a professional NDA, service agreement, or privacy policy in under 60 seconds.',
      href: isPaid ? '/documents' : '/billing',
      cta: isPaid ? 'Generate a document' : 'Upgrade to unlock',
      done: docCount > 0,
    },
  ]

  const completedCount = steps.filter((s) => s.done).length
  const allDone = completedCount === steps.length

  function dismiss() {
    localStorage.setItem('lexai_onboarding_dismissed', 'true')
    setDismissed(true)
  }

  // Auto-dismiss once all steps complete
  useEffect(() => {
    if (allDone) {
      const t = setTimeout(dismiss, 3000)
      return () => clearTimeout(t)
    }
  }, [allDone])

  if (dismissed) return null

  return (
    <div className="rounded-xl bg-white ring-1 ring-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-lexai-50 to-white border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-lexai-600" />
          <div>
            <p className="font-semibold text-gray-900">
              {allDone ? 'Setup complete!' : 'Get started with LexAI'}
            </p>
            <p className="text-xs text-gray-500">
              {completedCount} of {steps.length} steps done
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Progress pill */}
          <div className="flex items-center gap-1.5">
            {steps.map((s) => (
              <div
                key={s.id}
                className={`h-2 w-6 rounded-full transition-all ${s.done ? 'bg-lexai-500' : 'bg-gray-200'}`}
              />
            ))}
          </div>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="ml-2 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
          <button
            onClick={dismiss}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Steps */}
      {!collapsed && (
        <div className="divide-y divide-gray-50">
          {steps.map((step, i) => (
            <div
              key={step.id}
              className={`flex items-start gap-4 px-6 py-4 transition-colors ${
                step.done ? 'bg-gray-50/50' : 'bg-white hover:bg-lexai-50/30'
              }`}
            >
              {/* Icon */}
              <div className="mt-0.5 shrink-0">
                {step.done ? (
                  <CheckCircle className="h-5 w-5 text-lexai-500" />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-gray-300">
                    <span className="text-xs font-bold text-gray-400">{i + 1}</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${step.done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                  {step.title}
                </p>
                {!step.done && (
                  <p className="mt-0.5 text-xs text-gray-500">{step.description}</p>
                )}
              </div>

              {/* CTA */}
              {!step.done && (
                <Link
                  href={step.href}
                  className="shrink-0 rounded-lg bg-lexai-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-lexai-700 transition-colors"
                >
                  {step.cta}
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* All done banner */}
      {allDone && !collapsed && (
        <div className="bg-lexai-50 px-6 py-3 text-center">
          <p className="text-sm font-medium text-lexai-700">
            You have completed all steps! Dismissing in a moment…
          </p>
        </div>
      )}
    </div>
  )
}
