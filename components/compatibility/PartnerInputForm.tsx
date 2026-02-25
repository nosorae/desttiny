// 상대방 정보 입력 폼 (Client Component)
// 'use client' 필요: useState로 폼 상태 관리 + 이벤트 핸들러
// 궁합 플로우 2단계 - 이름/성별/생년월일시/MBTI 입력
'use client'

import { useState, useCallback } from 'react'

import {
  BirthDateInput,
  type BirthDateValue,
  getEmptyBirthDate,
  toBirthDateString,
  toBirthTimeString,
} from '@/components/ui/BirthDateInput'
import { GenderSelector } from '@/components/ui/GenderSelector'
import { MBTISelector } from '@/components/ui/MBTISelector'
import type { MbtiType } from '@/lib/compatibility/types'

export interface PartnerData {
  name: string
  gender: 'male' | 'female' | null
  birthDate: string // YYYY-MM-DD
  birthTime: string | null // HH:MM or null
  mbti: MbtiType | null
}

interface PartnerInputFormProps {
  onSubmit: (data: PartnerData) => void
  isSubmitting?: boolean
}

export default function PartnerInputForm({
  onSubmit,
  isSubmitting,
}: PartnerInputFormProps) {
  const [name, setName] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | null>(null)
  const [birthDate, setBirthDate] =
    useState<BirthDateValue>(getEmptyBirthDate())
  const [mbti, setMbti] = useState<MbtiType | null>(null)
  const [showMbti, setShowMbti] = useState(false)

  const dateStr = toBirthDateString(birthDate)
  const timeStr = toBirthTimeString(birthDate)
  // 이름 + 생년월일 필수, 시간은 모르면 생략 가능
  const isValid =
    name.trim().length >= 1 &&
    dateStr !== null &&
    (birthDate.unknownTime || timeStr !== null)

  const handleSubmit = useCallback(() => {
    if (!isValid || !dateStr) return
    onSubmit({
      name: name.trim(),
      gender,
      birthDate: dateStr,
      birthTime: timeStr,
      mbti,
    })
  }, [name, gender, dateStr, timeStr, mbti, isValid, onSubmit])

  return (
    <div className="space-y-6">
      {/* 이름 */}
      <div className="space-y-2 animate-fade-slide-up">
        <label className="text-sm font-medium text-destiny-text">
          상대방 이름
        </label>
        <input
          type="text"
          placeholder="이름을 입력해주세요"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          className="
            w-full bg-destiny-surface border border-destiny-border rounded-xl px-4 py-3.5
            text-destiny-text placeholder:text-destiny-text-subtle
            focus:border-destiny-primary focus:outline-none focus:ring-1 focus:ring-destiny-primary/50
            transition-colors
          "
        />
      </div>

      {/* 성별 (선택) */}
      <div
        className="space-y-2 animate-fade-slide-up"
        style={{ animationDelay: '50ms' }}
      >
        <label className="text-sm font-medium text-destiny-text">
          성별{' '}
          <span className="text-destiny-text-subtle font-normal">(선택)</span>
        </label>
        <GenderSelector value={gender} onChange={setGender} />
      </div>

      {/* 생년월일시 */}
      <div
        className="space-y-2 animate-fade-slide-up"
        style={{ animationDelay: '100ms' }}
      >
        <label className="text-sm font-medium text-destiny-text">
          생년월일시
        </label>
        <BirthDateInput value={birthDate} onChange={setBirthDate} />
      </div>

      {/* MBTI (선택, 토글) */}
      <div
        className="space-y-2 animate-fade-slide-up"
        style={{ animationDelay: '150ms' }}
      >
        <button
          type="button"
          onClick={() => setShowMbti(!showMbti)}
          className="flex items-center gap-2 text-sm text-destiny-text-muted hover:text-destiny-primary-light transition-colors cursor-pointer"
        >
          <span
            className="transition-transform duration-200"
            style={{ transform: showMbti ? 'rotate(90deg)' : 'rotate(0deg)' }}
          >
            ▸
          </span>
          MBTI <span className="text-destiny-text-subtle">(선택)</span>
        </button>
        {showMbti && (
          <div className="animate-fade-slide-up">
            <MBTISelector value={mbti} onChange={setMbti} />
          </div>
        )}
      </div>

      {/* 제출 */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!isValid || isSubmitting}
        className={`
          w-full rounded-xl py-3.5 text-base font-bold transition-all duration-200 cursor-pointer
          ${
            isValid && !isSubmitting
              ? 'bg-destiny-primary text-white hover:bg-destiny-primary-hover shadow-[0_0_24px_rgba(139,92,246,0.3)] active:scale-[0.98]'
              : 'bg-destiny-surface-2 text-destiny-text-subtle cursor-not-allowed'
          }
        `}
      >
        {isSubmitting ? '계산 중...' : '궁합 보기'}
      </button>
    </div>
  )
}
