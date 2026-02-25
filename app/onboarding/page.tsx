// 온보딩 페이지 (Server Component)
// 최초 로그인 후 반드시 거쳐야 하는 사용자 정보 수집 페이지
//
// 플로우: 로그인(/login) -> 온보딩(여기) -> 메인 탭(/(main)/profile)
//   - 미로그인 사용자: /login으로 리다이렉트
//   - 이미 프로필이 있는 사용자: /profile로 리다이렉트 (재온보딩 방지)
//
// Android의 온보딩 Activity 시퀀스와 유사 (ViewPager + 단계별 Fragment)
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

import OnboardingForm from './OnboardingForm'

export default async function OnboardingPage() {
  const supabase = await createClient()

  // 인증 확인 - 미로그인 시 로그인 페이지로
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 이미 프로필이 있으면 메인으로 보냄 (중복 온보딩 방지)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (profile) redirect('/profile')

  return <OnboardingForm />
}
