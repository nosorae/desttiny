// Supabase Middleware 유틸리티
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

  // getUser()는 항상 서버에서 세션 검증 - 캐시되지 않음
  // 주의: getSession()은 캐시될 수 있어 보안상 취약할 수 있음
  await supabase.auth.getUser();

  return supabaseResponse;
}
