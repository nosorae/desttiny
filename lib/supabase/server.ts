// Supabase 서버 클라이언트
// Server Component, API Route, Server Action에서 사용 (서버 사이드)
// 쿠키를 통해 세션 관리 - 클라이언트와 달리 직접 DB 접근 가능
// 참고: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component에서 호출 시 쿠키 설정 불가 - 무시해도 무방
            // Middleware에서 세션이 갱신되므로 이 에러는 안전하게 무시 가능
          }
        },
      },
    }
  );
}
