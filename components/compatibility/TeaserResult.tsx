// 궁합 점수 티저 결과 (Client Component)
// 'use client' 필요: 버튼 클릭 이벤트 핸들러
// 궁합 플로우 3단계 - 3체계 점수 미리보기 + 블러 처리된 상세 해설 (유료 잠금)
'use client'

import type { CompatibilityScoreResult } from '@/lib/compatibility/calculator'

interface TeaserResultProps {
  partnerName: string
  scores: CompatibilityScoreResult
  onViewFull: () => void
  isLoading?: boolean
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-destiny-accent'
  if (score >= 60) return 'text-destiny-primary-light'
  return 'text-destiny-text-muted'
}

function getScoreMessage(score: number): string {
  if (score >= 85) return '운명적인 궁합!'
  if (score >= 70) return '잘 맞는 궁합이에요'
  if (score >= 55) return '흥미로운 조합이네요'
  return '다름이 매력이 될 수 있어요'
}

export default function TeaserResult({
  partnerName,
  scores,
  onViewFull,
  isLoading,
}: TeaserResultProps) {
  const { totalScore } = scores

  return (
    <div className="space-y-6">
      {/* 종합 점수 - 대형 숫자 + 메시지 */}
      <div className="text-center space-y-3 py-6 animate-count-up">
        <p className="text-sm text-destiny-text-muted">나 & {partnerName}</p>
        <div className={`text-6xl font-black ${getScoreColor(totalScore)}`}>
          {totalScore}
          <span className="text-2xl text-destiny-text-subtle">점</span>
        </div>
        <p className="text-base text-destiny-text">
          {getScoreMessage(totalScore)}
        </p>
      </div>

      {/* 3체계 점수 바 - 블러 처리 (세부 점수는 전체 리포트에서 공개) */}
      <div
        className="relative rounded-xl bg-destiny-surface border border-destiny-border p-5 overflow-hidden animate-fade-slide-up"
        style={{ animationDelay: '200ms' }}
      >
        <div className="blur-sm select-none space-y-3" aria-hidden="true">
          {['사주 궁합', '별자리 궁합', 'MBTI 궁합'].map((label) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-sm text-destiny-text-muted w-24 shrink-0">
                {label}
              </span>
              <div className="flex-1 h-2 rounded-full bg-destiny-surface-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-destiny-primary to-destiny-primary-light"
                  style={{ width: '65%' }}
                />
              </div>
              <span className="text-sm font-bold text-destiny-text w-10 text-right shrink-0">
                ??
              </span>
            </div>
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-destiny-surface/60">
          <span className="text-sm text-destiny-text-muted">
            🔒 체계별 점수는 전체 리포트에서 공개
          </span>
        </div>
      </div>

      {/* 블러 처리된 상세 해설 영역 (유료 잠금 표현) */}
      <div
        className="relative rounded-xl bg-destiny-surface border border-destiny-border p-6 overflow-hidden animate-fade-slide-up"
        style={{ animationDelay: '400ms' }}
      >
        <div className="blur-sm select-none space-y-3" aria-hidden="true">
          <p className="text-sm text-destiny-text">
            두 사람의 소통 방식은 서로 다르지만...
          </p>
          <p className="text-sm text-destiny-text">
            감정 표현에서 흥미로운 패턴이...
          </p>
          <p className="text-sm text-destiny-text">
            가치관 측면에서 놀라운 조화를...
          </p>
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-destiny-surface/60">
          <span className="text-sm text-destiny-text-muted">
            상세 해설은 전체 리포트에서 확인
          </span>
        </div>
      </div>

      {/* CTA 버튼 - 그라데이션 + 글로우 */}
      <button
        type="button"
        onClick={onViewFull}
        disabled={isLoading}
        className="
          w-full rounded-xl py-4 text-base font-bold cursor-pointer
          bg-gradient-to-r from-destiny-primary to-destiny-accent text-white
          hover:shadow-[0_0_32px_rgba(139,92,246,0.4)]
          active:scale-[0.98]
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          animate-cosmic-pulse
        "
      >
        {isLoading ? '분석 중...' : '전체 궁합 리포트 보기'}
      </button>
    </div>
  )
}
