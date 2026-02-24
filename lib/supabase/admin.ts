// Supabase Admin 클라이언트 (service_role 키 사용)
// RLS를 우회하여 DB에 직접 접근해야 하는 서버 전용 작업에서 사용
// 예: 결제 상태 업데이트, 무료 슬롯 카운트 증가
// ⚠️ 절대 클라이언트 코드에서 import하지 말 것 - 서버(API Route, Server Action)에서만 사용
// 참고: https://supabase.com/docs/guides/api/creating-a-client#the-service-role-key
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경 변수가 설정되지 않았습니다.'
    )
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      // Admin 클라이언트는 사용자 세션을 관리하지 않음
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
