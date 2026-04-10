import Link from 'next/link'
import { Phone, ArrowRight, UtensilsCrossed, Clock, Calendar, Star, CheckCircle, MessageSquare, PhoneCall, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function RestaurantPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFF8F1' }}>

      {/* Nav — warm cream */}
      <nav className="sticky top-0 z-50 border-b" style={{ backgroundColor: '#FFF8F1', borderColor: '#F5DEC8' }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#9B1D20' }}>
              <Phone className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-xl" style={{ color: '#1C0A00' }}>RingPilot</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <button className="px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-rose-50" style={{ color: '#9B1D20' }}>
                Sign in
              </button>
            </Link>
            <Link href="/signup">
              <button className="px-4 py-2 text-sm font-semibold rounded-lg text-white transition-colors hover:opacity-90" style={{ backgroundColor: '#9B1D20' }}>
                Start Free Trial
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero — deep burgundy to amber */}
      <section className="text-white py-24 px-4 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #4A0E10 0%, #9B1D20 40%, #C17B2A 100%)' }}>
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #F5C842 0%, transparent 50%), radial-gradient(circle at 80% 20%, #E8855A 0%, transparent 40%)' }} />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8"
            style={{ backgroundColor: 'rgba(245, 200, 66, 0.15)', border: '1px solid rgba(245, 200, 66, 0.3)', color: '#F5C842' }}>
            <UtensilsCrossed className="h-4 w-4" />
            Built exclusively for restaurants
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
            Your restaurant never<br />
            <span style={{ color: '#F5C842' }}>misses a reservation</span>
          </h1>
          <p className="text-xl mb-10 max-w-2xl mx-auto" style={{ color: '#F5D9C8' }}>
            RingPilot answers every call — day or night — taking reservations, answering menu questions,
            and handling cancellations so your team can focus on the guests in front of them.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <button className="px-8 py-4 rounded-xl text-lg font-bold transition-all hover:scale-105 flex items-center gap-2"
                style={{ backgroundColor: '#F5C842', color: '#1C0A00' }}>
                Start Free Trial <ArrowRight className="h-5 w-5" />
              </button>
            </Link>
            <Link href="/pricing">
              <button className="px-8 py-4 rounded-xl text-lg font-semibold border transition-colors flex items-center gap-2"
                style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white', backgroundColor: 'rgba(255,255,255,0.08)' }}>
                View Pricing
              </button>
            </Link>
          </div>
          <p className="mt-5 text-sm" style={{ color: '#F5D9C8' }}>14-day free trial · No setup fee · Cancel anytime</p>
        </div>
      </section>

      {/* Stats bar */}
      <section className="py-12 px-4" style={{ backgroundColor: '#1C0A00' }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '73%', label: 'of callers hang up if no answer' },
            { value: '24/7', label: 'AI answering, always on' },
            { value: '10 min', label: 'to go live' },
            { value: '$1,200+', label: 'saved vs. a receptionist/month' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-3xl font-extrabold mb-1" style={{ color: '#F5C842' }}>{s.value}</p>
              <p className="text-sm" style={{ color: '#C9A07A' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20 px-4" style={{ backgroundColor: '#FFF8F1' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-extrabold mb-3" style={{ color: '#1C0A00' }}>
              Everything your front desk handles — automated
            </h2>
            <p className="text-lg" style={{ color: '#7A4A2A' }}>Your AI knows your menu, hours, and policies. It sounds natural, not robotic.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                icon: Calendar,
                title: 'Table Reservations',
                desc: 'Collects party size, date, time, name and callback number. Confirms with the caller before ending — exactly like a trained host would.',
                badge: 'Most Used',
              },
              {
                icon: Clock,
                title: 'Hours & Directions',
                desc: 'Instantly answers "What time do you open?", "Where are you located?", and "Do you have parking?" — every single time, perfectly.',
                badge: null,
              },
              {
                icon: Star,
                title: 'Dietary & Menu Questions',
                desc: 'Handles halal, vegan, gluten-free, allergen, and kids menu questions based on the instructions you provide.',
                badge: null,
              },
              {
                icon: Phone,
                title: 'Cancellations & Changes',
                desc: 'Guests can cancel or modify reservations without tying up your staff. All logged to your dashboard.',
                badge: null,
              },
              {
                icon: MessageSquare,
                title: 'SMS Confirmation',
                desc: 'After every booking, automatically texts the guest a confirmation — reducing no-shows and building trust.',
                badge: 'Pro',
              },
              {
                icon: TrendingUp,
                title: 'Call Analytics',
                desc: 'See peak call times, sentiment trends, and booking rates in your dashboard. Know when you\'re busiest.',
                badge: null,
              },
            ].map(f => (
              <div key={f.title} className="rounded-2xl p-6 flex gap-4 border transition-shadow hover:shadow-md"
                style={{ backgroundColor: 'white', borderColor: '#F5DEC8' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: '#FDE8D8' }}>
                  <f.icon className="h-6 w-6" style={{ color: '#9B1D20' }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold" style={{ color: '#1C0A00' }}>{f.title}</h3>
                    {f.badge && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ backgroundColor: f.badge === 'Pro' ? '#FDE8D8' : '#FEF9E7', color: f.badge === 'Pro' ? '#9B1D20' : '#92400E' }}>
                        {f.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: '#7A4A2A' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it compares */}
      <section className="py-20 px-4" style={{ backgroundColor: '#FDF0E3' }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center mb-10" style={{ color: '#1C0A00' }}>RingPilot vs. a human receptionist</h2>
          <div className="rounded-2xl overflow-hidden border" style={{ borderColor: '#F5DEC8' }}>
            <div className="grid grid-cols-3 text-sm font-bold py-4 px-6"
              style={{ backgroundColor: '#9B1D20', color: 'white' }}>
              <span></span>
              <span className="text-center">Human Receptionist</span>
              <span className="text-center" style={{ color: '#F5C842' }}>RingPilot AI</span>
            </div>
            {[
              ['Monthly cost', '$2,500–$4,000', '$149–$299'],
              ['Availability', '8hrs/day, 5 days', '24/7/365'],
              ['Missed calls during rush', 'Common', 'Zero'],
              ['Call transcripts', 'None', 'Every call'],
              ['Setup time', '2–4 weeks hiring', '10 minutes'],
            ].map(([label, human, ai], i) => (
              <div key={label} className="grid grid-cols-3 py-4 px-6 text-sm"
                style={{ backgroundColor: i % 2 === 0 ? 'white' : '#FFF8F1' }}>
                <span className="font-medium" style={{ color: '#1C0A00' }}>{label}</span>
                <span className="text-center" style={{ color: '#9B1D20' }}>{human}</span>
                <span className="text-center font-semibold flex justify-center items-center gap-1.5" style={{ color: '#166534' }}>
                  <CheckCircle className="h-4 w-4 shrink-0" />{ai}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4" style={{ backgroundColor: '#FFF8F1' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center mb-10" style={{ color: '#1C0A00' }}>What restaurant owners say</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: 'We were losing 20+ reservations a week during dinner service. RingPilot paid for itself in the first week.', name: 'Marco T.', role: 'Owner, Bella Roma' },
              { quote: 'My team was drowning in phone calls during lunch rush. Now the AI handles 80% of them. Game changer.', name: 'Sarah K.', role: 'General Manager, The Grill House' },
              { quote: 'Set up in under 10 minutes. The AI sounds professional and our guests can\'t tell the difference.', name: 'Ahmed R.', role: 'Owner, Spice Garden' },
            ].map(t => (
              <div key={t.name} className="rounded-2xl p-6 border" style={{ backgroundColor: 'white', borderColor: '#F5DEC8' }}>
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" style={{ color: '#F5C842' }} />)}
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: '#5A3A1A' }}>"{t.quote}"</p>
                <div>
                  <p className="font-bold text-sm" style={{ color: '#1C0A00' }}>{t.name}</p>
                  <p className="text-xs" style={{ color: '#C9A07A' }}>{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 text-white text-center"
        style={{ background: 'linear-gradient(135deg, #1C0A00 0%, #4A0E10 50%, #9B1D20 100%)' }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-extrabold mb-4">Ready to fill every table?</h2>
          <p className="text-lg mb-8" style={{ color: '#F5D9C8' }}>
            Join restaurant owners who've stopped missing reservations. Start your free 14-day trial today.
          </p>
          <Link href="/signup">
            <button className="px-10 py-4 rounded-xl text-lg font-bold transition-all hover:scale-105 flex items-center gap-2 mx-auto"
              style={{ backgroundColor: '#F5C842', color: '#1C0A00' }}>
              Get My Restaurant AI <ArrowRight className="h-5 w-5" />
            </button>
          </Link>
          <p className="mt-4 text-sm" style={{ color: '#C9A07A' }}>No credit card required · No setup fee · Live in 10 minutes</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t text-center text-sm" style={{ backgroundColor: '#1C0A00', borderColor: '#3A1A08', color: '#C9A07A' }}>
        <Link href="/" className="font-bold" style={{ color: '#F5C842' }}>RingPilot</Link>
        {' · '}AI Receptionist for Restaurants
        {' · '}
        <Link href="/pricing" style={{ color: '#C9A07A' }} className="hover:underline">Pricing</Link>
        {' · '}
        <Link href="/gym" style={{ color: '#C9A07A' }} className="hover:underline">For Gyms</Link>
      </footer>
    </div>
  )
}
