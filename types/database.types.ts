// Auto-generated types for Supabase database schema
// These match the tables created in supabase-schema.sql

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      persons: {
        Row: {
          id: string
          user_id: string
          name: string
          first_name: string
          last_name: string | null
          photo_url: string | null
          phone: string | null
          email: string | null
          linkedin: string | null
          birthday: string | null
          family_members: Json | null
          where_met: string | null
          who_introduced: string | null
          when_met: string | null
          why_stay_in_contact: string | null
          what_found_interesting: string | null
          most_important_to_them: string | null
          interests: string[] | null
          family_notes: string | null
          notes: string | null
          last_contact: string | null
          follow_up_reminder: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          first_name: string
          last_name?: string | null
          photo_url?: string | null
          phone?: string | null
          email?: string | null
          linkedin?: string | null
          birthday?: string | null
          family_members?: Json | null
          where_met?: string | null
          who_introduced?: string | null
          when_met?: string | null
          why_stay_in_contact?: string | null
          what_found_interesting?: string | null
          most_important_to_them?: string | null
          interests?: string[] | null
          family_notes?: string | null
          notes?: string | null
          last_contact?: string | null
          follow_up_reminder?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          first_name?: string
          last_name?: string | null
          photo_url?: string | null
          phone?: string | null
          email?: string | null
          linkedin?: string | null
          birthday?: string | null
          family_members?: Json | null
          where_met?: string | null
          who_introduced?: string | null
          when_met?: string | null
          why_stay_in_contact?: string | null
          what_found_interesting?: string | null
          most_important_to_them?: string | null
          interests?: string[] | null
          family_notes?: string | null
          notes?: string | null
          last_contact?: string | null
          follow_up_reminder?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          created_at?: string
        }
      }
      person_tags: {
        Row: {
          person_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          person_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          person_id?: string
          tag_id?: string
          created_at?: string
        }
      }
      relationships: {
        Row: {
          id: string
          from_person_id: string
          to_person_id: string
          relationship_type: string
          context: string | null
          direction: 'bidirectional' | 'from_to' | 'to_from'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          from_person_id: string
          to_person_id: string
          relationship_type: string
          context?: string | null
          direction?: 'bidirectional' | 'from_to' | 'to_from'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          from_person_id?: string
          to_person_id?: string
          relationship_type?: string
          context?: string | null
          direction?: 'bidirectional' | 'from_to' | 'to_from'
          created_at?: string
          updated_at?: string
        }
      }
      attachments: {
        Row: {
          id: string
          person_id: string
          user_id: string
          file_name: string
          file_url: string
          file_type: string
          file_size: number | null
          attachment_type: 'voice_note' | 'document' | 'image' | 'other'
          title: string | null
          description: string | null
          transcription: string | null
          created_at: string
        }
        Insert: {
          id?: string
          person_id: string
          user_id: string
          file_name: string
          file_url: string
          file_type: string
          file_size?: number | null
          attachment_type: 'voice_note' | 'document' | 'image' | 'other'
          title?: string | null
          description?: string | null
          transcription?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          person_id?: string
          user_id?: string
          file_name?: string
          file_url?: string
          file_type?: string
          file_size?: number | null
          attachment_type?: 'voice_note' | 'document' | 'image' | 'other'
          title?: string | null
          description?: string | null
          transcription?: string | null
          created_at?: string
        }
      }
      interactions: {
        Row: {
          id: string
          person_id: string
          user_id: string
          interaction_type: 'meeting' | 'call' | 'email' | 'message' | 'other'
          interaction_date: string
          title: string | null
          notes: string | null
          location: string | null
          duration_minutes: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          person_id: string
          user_id: string
          interaction_type: 'meeting' | 'call' | 'email' | 'message' | 'other'
          interaction_date?: string
          title?: string | null
          notes?: string | null
          location?: string | null
          duration_minutes?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          person_id?: string
          user_id?: string
          interaction_type?: 'meeting' | 'call' | 'email' | 'message' | 'other'
          interaction_date?: string
          title?: string | null
          notes?: string | null
          location?: string | null
          duration_minutes?: number | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      persons_with_tags: {
        Row: {
          id: string
          user_id: string
          name: string
          first_name: string
          last_name: string | null
          photo_url: string | null
          phone: string | null
          email: string | null
          linkedin: string | null
          birthday: string | null
          family_members: Json | null
          where_met: string | null
          who_introduced: string | null
          when_met: string | null
          why_stay_in_contact: string | null
          what_found_interesting: string | null
          most_important_to_them: string | null
          interests: string[] | null
          family_notes: string | null
          notes: string | null
          last_contact: string | null
          follow_up_reminder: string | null
          created_at: string
          updated_at: string
          tag_names: string[] | null
          tag_colors: string[] | null
        }
      }
      person_interaction_counts: {
        Row: {
          person_id: string
          total_interactions: number
          last_interaction_date: string
          meeting_count: number
          call_count: number
          email_count: number
        }
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// Helper types for easier usage
export type Person = Database['public']['Tables']['persons']['Row']
export type PersonInsert = Database['public']['Tables']['persons']['Insert']
export type PersonUpdate = Database['public']['Tables']['persons']['Update']

export type Tag = Database['public']['Tables']['tags']['Row']
export type TagInsert = Database['public']['Tables']['tags']['Insert']
export type TagUpdate = Database['public']['Tables']['tags']['Update']

export type PersonTag = Database['public']['Tables']['person_tags']['Row']
export type PersonTagInsert = Database['public']['Tables']['person_tags']['Insert']

export type Relationship = Database['public']['Tables']['relationships']['Row']
export type RelationshipInsert = Database['public']['Tables']['relationships']['Insert']
export type RelationshipUpdate = Database['public']['Tables']['relationships']['Update']

export type Attachment = Database['public']['Tables']['attachments']['Row']
export type AttachmentInsert = Database['public']['Tables']['attachments']['Insert']
export type AttachmentUpdate = Database['public']['Tables']['attachments']['Update']

export type Interaction = Database['public']['Tables']['interactions']['Row']
export type InteractionInsert = Database['public']['Tables']['interactions']['Insert']
export type InteractionUpdate = Database['public']['Tables']['interactions']['Update']

export type PersonWithTags = Database['public']['Views']['persons_with_tags']['Row']
export type PersonInteractionCount = Database['public']['Views']['person_interaction_counts']['Row']

