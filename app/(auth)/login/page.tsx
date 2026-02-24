// 로그인 페이지 (Server Component)
// 비로그인 사용자가 서비스에 진입하는 유일한 인증 경로
//
// 인증 플로우: 카카오 로그인 버튼 클릭 → Supabase Auth가 카카오 OAuth 처리
//   → 성공 시 프로필 존재 여부 확인 → 없으면 /onboarding, 있으면 /(main)/profile로 리다이렉트
// Android의 LoginActivity와 동일한 역할 (카카오 SDK 대신 Supabase Auth 사용)
//
// 참고: Supabase 카카오 OAuth 설정 - https://supabase.com/docs/guides/auth/social-login/auth-kakao
// TODO: 카카오 로그인 버튼 구현 - 이슈 #7에서 작업 예정
export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <h1 className="text-2xl font-bold text-destiny-text mb-8">로그인</h1>
      {/* TODO: 카카오 로그인 버튼 */}
    </main>
  );
}
