// ===== Supabase DB 테이블 타입 정의 =====
// supabase/migrations/20260224000001_initial_schema.sql과 동기화 유지

export type Profile = {
  id: string // auth.users.id (UUID)
  nickname: string | null
  gender: 'male' | 'female' | null
  birth_date: string // ISO date (YYYY-MM-DD)
  birth_time: string | null // HH:MM:SS
  day_pillar: string | null // 사주 일주 (예: "갑자")
  zodiac_sign: string | null // 별자리 (예: "물병자리")
  mbti: string | null // MBTI (예: "INFP")
  created_at: string
  updated_at: string
}

export type RelationshipType = 'romantic' | 'friend' | 'business'

export type CompatibilityResult = {
  id: string
  requester_id: string
  partner_id: string | null // null이면 비회원 상대
  partner_name: string | null
  partner_birth_date: string | null
  partner_birth_time: string | null
  partner_gender: 'male' | 'female' | null
  partner_day_pillar: string | null
  partner_zodiac_sign: string | null
  partner_mbti: string | null
  relationship_type: RelationshipType
  total_score: number // 0-100
  saju_score: number | null
  zodiac_score: number | null
  mbti_score: number | null
  ai_summary: string | null // Claude 궁합 해석 텍스트
  is_paid: boolean
  created_at: string
}

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled'

export type Payment = {
  id: string
  user_id: string
  compatibility_result_id: string | null
  amount: number // 결제 금액 (원)
  portone_payment_id: string | null // PortOne 결제 고유 ID
  status: PaymentStatus
  created_at: string
  updated_at: string
}

export type DailyFreeSlot = {
  id: string
  slot_date: string // ISO date (YYYY-MM-DD)
  used_count: number
  max_count: number // 기본값 20
  created_at: string
}
