'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, FileSearch, MessageSquare, FileText, Shield, Scale, Bell, GitCompare, Zap, Globe, Lightbulb } from 'lucide-react'

type Lang = 'ur' | 'en'

const FEATURES = [
  {
    icon: Lightbulb,
    isNew: true,
    en: { title: 'AI Legal Advisor', desc: 'Describe your legal situation — get a structured brief with applicable Pakistani law, your rights, and next steps.' },
    ur: { title: 'AI قانونی مشیر', desc: 'اپنی قانونی صورتحال بیان کریں — پاکستانی قانون کے تحت آپ کے حقوق اور تجویز کردہ اقدامات حاصل کریں۔' },
  },
  {
    icon: FileSearch,
    en: { title: 'Contract Analysis', desc: 'Upload any contract and get a risk score, red flags, and plain-English summary in seconds.' },
    ur: { title: 'معاہدے کا تجزیہ', desc: 'کوئی بھی معاہدہ اپ لوڈ کریں اور فوری طور پر خطرے کی رپورٹ حاصل کریں۔' },
  },
  {
    icon: MessageSquare,
    en: { title: 'AI Legal Chat (Urdu + English)', desc: 'Ask any legal question in Urdu or English — get instant answers about Pakistani law.' },
    ur: { title: 'AI قانونی چیٹ (اردو + انگریزی)', desc: 'اردو یا انگریزی میں کوئی بھی قانونی سوال پوچھیں — فوری جواب پائیں۔' },
  },
  {
    icon: FileText,
    en: { title: 'Document Generation', desc: 'Generate NDAs, service agreements, employment contracts, privacy policies in minutes.' },
    ur: { title: 'دستاویز تیار کریں', desc: 'NDA، سروس معاہدے، ملازمت کے معاہدے، پرائیویسی پالیسی منٹوں میں بنائیں۔' },
  },
  {
    icon: Bell,
    en: { title: 'Deadline Tracker', desc: 'Never miss a contract renewal or payment deadline — get email reminders automatically.' },
    ur: { title: 'ڈیڈ لائن ٹریکر', desc: 'معاہدے کی تجدید یا ادائیگی کی تاریخ کبھی نہ بھولیں — خودکار ای میل یاد دہانی۔' },
  },
  {
    icon: GitCompare,
    en: { title: 'Contract Comparison', desc: 'Upload two contracts — AI tells you which one is better for you.' },
    ur: { title: 'معاہدوں کا موازنہ', desc: 'دو معاہدے اپ لوڈ کریں — AI بتائے گا کون سا آپ کے لیے بہتر ہے۔' },
  },
  {
    icon: Zap,
    en: { title: 'Clause Negotiation', desc: 'AI rewrites risky clauses in your favor — negotiate like a pro without a lawyer.' },
    ur: { title: 'شق کی گفت و شنید', desc: 'AI خطرناک شقوں کو آپ کے حق میں دوبارہ لکھتا ہے — وکیل کے بغیر ماہرانہ گفت و شنید۔' },
  },
]

const STATS = [
  { en: { value: '5.2M+', label: 'Pakistani SMEs with no legal help' }, ur: { value: '52 لاکھ+', label: 'پاکستانی کاروبار بغیر قانونی مدد کے' } },
  { en: { value: 'PKR 0', label: 'Cost to start — free plan available' }, ur: { value: 'PKR 0', label: 'شروع کرنے کی لاگت — مفت پلان دستیاب' } },
  { en: { value: '30 sec', label: 'To analyze any contract' }, ur: { value: '30 سیکنڈ', label: 'کسی بھی معاہدے کا تجزیہ کرنے کے لیے' } },
  { en: { value: '100%', label: 'Urdu + English support' }, ur: { value: '100%', label: 'اردو + انگریزی سپورٹ' } },
]

const AUDIENCES = [
  {
    emoji: '⚖️',
    en: { title: 'Lawyers & Legal Professionals', points: ['Fast contract review', 'Auto document drafting', 'Client-ready PDF reports'] },
    ur: { title: 'وکلاء', points: ['معاہدوں کا تیز تجزیہ', 'خودکار دستاویز تیاری', 'کلائنٹ رپورٹ PDF میں'] },
    color: 'bg-purple-50 ring-purple-200',
  },
  {
    emoji: '💼',
    en: { title: 'Small Business Owners', points: ['Review supplier contracts', 'Spot risky clauses', 'Cut legal costs by 90%'] },
    ur: { title: 'چھوٹے کاروباری مالکان', points: ['سپلائر معاہدوں کا جائزہ', 'خطرناک شقوں کی نشاندہی', 'قانونی لاگت میں کمی'] },
    color: 'bg-blue-50 ring-blue-200',
  },
  {
    emoji: '💻',
    en: { title: 'Freelancers (Upwork / Fiverr)', points: ['Create client contracts', 'Protect your payments', 'Generate NDAs instantly'] },
    ur: { title: 'فری لانسرز (Upwork / Fiverr)', points: ['کلائنٹ معاہدے بنائیں', 'ادائیگی کی حفاظت', 'NDA فوری تیار کریں'] },
    color: 'bg-emerald-50 ring-emerald-200',
  },
  {
    emoji: '🚀',
    en: { title: 'Startup Founders', points: ['Co-founder agreements', 'SECP registration docs', 'Investor contracts'] },
    ur: { title: 'اسٹارٹ اپ فاؤنڈرز', points: ['شریک بانی معاہدے', 'SECP دستاویزات', 'سرمایہ کار معاہدے'] },
    color: 'bg-amber-50 ring-amber-200',
  },
  {
    emoji: '🛒',
    en: { title: 'E-commerce Sellers', points: ['Privacy policies', 'Terms & conditions', 'Supplier agreements'] },
    ur: { title: 'ای کامرس سیلرز', points: ['پرائیویسی پالیسی', 'شرائط و ضوابط', 'سپلائر معاہدے'] },
    color: 'bg-rose-50 ring-rose-200',
  },
  {
    emoji: '🏠',
    en: { title: 'Real Estate Professionals', points: ['Lease agreement review', 'Purchase agreements', 'Deadline tracking'] },
    ur: { title: 'رئیل اسٹیٹ پروفیشنلز', points: ['کرایہ نامے کا جائزہ', 'خریداری معاہدہ', 'ڈیڈ لائن ٹریکر'] },
    color: 'bg-teal-50 ring-teal-200',
  },
]

const PRICING = [
  {
    name: { en: 'Free', ur: 'مفت' },
    priceUSD: 0, pricePKR: 0,
    features: {
      en: ['3 contract analyses', '5 AI chats', '1 document', 'Urdu + English'],
      ur: ['3 معاہدوں کا تجزیہ', '5 AI چیٹس', '1 دستاویز', 'اردو + انگریزی'],
    },
    cta: { en: 'Start Free', ur: 'مفت شروع کریں' },
    highlight: false,
  },
  {
    name: { en: 'Starter', ur: 'اسٹارٹر' },
    priceUSD: 49, pricePKR: 13750,
    features: {
      en: ['25 contract analyses/mo', '50 AI chats/mo', '10 documents/mo', 'Clause negotiation', 'Deadline reminders', 'PDF reports'],
      ur: ['25 معاہدوں کا تجزیہ/ماہ', '50 AI چیٹس/ماہ', '10 دستاویزات/ماہ', 'شق کی گفت و شنید', 'ڈیڈ لائن یاد دہانی', 'PDF رپورٹس'],
    },
    cta: { en: 'Get Started', ur: 'شروع کریں' },
    highlight: true,
  },
  {
    name: { en: 'Pro', ur: 'پرو' },
    priceUSD: 99, pricePKR: 27750,
    features: {
      en: ['100 contract analyses/mo', '200 AI chats/mo', '50 documents/mo', 'Contract comparison', '3 team members', 'Priority support'],
      ur: ['100 معاہدوں کا تجزیہ/ماہ', '200 AI چیٹس/ماہ', '50 دستاویزات/ماہ', 'معاہدوں کا موازنہ', '3 ٹیم ممبر', 'ترجیحی سپورٹ'],
    },
    cta: { en: 'Get Pro', ur: 'پرو حاصل کریں' },
    highlight: false,
  },
]

const t = {
  en: {
    badge: "Pakistan's First AI Legal Co-Pilot",
    heroTitle: 'One AI Legal Platform',
    heroHighlight: 'For Everyone',
    heroSub: "Whether you're a lawyer, business owner, freelancer, or startup founder — analyze contracts, generate legal documents, and get instant legal answers in Urdu or English.",
    cta1: 'Start Free',
    cta2: 'Who is it for?',
    noCard: 'No credit card required · Free plan available',
    statsTitle: '',
    forWhoTitle: 'Who is it for?',
    forWhoSub: 'Court of AI is built for everyone who deals with legal matters',
    featuresTitle: 'All Features',
    featuresSub: 'Everything your business needs',
    chatTitle: 'Chat in Urdu — Get answers in Urdu',
    chatSub: 'The AI legal assistant responds in Urdu when you write in Urdu. Just type and get answers.',
    chatCta: 'Try it free',
    pricingTitle: 'Pricing',
    pricingSub: 'Simple, transparent pricing',
    pricingNote: 'Available in both USD and PKR',
    pricingFooter: 'No credit card required · JazzCash / EasyPaisa support coming soon',
    disclaimer: "⚠️ Court of AI is an AI tool — not a licensed attorney. Always consult a qualified lawyer for important legal matters.",
    footerTagline: "Pakistan's AI Legal Co-Pilot",
    tryBtn: 'Try Now — Free',
    audiencePills: ['⚖️ Lawyers', '💼 Business Owners', '💻 Freelancers', '🚀 Startups', '🛒 E-commerce', '🏠 Real Estate'],
  },
  ur: {
    badge: 'پاکستان کا پہلا AI قانونی معاون',
    heroTitle: 'ہر کسی کا',
    heroHighlight: 'AI قانونی معاون',
    heroSub: 'وکیل ہو یا کاروباری، فری لانسر ہو یا اسٹارٹ اپ — Court of AI سب کے لیے ہے۔ معاہدے سمجھیں، دستاویزات بنائیں، قانونی سوال پوچھیں — اردو یا انگریزی میں۔',
    cta1: 'مفت شروع کریں',
    cta2: 'یہ کس کے لیے ہے؟',
    noCard: 'کریڈٹ کارڈ کی ضرورت نہیں · مفت پلان دستیاب',
    forWhoTitle: 'یہ کس کے لیے ہے؟',
    forWhoSub: 'Court of AI ہر اس شخص کے لیے ہے جسے قانونی معاملات سے واسطہ پڑتا ہے',
    featuresTitle: 'تمام خصوصیات',
    featuresSub: 'Everything your business needs',
    chatTitle: 'اردو میں بات کریں',
    chatSub: 'AI قانونی معاون اردو میں آپ کے سوالوں کا جواب دیتا ہے۔ بس ٹائپ کریں اور جواب پائیں۔',
    chatCta: 'ابھی آزمائیں — مفت',
    pricingTitle: 'قیمت',
    pricingSub: 'Simple, transparent pricing',
    pricingNote: 'USD اور PKR دونوں میں دستیاب',
    pricingFooter: 'کریڈٹ کارڈ کی ضرورت نہیں · JazzCash / EasyPaisa سپورٹ جلد آ رہی ہے',
    disclaimer: '⚠️ Court of AI ایک AI ٹول ہے — یہ لائسنس یافتہ وکیل نہیں ہے۔ اہم قانونی معاملات کے لیے ہمیشہ ایک وکیل سے مشورہ کریں۔',
    footerTagline: 'پاکستان کا AI قانونی معاون',
    tryBtn: 'ابھی آزمائیں — مفت',
    audiencePills: ['⚖️ وکلاء', '💼 کاروباری', '💻 فری لانسرز', '🚀 اسٹارٹ اپ', '🛒 ای کامرس', '🏠 رئیل اسٹیٹ'],
  },
}

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>('ur')
  const T = t[lang]
  const isUrdu = lang === 'ur'

  return (
    <div className="min-h-screen bg-white" dir={isUrdu ? 'rtl' : 'ltr'}>
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-6 w-6 text-lexai-600" />
            <span className="text-xl font-bold text-lexai-700">Court of AI</span>
            <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">🇵🇰 Pakistan</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="#features" className="text-sm text-gray-600 hover:text-gray-900 hidden sm:block">
              {isUrdu ? 'خصوصیات' : 'Features'}
            </Link>
            <Link href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 hidden sm:block">
              {isUrdu ? 'قیمت' : 'Pricing'}
            </Link>

            {/* Language Toggle */}
            <button
              onClick={() => setLang(lang === 'ur' ? 'en' : 'ur')}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Globe className="h-4 w-4 text-lexai-500" />
              {lang === 'ur' ? 'English' : 'اردو'}
            </button>

            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
              {isUrdu ? 'سائن ان' : 'Sign in'}
            </Link>
            <Link href="/signup" className="rounded-lg bg-lexai-600 px-4 py-2 text-sm font-medium text-white hover:bg-lexai-700 transition-colors">
              {T.cta1}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 text-center bg-gradient-to-b from-white to-lexai-50">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-1.5 text-sm font-medium text-green-700 ring-1 ring-green-200">
            <Shield className="h-4 w-4" />
            {T.badge}
          </div>
          <h1 className="mb-4 text-5xl font-bold tracking-tight text-gray-900 leading-tight">
            {T.heroTitle}{' '}
            <span className="text-lexai-600">{T.heroHighlight}</span>
          </h1>
          <p className="mb-8 text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto">{T.heroSub}</p>

          {/* Audience pills */}
          <div className="mb-10 flex flex-wrap items-center justify-center gap-2">
            {T.audiencePills.map((p) => (
              <span key={p} className="rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-200 shadow-sm">
                {p}
              </span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="flex items-center gap-2 rounded-xl bg-lexai-600 px-8 py-4 text-lg font-bold text-white hover:bg-lexai-700 transition-colors shadow-lg shadow-lexai-200">
              {T.cta1} <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="#for-who" className="rounded-xl border-2 border-gray-200 px-8 py-4 text-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              {T.cta2}
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-400">{T.noCard}</p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-lexai-600 px-6 py-12">
        <div className="mx-auto max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((s, i) => (
            <div key={i}>
              <p className="text-3xl font-bold text-white">{s[lang].value}</p>
              <p className="mt-1 text-sm text-lexai-200">{s[lang].label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who is it for */}
      <section id="for-who" className="px-6 py-16 bg-white">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-center text-3xl font-bold text-gray-900">{T.forWhoTitle}</h2>
          <p className="mb-10 text-center text-gray-500">{T.forWhoSub}</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {AUDIENCES.map((a) => (
              <div key={a.en.title} className={`rounded-2xl p-5 ring-1 ${a.color}`}>
                <div className="text-3xl mb-3">{a.emoji}</div>
                <p className="font-bold text-gray-900">{a[lang].title}</p>
                <ul className="mt-3 space-y-1.5">
                  {a[lang].points.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-lexai-500 font-bold mt-0.5">✓</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-lexai-600 px-8 py-4 font-bold text-white hover:bg-lexai-700 transition-colors">
              {T.tryBtn} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-2 text-center text-3xl font-bold text-gray-900">{T.featuresTitle}</h2>
          <p className="mb-12 text-center text-gray-500">{T.featuresSub}</p>
          <div className="grid gap-6 md:grid-cols-3">
            {(FEATURES as { icon: React.ElementType; isNew?: boolean; en: { title: string; desc: string }; ur: { title: string; desc: string } }[]).map((f) => (
              <div key={f.en.title} className="relative rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 hover:ring-lexai-200 transition-all">
                {f.isNew && (
                  <span className="absolute top-4 right-4 rounded-full bg-lexai-100 px-2 py-0.5 text-[10px] font-bold text-lexai-700 uppercase tracking-wide">NEW</span>
                )}
                <div className="mb-4 inline-flex rounded-lg bg-lexai-50 p-3">
                  <f.icon className="h-6 w-6 text-lexai-600" />
                </div>
                <h3 className="mb-2 text-base font-bold text-gray-900">{f[lang].title}</h3>
                <p className="text-sm text-gray-500">{f[lang].desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 py-16 bg-white">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-center text-3xl font-bold text-gray-900">
            {isUrdu ? 'صارفین کیا کہتے ہیں' : 'Trusted by Pakistani professionals'}
          </h2>
          <p className="mb-10 text-center text-gray-500 text-sm">
            {isUrdu ? 'وکیلوں، کاروباری مالکان اور فری لانسرز کی رائے' : 'Lawyers, business owners, and freelancers across Pakistan'}
          </p>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                quote: 'I analyzed a 40-page vendor contract in under a minute. It caught a liability clause my client would have missed. This is a game changer for small firms like mine.',
                name: 'Adnan M.',
                role: 'Advocate, Lahore High Court',
                rating: 5,
              },
              {
                quote: 'As a freelancer on Upwork, I used to avoid sending contracts because I couldn\'t afford a lawyer. Court of AI generates professional agreements for me in seconds.',
                name: 'Saba R.',
                role: 'Freelance Developer, Karachi',
                rating: 5,
              },
              {
                quote: 'We used it to generate our co-founder agreement, NDA, and privacy policy. Saved us at least PKR 80,000 in legal fees during our early startup phase.',
                name: 'Usman A.',
                role: 'Co-founder, Lahore Startup',
                rating: 5,
              },
            ].map((t) => (
              <div key={t.name} className="rounded-2xl bg-white p-6 ring-1 ring-gray-200 shadow-sm flex flex-col">
                <div className="flex mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <span key={i} className="text-amber-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Urdu Chat Demo */}
      <section className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <div className="text-4xl mb-4">🗣️</div>
          <h2 className="mb-3 text-3xl font-bold text-gray-900">{T.chatTitle}</h2>
          <p className="mb-8 text-gray-500 max-w-xl mx-auto">{T.chatSub}</p>
          <div className="mx-auto max-w-lg rounded-2xl bg-white shadow-xl ring-1 ring-gray-200 overflow-hidden text-left" dir="rtl">
            <div className="bg-lexai-600 px-4 py-3 flex items-center gap-2">
              <Scale className="h-4 w-4 text-white" />
              <span className="text-sm font-semibold text-white">Court of AI — آپ کا AI قانونی معاون</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-start">
                <div className="rounded-xl rounded-tl-sm bg-lexai-600 px-4 py-2.5 text-sm text-white max-w-xs">
                  میں نے ایک کلائنٹ کو کام دیا لیکن اس نے پیسے نہیں دیے۔ کیا کروں؟
                </div>
              </div>
              <div className="flex justify-end">
                <div className="rounded-xl rounded-tr-sm bg-gray-100 px-4 py-2.5 text-sm text-gray-800 max-w-xs">
                  آپ کے پاس کئی قانونی راستے ہیں:<br /><br />
                  ۱. پہلے تحریری نوٹس بھیجیں<br />
                  ۲. معاہدے کی شرائط کا حوالہ دیں<br />
                  ۳. ضرورت پڑے تو چھوٹی عدالت میں کیس کریں<br /><br />
                  کیا میں ایک تقاضے کا خط تیار کروں؟
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8">
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-lexai-600 px-8 py-4 font-bold text-white hover:bg-lexai-700 transition-colors">
              {T.chatCta} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-20 bg-gray-50">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-center text-3xl font-bold text-gray-900">{T.pricingTitle}</h2>
          <p className="mb-2 text-center text-gray-500">{T.pricingSub}</p>
          <p className="mb-12 text-center text-sm text-gray-400">{T.pricingNote}</p>
          <div className="grid gap-6 md:grid-cols-3">
            {PRICING.map((plan) => (
              <div key={plan.name.en} className={`rounded-2xl p-6 ring-1 ${plan.highlight ? 'bg-lexai-600 ring-lexai-600 text-white shadow-xl scale-105' : 'bg-white ring-gray-200'}`}>
                {plan.highlight && (
                  <div className="mb-3 text-xs font-bold uppercase tracking-widest text-lexai-200">
                    {isUrdu ? '⭐ سب سے مقبول' : '⭐ Most Popular'}
                  </div>
                )}
                <h3 className={`text-xl font-bold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name[lang]}
                </h3>
                <div className="mt-3">
                  {plan.pricePKR === 0 ? (
                    <span className={`text-4xl font-bold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                      {isUrdu ? 'مفت' : 'Free'}
                    </span>
                  ) : (
                    <>
                      <div className={`text-3xl font-bold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                        {isUrdu ? `PKR ${plan.pricePKR.toLocaleString()}` : `$${plan.priceUSD}`}
                        <span className={`text-sm font-normal ml-1 ${plan.highlight ? 'text-lexai-200' : 'text-gray-400'}`}>
                          {isUrdu ? '/ماہ' : '/mo'}
                        </span>
                      </div>
                      <p className={`text-xs mt-0.5 ${plan.highlight ? 'text-lexai-300' : 'text-gray-400'}`}>
                        {isUrdu ? `($${plan.priceUSD} USD/mo)` : `≈ PKR ${plan.pricePKR.toLocaleString()}/mo`}
                      </p>
                    </>
                  )}
                </div>
                <ul className="mt-6 space-y-2.5">
                  {plan.features[lang].map((f, i) => (
                    <li key={i} className={`flex items-center gap-2 text-sm ${plan.highlight ? 'text-lexai-100' : 'text-gray-600'}`}>
                      <span className={plan.highlight ? 'text-lexai-200' : 'text-lexai-500'}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className={`mt-8 block rounded-xl py-3 text-center text-sm font-bold transition-colors ${plan.highlight ? 'bg-white text-lexai-600 hover:bg-lexai-50' : 'bg-lexai-600 text-white hover:bg-lexai-700'}`}>
                  {plan.cta[lang]}
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-gray-400">{T.pricingFooter}</p>
        </div>
      </section>

      {/* Competitor Comparison */}
      <section className="bg-gray-50 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-2 text-center text-3xl font-bold text-gray-900">
            {isUrdu ? 'موازنہ' : 'How we compare'}
          </h2>
          <p className="mb-10 text-center text-gray-500 text-sm">
            {isUrdu ? 'Court of AI بمقابلہ وکیل اور دوسرے ٹولز' : 'Court of AI vs. hiring a lawyer vs. other legal tools'}
          </p>
          <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">{isUrdu ? 'خصوصیت' : 'Feature'}</th>
                  <th className="px-5 py-4 font-bold text-lexai-700 text-center">Court of AI</th>
                  <th className="px-5 py-4 font-medium text-gray-500 text-center">{isUrdu ? 'وکیل' : 'Pakistani Lawyer'}</th>
                  <th className="px-5 py-4 font-medium text-gray-500 text-center">LegalZoom</th>
                  <th className="px-5 py-4 font-medium text-gray-500 text-center">ChatGPT</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  [isUrdu ? 'لاگت' : 'Cost', '$0–$99/mo', 'PKR 5k–50k/hr', '$39–$299/mo', 'No legal expertise'],
                  [isUrdu ? 'رفتار' : 'Speed', '30 seconds', '2–5 days', '1–3 days', 'Fast but generic'],
                  [isUrdu ? 'پاکستانی قانون' : 'Pakistani law', '✓ Built-in', '✓ Yes', '✗ US-focused', '✗ No'],
                  [isUrdu ? 'اردو سپورٹ' : 'Urdu support', '✓ Full Urdu', '✓ Yes', '✗ English only', '⚠ Limited'],
                  [isUrdu ? 'معاہدے کا تجزیہ' : 'Contract analysis', '✓ 30 seconds', '✓ (expensive)', '✓ (slow)', '⚠ No structure'],
                  [isUrdu ? 'دستاویز تیاری' : 'Document drafting', '✓ 9 types', '✓ (PKR 10k+)', '✓ US docs only', '⚠ No Pakistan law'],
                  [isUrdu ? 'قانونی مشورہ' : 'Legal advisor brief', '✓ Included', '✓ (per hour)', '✗', '⚠ No citations'],
                  [isUrdu ? 'ڈیڈ لائن ٹریکر' : 'Deadline tracker', '✓ Auto-extracted', '✗', '✗', '✗'],
                  [isUrdu ? 'مفت پلان' : 'Free plan', '✓ Yes', '✗', '✗', '✓ (no legal)'],
                ].map(([feature, courtofai, lawyer, lz, gpt]) => (
                  <tr key={feature} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 text-gray-700 font-medium">{feature}</td>
                    <td className="px-5 py-3.5 text-center text-lexai-700 font-medium">{courtofai}</td>
                    <td className="px-5 py-3.5 text-center text-gray-500">{lawyer}</td>
                    <td className="px-5 py-3.5 text-center text-gray-500">{lz}</td>
                    <td className="px-5 py-3.5 text-center text-gray-500">{gpt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16 bg-white">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-10 text-center text-3xl font-bold text-gray-900">
            {isUrdu ? 'اکثر پوچھے جانے والے سوالات' : 'Frequently asked questions'}
          </h2>
          <div className="space-y-4">
            {(isUrdu ? [
              {
                q: 'کیا Court of AI ایک وکیل کی جگہ لے سکتا ہے؟',
                a: 'نہیں۔ Court of AI ایک AI ٹول ہے جو آپ کو قانونی معلومات اور دستاویزات فراہم کرتا ہے۔ یہ لائسنس یافتہ وکیل نہیں ہے۔ اہم قانونی معاملات کے لیے ہمیشہ کسی وکیل سے مشورہ کریں۔',
              },
              {
                q: 'کیا یہ پاکستانی قانون پر کام کرتا ہے؟',
                a: 'ہاں۔ Court of AI خاص طور پر پاکستانی قوانین کے لیے بنایا گیا ہے — Contract Act 1872، PPC، Labour Laws، Companies Act 2017، اور مزید۔',
              },
              {
                q: 'کیا میں اردو میں سوال پوچھ سکتا ہوں؟',
                a: 'بالکل! آپ اردو یا انگریزی میں سوال پوچھ سکتے ہیں — AI دونوں زبانوں میں جواب دیتا ہے۔',
              },
              {
                q: 'میرا ڈیٹا محفوظ ہے؟',
                a: 'ہاں۔ آپ کے معاہدے اور ڈیٹا محفوظ ہیں اور صرف آپ ہی انہیں دیکھ سکتے ہیں۔ ہم کسی تیسرے فریق کے ساتھ آپ کا ڈیٹا شیئر نہیں کرتے۔',
              },
            ] : [
              {
                q: 'Is Court of AI a replacement for a real lawyer?',
                a: 'No. Court of AI is an AI tool that provides legal information and drafts documents. It is not a licensed attorney. For court proceedings, complex disputes, or high-stakes matters, always consult a qualified Pakistani lawyer.',
              },
              {
                q: 'Which Pakistani laws does it know?',
                a: 'Court of AI is trained on Pakistani law including the Contract Act 1872, Pakistan Penal Code, Companies Act 2017, Labor laws (EOBI, IRA), SECP regulations, FBR / tax law, Copyright Ordinance, Trademark Ordinance, PDPA, and PECA 2016.',
              },
              {
                q: 'Can I really ask in Urdu?',
                a: 'Yes. The AI responds in Urdu when you write in Urdu, and in English when you write in English. Both scripts are fully supported.',
              },
              {
                q: 'Is my contract data secure?',
                a: 'Yes. Your contracts and data are encrypted and only visible to you. We never share your legal documents with third parties. All data is stored securely with row-level security.',
              },
              {
                q: 'What document types can I generate?',
                a: 'NDAs, service agreements, employment contracts, privacy policies, terms of service, FBR-compliant invoices, demand letters, cease & desist letters, partnership deeds, shareholder agreements, and more — 15+ Pakistan-specific templates.',
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Yes. There are no contracts or commitments. Cancel your subscription from your account settings at any time. The free plan is available with no credit card required.',
              },
            ]).map(({ q, a }) => (
              <div key={q} className="rounded-xl bg-gray-50 border border-gray-200 p-5">
                <p className="font-semibold text-gray-900 mb-2 text-sm">{q}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="px-6 py-10 bg-amber-50 border-y border-amber-100">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm text-amber-800 font-medium">{T.disclaimer}</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-10">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-lexai-600" />
            <span className="font-bold text-lexai-700">Court of AI</span>
            <span className="text-gray-400 text-sm">— {T.footerTagline}</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/login" className="hover:text-gray-700">{isUrdu ? 'سائن ان' : 'Sign in'}</Link>
            <Link href="/signup" className="hover:text-gray-700">{isUrdu ? 'مفت سائن اپ' : 'Sign up free'}</Link>
            <Link href="#pricing" className="hover:text-gray-700">{isUrdu ? 'قیمت' : 'Pricing'}</Link>
          </div>
          <p className="text-xs text-gray-400">© 2025 Court of AI · Made for Pakistan 🇵🇰</p>
        </div>
      </footer>
    </div>
  )
}
