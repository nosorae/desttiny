// MBTI 유형 선택 UI (Client Component)
// 'use client' 필요: 버튼 클릭 이벤트 핸들러
// 온보딩(Task 2)과 궁합 플로우(Task 5)에서 재사용
//
// 16개 MBTI 유형을 4x4 그리드로 표시
// 각 유형에 한국어 별명을 함께 표시하여 MBTI에 익숙하지 않은 사용자도 선택 가능
'use client'

import type { MbtiType } from '@/lib/compatibility/types'

interface MBTISelectorProps {
  value: MbtiType | null
  onChange: (mbti: MbtiType) => void
}

// MBTI 유형별 한국어 별명
// 16personalities 공식 한국어 번역 기준
const MBTI_OPTIONS: { type: MbtiType; nickname: string }[] = [
  { type: 'INTJ', nickname: '전략가' },
  { type: 'INTP', nickname: '논리술사' },
  { type: 'ENTJ', nickname: '통솔자' },
  { type: 'ENTP', nickname: '변론가' },
  { type: 'INFJ', nickname: '옹호자' },
  { type: 'INFP', nickname: '중재자' },
  { type: 'ENFJ', nickname: '선도자' },
  { type: 'ENFP', nickname: '활동가' },
  { type: 'ISTJ', nickname: '현실주의자' },
  { type: 'ISFJ', nickname: '수호자' },
  { type: 'ESTJ', nickname: '경영자' },
  { type: 'ESFJ', nickname: '외교관' },
  { type: 'ISTP', nickname: '장인' },
  { type: 'ISFP', nickname: '모험가' },
  { type: 'ESTP', nickname: '사업가' },
  { type: 'ESFP', nickname: '연예인' },
]

const TEST_URL =
  'https://www.16personalities.com/ko/%EB%AC%B4%EB%A3%8C-%EC%84%B1%EA%B2%A9-%EC%9C%A0%ED%98%95-%EA%B2%80%EC%82%AC'

export function MBTISelector({ value, onChange }: MBTISelectorProps) {
  return (
    <div className="space-y-4">
      {/* 4x4 그리드 */}
      <div className="grid grid-cols-4 gap-2">
        {MBTI_OPTIONS.map(({ type, nickname }) => {
          const isSelected = value === type

          return (
            <button
              key={type}
              type="button"
              onClick={() => onChange(type)}
              className={`
                flex flex-col items-center justify-center gap-0.5 rounded-xl py-3 px-1
                text-center transition-all duration-200 cursor-pointer
                ${
                  isSelected
                    ? 'bg-destiny-primary text-white shadow-[0_0_16px_rgba(139,92,246,0.4)] scale-105'
                    : 'bg-destiny-surface border border-destiny-border text-destiny-text-muted hover:border-destiny-primary/50'
                }
              `}
            >
              <span
                className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-destiny-text'}`}
              >
                {type}
              </span>
              <span
                className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-destiny-text-subtle'}`}
              >
                {nickname}
              </span>
            </button>
          )
        })}
      </div>

      {/* MBTI 모르는 사용자를 위한 검사 링크 */}
      <div className="text-center">
        <a
          href={TEST_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-destiny-text-subtle hover:text-destiny-primary transition-colors duration-200 underline underline-offset-2"
        >
          MBTI를 모르시나요?
        </a>
      </div>
    </div>
  )
}
