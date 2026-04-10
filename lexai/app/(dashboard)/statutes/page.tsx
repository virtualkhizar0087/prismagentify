'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  BookMarked, X, Loader2, Bot, Scale, Search,
} from 'lucide-react'

interface Statute {
  id: string
  icon: string
  name: string
  shortName: string
  year: number
  category: string
  description: string
  purpose: string
  keySections: string[]
  color: string
  bgColor: string
  borderColor: string
}

const STATUTES: Statute[] = [
  {
    id: 'ppc',
    icon: '⚖️',
    name: 'Pakistan Penal Code',
    shortName: 'PPC',
    year: 1860,
    category: 'Criminal',
    description: 'The principal criminal code of Pakistan covering all criminal offenses and their punishments.',
    purpose: 'Defines criminal offenses ranging from petty crimes to capital offenses. Covers murder (s.302), theft (s.378), robbery (s.392), dacoity (s.391), fraud, forgery, defamation, and offenses against the state. The backbone of criminal law in Pakistan.',
    keySections: [
      's.34 — Common intention',
      's.84 — Unsoundness of mind (insanity defense)',
      's.100 — Right of private defence',
      's.302 — Punishment for qatl-i-amd (murder)',
      's.310 — Diyat (blood money)',
      's.311 — Tazir (discretionary punishment)',
      's.375-376 — Rape and punishment',
      's.378-382 — Theft and its forms',
      's.391-396 — Dacoity and robbery',
      's.420 — Cheating',
      's.441-447 — Criminal trespass',
      's.499-500 — Defamation',
    ],
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  {
    id: 'crpc',
    icon: '🏛️',
    name: 'Code of Criminal Procedure',
    shortName: 'CrPC',
    year: 1898,
    category: 'Criminal',
    description: 'Governs the procedural aspects of criminal law — how trials are conducted, arrests made, and bail granted.',
    purpose: 'Comprehensive code governing criminal procedure from FIR to final appeal. Deals with powers of police, arrest without warrant, bail, search and seizure, trial procedures, sentences, and appeals. Essential for criminal practitioners.',
    keySections: [
      's.22A — Power to direct registration of FIR',
      's.54 — Arrest without warrant by police',
      's.88 — Bail in bailable offenses',
      's.89 — Bail in non-bailable offenses',
      's.154 — FIR (First Information Report)',
      's.173 — Police report (challan)',
      's.196 — Prosecution for offenses against state',
      's.265-C — Trial before sessions court',
      's.374 — Suspension of sentence pending appeal',
      's.401 — Power of High Court to alter sentence',
      's.439 — Revision powers of High Court',
      's.491 — Habeas corpus',
    ],
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  {
    id: 'cpc',
    icon: '📋',
    name: 'Code of Civil Procedure',
    shortName: 'CPC',
    year: 1908,
    category: 'Civil',
    description: 'Governs all civil proceedings in Pakistan — suits, appeals, execution, and procedural requirements.',
    purpose: 'The master procedural code for civil litigation. Covers jurisdiction of courts, institution of suits, pleadings, discovery, interim injunctions, trials, judgments, decrees, and their execution. Every civil litigant must understand this code.',
    keySections: [
      'Order 1 — Parties to suits (joinder)',
      'Order 6 — Pleadings (plaint, written statement)',
      'Order 7 — Plaint requirements',
      'Order 8 — Written statement and set-off',
      'Order 11 — Discovery and inspection',
      'Order 38 — Attachment before judgment',
      'Order 39 — Temporary injunctions',
      'Order 40 — Appointment of receivers',
      'Order 41 — Appeals from original decrees',
      's.9 — Courts to try all civil suits',
      's.80 — Notice before suit against government',
      's.151 — Inherent powers of court',
    ],
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    id: 'qso',
    icon: '📜',
    name: 'Qanun-e-Shahadat Order',
    shortName: 'QSO 1984',
    year: 1984,
    category: 'Evidence',
    description: 'Pakistan\'s law of evidence governing the admissibility and proof of facts in courts.',
    purpose: 'Replaces the Indian Evidence Act. Governs what evidence is admissible, burden of proof, presumptions, expert opinions, documentary evidence, confessions, and the competence of witnesses. Based on Islamic principles of Shahadat (testimony).',
    keySections: [
      'Art. 17 — Number of witnesses (two males or one male + two females)',
      'Art. 29 — Admissions',
      'Art. 37-38 — Confessions to police (inadmissible)',
      'Art. 40 — Confession made to magistrate',
      'Art. 59 — Hearsay rule',
      'Art. 71 — Primary and secondary evidence',
      'Art. 79 — Presumption as to documents',
      'Art. 117 — Burden of proof',
      'Art. 118 — Onus of proof',
      'Art. 129 — Court may presume',
      'Art. 150 — Examination in chief',
      'Art. 162 — Leading questions',
    ],
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  {
    id: 'constitution',
    icon: '🏴',
    name: 'Constitution of Pakistan',
    shortName: 'Constitution 1973',
    year: 1973,
    category: 'Constitutional',
    description: 'The supreme law of Pakistan. All other laws must conform to constitutional provisions.',
    purpose: 'The fundamental law establishing Pakistan\'s governmental structure, federal system, fundamental rights of citizens, and constitutional institutions. No law can override the Constitution. Courts have power of judicial review to strike down unconstitutional legislation.',
    keySections: [
      'Art. 8 — Laws inconsistent with fundamental rights are void',
      'Art. 9 — Security of person (right to life)',
      'Art. 10 — Safeguards as to arrest and detention',
      'Art. 10-A — Right to fair trial',
      'Art. 14 — Inviolability of dignity of man',
      'Art. 19 — Freedom of speech and press',
      'Art. 19-A — Right to information',
      'Art. 23-24 — Rights to property',
      'Art. 25 — Equality of citizens',
      'Art. 62-63 — Qualifications/disqualifications of MPs',
      'Art. 184(3) — Original jurisdiction of Supreme Court',
      'Art. 199 — Constitutional jurisdiction of High Courts',
      'Art. 227 — Consistency with injunctions of Islam',
    ],
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  {
    id: 'mflo',
    icon: '💍',
    name: 'Muslim Family Laws Ordinance',
    shortName: 'MFLO 1961',
    year: 1961,
    category: 'Family',
    description: 'Regulates Muslim marriages, divorce, polygamy, and maintenance in Pakistan.',
    purpose: 'A landmark reform legislation governing Muslim personal law. Introduced compulsory registration of marriages (nikah), notice requirements for divorce and polygamy, and maintenance rights. Applicable to all Muslim citizens. Enforced through Union Councils.',
    keySections: [
      's.5 — Registration of marriage (nikah nama)',
      's.6 — Polygamy (permission from Arbitration Council)',
      's.7 — Talaq (divorce by husband, 90-day notice)',
      's.8 — Dissolution of marriage by wife (delegated talaq)',
      's.9 — Maintenance of divorced wife and children',
      's.10 — Dower (mehr)',
    ],
    color: 'text-pink-700',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
  },
  {
    id: 'dmma',
    icon: '⚡',
    name: 'Dissolution of Muslim Marriages Act',
    shortName: 'DMMA 1939',
    year: 1939,
    category: 'Family',
    description: 'Grounds on which a Muslim woman may seek dissolution of her marriage through court.',
    purpose: 'Provides Muslim women statutory grounds to dissolve their marriage through judicial divorce (faskh). Predates MFLO and remains important. Lists grounds including cruelty, desertion, failure of maintenance, imprisonment, and general grounds of incompatibility.',
    keySections: [
      's.2(i) — Husband\'s whereabouts unknown for 4 years',
      's.2(ii) — Failure to maintain for 2 years',
      's.2(iii) — Husband imprisoned for 7+ years',
      's.2(iv) — Husband failed to perform marital obligations',
      's.2(v) — Husband impotent',
      's.2(vi) — Husband insane or afflicted with leprosy/venereal disease',
      's.2(vii) — Husband\'s cruelty',
      's.2(ix) — All other grounds recognized in Muslim law (khula)',
    ],
    color: 'text-rose-700',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
  },
  {
    id: 'gwa',
    icon: '👶',
    name: 'Guardian and Wards Act',
    shortName: 'GWA 1890',
    year: 1890,
    category: 'Family',
    description: 'Governs the appointment of guardians for minor children and their property.',
    purpose: 'Governs guardianship and custody proceedings for minors. Courts appoint guardians of the person and property of minors. The paramount consideration is the welfare of the child. Family courts exercise jurisdiction under this Act in Pakistan.',
    keySections: [
      's.7 — Power of court to make order as to guardianship',
      's.8 — Application for order',
      's.17 — Matters to consider for welfare of minor',
      's.25 — Right of father as natural guardian',
      's.26 — Change in guardian',
      's.42 — Powers and duties of guardians',
    ],
    color: 'text-sky-700',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
  },
  {
    id: 'tpa',
    icon: '🏠',
    name: 'Transfer of Property Act',
    shortName: 'TPA 1882',
    year: 1882,
    category: 'Property',
    description: 'Governs the transfer of property by act of parties — sales, mortgages, leases, gifts, and exchanges.',
    purpose: 'The fundamental statute governing transfer of immovable property in Pakistan. Defines modes of transfer, conditions, restrictions, and rights of parties. Sale, mortgage (simple, English, usufructuary), lease, exchange, and gift are all governed by this Act.',
    keySections: [
      's.5 — Transfer of property defined',
      's.54 — Sale defined',
      's.55 — Rights and liabilities of buyer and seller',
      's.58 — Mortgage defined and types',
      's.76 — Rights of mortgagee',
      's.105 — Lease defined',
      's.108 — Rights and liabilities of lessor and lessee',
      's.122 — Gift defined',
      's.129 — Saving of Muslim law regarding gifts',
      's.130 — Transfer of actionable claims',
    ],
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  {
    id: 'sra',
    icon: '🛡️',
    name: 'Specific Relief Act',
    shortName: 'SRA 1877',
    year: 1877,
    category: 'Civil',
    description: 'Provides for specific performance of contracts, recovery of possession, and injunctions.',
    purpose: 'Governs equitable remedies in civil law. Key for enforcing contracts specifically (not just damages), recovering possession of immovable property, rectification of instruments, cancellation of void documents, and declaratory relief. Injunctions under s.53 are commonly sought.',
    keySections: [
      's.8 — Recovery of specific movable property',
      's.9 — Recovery of possession of immovable property',
      's.12 — Specific performance of contracts',
      's.21 — Discretion to award specific performance',
      's.39 — Cancellation of instrument',
      's.42 — Declaration of legal character',
      's.53 — Preventive relief (injunctions)',
      's.56 — Cases in which injunction may be granted',
    ],
    color: 'text-teal-700',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
  },
  {
    id: 'la',
    icon: '⏰',
    name: 'Limitation Act',
    shortName: 'Limitation Act 1908',
    year: 1908,
    category: 'Civil',
    description: 'Sets time limits within which civil suits and applications must be filed.',
    purpose: 'Prescribes limitation periods for all civil suits, appeals, and applications. Suits filed after the limitation period are time-barred. Also provides for extension of time in case of disability, fraud, or acknowledgment. Critical to know before advising clients.',
    keySections: [
      'Art. 65 — 12 years for possession of immovable property',
      'Art. 113 — 3 years for money suits',
      'Art. 120 — 6 years for general suits',
      'Art. 156 — 30 days for revision in criminal matters',
      's.5 — Extension of period in certain cases',
      's.14 — Exclusion of time of prior proceedings',
      's.18 — Effect of acknowledgment in writing',
      's.20 — Effect of payment',
      's.29 — Savings',
    ],
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
  },
  {
    id: 'ata',
    icon: '🚨',
    name: 'Anti-Terrorism Act',
    shortName: 'ATA 1997',
    year: 1997,
    category: 'Criminal',
    description: 'Special legislation for prosecution of terrorism offenses with dedicated Anti-Terrorism Courts (ATCs).',
    purpose: 'Creates special Anti-Terrorism Courts (ATCs) for speedy trial of terrorist offenses. Defines terrorism broadly, provides for forfeiture of assets, proscription of organizations, and enhanced punishments. Frequently challenged for overly broad jurisdiction.',
    keySections: [
      's.6 — Definition of terrorism',
      's.7 — Punishment for acts of terrorism',
      's.11 — Proscribed organizations',
      's.11-A to 11-N — Regulation of organizations',
      's.19 — Anti-Terrorism Courts',
      's.21 — Speedy trial (7 days)',
      's.23 — Appeal to High Court',
      's.26 — Forfeiture of property',
      's.31 — Protection of witnesses',
      's.40 — Presumption as to explosives',
    ],
    color: 'text-gray-800',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-400',
  },
  {
    id: 'nab',
    icon: '🏦',
    name: 'NAB Ordinance',
    shortName: 'NAB 1999',
    year: 1999,
    category: 'Accountability',
    description: 'Establishes the National Accountability Bureau for prosecution of corruption and financial crimes.',
    purpose: 'Creates NAB with broad powers to investigate and prosecute corruption, money laundering, and white-collar crime. Contains reverse burden of proof for public officeholders. Provides for plea bargain and voluntary return. Has been extensively amended and litigated.',
    keySections: [
      's.9 — Definitions of corruption and corrupt practices',
      's.10 — Punishment for corruption',
      's.14 — Presumption against accused (reverse burden)',
      's.15 — Bail not ordinarily to be granted',
      's.24 — Plea bargain',
      's.25 — Voluntary return',
      's.25-A — Freezing of assets',
      's.31-A — Accountability Courts',
      's.32 — Trial procedure',
    ],
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
  {
    id: 'peca',
    icon: '💻',
    name: 'Prevention of Electronic Crimes Act',
    shortName: 'PECA 2016',
    year: 2016,
    category: 'Cyber Crime',
    description: 'Pakistan\'s primary cyber crime legislation covering online offenses, digital evidence, and CERT.',
    purpose: 'Pakistan\'s first comprehensive cyber crime law. Criminalizes unauthorized access, cyber terrorism, electronic fraud, online harassment, and digital defamation. Highly controversial, especially s.20 on "online defamation" frequently used against journalists.',
    keySections: [
      's.3 — Unauthorized access to information system',
      's.4 — Unauthorized copying or transmission of data',
      's.9 — Cyber terrorism',
      's.10 — Electronic fraud',
      's.16 — Cyber stalking',
      's.17 — Spamming',
      's.18 — Spoofing',
      's.20 — Offenses against dignity of a natural person (online defamation)',
      's.21 — Offenses against modesty of a natural person',
      's.29 — Digital forensic analysis',
      's.30 — Designated court for PECA offenses',
    ],
    color: 'text-violet-700',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
  },
  {
    id: 'companies',
    icon: '🏢',
    name: 'Companies Act',
    shortName: 'Companies Act 2017',
    year: 2017,
    category: 'Commercial',
    description: 'Governs the formation, management, and winding up of companies in Pakistan.',
    purpose: 'Replaced the Companies Ordinance 1984. Comprehensive statute governing incorporation, share capital, directors\' duties, shareholder rights, mergers, acquisitions, and winding up. Administered by the Securities and Exchange Commission (SECP).',
    keySections: [
      's.17 — Incorporation',
      's.26 — Memorandum and articles',
      's.134 — Disclosure of interest by directors',
      's.181 — Annual general meeting',
      's.219 — Oppression and mismanagement',
      's.279 — Winding up by court',
      's.282 — Just and equitable winding up',
      's.309 — Fraudulent trading',
      's.452 — Powers of SECP',
    ],
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
  },
  {
    id: 'ito',
    icon: '💰',
    name: 'Income Tax Ordinance',
    shortName: 'ITO 2001',
    year: 2001,
    category: 'Tax',
    description: 'Comprehensive income tax legislation administered by the Federal Board of Revenue (FBR).',
    purpose: 'Governs income tax for individuals, companies, and associations. Covers tax on salary, business income, capital gains, rental income, withholding tax, and international taxation. FBR administers assessment, collection, and enforcement.',
    keySections: [
      's.4 — Tax on taxable income',
      's.11 — Salary income',
      's.18 — Business income',
      's.37 — Capital gains',
      's.39 — Income from property',
      's.111 — Unexplained income (assets beyond means)',
      's.114 — Return of income',
      's.122 — Amendment of assessment',
      's.153 — Payments for goods and services (WHT)',
      's.177 — Audit',
    ],
    color: 'text-lime-700',
    bgColor: 'bg-lime-50',
    borderColor: 'border-lime-200',
  },
  {
    id: 'pta',
    icon: '🌾',
    name: 'Punjab Tenancy Act',
    shortName: 'PTA 1887',
    year: 1887,
    category: 'Property',
    description: 'Governs landlord-tenant relations for agricultural land in Punjab.',
    purpose: 'Defines the rights and liabilities of landlords and tenants of agricultural land in Punjab. Covers fixity of tenure, rent, occupancy rights, ejectment, and dispute resolution. Important for agricultural property disputes in Punjab.',
    keySections: [
      's.4 — Tenant defined',
      's.5 — Occupancy tenant',
      's.6 — Right of occupancy',
      's.16 — Tenant\'s right to produce',
      's.31 — Rent',
      's.47 — Ejectment of tenant',
      's.53 — Suits by and against tenants',
    ],
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  {
    id: 'contract',
    icon: '🤝',
    name: 'Contract Act',
    shortName: 'Contract Act 1872',
    year: 1872,
    category: 'Commercial',
    description: 'The foundational law of contracts in Pakistan — offer, acceptance, consideration, and enforceability.',
    purpose: 'The fundamental law governing all contracts in Pakistan. Covers formation of contracts, capacity, consideration, free consent, legality, void and voidable agreements, performance, breach, remedies, indemnity, guarantee, bailment, and agency.',
    keySections: [
      's.2 — Definitions (proposal, acceptance, agreement)',
      's.10 — What agreements are contracts',
      's.11 — Who is competent to contract',
      's.14 — Free consent',
      's.15 — Coercion',
      's.16 — Undue influence',
      's.17 — Fraud',
      's.18 — Misrepresentation',
      's.23 — Void agreements (unlawful consideration)',
      's.56 — Agreement to do impossible act (frustration)',
      's.73 — Compensation for breach',
      's.126 — Contract of guarantee (surety)',
      's.182 — Agent defined',
    ],
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
  },
  {
    id: 'mpl',
    icon: '📿',
    name: 'Muslim Personal Law (Shariat) Application Act',
    shortName: 'WPMPLA 1962',
    year: 1962,
    category: 'Family',
    description: 'Applies Islamic personal law (Shariat) to Muslims in West Pakistan for personal matters.',
    purpose: 'Directs that in matters of personal status (inheritance, succession, marriage, dower, maintenance, gifts) Muslim personal law (Shariat) shall apply to Muslims. Replaces any conflicting custom or usage. Key for inheritance disputes especially daughters\' rights.',
    keySections: [
      's.2 — Application of Muslim Personal Law',
      'Scope: Intestate succession, special property of females, betrothal, marriage, divorce, dower, adoption, guardianship, minority, family relations',
    ],
    color: 'text-teal-700',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
  },
  {
    id: 'hudood',
    icon: '📖',
    name: 'Hudood Ordinances',
    shortName: 'Hudood 1979',
    year: 1979,
    category: 'Criminal',
    description: 'Islamic criminal laws prescribing Hadd punishments for specific offenses including theft and unlawful sexual intercourse.',
    purpose: 'A series of four ordinances promulgated under Zia ul-Haq: Zina (sexual offenses), Qazf (false accusation of zina), Theft (with hadd), and Prohibition (alcohol). Highly controversial. Women Protection Act 2006 shifted zina to PPC for many provisions.',
    keySections: [
      'Zina Ordinance s.5 — Zina liable to Hadd',
      'Zina Ordinance s.6 — Zina bil Jabr (rape)',
      'Zina Ordinance s.17 — Proof of zina',
      'Theft Ordinance s.5 — Hadd for theft',
      'Qazf Ordinance s.5 — Hadd for false accusation',
      'Prohibition Order s.3 — Hadd for drinking',
    ],
    color: 'text-stone-700',
    bgColor: 'bg-stone-50',
    borderColor: 'border-stone-200',
  },
]

const CATEGORIES = ['All', 'Criminal', 'Civil', 'Constitutional', 'Family', 'Property', 'Commercial', 'Tax', 'Accountability', 'Cyber Crime', 'Evidence']

export default function StatutesPage() {
  const [selected, setSelected] = useState<Statute | null>(null)
  const [aiQuestion, setAiQuestion] = useState('')
  const [aiAnswer, setAiAnswer] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered = STATUTES.filter(s => {
    const matchesSearch = searchQuery === '' ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === 'All' || s.category === activeCategory
    return matchesSearch && matchesCategory
  })

  async function handleAskQuestion() {
    if (!aiQuestion.trim() || !selected) return
    setAiAnswer('')
    setIsStreaming(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: null,
          message: `Regarding the ${selected.name} (${selected.shortName}) of Pakistan: ${aiQuestion}`,
          messages: [],
        }),
      })

      if (!res.body) return
      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break
            try {
              const parsed = JSON.parse(data)
              if (parsed.text) setAiAnswer(prev => prev + parsed.text)
            } catch {}
          }
        }
      }
    } catch {}
    setIsStreaming(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-5">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-2 mb-1">
            <BookMarked className="h-5 w-5 text-lexai-600" />
            <h1 className="text-xl font-bold text-gray-900">Pakistan Statutes</h1>
          </div>
          <p className="text-sm text-gray-500">
            {STATUTES.length} key statutes — quick reference with key sections and AI Q&A
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6">
        {/* Search + Filter */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search statutes..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-lexai-400 focus:outline-none focus:ring-2 focus:ring-lexai-100"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-lexai-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Statutes Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(statute => (
            <button
              key={statute.id}
              onClick={() => { setSelected(statute); setAiAnswer(''); setAiQuestion('') }}
              className={`rounded-xl border p-4 text-left hover:shadow-md transition-all group ${statute.borderColor} ${statute.bgColor} hover:scale-[1.01]`}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-2xl">{statute.icon}</span>
                <span className={`rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${statute.color}`}>
                  {statute.category}
                </span>
              </div>
              <h3 className={`mb-0.5 text-sm font-bold ${statute.color} leading-tight`}>
                {statute.shortName}
              </h3>
              <p className="mb-1 text-xs font-medium text-gray-700">{statute.name}</p>
              <p className="text-[10px] text-gray-400">{statute.year}</p>
              <p className="mt-2 text-xs text-gray-600 line-clamp-2">{statute.description}</p>
              <div className="mt-3 flex items-center gap-1 text-[10px] font-medium text-gray-400 group-hover:text-gray-600">
                <span>{statute.keySections.length} key sections</span>
                <span>·</span>
                <span>Ask AI →</span>
              </div>
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <BookMarked className="mb-3 h-10 w-10" />
            <p>No statutes found for "{searchQuery}"</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}
        >
          <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className={`flex items-start gap-4 border-b px-6 py-5 ${selected.bgColor} ${selected.borderColor}`}>
              <span className="mt-0.5 text-3xl">{selected.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`rounded-full bg-white/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${selected.color}`}>
                    {selected.category}
                  </span>
                  <span className="text-xs text-gray-500">{selected.year}</span>
                </div>
                <h2 className={`mt-1 text-lg font-bold ${selected.color}`}>{selected.shortName}</h2>
                <p className="text-sm text-gray-700">{selected.name}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-white/60 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Purpose */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Purpose & Scope</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{selected.purpose}</p>
              </div>

              {/* Key Sections */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Key Sections ({selected.keySections.length})
                </h3>
                <ul className="space-y-1.5">
                  {selected.keySections.map((sec, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${selected.bgColor} text-[9px] font-bold ${selected.color}`}>
                        {i + 1}
                      </span>
                      <span className="text-xs text-gray-700 font-mono">{sec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* AI Q&A */}
              <div className={`rounded-xl border p-4 ${selected.bgColor} ${selected.borderColor}`}>
                <div className="mb-3 flex items-center gap-2">
                  <Bot className={`h-4 w-4 ${selected.color}`} />
                  <span className={`text-sm font-semibold ${selected.color}`}>
                    Ask AI about {selected.shortName}
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiQuestion}
                    onChange={e => setAiQuestion(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAskQuestion()}
                    placeholder={`e.g. "What is the limitation period under this act?" or "Explain section 9"`}
                    className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs focus:border-lexai-400 focus:outline-none focus:ring-1 focus:ring-lexai-200"
                  />
                  <button
                    onClick={handleAskQuestion}
                    disabled={isStreaming || !aiQuestion.trim()}
                    className={`rounded-lg px-3 py-2 text-xs font-medium text-white disabled:opacity-60 transition-colors ${selected.color.replace('text-', 'bg-').replace('-700', '-600')} hover:opacity-90`}
                    style={{ backgroundColor: undefined }}
                  >
                    {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ask'}
                  </button>
                </div>

                {(aiAnswer || isStreaming) && (
                  <div className="mt-3 rounded-lg bg-white p-3">
                    <div className="prose prose-xs max-w-none text-gray-700 text-xs">
                      <ReactMarkdown>{aiAnswer}</ReactMarkdown>
                    </div>
                    {isStreaming && (
                      <span className="inline-block h-3.5 w-0.5 animate-pulse bg-lexai-600 mt-1" />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
              <span className="text-xs text-gray-400">
                Reference: {selected.name} {selected.year}
              </span>
              <div className="flex gap-2">
                <a
                  href={`/precedents?q=${encodeURIComponent(selected.shortName)}`}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${selected.bgColor} ${selected.color} hover:opacity-80 transition-opacity`}
                >
                  Search Cases →
                </a>
                <button
                  onClick={() => setSelected(null)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
