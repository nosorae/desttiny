// Supabase Proxy 유틸리티 (Next.js 16: middleware → proxy 명칭 변경)
// 모든 요청마다 세션 토큰을 갱신하는 역할
// Android의 OkHttp Interceptor와 유사 - 모든 요청을 가로채어 세션을 갱신
// 이 코드가 없으면 세션이 만료되어도 자동 갱신이 안 됨
// 참고: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getClaims()는 JWKS 캐시를 활용해 JWT를 검증 - 매 요청마다 네트워크 호출 없음
  // getUser()는 매 요청마다 Supabase Auth 서버에 네트워크 요청을 보냄 (느림)
  // 세션 갱신 트리거(TOKEN_REFRESHED)는 두 메서드 모두 동작하므로 getClaims() 권장
  // 참고: @supabase/auth-js GoTrueClient.getClaims() 주석
  await supabase.auth.getClaims();

  return supabaseResponse;
}
