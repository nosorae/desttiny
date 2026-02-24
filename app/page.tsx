// 랜딩 페이지 (Server Component)
// 비로그인 사용자가 처음 접하는 서비스 소개 페이지 (마케팅 진입점)
//
// 목적: 서비스 가치 전달 → 카카오 로그인 유도 → 온보딩 → 궁합 분석
// Android의 SplashActivity + 앱 스토어 소개 화면을 합친 역할
//
// 로그인 상태별 분기:
//   비로그인 → 이 페이지에서 서비스 소개 + 로그인 CTA 표시
//   로그인됨 → /(main)/profile로 리다이렉트 (proxy.ts에서 처리)
// TODO(#34): 랜딩 페이지 UI 구현 (서비스 전체 완성 후 마지막 작업)
export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-destiny-primary mb-4">
          desttiny
        </h1>
        <p className="text-destiny-text-muted text-lg">
          사주, 별자리, MBTI로 알아보는 나의 운명적 궁합
        </p>
      </div>
    </main>
  )
}
