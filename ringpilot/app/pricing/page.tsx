import Link from 'next/link'
import { Phone, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { PLANS } from '@/lib/stripe'

const COMPARISON = [
  { feature: 'Calls per month', starter: '500', pro: '2,000', agency: 'Unlimited' },
  { feature: 'Concurrent calls', starter: 'Unlimited', pro: 'Unlimited', agency: 'Unlimited' },
  { feature: 'AI agents', starter: '1', pro: '3', agency: '10' },
  { feature: 'Dedicated phone numbers', starter: '1', pro: '3', agency: '10' },
  { feature: 'Call transcripts', starter: true, pro: true, agency: true },
  { feature: 'Call recordings', starter: false, pro: true, agency: true },
  { feature: 'Sentiment analysis', starter: true, pro: true, agency: true },
  { feature: 'SMS follow-up after calls', starter: false, pro: true, agency: true },
  { feature: 'Bilingual (English + Spanish)', starter: false, pro: true, agency: true },
  { feature: 'OpenTable / Mindbody integration', starter: false, pro: true, agency: true },
  { feature: 'Outbound campaigns', starter: false, pro: true, agency: true },
  { feature: 'Human escalation transfer', starter: true, pro: true, agency: true },
  { feature: 'White-label dashboard', starter: false, pro: false, agency: true },
  { feature: 'API access', starter: false, pro: false, agency: true },
  { feature: 'No setup fee', starter: true, pro: true, agency: true },
  { feature: '14-day free trial', starter: true, pro: true, agency: true },
  { feature: 'Support', starter: 'Email', pro: 'Priority', agency: 'Dedicated Manager' },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Phone className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">RingPilot</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link href="/signup"><Button size="sm" className="bg-blue-600 hover:bg-blue-700">Start Free Trial</Button></Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Simple, transparent pricing</h1>
          <p className="text-gray-500 text-lg">14-day free trial. No setup fee. No credit card required. Cancel anytime.</p>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" />No setup fee</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" />Unlimited concurrent calls</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" />Cancel anytime</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {(Object.entries(PLANS) as [string, typeof PLANS[keyof typeof PLANS]][]).map(([key, plan]) => (
            <Card key={key} className={`relative ${key === 'pro' ? 'border-blue-500 border-2 shadow-xl' : 'shadow-sm'}`}>
              {key === 'pro' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white px-4 py-1">Most Popular</Badge>
                </div>
              )}
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{plan.name}</h2>
                <div className="mb-6">
                  <span className="text-5xl font-extrabold text-gray-900">${plan.price}</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup">
                  <Button
                    className={`w-full font-semibold h-11 ${key === 'pro' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
                    variant={key === 'pro' ? 'default' : 'outline'}
                  >
                    Start Free Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Comparison table */}
        <div>
          <h2 className="text-2xl font-bold text-center mb-8">Full comparison</h2>
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-4 font-semibold text-gray-700">Feature</th>
                  <th className="text-center p-4 font-semibold text-gray-700">Starter</th>
                  <th className="text-center p-4 font-semibold text-blue-700 bg-blue-50">Pro</th>
                  <th className="text-center p-4 font-semibold text-gray-700">Agency</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={row.feature} className={`border-b ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="p-4 text-sm text-gray-600">{row.feature}</td>
                    {(['starter', 'pro', 'agency'] as const).map(col => (
                      <td key={col} className={`p-4 text-center text-sm ${col === 'pro' ? 'bg-blue-50' : ''}`}>
                        {typeof row[col] === 'boolean' ? (
                          row[col] ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-gray-300 mx-auto" />
                        ) : (
                          <span className="text-gray-700 font-medium">{row[col]}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-500 mb-4">Questions? We respond within 24 hours.</p>
          <Link href="/signup">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-10">
              Start Your Free Trial
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
