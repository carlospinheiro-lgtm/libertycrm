export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agencies: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          remax_code: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          remax_code?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          remax_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agencies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_settings: {
        Row: {
          agency_id: string
          created_at: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          agency_id: string
          created_at?: string | null
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string | null
        }
        Update: {
          agency_id?: string
          created_at?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agency_settings_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_interactions: {
        Row: {
          agency_id: string
          created_at: string
          created_by: string | null
          id: string
          lead_id: string
          note: string | null
          type: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id: string
          note?: string | null
          type: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string
          note?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "buyer_interactions_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_interactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          agency_id: string
          completed_at: string | null
          created_at: string | null
          created_by_user_id: string | null
          diff_json: Json | null
          file_hash: string | null
          file_name: string
          id: string
          notes: string | null
          status: string
          summary_json: Json | null
          type: string
        }
        Insert: {
          agency_id: string
          completed_at?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          diff_json?: Json | null
          file_hash?: string | null
          file_name: string
          id?: string
          notes?: string | null
          status?: string
          summary_json?: Json | null
          type: string
        }
        Update: {
          agency_id?: string
          completed_at?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          diff_json?: Json | null
          file_hash?: string | null
          file_name?: string
          id?: string
          notes?: string | null
          status?: string
          summary_json?: Json | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_jobs_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_jobs_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      import_logs: {
        Row: {
          agency_id: string
          created_count: number | null
          deactivated_count: number | null
          file_name: string | null
          id: string
          import_type: Database["public"]["Enums"]["import_type"]
          imported_at: string | null
          imported_by: string | null
          notes: string | null
          updated_count: number | null
        }
        Insert: {
          agency_id: string
          created_count?: number | null
          deactivated_count?: number | null
          file_name?: string | null
          id?: string
          import_type: Database["public"]["Enums"]["import_type"]
          imported_at?: string | null
          imported_by?: string | null
          notes?: string | null
          updated_count?: number | null
        }
        Update: {
          agency_id?: string
          created_count?: number | null
          deactivated_count?: number | null
          file_name?: string | null
          id?: string
          import_type?: Database["public"]["Enums"]["import_type"]
          imported_at?: string | null
          imported_by?: string | null
          notes?: string | null
          updated_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "import_logs_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_logs_imported_by_fkey"
            columns: ["imported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          activity_type: string
          agency_id: string
          created_at: string
          description: string | null
          id: string
          lead_id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          activity_type: string
          agency_id: string
          created_at?: string
          description?: string | null
          id?: string
          lead_id: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          activity_type?: string
          agency_id?: string
          created_at?: string
          description?: string | null
          id?: string
          lead_id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_tasks: {
        Row: {
          agency_id: string
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          lead_id: string
          status: string
          title: string
        }
        Insert: {
          agency_id: string
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id: string
          status?: string
          title: string
        }
        Update: {
          agency_id?: string
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_tasks_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          agency_id: string
          budget_max: number | null
          budget_min: number | null
          buyer_financing: string | null
          buyer_motive: string | null
          buyer_timeline: string | null
          candidate_motivation: string | null
          candidate_notes: string | null
          candidate_profession: string | null
          candidate_zone: string | null
          client_name: string
          column_entered_at: string
          column_id: string
          commission_percentage: number | null
          contract_duration: string | null
          created_at: string
          cv_url: string | null
          email: string | null
          entry_date: string
          estimated_value: number | null
          experience_level: string | null
          id: string
          import_batch_id: string | null
          import_file_name: string | null
          import_source: string | null
          imported_at: string | null
          imported_by_user_id: string | null
          is_active: boolean | null
          language: string
          last_contact_at: string | null
          lead_type: string
          location: string | null
          next_action_at: string | null
          next_action_text: string | null
          next_activity_date: string | null
          next_activity_description: string | null
          nif: string | null
          notes: string | null
          phone: string | null
          priority: string
          property_type: string | null
          rgpd_consent: boolean
          rgpd_consent_date: string | null
          seller_deadline: string | null
          seller_exclusivity: string | null
          seller_motivation: string | null
          source: string | null
          source_category: string | null
          temperature: string
          typology: string | null
          updated_at: string
          user_id: string
          zones: string[] | null
        }
        Insert: {
          agency_id: string
          budget_max?: number | null
          budget_min?: number | null
          buyer_financing?: string | null
          buyer_motive?: string | null
          buyer_timeline?: string | null
          candidate_motivation?: string | null
          candidate_notes?: string | null
          candidate_profession?: string | null
          candidate_zone?: string | null
          client_name: string
          column_entered_at?: string
          column_id: string
          commission_percentage?: number | null
          contract_duration?: string | null
          created_at?: string
          cv_url?: string | null
          email?: string | null
          entry_date?: string
          estimated_value?: number | null
          experience_level?: string | null
          id?: string
          import_batch_id?: string | null
          import_file_name?: string | null
          import_source?: string | null
          imported_at?: string | null
          imported_by_user_id?: string | null
          is_active?: boolean | null
          language?: string
          last_contact_at?: string | null
          lead_type: string
          location?: string | null
          next_action_at?: string | null
          next_action_text?: string | null
          next_activity_date?: string | null
          next_activity_description?: string | null
          nif?: string | null
          notes?: string | null
          phone?: string | null
          priority?: string
          property_type?: string | null
          rgpd_consent?: boolean
          rgpd_consent_date?: string | null
          seller_deadline?: string | null
          seller_exclusivity?: string | null
          seller_motivation?: string | null
          source?: string | null
          source_category?: string | null
          temperature?: string
          typology?: string | null
          updated_at?: string
          user_id: string
          zones?: string[] | null
        }
        Update: {
          agency_id?: string
          budget_max?: number | null
          budget_min?: number | null
          buyer_financing?: string | null
          buyer_motive?: string | null
          buyer_timeline?: string | null
          candidate_motivation?: string | null
          candidate_notes?: string | null
          candidate_profession?: string | null
          candidate_zone?: string | null
          client_name?: string
          column_entered_at?: string
          column_id?: string
          commission_percentage?: number | null
          contract_duration?: string | null
          created_at?: string
          cv_url?: string | null
          email?: string | null
          entry_date?: string
          estimated_value?: number | null
          experience_level?: string | null
          id?: string
          import_batch_id?: string | null
          import_file_name?: string | null
          import_source?: string | null
          imported_at?: string | null
          imported_by_user_id?: string | null
          is_active?: boolean | null
          language?: string
          last_contact_at?: string | null
          lead_type?: string
          location?: string | null
          next_action_at?: string | null
          next_action_text?: string | null
          next_activity_date?: string | null
          next_activity_description?: string | null
          nif?: string | null
          notes?: string | null
          phone?: string | null
          priority?: string
          property_type?: string | null
          rgpd_consent?: boolean
          rgpd_consent_date?: string | null
          seller_deadline?: string | null
          seller_exclusivity?: string | null
          seller_motivation?: string | null
          source?: string | null
          source_category?: string | null
          temperature?: string
          typology?: string | null
          updated_at?: string
          user_id?: string
          zones?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      objectives: {
        Row: {
          activity_type: string | null
          agency_id: string
          created_at: string
          current_value: number
          end_date: string
          flow: string
          id: string
          is_active: boolean
          objective_category: string
          result_type: string | null
          source_filter: Json | null
          start_date: string
          target_id: string | null
          target_name: string | null
          target_type: string
          target_value: number
          unit: string
          unit_symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_type?: string | null
          agency_id: string
          created_at?: string
          current_value?: number
          end_date: string
          flow: string
          id?: string
          is_active?: boolean
          objective_category: string
          result_type?: string | null
          source_filter?: Json | null
          start_date: string
          target_id?: string | null
          target_name?: string | null
          target_type?: string
          target_value?: number
          unit?: string
          unit_symbol?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_type?: string | null
          agency_id?: string
          created_at?: string
          current_value?: number
          end_date?: string
          flow?: string
          id?: string
          is_active?: boolean
          objective_category?: string
          result_type?: string | null
          source_filter?: Json | null
          start_date?: string
          target_id?: string | null
          target_name?: string | null
          target_type?: string
          target_value?: number
          unit?: string
          unit_symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "objectives_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objectives_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          billing_email: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          max_agencies: number | null
          max_users: number | null
          name: string
          plan: string | null
          primary_color: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          billing_email?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          max_agencies?: number | null
          max_users?: number | null
          name: string
          plan?: string | null
          primary_color?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          billing_email?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          max_agencies?: number | null
          max_users?: number | null
          name?: string
          plan?: string | null
          primary_color?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          is_super_admin: boolean | null
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          is_active?: boolean | null
          is_super_admin?: boolean | null
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          is_super_admin?: boolean | null
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_activity_log: {
        Row: {
          action: string
          created_at: string
          id: string
          payload_json: Json | null
          project_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          payload_json?: Json | null
          project_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          payload_json?: Json | null
          project_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_activity_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_financial_items: {
        Row: {
          actual_value: number
          attachment_url: string | null
          category: string
          created_at: string
          created_by: string | null
          currency: string
          date_expected: string | null
          date_real: string | null
          description: string | null
          id: string
          notes: string | null
          planned_value: number
          project_id: string
          responsible_user_id: string | null
          status: Database["public"]["Enums"]["financial_item_status"]
          type: Database["public"]["Enums"]["financial_item_type"]
          updated_at: string
          vendor_or_client: string | null
        }
        Insert: {
          actual_value?: number
          attachment_url?: string | null
          category: string
          created_at?: string
          created_by?: string | null
          currency?: string
          date_expected?: string | null
          date_real?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          planned_value?: number
          project_id: string
          responsible_user_id?: string | null
          status?: Database["public"]["Enums"]["financial_item_status"]
          type: Database["public"]["Enums"]["financial_item_type"]
          updated_at?: string
          vendor_or_client?: string | null
        }
        Update: {
          actual_value?: number
          attachment_url?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          date_expected?: string | null
          date_real?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          planned_value?: number
          project_id?: string
          responsible_user_id?: string | null
          status?: Database["public"]["Enums"]["financial_item_status"]
          type?: Database["public"]["Enums"]["financial_item_type"]
          updated_at?: string
          vendor_or_client?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_financial_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_financial_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_financial_items_responsible_user_id_fkey"
            columns: ["responsible_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          project_id: string
          role: Database["public"]["Enums"]["project_member_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          project_id: string
          role?: Database["public"]["Enums"]["project_member_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          project_id?: string
          role?: Database["public"]["Enums"]["project_member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          assignee_user_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          order_index: number
          priority: Database["public"]["Enums"]["project_task_priority"]
          project_id: string
          status: Database["public"]["Enums"]["project_task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assignee_user_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          order_index?: number
          priority?: Database["public"]["Enums"]["project_task_priority"]
          project_id: string
          status?: Database["public"]["Enums"]["project_task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assignee_user_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          order_index?: number
          priority?: Database["public"]["Enums"]["project_task_priority"]
          project_id?: string
          status?: Database["public"]["Enums"]["project_task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_assignee_user_id_fkey"
            columns: ["assignee_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          agency_id: string
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          pm_user_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          pm_user_id: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          pm_user_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_pm_user_id_fkey"
            columns: ["pm_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string | null
          agency_id: string
          area_m2: number | null
          asking_price: number
          assigned_agent: string | null
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          commission_percentage: number | null
          contract_duration_months: number | null
          contract_end_date: string | null
          contract_start_date: string | null
          contract_type: string
          cover_photo_url: string | null
          created_at: string | null
          created_by: string | null
          current_stage: string
          energy_certificate: string | null
          floor: string | null
          garage: boolean | null
          id: string
          lead_id: string | null
          minimum_price: number | null
          parish: string | null
          property_type: string
          reference: string
          rooms: number | null
          stage_entered_at: string | null
          status: string | null
          updated_at: string | null
          video_url: string | null
          virtual_tour_url: string | null
        }
        Insert: {
          address?: string | null
          agency_id: string
          area_m2?: number | null
          asking_price?: number
          assigned_agent?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          commission_percentage?: number | null
          contract_duration_months?: number | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          contract_type?: string
          cover_photo_url?: string | null
          created_at?: string | null
          created_by?: string | null
          current_stage?: string
          energy_certificate?: string | null
          floor?: string | null
          garage?: boolean | null
          id?: string
          lead_id?: string | null
          minimum_price?: number | null
          parish?: string | null
          property_type?: string
          reference: string
          rooms?: number | null
          stage_entered_at?: string | null
          status?: string | null
          updated_at?: string | null
          video_url?: string | null
          virtual_tour_url?: string | null
        }
        Update: {
          address?: string | null
          agency_id?: string
          area_m2?: number | null
          asking_price?: number
          assigned_agent?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          commission_percentage?: number | null
          contract_duration_months?: number | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          contract_type?: string
          cover_photo_url?: string | null
          created_at?: string | null
          created_by?: string | null
          current_stage?: string
          energy_certificate?: string | null
          floor?: string | null
          garage?: boolean | null
          id?: string
          lead_id?: string | null
          minimum_price?: number | null
          parish?: string | null
          property_type?: string
          reference?: string
          rooms?: number | null
          stage_entered_at?: string | null
          status?: string | null
          updated_at?: string | null
          video_url?: string | null
          virtual_tour_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_assigned_agent_fkey"
            columns: ["assigned_agent"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      property_activities: {
        Row: {
          activity_type: string
          agency_id: string
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          property_id: string
          user_id: string
        }
        Insert: {
          activity_type: string
          agency_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          property_id: string
          user_id: string
        }
        Update: {
          activity_type?: string
          agency_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_activities_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_activities_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      property_checklist_items: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          is_optional: boolean | null
          item_key: string
          label: string
          order_index: number | null
          property_id: string
          stage: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          is_optional?: boolean | null
          item_key: string
          label: string
          order_index?: number | null
          property_id: string
          stage: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          is_optional?: boolean | null
          item_key?: string
          label?: string
          order_index?: number | null
          property_id?: string
          stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_checklist_items_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_checklist_items_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_documents: {
        Row: {
          created_at: string | null
          document_type: string
          expiry_date: string | null
          file_name: string | null
          file_url: string
          id: string
          property_id: string
          uploaded_by: string | null
          version: number | null
        }
        Insert: {
          created_at?: string | null
          document_type: string
          expiry_date?: string | null
          file_name?: string | null
          file_url: string
          id?: string
          property_id: string
          uploaded_by?: string | null
          version?: number | null
        }
        Update: {
          created_at?: string | null
          document_type?: string
          expiry_date?: string | null
          file_name?: string | null
          file_url?: string
          id?: string
          property_id?: string
          uploaded_by?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "property_documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      property_photos: {
        Row: {
          created_at: string | null
          id: string
          is_cover: boolean | null
          order_index: number | null
          property_id: string
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_cover?: boolean | null
          order_index?: number | null
          property_id: string
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_cover?: boolean | null
          order_index?: number | null
          property_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_photos_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_portals: {
        Row: {
          created_at: string | null
          id: string
          is_published: boolean | null
          last_updated: string | null
          portal_name: string
          portal_url: string | null
          property_id: string
          publish_date: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          last_updated?: string | null
          portal_name: string
          portal_url?: string | null
          property_id: string
          publish_date?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          last_updated?: string | null
          portal_name?: string
          portal_url?: string | null
          property_id?: string
          publish_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_portals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_visits: {
        Row: {
          agency_id: string
          agent_id: string | null
          buyer_contact: string | null
          buyer_name: string | null
          created_at: string | null
          feedback: string | null
          follow_up_created: boolean | null
          id: string
          outcome: string | null
          property_id: string
          visit_date: string
        }
        Insert: {
          agency_id: string
          agent_id?: string | null
          buyer_contact?: string | null
          buyer_name?: string | null
          created_at?: string | null
          feedback?: string | null
          follow_up_created?: boolean | null
          id?: string
          outcome?: string | null
          property_id: string
          visit_date: string
        }
        Update: {
          agency_id?: string
          agent_id?: string | null
          buyer_contact?: string | null
          buyer_name?: string | null
          created_at?: string | null
          feedback?: string | null
          follow_up_created?: boolean | null
          id?: string
          outcome?: string | null
          property_id?: string
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_visits_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_visits_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_visits_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          agency_id: string
          approval_status: string | null
          bank: string | null
          client_address: string | null
          client_email: string | null
          client_name: string | null
          client_nif: string | null
          client_phone: string | null
          co_titular_name: string | null
          co_titular_nif: string | null
          condition_notes: string | null
          conditions_checklist: Json | null
          created_at: string
          created_by: string | null
          deal_type: string
          deed_date: string | null
          down_payment: number | null
          down_payment_date: string | null
          id: string
          inspection_deadline: string | null
          inspection_required: boolean | null
          lead_id: string
          mortgage_amount: number | null
          payment_method: string | null
          pdf_url: string | null
          property_address: string | null
          property_area: number | null
          property_reference: string | null
          property_typology: string | null
          proposal_date: string
          proposal_number: string
          proposed_value: number
          rejection_reason: string | null
          special_conditions: string | null
          status: string
          updated_at: string
          validity_date: string | null
        }
        Insert: {
          agency_id: string
          approval_status?: string | null
          bank?: string | null
          client_address?: string | null
          client_email?: string | null
          client_name?: string | null
          client_nif?: string | null
          client_phone?: string | null
          co_titular_name?: string | null
          co_titular_nif?: string | null
          condition_notes?: string | null
          conditions_checklist?: Json | null
          created_at?: string
          created_by?: string | null
          deal_type?: string
          deed_date?: string | null
          down_payment?: number | null
          down_payment_date?: string | null
          id?: string
          inspection_deadline?: string | null
          inspection_required?: boolean | null
          lead_id: string
          mortgage_amount?: number | null
          payment_method?: string | null
          pdf_url?: string | null
          property_address?: string | null
          property_area?: number | null
          property_reference?: string | null
          property_typology?: string | null
          proposal_date?: string
          proposal_number: string
          proposed_value?: number
          rejection_reason?: string | null
          special_conditions?: string | null
          status?: string
          updated_at?: string
          validity_date?: string | null
        }
        Update: {
          agency_id?: string
          approval_status?: string | null
          bank?: string | null
          client_address?: string | null
          client_email?: string | null
          client_name?: string | null
          client_nif?: string | null
          client_phone?: string | null
          co_titular_name?: string | null
          co_titular_nif?: string | null
          condition_notes?: string | null
          conditions_checklist?: Json | null
          created_at?: string
          created_by?: string | null
          deal_type?: string
          deed_date?: string | null
          down_payment?: number | null
          down_payment_date?: string | null
          id?: string
          inspection_deadline?: string | null
          inspection_required?: boolean | null
          lead_id?: string
          mortgage_amount?: number | null
          payment_method?: string | null
          pdf_url?: string | null
          property_address?: string | null
          property_area?: number | null
          property_reference?: string | null
          property_typology?: string | null
          proposal_date?: string
          proposal_number?: string
          proposed_value?: number
          rejection_reason?: string | null
          special_conditions?: string | null
          status?: string
          updated_at?: string
          validity_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      recruitment_interactions: {
        Row: {
          agency_id: string
          created_at: string
          created_by: string | null
          id: string
          lead_id: string
          note: string | null
          type: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id: string
          note?: string | null
          type: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string
          note?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruitment_interactions_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruitment_interactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruitment_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_interactions: {
        Row: {
          agency_id: string
          created_at: string
          created_by: string | null
          id: string
          lead_id: string
          note: string | null
          type: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id: string
          note?: string | null
          type: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string
          note?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_interactions_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_interactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      team_memberships: {
        Row: {
          created_at: string | null
          id: string
          is_leader: boolean | null
          is_synced: boolean | null
          joined_at: string | null
          last_synced_at: string | null
          relation_type: string | null
          status: string | null
          team_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_leader?: boolean | null
          is_synced?: boolean | null
          joined_at?: string | null
          last_synced_at?: string | null
          relation_type?: string | null
          status?: string | null
          team_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_leader?: boolean | null
          is_synced?: boolean | null
          joined_at?: string | null
          last_synced_at?: string | null
          relation_type?: string | null
          status?: string | null
          team_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_memberships_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          agency_id: string
          created_at: string | null
          external_id: string | null
          id: string
          is_active: boolean | null
          is_synced: boolean | null
          last_synced_at: string | null
          leader_user_id: string | null
          name: string
          nickname: string | null
          team_type: string | null
          updated_at: string | null
        }
        Insert: {
          agency_id: string
          created_at?: string | null
          external_id?: string | null
          id?: string
          is_active?: boolean | null
          is_synced?: boolean | null
          last_synced_at?: string | null
          leader_user_id?: string | null
          name: string
          nickname?: string | null
          team_type?: string | null
          updated_at?: string | null
        }
        Update: {
          agency_id?: string
          created_at?: string | null
          external_id?: string | null
          id?: string
          is_active?: boolean | null
          is_synced?: boolean | null
          last_synced_at?: string | null
          leader_user_id?: string | null
          name?: string
          nickname?: string | null
          team_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_leader_user_id_fkey"
            columns: ["leader_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_agencies: {
        Row: {
          agency_id: string
          assigned_agent_id: string | null
          created_at: string | null
          external_id: string | null
          id: string
          is_active: boolean | null
          is_synced: boolean | null
          last_synced_at: string | null
          team_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agency_id: string
          assigned_agent_id?: string | null
          created_at?: string | null
          external_id?: string | null
          id?: string
          is_active?: boolean | null
          is_synced?: boolean | null
          last_synced_at?: string | null
          team_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agency_id?: string
          assigned_agent_id?: string | null
          created_at?: string | null
          external_id?: string | null
          id?: string
          is_active?: boolean | null
          is_synced?: boolean | null
          last_synced_at?: string | null
          team_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_agencies_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_agencies_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_agencies_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_agencies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          agency_id: string
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          agency_id: string
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          agency_id?: string
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_project_role: {
        Args: { _project_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["project_member_role"]
      }
      get_user_agency_ids: { Args: { _user_id: string }; Returns: string[] }
      has_agency_access: {
        Args: { _agency_id: string; _user_id: string }
        Returns: boolean
      }
      has_project_role: {
        Args: {
          _project_id: string
          _role: Database["public"]["Enums"]["project_member_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role_in_agency: {
        Args: {
          _agency_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_global_admin: { Args: { _user_id: string }; Returns: boolean }
      is_project_member: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      is_project_pm_or_finance: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "diretor_geral"
        | "diretor_comercial"
        | "diretor_agencia"
        | "team_leader"
        | "agente_imobiliario"
        | "diretor_rh"
        | "diretor_financeiro"
        | "gestor_backoffice"
        | "assistente_administrativo"
        | "consultor_externo"
      financial_item_status:
        | "planned"
        | "submitted"
        | "approved"
        | "paid"
        | "received"
        | "archived"
      financial_item_type: "cost" | "revenue"
      import_type: "users" | "teams"
      project_member_role: "pm" | "member" | "finance" | "viewer"
      project_status: "planning" | "active" | "at_risk" | "done" | "archived"
      project_task_priority: "low" | "medium" | "high"
      project_task_status: "backlog" | "todo" | "doing" | "blocked" | "done"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "diretor_geral",
        "diretor_comercial",
        "diretor_agencia",
        "team_leader",
        "agente_imobiliario",
        "diretor_rh",
        "diretor_financeiro",
        "gestor_backoffice",
        "assistente_administrativo",
        "consultor_externo",
      ],
      financial_item_status: [
        "planned",
        "submitted",
        "approved",
        "paid",
        "received",
        "archived",
      ],
      financial_item_type: ["cost", "revenue"],
      import_type: ["users", "teams"],
      project_member_role: ["pm", "member", "finance", "viewer"],
      project_status: ["planning", "active", "at_risk", "done", "archived"],
      project_task_priority: ["low", "medium", "high"],
      project_task_status: ["backlog", "todo", "doing", "blocked", "done"],
    },
  },
} as const
