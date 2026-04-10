export type Plan = 'starter' | 'pro' | 'team' | 'free'

export interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  plan: Plan
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: string | null
  created_at: string
  updated_at: string
}

export interface Contract {
  id: string
  user_id: string
  filename: string
  content: string
  risk_score: number | null
  risk_summary: string | null
  key_clauses: string[] | null
  red_flags: string[] | null
  missing_protections: string[] | null
  recommendations: string[] | null
  plain_english_summary: string | null
  created_at: string
  updated_at: string
}

export interface Deadline {
  id: string
  user_id: string
  contract_id: string | null
  contract_name: string
  deadline_type: 'renewal' | 'termination_notice' | 'payment' | 'expiry' | 'other'
  description: string
  deadline_date: string
  notice_period_days: number | null
  reminder_30_sent: boolean
  reminder_7_sent: boolean
  reminder_1_sent: boolean
  created_at: string
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface Conversation {
  id: string
  user_id: string
  title: string
  messages_json: Message[]
  created_at: string
  updated_at: string
}

export interface DocumentGenerated {
  id: string
  user_id: string
  type: DocumentType
  title: string
  content: string
  created_at: string
}

export type DocumentType =
  | 'nda'
  | 'service_agreement'
  | 'employment_contract'
  | 'privacy_policy'
  | 'terms_of_service'
  | 'invoice'
  | 'cease_and_desist'
  | 'demand_letter'
  | 'other'

// ============================================================
// PRECEDENTS TYPES
// ============================================================

export type Precedent = {
  id: string
  case_name: string
  citation: string | null
  citation_type: string | null
  court: string
  court_code: string
  year: number | null
  date_decided: string | null
  appellant: string | null
  respondent: string | null
  judge_names: string[]
  bench_type: string | null
  law_category: string
  law_subcategory: string | null
  statutes: string[]
  keywords: string[]
  headnotes: string | null
  holding: string | null
  full_text: string | null
  outcome: string | null
  is_landmark: boolean
  landmark_reason: string | null
  source_url: string | null
  source: string | null
  view_count: number
  created_at: string
  updated_at: string
}

export type SavedPrecedent = {
  id: string
  user_id: string
  precedent_id: string
  notes: string | null
  folder: string
  created_at: string
  precedent?: Precedent
}

export type LegalArgument = {
  id: string
  user_id: string
  title: string
  query: string
  case_facts: string | null
  argument_text: string | null
  cited_precedent_ids: string[]
  law_category: string | null
  created_at: string
}

export const COURTS = [
  { code: 'SC', name: 'Supreme Court of Pakistan' },
  { code: 'LHC', name: 'Lahore High Court' },
  { code: 'SHC', name: 'Sindh High Court' },
  { code: 'PHC', name: 'Peshawar High Court' },
  { code: 'BHC', name: 'Balochistan High Court' },
  { code: 'IHC', name: 'Islamabad High Court' },
  { code: 'FSC', name: 'Federal Shariat Court' },
] as const

export const LAW_CATEGORIES = [
  'Criminal', 'Civil', 'Constitutional', 'Family', 'Commercial',
  'Labour', 'Tax', 'Property', 'Islamic/Shariat', 'Cyber Crime',
  'Anti-Terrorism', 'NAB/Accountability', 'Immigration',
  'Human Rights', 'Environmental', 'Banking',
  'Intellectual Property', 'Other',
] as const

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'created_at' | 'updated_at'>
        Update: Partial<Omit<User, 'id' | 'created_at'>>
      }
      contracts: {
        Row: Contract
        Insert: Omit<Contract, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Contract, 'id' | 'user_id' | 'created_at'>>
      }
      conversations: {
        Row: Conversation
        Insert: Omit<Conversation, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Conversation, 'id' | 'user_id' | 'created_at'>>
      }
      documents_generated: {
        Row: DocumentGenerated
        Insert: Omit<DocumentGenerated, 'id' | 'created_at'>
        Update: Partial<Omit<DocumentGenerated, 'id' | 'user_id' | 'created_at'>>
      }
      deadlines: {
        Row: Deadline
        Insert: Omit<Deadline, 'id' | 'created_at' | 'reminder_30_sent' | 'reminder_7_sent' | 'reminder_1_sent'>
        Update: Partial<Omit<Deadline, 'id' | 'user_id' | 'created_at'>>
      }
    }
  }
}
