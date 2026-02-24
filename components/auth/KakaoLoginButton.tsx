// 카카오 로그인 버튼 (Client Component)
// 'use client'가 필요한 이유: 버튼 클릭 이벤트(onClick)와 useState 사용
// Android의 카카오 로그인 버튼과 동일한 역할
// - Android: UserApiClient.loginWithKakaoAccount(context) {}
// - Web: supabase.auth.signInWithOAuth({ provider: 'kakao' })
'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function KakaoLoginButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 카카오 로그인 페이지에서 뒤로가기로 복귀 시 버튼 비활성화 상태 해제
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') setIsLoading(false)
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const handleLogin = async () => {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    // redirectTo: 카카오 로그인 완료 후 우리 앱으로 돌아올 주소
    // Android의 카카오 SDK에서 키 해시 등록하는 것과 유사한 역할
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        // Supabase Kakao provider가 account_email, profile_image를 기본 scope로 항상 추가
        // 카카오 동의항목에서 닉네임/프로필 사진/이메일 모두 "선택 동의"로 설정 필요
        scopes: 'profile_nickname',
      },
    })

    if (error) {
      // signInWithOAuth 성공 시 브라우저가 카카오로 이동하므로 여기까지 오지 않음
      // 여기에 도달했다면 OAuth 시작 자체가 실패한 경우
      setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.')
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full flex flex-col items-center gap-3">
      {/* 카카오 공식 버튼 스타일: 노란 배경 (#FEE500), 검정 텍스트 */}
      <button
        onClick={handleLogin}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 rounded-xl px-6 py-4 font-semibold text-[#191919] transition-opacity disabled:opacity-60"
        style={{ backgroundColor: '#FEE500' }}
      >
        {/* 카카오 말풍선 아이콘 (SVG) */}
        <svg
          width="22"
          height="22"
          viewBox="0 0 22 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M11 1.5C5.753 1.5 1.5 4.91 1.5 9.1c0 2.664 1.73 5.007 4.344 6.376l-1.107 4.093a.375.375 0 0 0 .547.413L9.93 17.34A11.4 11.4 0 0 0 11 17.4c5.247 0 9.5-3.41 9.5-7.6S16.247 1.5 11 1.5Z"
            fill="#191919"
          />
        </svg>
        {isLoading ? '로그인 중...' : '카카오로 시작하기'}
      </button>

      {error && (
        <p className="text-sm text-red-400 text-center">{error}</p>
      )}
    </div>
  )
}
