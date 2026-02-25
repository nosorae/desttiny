// 온보딩 3단계 폼 (Client Component)
// 'use client' 필요: useState/useEffect/useRef + 이벤트 핸들러 + useRouter
//
// 3단계 구성:
// Step 0: 이름 + 성별 선택
// Step 1: 생년월일/시간 입력 + 사주/별자리 미리보기
// Step 2: MBTI 선택 (필수)
//
// Android의 ViewPager + 단계별 Fragment와 유사한 UX 패턴
'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect, useTransition } from 'react'

import {
  BirthDateInput,
  type BirthDateValue,
  getEmptyBirthDate,
  toBirthDateString,
  toBirthTimeString,
} from '@/components/ui/BirthDateInput'
import { GenderSelector } from '@/components/ui/GenderSelector'
import { MBTISelector } from '@/components/ui/MBTISelector'
import { ProgressBar } from '@/components/ui/ProgressBar'
import {
  getSajuPreview,
  type SajuPreviewResult,
} from '@/lib/actions/saju-preview'
import type { MbtiType } from '@/lib/compatibility/types'

// ===== 상수 =====

const TOTAL_STEPS = 3

const STEP_TITLES = [
  '반가워요!',
  '생년월일을 알려주세요',
  'MBTI를 선택해주세요',
]

const STEP_DESCRIPTIONS = [
  '궁합 분석에 사용할 기본 정보를 알려주세요.',
  '사주와 별자리를 자동으로 계산해 드릴게요.',
  'MBTI까지 알면 더 정확한 궁합을 볼 수 있어요.',
]

// 사용자 입력이 멈춘 후 서버 계산을 요청하는 대기 시간
const PREVIEW_DEBOUNCE_MS = 500

export default function OnboardingForm() {
  const router = useRouter()

  // ===== 폼 상태 =====
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | null>(null)
  const [birthDate, setBirthDate] =
    useState<BirthDateValue>(getEmptyBirthDate())
  const [mbti, setMbti] = useState<MbtiType | null>(null)

  // 사주/별자리 미리보기 상태
  const [preview, setPreview] = useState<SajuPreviewResult | null>(null)
  const [, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 제출 상태
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // ===== 생년월일 변경 시 미리보기 debounce 호출 =====
  // 매 키 입력마다 서버 호출하면 과도한 부하 → 500ms 대기 후 한 번만 호출
  useEffect(() => {
    // 이전 타이머 취소
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    const dateStr = toBirthDateString(birthDate)
    if (!dateStr) {
      // 날짜가 완성되지 않으면 미리보기 초기화
      setPreview(null)
      return
    }

    // birthHour: 시간 모름이면 null, 입력 중이면 파싱 시도
    const hourStr = birthDate.unknownTime ? null : birthDate.hour
    const birthHour = hourStr ? parseInt(hourStr, 10) : null
    const validHour =
      birthHour !== null &&
      !isNaN(birthHour) &&
      birthHour >= 0 &&
      birthHour <= 23
        ? birthHour
        : null

    debounceRef.current = setTimeout(() => {
      // startTransition으로 감싸서 서버 액션 호출 중에도 UI가 블로킹되지 않음
      startTransition(async () => {
        const result = await getSajuPreview(dateStr, validHour)
        setPreview(result)
      })
    }, PREVIEW_DEBOUNCE_MS)

    // 클린업: 컴포넌트 언마운트 또는 다음 변경 시 이전 타이머 취소
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [
    birthDate.year,
    birthDate.month,
    birthDate.day,
    birthDate.hour,
    birthDate.unknownTime,
  ])

  // ===== 단계별 유효성 검사 =====
  const isStepValid = (s: number): boolean => {
    switch (s) {
      case 0:
        return (
          name.trim().length >= 1 && name.trim().length <= 20 && gender !== null
        )
      case 1:
        // 생년월일 필수, 시간은 모름 체크 또는 입력 필요
        return (
          toBirthDateString(birthDate) !== null &&
          (birthDate.unknownTime || toBirthTimeString(birthDate) !== null)
        )
      case 2:
        return mbti !== null
      default:
        return false
    }
  }

  // ===== 다음 / 이전 단계 이동 =====
  const handleNext = () => {
    setErrorMessage(null)
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    setErrorMessage(null)
    if (step > 0) {
      setStep(step - 1)
    }
  }

  // ===== 최종 제출 =====
  const handleSubmit = async () => {
    if (!isStepValid(2)) return

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const dateStr = toBirthDateString(birthDate)
      const timeStr = toBirthTimeString(birthDate)

      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          gender,
          birthDate: dateStr,
          birthTime: timeStr,
          mbti,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '프로필 저장에 실패했습니다.')
      }

      // 온보딩 완료 → 프로필 페이지로 이동
      router.push('/profile')
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : '알 수 없는 오류가 발생했습니다.'
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col px-6 py-8">
      {/* 상단 진행 표시 - current는 1-based (ProgressBar 컴포넌트 규격) */}
      <div className="mb-8">
        <ProgressBar variant="step" current={step + 1} total={TOTAL_STEPS} />
      </div>

      {/* 단계 제목 + 설명 */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-destiny-text mb-2">
          {STEP_TITLES[step]}
        </h1>
        <p className="text-sm text-destiny-text-muted">
          {STEP_DESCRIPTIONS[step]}
        </p>
      </div>

      {/* ===== 단계별 폼 컨텐츠 ===== */}
      <div className="flex-1">
        {/* Step 0: 이름 + 성별 */}
        {step === 0 && (
          <div
            key="step-0"
            className="space-y-6 animate-[fadeSlideIn_300ms_ease-out]"
          >
            {/* 이름 입력 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-destiny-text-muted">
                이름 (닉네임)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="궁합에 표시될 이름을 입력해주세요"
                maxLength={20}
                className="w-full bg-destiny-surface border border-destiny-border rounded-xl px-4 py-3.5 text-destiny-text placeholder:text-destiny-text-subtle focus:border-destiny-primary focus:outline-none focus:ring-1 focus:ring-destiny-primary/50 transition-colors duration-200"
              />
              <p className="text-xs text-destiny-text-subtle text-right">
                {name.trim().length}/20
              </p>
            </div>

            {/* 성별 선택 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-destiny-text-muted">
                성별
              </label>
              <GenderSelector value={gender} onChange={setGender} />
            </div>
          </div>
        )}

        {/* Step 1: 생년월일 + 미리보기 */}
        {step === 1 && (
          <div
            key="step-1"
            className="space-y-6 animate-[fadeSlideIn_300ms_ease-out]"
          >
            <BirthDateInput
              value={birthDate}
              onChange={setBirthDate}
              showPreview={true}
              preview={
                preview
                  ? {
                      dayPillar: preview.dayPillar ?? undefined,
                      zodiacSign: preview.zodiacSign ?? undefined,
                      zodiacEmoji: preview.zodiacEmoji ?? undefined,
                    }
                  : null
              }
            />
          </div>
        )}

        {/* Step 2: MBTI 선택 */}
        {step === 2 && (
          <div
            key="step-2"
            className="space-y-6 animate-[fadeSlideIn_300ms_ease-out]"
          >
            <MBTISelector value={mbti} onChange={setMbti} />
          </div>
        )}
      </div>

      {/* ===== 에러 메시지 ===== */}
      {errorMessage && (
        <p className="text-sm text-red-400 text-center mb-4">{errorMessage}</p>
      )}

      {/* ===== 하단 버튼 ===== */}
      <div className="flex gap-3 mt-8">
        {/* 이전 버튼: Step 0에서는 숨김 */}
        {step > 0 && (
          <button
            type="button"
            onClick={handleBack}
            disabled={isSubmitting}
            className="flex-1 rounded-xl py-3.5 font-semibold bg-destiny-surface border border-destiny-border text-destiny-text-muted transition-all duration-200 hover:border-destiny-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            이전
          </button>
        )}

        {/* 다음 / 완료 버튼 */}
        {step < TOTAL_STEPS - 1 ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={!isStepValid(step)}
            className={`flex-1 rounded-xl py-3.5 font-semibold transition-all duration-200 ${
              isStepValid(step)
                ? 'bg-destiny-primary text-white hover:bg-destiny-primary-hover shadow-[0_0_24px_rgba(139,92,246,0.3)] cursor-pointer'
                : 'bg-destiny-surface-2 text-destiny-text-subtle cursor-not-allowed'
            }`}
          >
            다음
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isStepValid(step) || isSubmitting}
            className={`flex-1 rounded-xl py-3.5 font-semibold transition-all duration-200 ${
              isStepValid(step) && !isSubmitting
                ? 'bg-destiny-primary text-white hover:bg-destiny-primary-hover shadow-[0_0_24px_rgba(139,92,246,0.3)] cursor-pointer'
                : 'bg-destiny-surface-2 text-destiny-text-subtle cursor-not-allowed'
            }`}
          >
            {isSubmitting ? '저장 중...' : '완료'}
          </button>
        )}
      </div>
    </main>
  )
}
