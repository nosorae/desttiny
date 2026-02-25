// 성별 선택 UI (Client Component)
// 'use client' 필요: 버튼 클릭 이벤트 핸들러 사용
// 온보딩(Task 2)과 궁합 플로우(Task 5)에서 재사용
'use client'

interface GenderSelectorProps {
  value: 'male' | 'female' | null
  onChange: (gender: 'male' | 'female') => void
}

// 선택/비선택 상태의 시각적 차이를 극대화하여 현재 선택 상태를 직관적으로 파악 가능
const GENDER_OPTIONS = [
  { key: 'male' as const, label: '남성', symbol: '♂' },
  { key: 'female' as const, label: '여성', symbol: '♀' },
]

export function GenderSelector({ value, onChange }: GenderSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {GENDER_OPTIONS.map(({ key, label, symbol }) => {
        const isSelected = value === key

        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`
              flex flex-col items-center justify-center gap-1 rounded-xl py-5
              font-semibold transition-all duration-200 cursor-pointer
              ${
                isSelected
                  ? 'bg-destiny-primary text-white shadow-[0_0_20px_rgba(139,92,246,0.4)]'
                  : 'bg-destiny-surface border border-destiny-border text-destiny-text-muted hover:border-destiny-primary/50'
              }
            `}
          >
            <span className="text-2xl">{symbol}</span>
            <span className="text-sm">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
