import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Check, CreditCard, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PLANS } from '@/lib/stripe'

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
  const currentPlan = profile?.plan ?? 'free'

  return (
    <div className="space-y-8 max-w-4xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-gray-500 mt-1">Manage your subscription and plan</p>
      </div>

      {/* Current plan */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-600 font-medium mb-1">Current Plan</p>
            <p className="text-2xl font-bold text-blue-900 capitalize">{currentPlan}</p>
            {profile?.trial_ends_at && currentPlan === 'free' && (
              <p className="text-sm text-blue-600 mt-1">
                Trial ends {new Date(profile.trial_ends_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
              </p>
            )}
          </div>
          {profile?.stripe_customer_id && (
            <form action="/api/stripe/portal" method="POST">
              <Button variant="outline" type="submit">
                <CreditCard className="h-4 w-4 mr-2" />Manage Billing
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {currentPlan === 'free' ? 'Choose a plan' : 'Change your plan'}
        </h2>
        <div className="grid md:grid-cols-3 gap-5">
          {(Object.entries(PLANS) as [string, typeof PLANS[keyof typeof PLANS]][]).map(([key, plan]) => {
            const isCurrent = key === currentPlan
            return (
              <Card key={key} className={`relative ${isCurrent ? 'border-blue-500 border-2' : ''} ${key === 'pro' && !isCurrent ? 'shadow-lg' : ''}`}>
                {isCurrent && (
                  <div className="absolute -top-3 left-4">
                    <Badge className="bg-blue-600 text-white">Current Plan</Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-extrabold text-gray-900">${plan.price}</span>
                    <span className="text-gray-400 text-sm">/month</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                  {!isCurrent && (
                    <form action="/api/stripe/checkout" method="POST">
                      <input type="hidden" name="plan" value={key} />
                      <Button type="submit" className={`w-full ${key === 'pro' ? 'bg-blue-600 hover:bg-blue-700' : ''}`} variant={key === 'pro' ? 'default' : 'outline'}>
                        Upgrade to {plan.name} <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </form>
                  )}
                  {isCurrent && (
                    <Button disabled className="w-full" variant="secondary">Current Plan</Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
