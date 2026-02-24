// lib/supabase/middleware.ts
// Next.js Middleware 전용 Supabase 클라이언트
// 모든 요청마다 실행되어 세션 토큰 자동 갱신
//
// updateSession 함수는 두 가지 역할:
//   1. 만료된 세션 토큰을 갱신하고 쿠키에 저장
//   2. 보호된 라우트 접근 시 비로그인 사용자를 /login으로 리다이렉트
//
// getUser()를 사용하는 이유: getSession()은 쿠키의 JWT만 확인하지만,
// getUser()는 Supabase Auth 서버에 재검증 요청을 보내 더 안전함
// 참고: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// 비로그인 사용자가 접근할 수 없는 보호된 경로 목록
const PROTECTED_PATHS = [
  '/profile',
  '/compatibility',
  '/payment',
  '/onboarding',
  '/result',
]

// 로그인이 이미 된 사용자가 접근 시 /profile로 보낼 경로 목록
const AUTH_PATHS = ['/login']

export async function updateSession(request: NextRequest) {
  // supabaseResponse를 let으로 선언: setAll 콜백 내부에서 재할당 필요
  // IMPORTANT: 이 response 객체를 그대로 반환해야 세션 쿠키가 정상적으로 전달됨
  let supabaseResponse = NextResponse.next({
    request,
  })

  // IMPORTANT: 매 요청마다 새 클라이언트 생성 필수 (전역 변수 저장 금지)
  // Fluid compute 환경에서 전역 변수로 공유하면 세션 교차 오염 발생
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // 1단계: request 쿠키 업데이트 (이후 생성되는 NextResponse가 참조)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // 2단계: response 재생성 후 쿠키 설정
          // request 쿠키가 업데이트된 상태에서 새 response를 만들어야
          // 갱신된 세션 정보가 다음 요청에도 올바르게 전달됨
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: createServerClient와 getUser() 사이에 다른 코드를 넣지 말 것
  // 중간에 코드가 들어가면 세션 갱신 타이밍이 어긋나 사용자가 무작위로 로그아웃됨
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // 비로그인 사용자가 보호된 라우트 접근 시 /login으로 리다이렉트
  // pathname === path: 정확한 경로 일치 (예: /profile)
  // pathname.startsWith(path + '/'): 하위 경로 일치 (예: /profile/settings)
  // startsWith(path)만 사용 시 /result가 /results도 매칭하는 오탐 방지
  const isProtectedPath = PROTECTED_PATHS.some((path) =>
    pathname === path || pathname.startsWith(path + '/')
  )
  if (!user && isProtectedPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    const redirectResponse = NextResponse.redirect(url)
    // getUser() 호출 중 토큰 갱신이 발생했을 수 있으므로
    // supabaseResponse에 설정된 갱신 쿠키를 리다이렉트 응답에도 복사
    // 이를 생략하면 갱신된 토큰이 유실되어 다음 요청에서 불필요한 재갱신 발생
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value)
    })
    return redirectResponse
  }

  // 로그인된 사용자가 /login 접근 시 /profile로 리다이렉트
  // TODO(MVP 이후): ?next= 파라미터로 로그인 전 원래 가려던 페이지로 리다이렉트 지원
  // 예: /login?next=/compatibility → 로그인 후 /compatibility로 이동
  const isAuthPath = AUTH_PATHS.some((path) => pathname === path || pathname.startsWith(path + '/'))
  if (user && isAuthPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/profile'
    const redirectResponse = NextResponse.redirect(url)
    // 로그인된 사용자 리다이렉트 시에도 갱신된 세션 쿠키 전달
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value)
    })
    return redirectResponse
  }

  // IMPORTANT: 반드시 supabaseResponse를 그대로 반환
  // 새 NextResponse를 만들어 반환하면 쿠키가 전달되지 않아 세션 불일치 발생
  return supabaseResponse
}
