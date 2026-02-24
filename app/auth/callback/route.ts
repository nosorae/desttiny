// 카카오 OAuth 콜백 처리 Route Handler
// 카카오 로그인 완료 후 Supabase가 이 URL로 리다이렉트
// Android의 onActivityResult()와 동일한 역할 - 카카오 로그인 결과를 받아 처리
//
// 플로우:
//   1. Supabase가 ?code= 파라미터와 함께 이 URL로 리다이렉트
//   2. code를 세션으로 교환 (exchangeCodeForSession)
//   3. profiles 테이블에 사용자 정보 있는지 확인
//      - 있으면 → /profile (메인 탭)
//      - 없으면 → /onboarding (최초 정보 입력)
//   4. 오류 → /login?error=auth_error
//
// 참고: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()

    // code를 실제 세션(JWT)으로 교환 - Android의 OAuthToken 수령과 유사
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      // 세션 교환 성공 - 프로필 존재 여부로 신규/기존 사용자 판단
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()

        if (profile) {
          // 기존 사용자 → 메인 화면
          return NextResponse.redirect(`${origin}/profile`)
        } else {
          // 신규 사용자 → 온보딩 (이름/생년월일/MBTI 입력)
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }
    }
  }

  // 코드 없음 또는 교환 실패 → 로그인 페이지로 돌려보내기
  return NextResponse.redirect(`${origin}/login?error=auth_error`)
}
