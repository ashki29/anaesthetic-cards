export interface Team {
  id: string
  name: string
  invite_code: string
  created_at: string
}

export interface User {
  id: string
  email: string
  display_name: string
  team_id: string
  created_at: string
}

export interface Consultant {
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

export interface PreferenceCard {
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

export interface PreferenceCardWithConsultant extends PreferenceCard {
  consultant: Consultant
  editor?: User
}

export interface ConsultantWithCards extends Consultant {
  preference_cards: PreferenceCard[]
}

export type Database = {
  public: {
    Tables: {
      teams: {
        Row: Team
        Insert: Omit<Team, 'id' | 'created_at'>
        Update: Partial<Omit<Team, 'id' | 'created_at'>>
      }
      users: {
        Row: User
        Insert: Omit<User, 'created_at'>
        Update: Partial<Omit<User, 'id' | 'created_at'>>
      }
      consultants: {
        Row: Consultant
        Insert: Omit<Consultant, 'id' | 'created_at'>
        Update: Partial<Omit<Consultant, 'id' | 'created_at'>>
      }
      preference_cards: {
        Row: PreferenceCard
        Insert: Omit<PreferenceCard, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<PreferenceCard, 'id' | 'created_at'>>
      }
    }
  }
}
