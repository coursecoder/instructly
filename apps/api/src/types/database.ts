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
      users: {
        Row: {
          id: string
          email: string
          name: string
          organization: string | null
          role: 'designer' | 'manager' | 'admin'
          preferences: Json
          created_at: string
          last_login_at: string | null
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          organization?: string | null
          role: 'designer' | 'manager' | 'admin'
          preferences?: Json
          created_at?: string
          last_login_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          organization?: string | null
          role?: 'designer' | 'manager' | 'admin'
          preferences?: Json
          created_at?: string
          last_login_at?: string | null
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          title: string
          description: string | null
          target_audience: string | null
          estimated_duration: number
          status: 'draft' | 'in_progress' | 'review' | 'completed' | 'archived'
          owner_id: string
          collaborators: string[]
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          target_audience?: string | null
          estimated_duration: number
          status: 'draft' | 'in_progress' | 'review' | 'completed' | 'archived'
          owner_id: string
          collaborators?: string[]
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          target_audience?: string | null
          estimated_duration?: number
          status?: 'draft' | 'in_progress' | 'review' | 'completed' | 'archived'
          owner_id?: string
          collaborators?: string[]
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      lessons: {
        Row: {
          id: string
          title: string
          description: string | null
          project_id: string
          status: 'draft' | 'generating' | 'generated' | 'reviewed' | 'approved'
          estimated_duration: number
          delivery_format: 'instructor_led' | 'self_paced' | 'hybrid' | 'virtual_classroom'
          topics: Json
          accessibility_compliance: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          project_id: string
          status: 'draft' | 'generating' | 'generated' | 'reviewed' | 'approved'
          estimated_duration: number
          delivery_format: 'instructor_led' | 'self_paced' | 'hybrid' | 'virtual_classroom'
          topics?: Json
          accessibility_compliance?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          project_id?: string
          status?: 'draft' | 'generating' | 'generated' | 'reviewed' | 'approved'
          estimated_duration?: number
          delivery_format?: 'instructor_led' | 'self_paced' | 'hybrid' | 'virtual_classroom'
          topics?: Json
          accessibility_compliance?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      lesson_content: {
        Row: {
          id: string
          lesson_id: string
          learning_objectives: Json
          activities: Json
          assessments: Json
          instructor_notes: string | null
          participant_materials: string | null
          professional_documentation: Json | null
          generation_metadata: Json
          accessibility_features: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lesson_id: string
          learning_objectives?: Json
          activities?: Json
          assessments?: Json
          instructor_notes?: string | null
          participant_materials?: string | null
          professional_documentation?: Json | null
          generation_metadata?: Json
          accessibility_features?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lesson_id?: string
          learning_objectives?: Json
          activities?: Json
          assessments?: Json
          instructor_notes?: string | null
          participant_materials?: string | null
          professional_documentation?: Json | null
          generation_metadata?: Json
          accessibility_features?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      accessibility_reports: {
        Row: {
          id: string
          lesson_id: string
          compliance_level: 'A' | 'AA' | 'AAA'
          overall_score: number
          violations: Json
          recommendations: Json
          audit_trail: Json
          report_format: 'section_508' | 'wcag_2_1' | 'enterprise_summary'
          generated_at: string
        }
        Insert: {
          id?: string
          lesson_id: string
          compliance_level: 'A' | 'AA' | 'AAA'
          overall_score: number
          violations?: Json
          recommendations?: Json
          audit_trail?: Json
          report_format: 'section_508' | 'wcag_2_1' | 'enterprise_summary'
          generated_at?: string
        }
        Update: {
          id?: string
          lesson_id?: string
          compliance_level?: 'A' | 'AA' | 'AAA'
          overall_score?: number
          violations?: Json
          recommendations?: Json
          audit_trail?: Json
          report_format?: 'section_508' | 'wcag_2_1' | 'enterprise_summary'
          generated_at?: string
        }
      }
      ai_usage_logs: {
        Row: {
          id: string
          user_id: string
          lesson_id: string | null
          model_used: string
          operation_type: string
          input_tokens: number
          output_tokens: number
          cost_usd: number
          processing_time_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lesson_id?: string | null
          model_used: string
          operation_type: string
          input_tokens: number
          output_tokens: number
          cost_usd: number
          processing_time_ms?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lesson_id?: string | null
          model_used?: string
          operation_type?: string
          input_tokens?: number
          output_tokens?: number
          cost_usd?: number
          processing_time_ms?: number | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}