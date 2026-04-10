// Auto-generated from Supabase — do not edit the Database block manually.
// Re-generate: supabase gen types typescript --project-id hmcmjieixkofsutagnrp

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.4" }
  public: {
    Tables: {
      agent_faqs: {
        Row: {
          agent_id: string
          answer: string
          created_at: string
          id: string
          order_index: number
          question: string
          user_id: string
        }
        Insert: {
          agent_id: string
          answer: string
          created_at?: string
          id?: string
          order_index?: number
          question: string
          user_id: string
        }
        Update: {
          agent_id?: string
          answer?: string
          created_at?: string
          id?: string
          order_index?: number
          question?: string
          user_id?: string
        }
        Relationships: [
          { foreignKeyName: "agent_faqs_agent_id_fkey"; columns: ["agent_id"]; isOneToOne: false; referencedRelation: "agents"; referencedColumns: ["id"] },
          { foreignKeyName: "agent_faqs_user_id_fkey";  columns: ["user_id"];  isOneToOne: false; referencedRelation: "users";  referencedColumns: ["id"] },
        ]
      }
      agent_templates: {
        Row: {
          created_at: string
          faq_examples: Json | null
          id: string
          system_prompt: string
          template_name: string
          vertical: Database["public"]["Enums"]["business_type"]
        }
        Insert: {
          created_at?: string
          faq_examples?: Json | null
          id?: string
          system_prompt: string
          template_name: string
          vertical: Database["public"]["Enums"]["business_type"]
        }
        Update: {
          created_at?: string
          faq_examples?: Json | null
          id?: string
          system_prompt?: string
          template_name?: string
          vertical?: Database["public"]["Enums"]["business_type"]
        }
        Relationships: []
      }
      agents: {
        Row: {
          after_hours_message: string | null
          business_hours: Json | null
          calls_this_month: number
          created_at: string
          custom_instructions: string | null
          escalation_phone: string | null
          first_message: string | null
          id: string
          language: string
          menu_items: string | null
          mindbody_site_id: string | null
          name: string
          opentable_id: string | null
          pos_type: string | null
          retell_agent_id: string | null
          sms_followup_enabled: boolean
          status: Database["public"]["Enums"]["agent_status"]
          twilio_phone_number: string | null
          user_id: string
          vertical: Database["public"]["Enums"]["business_type"]
          voice_id: string
        }
        Insert: {
          after_hours_message?: string | null
          business_hours?: Json | null
          calls_this_month?: number
          created_at?: string
          custom_instructions?: string | null
          escalation_phone?: string | null
          first_message?: string | null
          id?: string
          language?: string
          menu_items?: string | null
          mindbody_site_id?: string | null
          name: string
          opentable_id?: string | null
          pos_type?: string | null
          retell_agent_id?: string | null
          sms_followup_enabled?: boolean
          status?: Database["public"]["Enums"]["agent_status"]
          twilio_phone_number?: string | null
          user_id: string
          vertical: Database["public"]["Enums"]["business_type"]
          voice_id?: string
        }
        Update: {
          after_hours_message?: string | null
          business_hours?: Json | null
          calls_this_month?: number
          created_at?: string
          custom_instructions?: string | null
          escalation_phone?: string | null
          first_message?: string | null
          id?: string
          language?: string
          menu_items?: string | null
          mindbody_site_id?: string | null
          name?: string
          opentable_id?: string | null
          pos_type?: string | null
          retell_agent_id?: string | null
          sms_followup_enabled?: boolean
          status?: Database["public"]["Enums"]["agent_status"]
          twilio_phone_number?: string | null
          user_id?: string
          vertical?: Database["public"]["Enums"]["business_type"]
          voice_id?: string
        }
        Relationships: [
          { foreignKeyName: "agents_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
        ]
      }
      calls: {
        Row: {
          action_taken: string | null
          agent_id: string
          call_id: string | null
          created_at: string
          duration_seconds: number | null
          from_number: string | null
          id: string
          recording_url: string | null
          sentiment: Database["public"]["Enums"]["sentiment_type"] | null
          summary: string | null
          to_number: string | null
          transcript: string | null
          user_id: string
        }
        Insert: {
          action_taken?: string | null
          agent_id: string
          call_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          from_number?: string | null
          id?: string
          recording_url?: string | null
          sentiment?: Database["public"]["Enums"]["sentiment_type"] | null
          summary?: string | null
          to_number?: string | null
          transcript?: string | null
          user_id: string
        }
        Update: {
          action_taken?: string | null
          agent_id?: string
          call_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          from_number?: string | null
          id?: string
          recording_url?: string | null
          sentiment?: Database["public"]["Enums"]["sentiment_type"] | null
          summary?: string | null
          to_number?: string | null
          transcript?: string | null
          user_id?: string
        }
        Relationships: [
          { foreignKeyName: "calls_agent_id_fkey"; columns: ["agent_id"]; isOneToOne: false; referencedRelation: "agents"; referencedColumns: ["id"] },
          { foreignKeyName: "calls_user_id_fkey";  columns: ["user_id"];  isOneToOne: false; referencedRelation: "users";  referencedColumns: ["id"] },
        ]
      }
      campaign_contacts: {
        Row: {
          called_at: string | null
          campaign_id: string
          created_at: string
          email: string | null
          id: string
          name: string | null
          phone: string
          status: string
          user_id: string
        }
        Insert: {
          called_at?: string | null
          campaign_id: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          phone: string
          status?: string
          user_id: string
        }
        Update: {
          called_at?: string | null
          campaign_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          phone?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          { foreignKeyName: "campaign_contacts_campaign_id_fkey"; columns: ["campaign_id"]; isOneToOne: false; referencedRelation: "campaigns"; referencedColumns: ["id"] },
          { foreignKeyName: "campaign_contacts_user_id_fkey";    columns: ["user_id"];     isOneToOne: false; referencedRelation: "users";     referencedColumns: ["id"] },
        ]
      }
      campaigns: {
        Row: {
          created_at: string
          id: string
          message_template: string
          name: string
          sent_count: number
          status: string
          total_contacts: number
          type: string
          user_id: string
          vertical: Database["public"]["Enums"]["business_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          message_template: string
          name: string
          sent_count?: number
          status?: string
          total_contacts?: number
          type?: string
          user_id: string
          vertical: Database["public"]["Enums"]["business_type"]
        }
        Update: {
          created_at?: string
          id?: string
          message_template?: string
          name?: string
          sent_count?: number
          status?: string
          total_contacts?: number
          type?: string
          user_id?: string
          vertical?: Database["public"]["Enums"]["business_type"]
        }
        Relationships: [
          { foreignKeyName: "campaigns_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          { foreignKeyName: "notifications_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
        ]
      }
      users: {
        Row: {
          business_name: string | null
          business_type: Database["public"]["Enums"]["business_type"] | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          plan: Database["public"]["Enums"]["plan_type"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
        }
        Insert: {
          business_name?: string | null
          business_type?: Database["public"]["Enums"]["business_type"] | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
        }
        Update: {
          business_name?: string | null
          business_type?: Database["public"]["Enums"]["business_type"] | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      increment_calls: { Args: { agent_id: string }; Returns: undefined }
    }
    Enums: {
      agent_status: "active" | "paused" | "setup"
      business_type: "restaurant" | "gym"
      notification_type: "missed_call" | "booking" | "lead" | "system"
      plan_type: "free" | "starter" | "pro" | "agency"
      sentiment_type: "positive" | "neutral" | "negative"
    }
    CompositeTypes: { [_ in never]: never }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  N extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]),
> = (DefaultSchema["Tables"] & DefaultSchema["Views"])[N] extends { Row: infer R } ? R : never

export type Enums<N extends keyof DefaultSchema["Enums"]> = DefaultSchema["Enums"][N]

// ── Convenience aliases ───────────────────────────────────────────────────────
export type Plan             = Database["public"]["Enums"]["plan_type"]
export type BusinessType     = Database["public"]["Enums"]["business_type"]
export type AgentStatus      = Database["public"]["Enums"]["agent_status"]
export type Sentiment        = Database["public"]["Enums"]["sentiment_type"]
export type NotificationType = Database["public"]["Enums"]["notification_type"]

export type User            = Database["public"]["Tables"]["users"]["Row"]
export type Agent           = Database["public"]["Tables"]["agents"]["Row"]
export type Call            = Database["public"]["Tables"]["calls"]["Row"]
export type AgentTemplate   = Database["public"]["Tables"]["agent_templates"]["Row"]
export type Notification    = Database["public"]["Tables"]["notifications"]["Row"]
export type Campaign        = Database["public"]["Tables"]["campaigns"]["Row"]
export type CampaignContact = Database["public"]["Tables"]["campaign_contacts"]["Row"]
export type AgentFaq        = Database["public"]["Tables"]["agent_faqs"]["Row"]

export interface BusinessHours {
  mon: DayHours; tue: DayHours; wed: DayHours; thu: DayHours
  fri: DayHours; sat: DayHours; sun: DayHours
}
export interface DayHours { open: boolean; from: string; to: string }
