// 진행 상태 표시 UI (Client Component)
// 'use client' 필요: 애니메이션과 동적 스타일 변경
// 두 가지 variant를 discriminated union으로 구분:
// - 'step': 온보딩 단계 표시 (별자리 컨셉의 점+선)
// - 'loading': 궁합 분석 로딩 (그라데이션 프로그레스 바)
'use client'

interface StepProgressProps {
  variant: 'step'
  current: number
  total: number
}

interface LoadingProgressProps {
  variant: 'loading'
  progress: number
  message?: string
}

type ProgressBarProps = StepProgressProps | LoadingProgressProps

export function ProgressBar(props: ProgressBarProps) {
  if (props.variant === 'step') {
    return <StepProgress current={props.current} total={props.total} />
  }

  return <LoadingProgress progress={props.progress} message={props.message} />
}

// ===== Step Variant =====
// 별자리 컨셉: 각 단계를 별(dot)로, 단계 사이를 선(line)으로 연결
// 완료된 별은 보라빛 발광, 현재 별은 pulse 애니메이션
function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center w-full">
      {Array.from({ length: total }, (_, i) => {
        const stepNumber = i + 1
        const isCompleted = stepNumber < current
        const isCurrent = stepNumber === current

        return (
          <div key={i} className="flex items-center">
            {/* 별(dot) */}
            <div
              className={`
                relative rounded-full transition-all duration-300
                ${
                  isCompleted
                    ? 'w-3 h-3 bg-destiny-primary shadow-[0_0_8px_rgba(139,92,246,0.6)]'
                    : isCurrent
                      ? 'w-4 h-4 bg-destiny-primary animate-pulse shadow-[0_0_12px_rgba(139,92,246,0.8)]'
                      : 'w-3 h-3 bg-destiny-surface-2 border border-destiny-border'
                }
              `}
            />

            {/* 연결선: 마지막 dot 뒤에는 그리지 않음 */}
            {i < total - 1 && (
              <div
                className={`
                  h-[2px] w-8 transition-all duration-300
                  ${isCompleted ? 'bg-destiny-primary/60' : 'bg-destiny-border'}
                `}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ===== Loading Variant =====
// primary → accent 그라데이션 바 + 펄스 메시지
function LoadingProgress({
  progress,
  message,
}: {
  progress: number
  message?: string
}) {
  // 0-100 범위 클램핑
  const clampedProgress = Math.min(100, Math.max(0, progress))

  return (
    <div className="w-full space-y-3">
      {/* 프로그레스 바 트랙 */}
      <div className="h-2 w-full rounded-full bg-destiny-surface-2 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-destiny-primary to-destiny-accent transition-all duration-500 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>

      {/* 메시지: 분석 진행 중 사용자에게 현재 상태를 알려줌 */}
      {message && (
        <p className="text-sm text-destiny-text-muted text-center animate-pulse">
          {message}
        </p>
      )}
    </div>
  )
}
