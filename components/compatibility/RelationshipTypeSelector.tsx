// 관계 유형 선택 UI (Client Component)
// 'use client' 필요: 버튼 클릭 이벤트 핸들러
// 궁합 플로우의 첫 단계 - 상대와의 관계를 7개 중 선택
'use client'

import type { RelationshipType } from '@/lib/compatibility/types'

interface RelationshipTypeSelectorProps {
  value: RelationshipType | null
  onChange: (type: RelationshipType) => void
}

const RELATIONSHIP_OPTIONS: {
  value: RelationshipType
  label: string
  emoji: string
  description: string
}[] = [
  {
    value: 'lover',
    label: '연인',
    emoji: '💕',
    description: '현재 사귀는 사이',
  },
  { value: 'crush', label: '썸', emoji: '🦋', description: '설레는 그 사람' },
  { value: 'ex', label: '전연인', emoji: '💔', description: '헤어진 사이' },
  { value: 'friend', label: '친구', emoji: '🤝', description: '우정의 궁합' },
  {
    value: 'idol',
    label: '아이돌',
    emoji: '⭐',
    description: '최애와의 궁합',
  },
  { value: 'colleague', label: '동료', emoji: '💼', description: '직장 동료' },
  { value: 'family', label: '가족', emoji: '🏠', description: '가족 관계' },
]

export default function RelationshipTypeSelector({
  value,
  onChange,
}: RelationshipTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {RELATIONSHIP_OPTIONS.map((option, index) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`
            flex flex-col items-start gap-1 rounded-xl p-4 text-left
            transition-all duration-200 cursor-pointer animate-fade-slide-up
            ${
              value === option.value
                ? 'bg-destiny-primary/15 border-2 border-destiny-primary shadow-[0_0_20px_rgba(139,92,246,0.2)]'
                : 'bg-destiny-surface border border-destiny-border hover:border-destiny-primary/40'
            }
          `}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{option.emoji}</span>
            <span
              className={`text-sm font-bold ${value === option.value ? 'text-destiny-primary-light' : 'text-destiny-text'}`}
            >
              {option.label}
            </span>
          </div>
          <span className="text-xs text-destiny-text-subtle">
            {option.description}
          </span>
        </button>
      ))}
    </div>
  )
}
