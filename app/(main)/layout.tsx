// (main) 그룹 레이아웃 - 인증이 필요한 메인 페이지 공통 레이아웃
// Android의 MainActivity + BottomNavigationView 구조와 동일한 역할
//
// 탭 구조 (하단 탭바 3개):
//   [탭1] /profile - 내 프로필 (사주/별자리/MBTI 요약)
//   [탭2] /compatibility - 궁합 분석 (핵심 기능)
//   [탭3] /payment - 결제 이력
//
// Next.js Route Group: (main) 폴더명의 괄호는 URL에 포함되지 않음
//   예: app/(main)/profile/page.tsx → URL은 /profile (main이 빠짐)
//   Android의 Navigation Graph에서 중첩 그래프로 묶는 것과 유사
//
// pb-16: 하단 탭바 높이(64px=4rem)만큼 콘텐츠 하단 패딩 확보
// TODO(#9): 인증 미들웨어 연동 후 비로그인 시 /login으로 리다이렉트
export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 pb-16">{children}</main>
      {/* TODO: BottomTabBar 컴포넌트 */}
    </div>
  )
}
