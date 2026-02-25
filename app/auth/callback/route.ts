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
import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

// 허용된 origin 목록 - 호스트 헤더 인젝션으로 인한 open redirect 방지
// NEXT_PUBLIC_SITE_URL: 프로덕션 도메인 (예: https://desttiny.vercel.app)
// VERCEL_URL: Vercel이 프리뷰 배포마다 자동 설정하는 도메인 (서버 전용 env var)
const ALLOWED_ORIGINS: string[] = []
if (process.env.NEXT_PUBLIC_SITE_URL) {
  ALLOWED_ORIGINS.push(process.env.NEXT_PUBLIC_SITE_URL)
}
if (process.env.VERCEL_URL) {
  ALLOWED_ORIGINS.push(`https://${process.env.VERCEL_URL}`)
}

function getSafeOrigin(requestUrl: string): string {
  const requestOrigin = new URL(requestUrl).origin

  // 프로덕션 또는 Vercel 프리뷰 도메인이면 해당 origin 사용
  if (ALLOWED_ORIGINS.includes(requestOrigin)) return requestOrigin

  // 로컬 개발 환경 (localhost)
  if (requestOrigin.startsWith('http://localhost')) return requestOrigin

  // Fallback: 프로덕션 도메인 또는 요청 origin
  return ALLOWED_ORIGINS[0] ?? requestOrigin
}

export async function GET(request: Request) {
  const safeOrigin = getSafeOrigin(request.url)
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  try {
    if (code) {
      const supabase = await createClient()

      // code를 실제 세션(JWT)으로 교환 - Android의 OAuthToken 수령과 유사
      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code)

      if (!exchangeError) {
        // 세션 교환 성공 - 프로필 존재 여부로 신규/기존 사용자 판단
        const {
          data: { user },
          error: getUserError,
        } = await supabase.auth.getUser()

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
