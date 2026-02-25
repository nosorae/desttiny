// [탭2] 궁합 페이지 (Server Component)
// 서비스의 핵심 기능 - 두 사람의 운명적 궁합을 3체계로 분석
//
// Server Component: 서버에서 인증 확인 + 프로필 존재 여부 체크 후
// 실제 궁합 플로우는 Client Component(CompatibilityFlow)에 위임
// Android의 Fragment(서버가 초기 데이터 세팅) → ViewModel(클라이언트 상태 관리) 구조와 유사
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

import CompatibilityFlow from './CompatibilityFlow'

export default async function CompatibilityPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 프로필 미완성 시 온보딩으로 리다이렉트
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  return <CompatibilityFlow />
}
