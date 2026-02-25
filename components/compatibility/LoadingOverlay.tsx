// 궁합 분석 로딩 오버레이 (Client Component)
// 'use client' 필요: useEffect로 프로그레스 바 + 메시지 순환 애니메이션
// LLM 분석(10~20초) 동안 사용자가 이탈하지 않도록 신비로운 UX 제공
'use client'

import { useState, useEffect } from 'react'

import { ProgressBar } from '@/components/ui/ProgressBar'

const LOADING_MESSAGES = [
  '별들의 기운을 읽는 중...',
  '사주 팔자를 해석하는 중...',
  '두 사람의 궁합을 분석하는 중...',
  '별자리 궁합을 확인하는 중...',
  '성격 호환성을 계산하는 중...',
  '운명의 실타래를 풀어보는 중...',
  '거의 다 됐어요!',
]

interface LoadingOverlayProps {
  isVisible: boolean
}

// 내부 컴포넌트: isVisible이 true일 때만 마운트되므로
// 마운트 시 상태가 자연스럽게 0으로 초기화, 언마운트 시 인터벌 정리
function LoadingContent() {
  const [progress, setProgress] = useState(0)
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    // 프로그레스 바 애니메이션 (0→90% over ~15초, 마지막 10%는 완료 시)
    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return p
        return p + Math.random() * 8 + 2
      })
    }, 1000)

    // 메시지 순환 (2.5초마다)
    const messageInterval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % LOADING_MESSAGES.length)
    }, 2500)

    return () => {
      clearInterval(progressInterval)
      clearInterval(messageInterval)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-destiny-bg/95 animate-fade-in">
      <div className="w-full max-w-[390px] px-8 space-y-8 text-center">
        {/* 코스믹 로딩 아이콘 */}
        <div className="relative mx-auto h-24 w-24">
          <div className="absolute inset-0 rounded-full border-2 border-destiny-primary/30 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-destiny-primary/50 animate-pulse" />
          <div className="absolute inset-4 rounded-full bg-destiny-primary/20 flex items-center justify-center">
            <span className="text-3xl animate-bounce">✨</span>
          </div>
        </div>

        <ProgressBar
          variant="loading"
          progress={Math.min(progress, 100)}
          message={LOADING_MESSAGES[messageIndex]}
        />
      </div>
    </div>
  )
}

export default function LoadingOverlay({ isVisible }: LoadingOverlayProps) {
  // isVisible이 false→true가 될 때 LoadingContent가 마운트되며 상태 자동 리셋
  if (!isVisible) return null
  return <LoadingContent />
}
