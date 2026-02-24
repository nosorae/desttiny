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

// 허용된 origin만 사용 - 호스트 헤더 인젝션으로 인한 open redirect 방지
const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL ?? null
  : null

function getSafeOrigin(requestUrl: string): string {
  if (ALLOWED_ORIGIN) return ALLOWED_ORIGIN
  // NEXT_PUBLIC_SITE_URL 미설정 시 request.url에서 추출 (개발 환경)
  return new URL(requestUrl).origin
}

export async function GET(request: Request) {
  const safeOrigin = getSafeOrigin(request.url)
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  try {
    if (code) {
      const supabase = await createClient()

      // code를 실제 세션(JWT)으로 교환 - Android의 OAuthToken 수령과 유사
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (!exchangeError) {
        // 세션 교환 성공 - 프로필 존재 여부로 신규/기존 사용자 판단
        const { data: { user }, error: getUserError } = await supabase.auth.getUser()

        if (getUserError || !user) {
          console.error('[auth/callback] getUser 실패:', getUserError)
          return NextResponse.redirect(`${safeOrigin}/login?error=auth_error`)
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()

        if (profile) {
          // 기존 사용자 → 메인 화면
          return NextResponse.redirect(`${safeOrigin}/profile`)
        } else {
          // 신규 사용자 → 온보딩 (이름/생년월일/MBTI 입력)
          return NextResponse.redirect(`${safeOrigin}/onboarding`)
        }
      }
    }
  } catch (error) {
    // 네트워크 오류 등 예기치 않은 예외 - 로그인 페이지로 복귀
    console.error('[auth/callback] 예기치 않은 오류:', error)
  }

  // 코드 없음 또는 교환 실패 → 로그인 페이지로 돌려보내기
  return NextResponse.redirect(`${safeOrigin}/login?error=auth_error`)
}
