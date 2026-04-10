import Link from 'next/link'
import { Phone, Clock, MessageSquare, BarChart3, Star, Check, ArrowRight, UtensilsCrossed, Dumbbell, Zap, Shield, TrendingUp, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { PLANS } from '@/lib/stripe'

const FEATURES = [
  { icon: Phone, title: 'Never Miss a Call', desc: 'Your AI answers every call, every time — 24/7, including nights and weekends.' },
  { icon: Clock, title: 'Live in 10 Minutes', desc: 'Sign up, answer 5 questions, get your AI phone number. No tech skills needed.' },
  { icon: MessageSquare, title: 'Full Transcripts', desc: 'Every call is transcribed and summarized. See exactly what your customers said.' },
  { icon: BarChart3, title: 'Call Analytics', desc: 'Track peak hours, sentiment, and booking rates from your dashboard.' },
  { icon: Zap, title: 'Instant Reservations', desc: 'Your AI takes reservations, confirms details, and logs them instantly.' },
  { icon: Shield, title: 'Smart Escalation', desc: 'Urgent calls are transferred to your real phone automatically.' },
]

const STATS = [
  { value: '73%', label: 'of calls go unanswered during peak hours' },
  { value: '$1,200', label: 'average monthly revenue lost per missed call' },
  { value: '10 min', label: 'to go live with your AI receptionist' },
  { value: '83%', label: 'gross margin — we keep costs lean' },
]

const TESTIMONIALS = [
  { name: 'Marco Rossi', role: 'Owner, Rossi Trattoria', text: "We were missing 20+ calls a week on Friday nights. RingPilot fixed that overnight. We've seen a 15% uptick in reservations since." },
  { name: 'Sarah Chen', role: 'Owner, FitZone Gym', text: "Our AI answers questions about memberships and books free trials while I'm training clients. It's like having a full-time receptionist at 1/10th the cost." },
  { name: 'James O\'Brien', role: 'Owner, The Burger Joint', text: "Setup took 8 minutes. My Google Maps number now goes to the AI. No more missed lunch rushes." },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b bg-white/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Phone className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">RingPilot</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <Link href="/restaurant" className="hover:text-gray-900">For Restaurants</Link>
            <Link href="/gym" className="hover:text-gray-900">For Gyms</Link>
            <Link href="/pricing" className="hover:text-gray-900">Pricing</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link href="/signup"><Button size="sm" className="bg-blue-600 hover:bg-blue-700">Start Free Trial</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-blue-500/30 text-blue-100 border-blue-400/40 text-sm px-4 py-1.5">
            🎉 14-day free trial · No credit card required
          </Badge>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
            Your AI receptionist.<br />
            <span className="text-blue-200">Never misses a call.</span>
          </h1>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            RingPilot answers every customer call with a friendly AI — taking reservations, answering FAQs, and capturing leads. Set up in 10 minutes. No tech skills needed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-8 text-lg h-14 rounded-xl">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/restaurant">
              <Button size="lg" variant="outline" className="border-blue-300 text-white hover:bg-blue-600 font-semibold px-8 text-lg h-14 rounded-xl">
                See Demo
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-blue-300 text-sm">Trusted by restaurants and gyms across USA & Europe</p>
        </div>
      </section>

      {/* Verticals */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">Built for your business</h2>
          <p className="text-center text-gray-500 mb-10">Specialized AI agents tuned for restaurants and gyms</p>
          <div className="grid md:grid-cols-2 gap-6">
            <Link href="/restaurant">
              <Card className="hover:shadow-lg transition-all hover:border-blue-300 cursor-pointer group">
                <CardContent className="p-8">
                  <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                    <UtensilsCrossed className="h-7 w-7 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">For Restaurants</h3>
                  <p className="text-gray-500 mb-4">Take reservations, handle cancellations, answer dietary questions, and manage peak-hour call volume automatically.</p>
                  <ul className="space-y-2">
                    {['Reservation booking & confirmation', 'Dietary & menu FAQs', 'Hours, location & parking', 'Cancellation management'].map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-blue-600 font-semibold text-sm group-hover:underline">See how it works →</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/gym">
              <Card className="hover:shadow-lg transition-all hover:border-blue-300 cursor-pointer group">
                <CardContent className="p-8">
                  <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                    <Dumbbell className="h-7 w-7 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">For Gyms</h3>
                  <p className="text-gray-500 mb-4">Explain memberships, book free trial sessions, answer FAQs about classes and facilities, and capture new leads automatically.</p>
                  <ul className="space-y-2">
                    {['Membership enquiries & pricing', 'Free trial session booking', 'Class schedule FAQs', 'Lead capture & follow-up'].map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-blue-600 font-semibold text-sm group-hover:underline">See how it works →</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map(s => (
            <div key={s.label} className="text-center p-6 rounded-2xl bg-blue-50">
              <div className="text-4xl font-extrabold text-blue-600 mb-2">{s.value}</div>
              <div className="text-sm text-gray-500 leading-tight">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">Everything you need</h2>
          <p className="text-center text-gray-500 mb-12">All the tools to turn missed calls into revenue</p>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <Card key={f.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                    <f.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">Live in 4 steps</h2>
          <p className="text-center text-gray-500 mb-12">No technical setup. No hardware. No waiting.</p>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Sign up', desc: 'Create your account in 60 seconds' },
              { step: '2', title: 'Set up your AI', desc: 'Answer 5 questions about your business' },
              { step: '3', title: 'Get your number', desc: 'Receive a dedicated AI phone number' },
              { step: '4', title: 'Go live', desc: 'Update your Google listing. Done.' },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">{s.step}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Owners love RingPilot</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <Card key={t.name} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">{[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}</div>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">"{t.text}"</p>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                    <div className="text-gray-400 text-xs">{t.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Simple, transparent pricing</h2>
          <p className="text-gray-500 mb-10">All plans include a 14-day free trial</p>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            {(Object.entries(PLANS) as [string, typeof PLANS[keyof typeof PLANS]][]).map(([key, plan]) => (
              <Card key={key} className={`relative ${key === 'pro' ? 'border-blue-500 border-2 shadow-lg' : ''}`}>
                {key === 'pro' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-4">Most Popular</Badge>
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
                  <Link href="/signup">
                    <Button className={`w-full ${key === 'pro' ? 'bg-blue-600 hover:bg-blue-700' : ''}`} variant={key === 'pro' ? 'default' : 'outline'}>
                      Start Free Trial
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-6 text-sm text-gray-400">
            <Link href="/pricing" className="text-blue-600 hover:underline">See full pricing comparison →</Link>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-extrabold mb-4">Stop losing customers to missed calls</h2>
          <p className="text-blue-100 text-lg mb-8">Join hundreds of restaurant and gym owners who never miss a call.</p>
          <Link href="/signup">
            <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-10 text-lg h-14 rounded-xl">
              Start Your Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="mt-4 text-blue-300 text-sm">14 days free · No credit card · Live in 10 minutes</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <Phone className="h-3 w-3 text-white" />
            </div>
            <span className="font-semibold text-white">RingPilot</span>
          </div>
          <div className="flex gap-6 text-sm">
            <Link href="/restaurant" className="hover:text-white">Restaurants</Link>
            <Link href="/gym" className="hover:text-white">Gyms</Link>
            <Link href="/pricing" className="hover:text-white">Pricing</Link>
            <Link href="/login" className="hover:text-white">Sign In</Link>
          </div>
          <p className="text-xs">© 2026 RingPilot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
