export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      campaigns: {
        Row: {
          id: string
          name: string
          description: string | null
          join_code: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          join_code?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          join_code?: string
          created_at?: string
        }
      }
      campaign_members: {
        Row: {
          user_id: string
          campaign_id: string
          role: string
          joined_at: string
        }
        Insert: {
          user_id: string
          campaign_id: string
          role?: string
          joined_at?: string
        }
        Update: {
          user_id?: string
          campaign_id?: string
          role?: string
          joined_at?: string
        }
      }
      polls: {
        Row: {
          id: string
          campaign_id: string
          title: string
          description: string | null
          questions: Json
          sent_count: number | null
          sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          title: string
          description?: string | null
          questions: Json
          sent_count?: number | null
          sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          title?: string
          description?: string | null
          questions?: Json
          sent_count?: number | null
          sent_at?: string | null
          created_at?: string
        }
      }
      contacts: {
        Row: {
          id: string
          campaign_id: string
          phone: string
          name: string | null
          zip: string | null
          district: string | null
          city: string | null
          tags: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          phone: string
          name?: string | null
          zip?: string | null
          district?: string | null
          city?: string | null
          tags?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          phone?: string
          name?: string | null
          zip?: string | null
          district?: string | null
          city?: string | null
          tags?: string[] | null
          created_at?: string
        }
      }
      responses: {
        Row: {
          id: string
          poll_id: string
          contact_id: string
          question_id: string
          answer: string
          raw_body: string | null
          received_at: string
        }
        Insert: {
          id?: string
          poll_id: string
          contact_id: string
          question_id: string
          answer: string
          raw_body?: string | null
          received_at?: string
        }
        Update: {
          id?: string
          poll_id?: string
          contact_id?: string
          question_id?: string
          answer?: string
          raw_body?: string | null
          received_at?: string
        }
      }
      ai_analysis: {
        Row: {
          id: string
          poll_id: string
          correlations: Json | null
          insights: Json | null
          generated_at: string
        }
        Insert: {
          id?: string
          poll_id: string
          correlations?: Json | null
          insights?: Json | null
          generated_at?: string
        }
        Update: {
          id?: string
          poll_id?: string
          correlations?: Json | null
          insights?: Json | null
          generated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// Convenience types
export type Campaign = Database['public']['Tables']['campaigns']['Row']
export type CampaignMember = Database['public']['Tables']['campaign_members']['Row']
export type Poll = Database['public']['Tables']['polls']['Row']
export type Contact = Database['public']['Tables']['contacts']['Row']
export type Response = Database['public']['Tables']['responses']['Row']
export type AiAnalysis = Database['public']['Tables']['ai_analysis']['Row']

export interface PollQuestion {
  id: string
  text: string
  options: string[]
}
