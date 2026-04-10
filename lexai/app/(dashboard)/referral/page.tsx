'use client'

import { useState, useEffect } from 'react'
import { Copy, Check, Gift, Users, Star, Share2, ChevronRight } from 'lucide-react'

const REWARDS = [
  { referrals: 1, reward: '1 free month', icon: '🎁' },
  { referrals: 3, reward: '3 free months', icon: '🏆' },
  { referrals: 10, reward: 'Lifetime Pro upgrade', icon: '⭐' },
]

export default function ReferralPage() {
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [referralCount, setReferralCount] = useState(0)
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)
  const [loading, setLoading] = useState(true)

  const referralLink = referralCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/signup?ref=${referralCode}`
    : ''

  useEffect(() => {
    fetch('/api/referral')
      .then((r) => r.json())
      .then((d) => {
        setReferralCode(d.referralCode)
        setReferralCount(d.referralCount ?? 0)
      })
      .finally(() => setLoading(false))
  }, [])

  function copy(type: 'code' | 'link') {
    const text = type === 'code' ? referralCode! : referralLink
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  function share() {
    if (navigator.share) {
      navigator.share({
        title: 'Court of AI — AI Legal Co-Pilot',
        text: 'I use Court of AI to analyze contracts and draft legal docs with AI. Try it free:',
        url: referralLink,
      })
    } else {
      copy('link')
    }
  }

  return (
    <div className="animate-fade-in space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
            <Gift className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Refer &amp; Earn</h1>
            <p className="text-sm text-gray-500">Invite friends, earn free months of Court of AI Pro</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-white p-5 ring-1 ring-gray-200 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Users className="h-4 w-4 text-lexai-500" />
            <p className="text-sm text-gray-500">Friends Referred</p>
          </div>
          <p className="text-4xl font-bold text-lexai-600">{referralCount}</p>
        </div>
        <div className="rounded-xl bg-white p-5 ring-1 ring-gray-200 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Star className="h-4 w-4 text-amber-500" />
            <p className="text-sm text-gray-500">Free Months Earned</p>
          </div>
          <p className="text-4xl font-bold text-amber-600">{referralCount}</p>
        </div>
      </div>

      {/* Referral code */}
      <div className="rounded-xl bg-white p-6 ring-1 ring-gray-200">
        <h2 className="mb-4 font-semibold text-gray-900">Your Referral Code</h2>

        {loading ? (
          <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
        ) : (
          <div className="space-y-3">
            {/* Code */}
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 font-mono text-lg font-bold tracking-widest text-gray-900">
                {referralCode}
              </div>
              <button
                onClick={() => copy('code')}
                className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
              >
                {copied === 'code' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                {copied === 'code' ? 'Copied!' : 'Copy'}
              </button>
            </div>

            {/* Link */}
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-500 truncate">
                {referralLink}
              </div>
              <button
                onClick={() => copy('link')}
                className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
              >
                {copied === 'link' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                {copied === 'link' ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <button
              onClick={share}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-lexai-600 py-3 text-sm font-semibold text-white hover:bg-lexai-700 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              Share your link
            </button>
          </div>
        )}
      </div>

      {/* Rewards ladder */}
      <div className="rounded-xl bg-white p-6 ring-1 ring-gray-200">
        <h2 className="mb-4 font-semibold text-gray-900">Rewards</h2>
        <div className="space-y-3">
          {REWARDS.map((r) => {
            const achieved = referralCount >= r.referrals
            return (
              <div
                key={r.referrals}
                className={`flex items-center gap-4 rounded-lg p-4 transition-all ${
                  achieved ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'bg-gray-50'
                }`}
              >
                <div className="text-2xl">{r.icon}</div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${achieved ? 'text-emerald-800' : 'text-gray-700'}`}>
                    {r.reward}
                  </p>
                  <p className="text-xs text-gray-400">Refer {r.referrals} friend{r.referrals > 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  {achieved ? (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      Unlocked
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">
                      {r.referrals - referralCount} more needed
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-xl bg-lexai-50 p-6 ring-1 ring-lexai-100">
        <h2 className="mb-4 font-semibold text-lexai-900">How it works</h2>
        <ol className="space-y-2 text-sm text-lexai-700">
          <li className="flex items-start gap-2"><span className="font-bold text-lexai-500">1.</span> Share your referral link with a friend or colleague</li>
          <li className="flex items-start gap-2"><span className="font-bold text-lexai-500">2.</span> They sign up and start using LexAI</li>
          <li className="flex items-start gap-2"><span className="font-bold text-lexai-500">3.</span> You earn 1 free month of LexAI Starter for every referral</li>
          <li className="flex items-start gap-2"><span className="font-bold text-lexai-500">4.</span> Refer 10 friends → get a lifetime Pro upgrade</li>
        </ol>
        <p className="mt-4 text-xs text-lexai-500">Rewards are applied automatically. Contact support if you have questions.</p>
      </div>
    </div>
  )
}
