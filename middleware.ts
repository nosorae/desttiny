// Next.js Middleware - 모든 요청에서 세션 갱신 + 보호된 라우트 가드
// lib/supabase/middleware.ts의 updateSession을 여기서 호출해야 실제로 동작함
// 참고: https://nextjs.org/docs/app/building-your-application/routing/middleware
import type { NextRequest } from 'next/server'

import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  // 정적 파일과 이미지 최적화 경로 제외 (미들웨어 불필요한 경로)
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
