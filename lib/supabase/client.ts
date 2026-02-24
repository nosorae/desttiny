// Supabase 브라우저 클라이언트
// 'use client' 컴포넌트에서 사용 (클라이언트 사이드)
// Android의 Retrofit/OkHttp 클라이언트와 유사한 역할
// 참고: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
