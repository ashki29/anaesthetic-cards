export type Team = {
  id: string
  name: string
  invite_code: string
  created_at: string
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type User = {
  id: string
  email: string
  display_name: string
  team_id: string
  created_at: string
}

export type Consultant = {
  id: string
  team_id: string
  name: string
  specialty: string
  notes: string | null
  created_at: string
}

export interface DrugPreferences {
  induction?: string
  muscle_relaxant?: string
  maintenance?: string
  infusions?: string[]
  analgesics?: string
  antiemetics?: string
  other?: string
}

export interface EquipmentPreferences {
  airway?: string
  lines?: string
  monitoring?: string
  machine?: string
  ventilator?: string
  other?: string
}

export interface PositioningPreferences {
  position?: string
  warming?: string
  catheter?: string
  ngt?: string
  other?: string
}

export type PreferenceCard = {
  id: string
  consultant_id: string
  procedure_name: string
  procedure_category: string | null
  drugs: DrugPreferences
  equipment: EquipmentPreferences
  positioning: PositioningPreferences
  notes: string | null
  last_edited_by: string | null
  updated_at: string
  created_at: string
}

export type PreferenceCardWithConsultant = PreferenceCard & {
  consultant: Consultant
  editor?: User
}

export type ConsultantWithCards = Consultant & {
  preference_cards: PreferenceCard[]
}

export type Database = {
  public: {
    Tables: {
      teams: {
        Row: Team
        Insert: Omit<Team, 'id' | 'created_at'>
        Update: Partial<Omit<Team, 'id' | 'created_at'>>
        Relationships: []
      }
      users: {
        Row: User
        Insert: Omit<User, 'created_at'>
        Update: Partial<Omit<User, 'id' | 'created_at'>>
        Relationships: [
          {
            foreignKeyName: 'users_team_id_fkey'
            columns: ['team_id']
            referencedRelation: 'teams'
            referencedColumns: ['id']
          }
        ]
      }
      consultants: {
        Row: Consultant
        Insert: Omit<Consultant, 'id' | 'created_at'>
        Update: Partial<Omit<Consultant, 'id' | 'created_at'>>
        Relationships: [
          {
            foreignKeyName: 'consultants_team_id_fkey'
            columns: ['team_id']
            referencedRelation: 'teams'
            referencedColumns: ['id']
          }
        ]
      }
      preference_cards: {
        Row: PreferenceCard
        Insert: Omit<PreferenceCard, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<PreferenceCard, 'id' | 'created_at'>>
        Relationships: [
          {
            foreignKeyName: 'preference_cards_consultant_id_fkey'
            columns: ['consultant_id']
            referencedRelation: 'consultants'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'preference_cards_last_edited_by_fkey'
            columns: ['last_edited_by']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: { [K in never]: never }
    Functions: { [K in never]: never }
    Enums: { [K in never]: never }
    CompositeTypes: { [K in never]: never }
  }
}
