// 온보딩 페이지 (Server Component)
// 최초 로그인 후 반드시 거쳐야 하는 사용자 정보 수집 페이지
//
// 플로우: 로그인(/login) → 온보딩(여기) → 메인 탭(/(main)/profile)
//   - 프로필이 이미 있는 사용자는 이 페이지를 건너뜀 (proxy.ts에서 리다이렉트)
//
// 수집 정보 (궁합 분석에 필요한 기본 데이터):
//   1단계: 이름, 성별, 생년월일/시간 → 사주(일주) 및 별자리 자동 계산
//   2단계: MBTI 선택 (선택사항)
//   → 완료 시 Supabase profiles 테이블에 저장
//
// Android의 온보딩 Activity 시퀀스와 유사 (ViewPager + 단계별 Fragment)
// TODO(#10): 온보딩 스텝 UI 구현 (이름/성별/생년월일시)
// TODO(#11): MBTI 선택 & 온보딩 완료 처리
export default function OnboardingPage() {
  return (
    <main className="flex min-h-screen flex-col px-6 py-8">
      <h1 className="text-xl font-bold text-destiny-text">기본 정보 입력</h1>
    </main>
  )
}
