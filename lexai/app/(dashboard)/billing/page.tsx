import { createClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/stripe'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export default async function BillingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('plan, stripe_customer_id, stripe_subscription_id, subscription_status')
    .eq('id', user!.id)
    .single()

  const currentPlan = profile?.plan ?? 'free'

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Plans</h1>
        <p className="mt-1 text-gray-500">
          Manage your subscription and billing.
        </p>
      </div>

      {/* Current plan status */}
      <div className="rounded-xl bg-white p-6 ring-1 ring-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Current Plan</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 capitalize">
              {currentPlan}
            </p>
            {profile?.subscription_status && (
              <p className="mt-0.5 text-sm text-gray-500 capitalize">
                Status: {profile.subscription_status}
              </p>
            )}
          </div>
          {profile?.stripe_customer_id && (
            <form action="/api/stripe/portal" method="POST">
              <button
                type="submit"
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Manage billing
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {Object.entries(PLANS).map(([key, plan]) => {
          const isCurrentPlan = currentPlan === key
          return (
            <div
              key={key}
              className={`rounded-xl p-6 ring-1 ${
                key === 'pro'
                  ? 'bg-lexai-600 ring-lexai-600'
                  : isCurrentPlan
                  ? 'bg-lexai-50 ring-lexai-300'
                  : 'bg-white ring-gray-200'
              }`}
            >
              {key === 'pro' && (
                <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-lexai-200">
                  Most Popular
                </div>
              )}
              <h3
                className={`text-lg font-bold ${
                  key === 'pro' ? 'text-white' : 'text-gray-900'
                }`}
              >
                {plan.name}
              </h3>
              <div className="mt-2">
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-bold ${key === 'pro' ? 'text-white' : 'text-gray-900'}`}>
                    ${plan.price}
                  </span>
                  <span className={`text-sm ${key === 'pro' ? 'text-lexai-200' : 'text-gray-400'}`}>/mo</span>
                </div>
                {plan.price > 0 && (
                  <p className={`text-xs mt-0.5 ${key === 'pro' ? 'text-lexai-300' : 'text-gray-400'}`}>
                    ≈ PKR {(plan.price * 280).toLocaleString()}/ماہ
                  </p>
                )}
              </div>

              <ul className="mt-4 space-y-2">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className={`flex items-start gap-2 text-sm ${
                      key === 'pro' ? 'text-lexai-100' : 'text-gray-600'
                    }`}
                  >
                    <CheckCircle
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        key === 'pro' ? 'text-lexai-300' : 'text-lexai-500'
                      }`}
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              {isCurrentPlan ? (
                <div className="mt-6 rounded-lg bg-lexai-100 py-2 text-center text-sm font-semibold text-lexai-700">
                  Current plan
                </div>
              ) : (
                <form action="/api/stripe/checkout" method="POST">
                  <input type="hidden" name="plan" value={key} />
                  <button
                    type="submit"
                    className={`mt-6 w-full rounded-lg py-2 text-sm font-semibold transition-colors ${
                      key === 'pro'
                        ? 'bg-white text-lexai-600 hover:bg-lexai-50'
                        : 'bg-lexai-600 text-white hover:bg-lexai-700'
                    }`}
                  >
                    {currentPlan === 'free' ? 'Upgrade to ' : 'Switch to '}{plan.name}
                  </button>
                </form>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Cancel anytime. No hidden fees. Billed monthly.
      </p>
    </div>
  )
}
