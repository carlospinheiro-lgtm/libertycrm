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
          remax_code: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          remax_code?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          remax_code?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
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
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      get_user_agency_ids: { Args: { _user_id: string }; Returns: string[] }
      has_agency_access: {
        Args: { _agency_id: string; _user_id: string }
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
      import_type: "users" | "teams"
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
      import_type: ["users", "teams"],
    },
  },
} as const
