// proxy.ts
// Next.js 16 Proxy (Next.js 16에서 middleware.ts → proxy.ts로 변경)
// 모든 요청에서 Supabase 세션을 갱신하고 보호된 라우트를 제어하는 진입점
// Android의 OkHttp Interceptor와 유사한 역할:
//   - 요청 전처리 (세션 갱신)
//   - 인증 체크 후 리다이렉트
//
// 참고: https://supabase.com/docs/guides/auth/server-side/nextjs
import { type NextRequest } from 'next/server'

import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * 아래로 시작하는 경로를 제외한 모든 요청에 미들웨어 적용:
     * - _next/static (Next.js 정적 파일)
     * - _next/image (Next.js 이미지 최적화)
     * - favicon.ico (파비콘)
     * - svg, png, jpg, jpeg, gif, webp (이미지 파일)
     *
     * 이미지/정적 파일에 미들웨어를 적용하지 않는 이유:
     * Supabase getUser() 호출은 네트워크 요청이므로 정적 파일까지 실행 시 성능 저하
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
