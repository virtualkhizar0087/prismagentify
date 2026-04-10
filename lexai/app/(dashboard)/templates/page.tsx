'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileText, Search, ArrowRight, Star, Briefcase, Users, Home, Shield, Code } from 'lucide-react'

interface Template {
  id: string
  title: string
  category: string
  description: string
  useCase: string[]
  complexity: 'Simple' | 'Standard' | 'Complex'
  pages: string
  docType: string
  prefill: Record<string, string>
  popular?: boolean
}

const CATEGORIES = [
  { id: 'all', label: 'All Templates', icon: FileText },
  { id: 'freelance', label: 'Freelance & IT', icon: Code },
  { id: 'business', label: 'Business', icon: Briefcase },
  { id: 'employment', label: 'Employment', icon: Users },
  { id: 'property', label: 'Property', icon: Home },
  { id: 'ip', label: 'IP & Privacy', icon: Shield },
]

const TEMPLATES: Template[] = [
  {
    id: 'freelance-service',
    title: 'Freelance Service Agreement',
    category: 'freelance',
    description: 'For Upwork, Fiverr, and local freelancers. Covers scope, payment, IP ownership, and dispute resolution under Pakistan law.',
    useCase: ['Web developers', 'Designers', 'Content writers', 'IT consultants'],
    complexity: 'Standard',
    pages: '3–4',
    docType: 'service_agreement',
    popular: true,
    prefill: {
      details: 'Freelance service agreement for a Pakistani freelancer. Include: clear scope of work definition, milestone-based payment schedule, IP assignment to client upon full payment, 30-day dispute resolution clause under Pakistan Contract Act 1872, limitation of liability, and termination with 15-day notice. Make it enforceable in Pakistani courts.'
    }
  },
  {
    id: 'nda-standard',
    title: 'Non-Disclosure Agreement (NDA)',
    category: 'business',
    description: 'Mutual or one-way NDA for protecting confidential business information, trade secrets, and client data.',
    useCase: ['Business partnerships', 'Investor meetings', 'Client onboarding', 'Employee hiring'],
    complexity: 'Simple',
    pages: '2–3',
    docType: 'nda',
    popular: true,
    prefill: {
      details: 'Standard NDA under Pakistan Contract Act 1872. Include: definition of confidential information, exclusions (public domain, independently developed), 2-year confidentiality period, return/destruction of materials clause, non-solicitation clause, and injunctive relief remedy. Make it balanced and enforceable in Pakistan.'
    }
  },
  {
    id: 'employment-standard',
    title: 'Employment Contract (Pakistan)',
    category: 'employment',
    description: 'Full employment agreement compliant with Pakistan labor laws including EOBI, SESSI, and Industrial Relations Act.',
    useCase: ['Small businesses', 'Startups', 'Offices', 'Remote workers'],
    complexity: 'Complex',
    pages: '5–7',
    docType: 'employment_contract',
    popular: true,
    prefill: {
      details: 'Employment contract compliant with Pakistan labor laws. Include: probation period (3 months), salary with deductions (EOBI, Income Tax), leave entitlements (annual 14 days, sick 10 days, casual 10 days per Industrial Relations Act), overtime policy, code of conduct, IP ownership clause, non-compete (6 months post-employment in same city), EOBI and SESSI registration obligations, and termination with 1-month notice or payment in lieu.'
    }
  },
  {
    id: 'saas-terms',
    title: 'SaaS / Software Terms of Service',
    category: 'freelance',
    description: 'Terms of service for software products, mobile apps, and SaaS businesses targeting Pakistani and international users.',
    useCase: ['App developers', 'SaaS founders', 'Subscription businesses'],
    complexity: 'Complex',
    pages: '4–6',
    docType: 'terms_of_service',
    prefill: {
      details: 'Terms of Service for a Pakistan-based SaaS company with international users. Include: account registration, subscription and payment terms (including PKR billing), acceptable use policy, intellectual property ownership, service level commitments, data processing under Pakistan PDPA, limitation of liability (max 3 months fees), governing law (Pakistan), and dispute resolution through Lahore courts.'
    }
  },
  {
    id: 'privacy-policy',
    title: 'Privacy Policy (PDPA Compliant)',
    category: 'ip',
    description: 'Privacy policy compliant with Pakistan Personal Data Protection Act and international standards (GDPR-friendly).',
    useCase: ['Websites', 'Mobile apps', 'E-commerce', 'Data collectors'],
    complexity: 'Standard',
    pages: '3–4',
    docType: 'privacy_policy',
    popular: true,
    prefill: {
      details: 'Privacy policy for a Pakistani digital business. Cover: data collected (name, email, payment info, usage data), legal basis for processing, data storage in Pakistan or international transfers, user rights (access, deletion, correction), cookies policy, third-party services disclosure, children\'s privacy (under 13), data breach notification (72-hour policy), and contact details for privacy officer. Compliant with Pakistan PDPA and GDPR principles.'
    }
  },
  {
    id: 'vendor-contract',
    title: 'Vendor / Supplier Agreement',
    category: 'business',
    description: 'For purchasing goods or services from local suppliers, manufacturers, or distributors in Pakistan.',
    useCase: ['Retailers', 'Manufacturers', 'Importers', 'SMEs'],
    complexity: 'Standard',
    pages: '3–5',
    docType: 'service_agreement',
    prefill: {
      details: 'Vendor agreement under Pakistan Contract Act 1872 and Sale of Goods Act 1930. Include: product/service specifications with quality standards, payment terms (advance, delivery, credit), delivery timelines and penalties for delay, inspection and rejection rights, warranty (1 year), indemnification for defective goods, force majeure, and termination with 30-day notice. Governing law: Pakistan, courts of [City].'
    }
  },
  {
    id: 'rental-agreement',
    title: 'Commercial Property Rental',
    category: 'property',
    description: 'Commercial office or shop rental agreement for Pakistani businesses, compliant with local tenancy laws.',
    useCase: ['Office rentals', 'Shop rentals', 'Warehouse leases', 'Retail spaces'],
    complexity: 'Standard',
    pages: '3–4',
    docType: 'other',
    prefill: {
      details: 'Commercial rental agreement for office/shop in Pakistan. Include: property description (address, size, permitted use), monthly rent in PKR with annual escalation (8-10%), security deposit (2-3 months, refundable), maintenance responsibilities (tenant: minor repairs, landlord: major structural), utility payments, sub-letting restriction, 90-day notice for early termination, and dispute resolution through civil courts.'
    }
  },
  {
    id: 'partnership-deed',
    title: 'Partnership Deed',
    category: 'business',
    description: 'Business partnership agreement under Pakistan Partnership Act 1932 for two or more partners.',
    useCase: ['Joint ventures', 'Business partnerships', 'Co-founders', 'Family businesses'],
    complexity: 'Complex',
    pages: '5–8',
    docType: 'other',
    prefill: {
      details: 'Partnership deed under Pakistan Partnership Act 1932. Include: business name and nature, capital contribution by each partner, profit/loss sharing ratio, partner roles and authorities, bank account operation (require 2 signatures), admission and retirement of partners, goodwill valuation method, dissolution procedure (3-month winding up), non-compete for 1 year post-exit, arbitration clause. Register with Partnership Registration Authority.'
    }
  },
  {
    id: 'ip-assignment',
    title: 'Intellectual Property Assignment',
    category: 'ip',
    description: 'Transfer ownership of copyright, software code, designs, or trademarks from creator to business.',
    useCase: ['Software development', 'Content creation', 'Design work', 'Brand acquisition'],
    complexity: 'Standard',
    pages: '2–3',
    docType: 'other',
    prefill: {
      details: 'IP assignment agreement under Pakistan Copyright Ordinance 1962 and Trademark Ordinance 2001. Include: clear description of IP being assigned (software code, designs, content, trademark), full and exclusive ownership transfer, moral rights waiver, warranty that creator is the original author and IP is unencumbered, consideration paid, representations about no prior assignments or licenses, assistance with registration transfer, and perpetual worldwide assignment.'
    }
  },
  {
    id: 'demand-letter',
    title: 'Demand Letter for Payment',
    category: 'business',
    description: 'Formal demand letter requesting outstanding payment before initiating legal proceedings in Pakistan.',
    useCase: ['Unpaid invoices', 'Loan recovery', 'Service fee disputes', 'B2B collections'],
    complexity: 'Simple',
    pages: '1–2',
    docType: 'demand_letter',
    prefill: {
      details: 'Formal legal demand letter for payment recovery. Include: clear statement of amount owed with breakdown, reference to original agreement/invoice numbers, 14-day ultimatum for payment, warning that failure will result in legal action under Negotiable Instruments Act or civil suit for recovery, mention of potential additional costs (legal fees, interest under Contract Act), and instruction to contact sender to resolve before escalation.'
    }
  },
  {
    id: 'ceasedesist',
    title: 'Cease & Desist Letter',
    category: 'ip',
    description: 'Formal notice to stop infringing activity — copyright violation, defamation, trademark misuse, or harassment.',
    useCase: ['IP infringement', 'Brand copying', 'Online defamation', 'Harassment'],
    complexity: 'Simple',
    pages: '1–2',
    docType: 'cease_and_desist',
    prefill: {
      details: 'Cease and desist letter under Pakistan Copyright Ordinance 1962. Include: specific description of the infringing activity with dates, legal basis (copyright violation, defamation, trademark misuse), demand to immediately stop the activity and remove infringing content within 7 days, demand for written confirmation of compliance, warning that continued infringement will result in civil suit and criminal complaint, and reservation of all legal rights.'
    }
  },
  {
    id: 'consultant-retainer',
    title: 'Consulting Retainer Agreement',
    category: 'freelance',
    description: 'Monthly retainer contract for consultants, advisors, and ongoing professional services.',
    useCase: ['Business consultants', 'Financial advisors', 'Legal advisors', 'Marketing retainers'],
    complexity: 'Standard',
    pages: '3–4',
    docType: 'service_agreement',
    prefill: {
      details: 'Consulting retainer agreement for ongoing monthly services. Include: monthly retainer fee in PKR, scope of services (hours/deliverables per month), exclusivity clause (or non-exclusivity), expenses reimbursement policy, monthly reporting requirement, 30-day termination notice, IP ownership (client owns all work product), confidentiality, independent contractor status (not employee), FBR withholding tax compliance, and dispute resolution through arbitration in [City].'
    }
  },
  {
    id: 'data-processing',
    title: 'Data Processing Agreement (DPA)',
    category: 'ip',
    description: 'Agreement between data controller and data processor under Pakistan PDPA for handling personal data.',
    useCase: ['SaaS providers', 'Outsourcing', 'Cloud services', 'Marketing agencies'],
    complexity: 'Complex',
    pages: '4–5',
    docType: 'other',
    prefill: {
      details: 'Data Processing Agreement under Pakistan Personal Data Protection Act. Include: definitions (controller, processor, personal data, processing), subject matter and duration, nature and purpose of processing, types of personal data and categories of data subjects, processor obligations (process only per instructions, staff confidentiality, security measures, sub-processor rules, audit rights, deletion on termination), data breach notification (24 hours), data subject request handling, international transfer restrictions, and liability allocation.'
    }
  },
  {
    id: 'shareholder-agreement',
    title: 'Shareholder Agreement',
    category: 'business',
    description: 'Rights and obligations of shareholders in a Pakistan private limited company under Companies Act 2017.',
    useCase: ['Startups', 'Private limited companies', 'Co-founders', 'Investor agreements'],
    complexity: 'Complex',
    pages: '8–12',
    docType: 'other',
    prefill: {
      details: 'Shareholder agreement for Pakistan private limited company under Companies Act 2017. Include: share ownership percentages, board composition and voting rights, reserved matters requiring unanimous consent, pre-emption rights on share transfer, tag-along and drag-along rights, anti-dilution protection, dividend policy, founder vesting (4-year, 1-year cliff), non-compete (2 years, Pakistan), confidentiality, deadlock resolution mechanism, exit provisions (IPO, trade sale, buyout), governing law: Pakistan, LCIA arbitration.'
    }
  },
  {
    id: 'invoice-template',
    title: 'Professional Invoice (FBR Compliant)',
    category: 'freelance',
    description: 'FBR-compliant professional invoice for Pakistani businesses and freelancers, including tax breakdown.',
    useCase: ['Freelancers', 'Consultants', 'Service providers', 'Small businesses'],
    complexity: 'Simple',
    pages: '1',
    docType: 'invoice',
    prefill: {
      details: 'Professional invoice compliant with FBR requirements. Include: business name, NTN number, STRN if applicable, invoice number, date, client details, itemized services with description and rate, subtotal, withholding tax deduction (if applicable, show rate), sales tax (if registered), net amount payable in PKR, payment terms (due within 30 days), bank details for payment (bank name, account title, IBAN), and late payment fee (2% per month on overdue amount).'
    }
  },
]

const complexityColors = {
  Simple: 'bg-green-100 text-green-700',
  Standard: 'bg-blue-100 text-blue-700',
  Complex: 'bg-purple-100 text-purple-700',
}

export default function TemplatesPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  const filtered = TEMPLATES.filter((t) => {
    const matchesCategory = activeCategory === 'all' || t.category === activeCategory
    const matchesSearch = !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.useCase.some((u) => u.toLowerCase().includes(search.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const popular = TEMPLATES.filter((t) => t.popular)

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Contract Templates</h1>
        <p className="mt-1 text-gray-500">
          15+ Pakistan-specific legal templates. Click <strong>Use Template</strong> to generate with AI in seconds.
        </p>
      </div>

      {/* Popular */}
      <div className="rounded-xl bg-lexai-50 border border-lexai-100 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Star className="h-4 w-4 text-lexai-600 fill-lexai-600" />
          <span className="text-sm font-semibold text-lexai-700">Most Popular</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {popular.map((t) => (
            <Link
              key={t.id}
              href={`/documents?type=${t.docType}&prefill=${encodeURIComponent(t.prefill.details)}`}
              className="flex items-center gap-1.5 rounded-lg bg-white border border-lexai-200 px-3 py-1.5 text-sm font-medium text-lexai-700 hover:bg-lexai-100 transition-colors"
            >
              {t.title}
              <ArrowRight className="h-3 w-3" />
            </Link>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search templates — e.g. NDA, employment, freelance…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-lexai-500"
        />
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeCategory === cat.id
                  ? 'bg-lexai-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Templates grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => (
          <div key={t.id} className="flex flex-col rounded-xl bg-white p-5 ring-1 ring-gray-200 hover:ring-lexai-300 transition-all">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex flex-wrap gap-1.5">
                <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${complexityColors[t.complexity]}`}>
                  {t.complexity}
                </span>
                <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                  {t.pages} pages
                </span>
                {t.popular && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                    <Star className="h-2.5 w-2.5 fill-amber-500" /> Popular
                  </span>
                )}
              </div>
            </div>

            <h3 className="text-sm font-semibold text-gray-900 mb-1">{t.title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-3 flex-1">{t.description}</p>

            <div className="mb-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Good for</p>
              <div className="flex flex-wrap gap-1">
                {t.useCase.map((u) => (
                  <span key={u} className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600">{u}</span>
                ))}
              </div>
            </div>

            <Link
              href={`/documents?type=${t.docType}&prefill=${encodeURIComponent(t.prefill.details)}`}
              className="flex items-center justify-center gap-2 rounded-lg bg-lexai-600 px-4 py-2 text-sm font-medium text-white hover:bg-lexai-700 transition-colors"
            >
              Use Template
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <FileText className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No templates match your search.</p>
          <button onClick={() => { setSearch(''); setActiveCategory('all') }} className="mt-2 text-sm text-lexai-600 hover:underline">
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}
