import Link from 'next/link'
import { Phone, ArrowRight, Dumbbell, Users, Calendar, TrendingUp, CheckCircle, MessageSquare, Star, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GymPage() {
  return (
    <div className="min-h-screen bg-black">

      {/* Nav — black with lime accent */}
      <nav className="sticky top-0 z-50 border-b" style={{ backgroundColor: '#0A0A0A', borderColor: '#1A1A1A' }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#A3E635' }}>
              <Phone className="h-4 w-4" style={{ color: '#0A0A0A' }} />
            </div>
            <span className="font-bold text-xl text-white">RingPilot</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <button className="px-4 py-2 text-sm font-medium rounded-lg text-gray-400 hover:text-white transition-colors">
                Sign in
              </button>
            </Link>
            <Link href="/signup">
              <button className="px-4 py-2 text-sm font-bold rounded-lg transition-all hover:scale-105"
                style={{ backgroundColor: '#A3E635', color: '#0A0A0A' }}>
                Start Free Trial
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero — black with lime energy */}
      <section className="text-white py-24 px-4 relative overflow-hidden" style={{ backgroundColor: '#0A0A0A' }}>
        {/* Background glow effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
            style={{ backgroundColor: '#A3E635' }} />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-10"
            style={{ backgroundColor: '#65A30D' }} />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-8 border"
            style={{ backgroundColor: 'rgba(163, 230, 53, 0.08)', borderColor: 'rgba(163, 230, 53, 0.25)', color: '#A3E635' }}>
            <Zap className="h-4 w-4 fill-current" />
            Built exclusively for gyms & fitness studios
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
            Every missed call is a<br />
            <span style={{ color: '#A3E635' }}>lost membership</span>
          </h1>
          <p className="text-xl mb-10 max-w-2xl mx-auto text-gray-400">
            RingPilot's AI answers every call — explaining memberships, booking free trials, and qualifying leads
            so you never lose a potential member to voicemail again.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <button className="px-8 py-4 rounded-xl text-lg font-bold transition-all hover:scale-105 flex items-center gap-2"
                style={{ backgroundColor: '#A3E635', color: '#0A0A0A' }}>
                Start Free Trial <ArrowRight className="h-5 w-5" />
              </button>
            </Link>
            <Link href="/pricing">
              <button className="px-8 py-4 rounded-xl text-lg font-semibold border transition-colors flex items-center gap-2 text-gray-300 hover:text-white"
                style={{ borderColor: '#2A2A2A', backgroundColor: 'transparent' }}>
                View Pricing
              </button>
            </Link>
          </div>
          <p className="mt-5 text-sm text-gray-500">14-day free trial · No setup fee · Cancel anytime</p>
        </div>
      </section>

      {/* Stats bar */}
      <section className="py-12 px-4 border-y" style={{ backgroundColor: '#111111', borderColor: '#1F1F1F' }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '0%', label: 'missed calls with RingPilot' },
            { value: '83%', label: 'cost savings vs. receptionist' },
            { value: '31%', label: 'of gym calls answered by staff (2025)' },
            { value: '$517', label: 'avg member lifetime value' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-3xl font-extrabold mb-1" style={{ color: '#A3E635' }}>{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features — alternating dark/white cards */}
      <section className="py-20 px-4" style={{ backgroundColor: '#0A0A0A' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-extrabold text-white mb-3">
              Your AI handles the front desk<br />
              <span style={{ color: '#A3E635' }}>so you handle the training floor</span>
            </h2>
            <p className="text-lg text-gray-500">Fully trained on gym workflows. Sounds natural. Works 24/7.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                icon: Users,
                title: 'Membership Enquiries',
                desc: 'Explains your tiers, pricing, and perks. Captures name, email, and interest level for every caller.',
                badge: 'High ROI',
              },
              {
                icon: Calendar,
                title: 'Free Trial Bookings',
                desc: 'Books free trial sessions and gym tours — collecting name, email, phone, and preferred visit time automatically.',
                badge: null,
              },
              {
                icon: Dumbbell,
                title: 'Facilities & Classes',
                desc: 'Answers questions about equipment, classes, PT sessions, pool, sauna, and group programs from your instructions.',
                badge: null,
              },
              {
                icon: TrendingUp,
                title: 'Outbound Re-engagement',
                desc: 'Pro: AI proactively calls lapsed members with a personalized re-engagement message. One saved member = months of subscription paid.',
                badge: 'Pro',
              },
              {
                icon: MessageSquare,
                title: 'SMS Follow-up',
                desc: 'After every trial booking, AI texts the caller a confirmation with timing and what to bring. Dramatically reduces no-shows.',
                badge: 'Pro',
              },
              {
                icon: Zap,
                title: 'No-Show Prevention',
                desc: 'Automated SMS reminders 24h and 3h before scheduled trials. Saves staff time and keeps your schedule full.',
                badge: null,
              },
            ].map(f => (
              <div key={f.title} className="rounded-2xl p-6 flex gap-4 border transition-all hover:border-lime-500/30"
                style={{ backgroundColor: '#141414', borderColor: '#1F1F1F' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'rgba(163, 230, 53, 0.1)' }}>
                  <f.icon className="h-6 w-6" style={{ color: '#A3E635' }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-white">{f.title}</h3>
                    {f.badge && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{
                          backgroundColor: f.badge === 'Pro' ? 'rgba(163, 230, 53, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                          color: f.badge === 'Pro' ? '#A3E635' : '#FCD34D',
                        }}>
                        {f.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed text-gray-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-20 px-4" style={{ backgroundColor: '#111111' }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center text-white mb-10">
            RingPilot vs. <span className="text-gray-500 line-through">voicemail</span>
          </h2>
          <div className="rounded-2xl overflow-hidden border" style={{ borderColor: '#1F1F1F' }}>
            <div className="grid grid-cols-3 text-sm font-bold py-4 px-6"
              style={{ backgroundColor: '#1A1A1A', color: 'white' }}>
              <span></span>
              <span className="text-center text-gray-500">Voicemail / No answer</span>
              <span className="text-center" style={{ color: '#A3E635' }}>RingPilot AI</span>
            </div>
            {[
              ['Membership enquiries', '73% hang up & call competitor', 'Every lead captured'],
              ['After-hours calls', 'Goes to voicemail', 'AI answers instantly'],
              ['Trial bookings', 'Lost', 'Auto-booked + confirmed'],
              ['Call summaries', 'None', 'Full transcript + sentiment'],
              ['Monthly cost', 'Free (but costs you leads)', '$149–$299/mo'],
            ].map(([label, bad, good], i) => (
              <div key={label} className="grid grid-cols-3 py-4 px-6 text-sm border-t"
                style={{ backgroundColor: i % 2 === 0 ? '#0D0D0D' : '#111111', borderColor: '#1F1F1F' }}>
                <span className="font-medium text-gray-300">{label}</span>
                <span className="text-center text-gray-600">{bad}</span>
                <span className="text-center font-semibold flex justify-center items-center gap-1.5" style={{ color: '#A3E635' }}>
                  <CheckCircle className="h-4 w-4 shrink-0" />{good}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4" style={{ backgroundColor: '#0A0A0A' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center text-white mb-10">What gym owners say</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { quote: 'We used to miss 30–40 calls a week when the floor was busy. Now every single call gets answered. Membership sign-ups are up 22%.', name: 'James L.', role: 'Owner, Iron Peak Gym' },
              { quote: 'The AI booked 14 free trials in the first month without any effort from my staff. Those converted to 9 memberships.', name: 'Priya N.', role: 'Founder, FlexStudio' },
              { quote: 'Setup took literally 8 minutes. The AI knew our classes, our prices, and our hours right away. Incredibly impressed.', name: 'Tyler M.', role: 'Manager, CrossFit Edge' },
            ].map(t => (
              <div key={t.name} className="rounded-2xl p-6 border" style={{ backgroundColor: '#141414', borderColor: '#1F1F1F' }}>
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" style={{ color: '#A3E635' }} />)}
                </div>
                <p className="text-sm leading-relaxed mb-4 text-gray-400">"{t.quote}"</p>
                <div>
                  <p className="font-bold text-sm text-white">{t.name}</p>
                  <p className="text-xs text-gray-600">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 text-center relative overflow-hidden border-t" style={{ backgroundColor: '#0D0D0D', borderColor: '#1A1A1A' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-10"
            style={{ backgroundColor: '#A3E635' }} />
        </div>
        <div className="max-w-2xl mx-auto relative z-10">
          <h2 className="text-4xl font-extrabold text-white mb-4">Stop losing members to voicemail</h2>
          <p className="text-lg text-gray-500 mb-8">
            Start your free 14-day trial. Your AI is live in 10 minutes — no tech skills needed.
          </p>
          <Link href="/signup">
            <button className="px-10 py-4 rounded-xl text-lg font-bold transition-all hover:scale-105 flex items-center gap-2 mx-auto"
              style={{ backgroundColor: '#A3E635', color: '#0A0A0A' }}>
              Get My Gym AI <ArrowRight className="h-5 w-5" />
            </button>
          </Link>
          <p className="mt-4 text-sm text-gray-600">No credit card · No setup fee · Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t text-center text-sm" style={{ backgroundColor: '#080808', borderColor: '#1A1A1A', color: '#444' }}>
        <Link href="/" className="font-bold" style={{ color: '#A3E635' }}>RingPilot</Link>
        {' · '}AI Receptionist for Gyms
        {' · '}
        <Link href="/pricing" className="hover:underline" style={{ color: '#444' }}>Pricing</Link>
        {' · '}
        <Link href="/restaurant" className="hover:underline" style={{ color: '#444' }}>For Restaurants</Link>
      </footer>
    </div>
  )
}
