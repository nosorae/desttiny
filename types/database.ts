// 이 파일은 자동 생성됩니다. 직접 수정하지 마세요.
// DB 스키마 변경 후 `npm run db:types`로 재생성하세요.
// 참고: https://supabase.com/docs/guides/api/rest/generating-types

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
    PostgrestVersion: '14.4'
  }
  public: {
    Tables: {
      compatibility_results: {
        Row: {
          ai_summary: string | null
          created_at: string
          id: string
          is_paid: boolean
          mbti_score: number | null
          partner_birth_date: string | null
          partner_birth_time: string | null
          partner_day_pillar: string | null
          partner_gender: string | null
          partner_id: string | null
          partner_mbti: string | null
          partner_name: string | null
          partner_zodiac_sign: string | null
          relationship_type: string
          requester_id: string
          saju_score: number | null
          total_score: number
          zodiac_score: number | null
        }
        Insert: {
          ai_summary?: string | null
          created_at?: string
          id?: string
          is_paid?: boolean
          mbti_score?: number | null
          partner_birth_date?: string | null
          partner_birth_time?: string | null
          partner_day_pillar?: string | null
          partner_gender?: string | null
          partner_id?: string | null
          partner_mbti?: string | null
          partner_name?: string | null
          partner_zodiac_sign?: string | null
          relationship_type: string
          requester_id: string
          saju_score?: number | null
          total_score: number
          zodiac_score?: number | null
        }
        Update: {
          ai_summary?: string | null
          created_at?: string
          id?: string
          is_paid?: boolean
          mbti_score?: number | null
          partner_birth_date?: string | null
          partner_birth_time?: string | null
          partner_day_pillar?: string | null
          partner_gender?: string | null
          partner_id?: string | null
          partner_mbti?: string | null
          partner_name?: string | null
          partner_zodiac_sign?: string | null
          relationship_type?: string
          requester_id?: string
          saju_score?: number | null
          total_score?: number
          zodiac_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'compatibility_results_partner_id_fkey'
            columns: ['partner_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'compatibility_results_requester_id_fkey'
            columns: ['requester_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      daily_free_slots: {
        Row: {
          created_at: string
          id: string
          max_count: number
          slot_date: string
          used_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          max_count?: number
          slot_date?: string
          used_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          max_count?: number
          slot_date?: string
          used_count?: number
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          compatibility_result_id: string | null
          created_at: string
          id: string
          portone_payment_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          compatibility_result_id?: string | null
          created_at?: string
          id?: string
          portone_payment_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          compatibility_result_id?: string | null
          created_at?: string
          id?: string
          portone_payment_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'payments_compatibility_result_id_fkey'
            columns: ['compatibility_result_id']
            isOneToOne: false
            referencedRelation: 'compatibility_results'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'payments_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          birth_date: string
          birth_time: string | null
          created_at: string
          day_pillar: string | null
          gender: string | null
          id: string
          mbti: string | null
          nickname: string | null
          updated_at: string
          zodiac_sign: string | null
        }
        Insert: {
          birth_date: string
          birth_time?: string | null
          created_at?: string
          day_pillar?: string | null
          gender?: string | null
          id: string
          mbti?: string | null
          nickname?: string | null
          updated_at?: string
          zodiac_sign?: string | null
        }
        Update: {
          birth_date?: string
          birth_time?: string | null
          created_at?: string
          day_pillar?: string | null
          gender?: string | null
          id?: string
          mbti?: string | null
          nickname?: string | null
          updated_at?: string
          zodiac_sign?: string | null
        }
        Relationships: []
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
