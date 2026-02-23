// Next.js Proxy (Next.js 16에서 middleware → proxy로 명칭 변경)
// 모든 요청에서 Supabase 세션을 갱신하는 역할
// 인증이 필요한 경로에 대한 리다이렉트 처리
// 참고: https://supabase.com/docs/guides/auth/server-side/nextjs
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // 정적 파일과 이미지를 제외한 모든 경로에서 미들웨어 실행
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
