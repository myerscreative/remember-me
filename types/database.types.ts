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
          custom_anniversary: string | null
          deep_lore: string | null
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
          // Archive functionality
          archived: boolean
          archived_at: string | null
          archived_reason: string | null
          // First impression capture
          first_impression: string | null
          memorable_moment: string | null
          // Relationship value tracking
          relationship_value: string | null
          what_i_offered: string | null
          what_they_offered: string | null
          // Story completeness
          story_completeness: number
          // Phase 1: New relationship tracking fields
          relationship_summary: string | null
          last_interaction_date: string | null
          last_contact_method: string | null
          interaction_count: number
          importance: 'high' | 'medium' | 'low' | string | null
          target_frequency_days: number | null
          archive_status: boolean
          has_context: boolean
          imported: boolean
          important_dates: Json | null
          // Career fields
          company: string | null
          job_title: string | null
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
          custom_anniversary?: string | null
          deep_lore?: string | null
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
          // Archive functionality
          archived?: boolean
          archived_at?: string | null
          archived_reason?: string | null
          // First impression capture
          first_impression?: string | null
          memorable_moment?: string | null
          // Relationship value tracking
          relationship_value?: string | null
          what_i_offered?: string | null
          what_they_offered?: string | null
          // Story completeness
          story_completeness?: number
          imported?: boolean
          important_dates?: Json | null
          // Career fields
          company?: string | null
          job_title?: string | null
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
          custom_anniversary?: string | null
          deep_lore?: string | null
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
          // Archive functionality
          archived?: boolean
          archived_at?: string | null
          archived_reason?: string | null
          // First impression capture
          first_impression?: string | null
          memorable_moment?: string | null
          // Relationship value tracking
          relationship_value?: string | null
          what_i_offered?: string | null
          what_they_offered?: string | null
          // Story completeness
          story_completeness?: number
          // Phase 1: New relationship tracking fields
          relationship_summary?: string | null
          last_interaction_date?: string | null
          interaction_count?: number
          contact_importance?: 'high' | 'medium' | 'low' | null
          archive_status?: boolean
          has_context?: boolean
          imported?: boolean
          important_dates?: Json | null
          // Career fields
          company?: string | null
          job_title?: string | null
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
          next_goal_note: string | null // Added
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
          next_goal_note?: string | null // Added
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
          next_goal_note?: string | null // Added
          location?: string | null
          duration_minutes?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      user_stats: {
        Row: {
          id: string
          user_id: string
          contacts_with_context: number
          total_contacts: number
          voice_memos_added: number
          last_activity_date: string | null
          streak_days: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          contacts_with_context?: number
          total_contacts?: number
          voice_memos_added?: number
          last_activity_date?: string | null
          streak_days?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          contacts_with_context?: number
          total_contacts?: number
          voice_memos_added?: number
          last_activity_date?: string | null
          streak_days?: number
          created_at?: string
          updated_at?: string
        }
      }
      contact_facts: {
        Row: {
          id: string
          contact_id: string
          category: 'career' | 'family' | 'interest' | 'goal' | 'general'
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contact_id: string
          category?: 'career' | 'family' | 'interest' | 'goal' | 'general'
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contact_id?: string
          category?: 'career' | 'family' | 'interest' | 'goal' | 'general'
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      inter_contact_relationships: {
        Row: {
          id: string
          user_id: string
          contact_id_a: string
          contact_id_b: string
          relationship_type: 'parent' | 'child' | 'spouse' | 'partner' | 'sibling' | 'friend' | 'colleague' | 'other'
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          contact_id_a: string
          contact_id_b: string
          relationship_type: 'parent' | 'child' | 'spouse' | 'partner' | 'sibling' | 'friend' | 'colleague' | 'other'
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          contact_id_a?: string
          contact_id_b?: string
          relationship_type?: 'parent' | 'child' | 'spouse' | 'partner' | 'sibling' | 'friend' | 'colleague' | 'other'
          notes?: string | null
          created_at?: string
        }
      }
      interests: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      person_interests: {
        Row: {
          person_id: string
          interest_id: string
          created_at: string
        }
        Insert: {
          person_id: string
          interest_id: string
          created_at?: string
        }
        Update: {
          person_id?: string
          interest_id?: string
          created_at?: string
        }
      }
      shared_memories: {
        Row: {
          id: string
          user_id: string
          person_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          person_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          person_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      person_health_status: {
        Row: {
          id: string
          name: string
          target_frequency_days: number | null
          last_contact: string | null
          current_health: 'nurtured' | 'drifting' | 'neglected'
        }
      }
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
          // Archive functionality
          archived: boolean
          archived_at: string | null
          archived_reason: string | null
          // First impression capture
          first_impression: string | null
          memorable_moment: string | null
          // Relationship value tracking
          relationship_value: string | null
          what_i_offered: string | null
          what_they_offered: string | null
          // Story completeness
          story_completeness: number
          // Phase 1: New relationship tracking fields
          relationship_summary: string | null
          last_interaction_date: string | null
          interaction_count: number
          contact_importance: 'high' | 'medium' | 'low' | null
          archive_status: boolean
          has_context: boolean
          imported: boolean
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
export type BasePerson = Database['public']['Tables']['persons']['Row']
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

export type UserStats = Database['public']['Tables']['user_stats']['Row']
export type UserStatsInsert = Database['public']['Tables']['user_stats']['Insert']
export type UserStatsUpdate = Database['public']['Tables']['user_stats']['Update']

// Inter-contact relationship types (new family/connections feature)
export type ContactImportance = 'high' | 'medium' | 'low';
export type RelationshipRole = 'parent' | 'child' | 'spouse' | 'partner' | 'sibling' | 'friend' | 'colleague' | 'other';

export interface InterContactRelationship {
  id: string;
  user_id: string;
  contact_id_a: string;
  contact_id_b: string;
  relationship_type: RelationshipRole;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InterContactRelationshipInsert {
  id?: string;
  user_id: string;
  contact_id_a: string;
  contact_id_b: string;
  relationship_type: RelationshipRole;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface InterContactRelationshipUpdate {
  id?: string;
  user_id?: string;
  contact_id_a?: string;
  contact_id_b?: string;
  relationship_type?: RelationshipRole;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Linked contact with health data (for Family tab display)
export interface LinkedContact {
  id: string;
  name: string;
  first_name: string;
  last_name: string | null;
  photo_url: string | null;
  relationship_id: string;
  relationship_type: RelationshipRole;
  is_inverse: boolean; // true if current contact is contact_id_b
  last_interaction_date: string | null;
  target_frequency_days: number | null;
}
