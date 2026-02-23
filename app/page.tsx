// 랜딩 페이지 (Server Component)
// 비로그인 사용자도 접근 가능한 서비스 소개 페이지
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
  );
}
