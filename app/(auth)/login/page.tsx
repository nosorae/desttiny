// 로그인 페이지 (Server Component)
// 비로그인 사용자가 서비스에 진입하는 유일한 인증 경로
//
// 인증 플로우: 카카오 로그인 버튼 클릭 → Supabase Auth가 카카오 OAuth 처리
//   → 성공 시 프로필 존재 여부 확인 → 없으면 /onboarding, 있으면 /profile로 리다이렉트
// Android의 LoginActivity와 동일한 역할 (카카오 SDK 대신 Supabase Auth 사용)
//
// 참고: Supabase 카카오 OAuth 설정 - https://supabase.com/docs/guides/auth/social-login/auth-kakao
import { KakaoLoginButton } from '@/components/auth/KakaoLoginButton'

// Next.js 16에서 searchParams는 Promise - auth/callback에서 오류 발생 시 ?error= 파라미터로 전달됨
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      {/* 서비스 소개 영역 */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-destiny-primary mb-3">
          desttiny
        </h1>
        <p className="text-destiny-text-muted text-base leading-relaxed">
          사주, 별자리, MBTI로 알아보는
          <br />
          나의 운명적 궁합
        </p>
      </div>

      {/* 콜백에서 넘어온 오류 메시지 (예: 카카오 로그인 거부) */}
      {error && (
        <div className="w-full mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400 text-center">
            로그인에 실패했습니다. 다시 시도해주세요.
          </p>
        </div>
      )}

      {/* 카카오 로그인 버튼 (Client Component) */}
      <div className="w-full">
        <KakaoLoginButton />
      </div>
    </main>
  )
}
