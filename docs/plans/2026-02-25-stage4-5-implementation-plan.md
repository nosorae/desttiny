# 4~5단계 온보딩 + 궁합 플로우 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 온보딩(3단계 프로필 입력) + 궁합(관계선택→상대입력→티저→LLM해설→결과) 전체 플로우를 구현한다.

**Architecture:** 온보딩과 궁합 입력에서 공용 컴포넌트(BirthDateInput, MBTISelector, GenderSelector)를 공유한다. 궁합 플로우는 점수 미리보기(Server Action, LLM 없음)→티저→전체 결과(기존 API + LLM)로 2단계 분기. 모바일 퍼스트 390px, 다크 코스믹 퍼플 테마.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS 4, Supabase (PostgreSQL + Auth + SSR), Anthropic SDK

**Design:** 신비로운 우주/운명 컨셉의 다크 퍼플 테마. `--destiny-bg: #0d0a1a`, `--destiny-primary: #8b5cf6`, `--destiny-accent: #f59e0b`. Geist Sans 폰트. CSS 기반 애니메이션 (별빛 반짝임, 글로우 효과, 부드러운 스텝 전환).

**현재 상태:** 65 tests pass, 2 skip, 4 todo. 브랜치: `develop`.

---

## Task 0: Root middleware.ts 생성 (인증 가드 활성화)

> ⚠️ **발견된 문제**: `middleware.ts`가 프로젝트 루트에 없어서 인증 가드가 실제로 동작하지 않음.
> `lib/supabase/middleware.ts`에 `updateSession` 함수는 구현되어 있으나 호출하는 코드가 없음.

**Files:**

- Create: `middleware.ts`

**Step 1: middleware.ts 생성**

```typescript
// middleware.ts
// Next.js Middleware - 모든 요청에서 세션 갱신 + 보호된 라우트 가드
// lib/supabase/middleware.ts의 updateSession을 여기서 호출해야 실제로 동작함
// 참고: https://nextjs.org/docs/app/building-your-application/routing/middleware
import { updateSession } from '@/lib/supabase/middleware'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  // 정적 파일과 이미지 최적화 경로 제외 (미들웨어 불필요한 경로)
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Step 2: 확인**

Run: `npx next build 2>&1 | head -30` (빌드 오류 없는지 확인)

**Step 3: Commit**

```bash
git add middleware.ts
git commit -m "fix: root middleware.ts 생성 - 인증 가드 활성화 (#10)"
```

---

## Task 1: 공용 UI 컴포넌트

온보딩과 궁합 입력에서 함께 사용하는 4개 공용 컴포넌트.

**Files:**

- Create: `components/ui/GenderSelector.tsx`
- Create: `components/ui/BirthDateInput.tsx`
- Create: `components/ui/MBTISelector.tsx`
- Create: `components/ui/ProgressBar.tsx`

### Step 1: GenderSelector

```tsx
// components/ui/GenderSelector.tsx
'use client'

interface GenderSelectorProps {
  value: 'male' | 'female' | null
  onChange: (gender: 'male' | 'female') => void
}

const GENDERS = [
  { value: 'male' as const, label: '남성', icon: '♂' },
  { value: 'female' as const, label: '여성', icon: '♀' },
]

export default function GenderSelector({
  value,
  onChange,
}: GenderSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {GENDERS.map((g) => (
        <button
          key={g.value}
          type="button"
          onClick={() => onChange(g.value)}
          className={`
            flex items-center justify-center gap-2 rounded-xl py-4
            text-base font-medium transition-all duration-200
            ${
              value === g.value
                ? 'bg-destiny-primary text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]'
                : 'bg-destiny-surface border border-destiny-border text-destiny-text-muted hover:border-destiny-primary/50'
            }
          `}
        >
          <span className="text-lg">{g.icon}</span>
          {g.label}
        </button>
      ))}
    </div>
  )
}
```

### Step 2: ProgressBar

```tsx
// components/ui/ProgressBar.tsx
'use client'

interface StepProgressProps {
  current: number
  total: number
}

interface LoadingProgressProps {
  progress: number
  message?: string
}

type ProgressBarProps =
  | ({ variant: 'step' } & StepProgressProps)
  | ({ variant: 'loading' } & LoadingProgressProps)

export default function ProgressBar(props: ProgressBarProps) {
  if (props.variant === 'step') {
    const { current, total } = props
    return (
      <div className="flex items-center gap-2">
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className="flex items-center gap-2">
            {/* 별(단계 원) */}
            <div
              className={`
                h-2.5 w-2.5 rounded-full transition-all duration-500
                ${
                  i < current
                    ? 'bg-destiny-primary shadow-[0_0_8px_rgba(139,92,246,0.6)]'
                    : i === current
                      ? 'bg-destiny-primary-light animate-pulse'
                      : 'bg-destiny-surface-2'
                }
              `}
            />
            {/* 별자리 연결선 */}
            {i < total - 1 && (
              <div
                className={`
                  h-px w-8 transition-all duration-500
                  ${i < current ? 'bg-destiny-primary/60' : 'bg-destiny-border'}
                `}
              />
            )}
          </div>
        ))}
        <span className="ml-2 text-xs text-destiny-text-subtle">
          {current + 1}/{total}
        </span>
      </div>
    )
  }

  // variant === 'loading'
  const { progress, message } = props
  return (
    <div className="w-full space-y-3">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-destiny-surface-2">
        <div
          className="h-full rounded-full bg-gradient-to-r from-destiny-primary to-destiny-accent transition-all duration-700 ease-out"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      {message && (
        <p className="text-center text-sm text-destiny-text-muted animate-pulse">
          {message}
        </p>
      )}
    </div>
  )
}
```

### Step 3: BirthDateInput

```tsx
// components/ui/BirthDateInput.tsx
'use client'

import { useState, useCallback } from 'react'

export interface BirthDateValue {
  year: string
  month: string
  day: string
  hour: string
  unknownTime: boolean
}

interface BirthDateInputProps {
  value: BirthDateValue
  onChange: (value: BirthDateValue) => void
  /** true면 사주/별자리 미리보기 표시 (온보딩 2단계) */
  showPreview?: boolean
  /** showPreview=true일 때 외부에서 계산된 미리보기 데이터 */
  preview?: {
    dayPillar?: string
    zodiacSign?: string
    zodiacEmoji?: string
  } | null
}

export function getEmptyBirthDate(): BirthDateValue {
  return { year: '', month: '', day: '', hour: '', unknownTime: false }
}

/** BirthDateValue → YYYY-MM-DD 문자열 변환 (유효하지 않으면 null) */
export function toBirthDateString(v: BirthDateValue): string | null {
  const y = parseInt(v.year, 10)
  const m = parseInt(v.month, 10)
  const d = parseInt(v.day, 10)
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null
  if (y < 1900 || y > new Date().getFullYear()) return null
  if (m < 1 || m > 12) return null
  if (d < 1 || d > 31) return null
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/** BirthDateValue → HH:MM 문자열 변환 (시 모름이면 null) */
export function toBirthTimeString(v: BirthDateValue): string | null {
  if (v.unknownTime) return null
  const h = parseInt(v.hour, 10)
  if (isNaN(h) || h < 0 || h > 23) return null
  return `${String(h).padStart(2, '0')}:00`
}

export default function BirthDateInput({
  value,
  onChange,
  showPreview = false,
  preview,
}: BirthDateInputProps) {
  const update = useCallback(
    (partial: Partial<BirthDateValue>) => {
      onChange({ ...value, ...partial })
    },
    [value, onChange]
  )

  const inputClass = `
    bg-destiny-surface border border-destiny-border rounded-lg px-3 py-3
    text-center text-destiny-text text-base
    focus:border-destiny-primary focus:outline-none focus:ring-1 focus:ring-destiny-primary/50
    transition-colors placeholder:text-destiny-text-subtle
  `

  return (
    <div className="space-y-4">
      {/* 생년월일 */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          placeholder="1990"
          maxLength={4}
          value={value.year}
          onChange={(e) => update({ year: e.target.value.replace(/\D/g, '') })}
          className={`${inputClass} w-20`}
        />
        <span className="text-destiny-text-muted text-sm">년</span>
        <input
          type="text"
          inputMode="numeric"
          placeholder="1"
          maxLength={2}
          value={value.month}
          onChange={(e) => update({ month: e.target.value.replace(/\D/g, '') })}
          className={`${inputClass} w-14`}
        />
        <span className="text-destiny-text-muted text-sm">월</span>
        <input
          type="text"
          inputMode="numeric"
          placeholder="1"
          maxLength={2}
          value={value.day}
          onChange={(e) => update({ day: e.target.value.replace(/\D/g, '') })}
          className={`${inputClass} w-14`}
        />
        <span className="text-destiny-text-muted text-sm">일</span>
      </div>

      {/* 출생 시간 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            placeholder="0"
            maxLength={2}
            value={value.unknownTime ? '' : value.hour}
            disabled={value.unknownTime}
            onChange={(e) =>
              update({ hour: e.target.value.replace(/\D/g, '') })
            }
            className={`${inputClass} w-14 ${value.unknownTime ? 'opacity-40' : ''}`}
          />
          <span className="text-destiny-text-muted text-sm">시</span>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value.unknownTime}
            onChange={(e) =>
              update({ unknownTime: e.target.checked, hour: '' })
            }
            className="accent-destiny-primary h-4 w-4 rounded"
          />
          <span className="text-sm text-destiny-text-muted">
            태어난 시간을 몰라요
          </span>
        </label>
      </div>

      {/* 사주/별자리 미리보기 */}
      {showPreview && preview && (
        <div className="rounded-xl bg-destiny-surface-2/60 border border-destiny-border/50 p-4 space-y-2 animate-in fade-in duration-300">
          {preview.dayPillar && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-destiny-text-subtle">
                사주 일주
              </span>
              <span className="text-sm font-medium text-destiny-primary-light">
                {preview.dayPillar}
              </span>
            </div>
          )}
          {preview.zodiacSign && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-destiny-text-subtle">별자리</span>
              <span className="text-sm font-medium text-destiny-primary-light">
                {preview.zodiacEmoji} {preview.zodiacSign}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

### Step 4: MBTISelector

```tsx
// components/ui/MBTISelector.tsx
'use client'

import type { MbtiType } from '@/lib/compatibility/types'

interface MBTISelectorProps {
  value: MbtiType | null
  onChange: (mbti: MbtiType) => void
}

const MBTI_TYPES: { type: MbtiType; nickname: string }[] = [
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

const MBTI_TEST_URL =
  'https://www.16personalities.com/ko/%EB%AC%B4%EB%A3%8C-%EC%84%B1%EA%B2%A9-%EC%9C%A0%ED%98%95-%EA%B2%80%EC%82%AC'

export default function MBTISelector({ value, onChange }: MBTISelectorProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {MBTI_TYPES.map(({ type, nickname }) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={`
              rounded-lg py-2.5 px-1 text-center transition-all duration-200
              ${
                value === type
                  ? 'bg-destiny-primary text-white shadow-[0_0_16px_rgba(139,92,246,0.4)] scale-[1.02]'
                  : 'bg-destiny-surface border border-destiny-border text-destiny-text-muted hover:border-destiny-primary/40'
              }
            `}
          >
            <div className="text-xs font-bold">{type}</div>
            <div
              className={`text-[10px] mt-0.5 ${value === type ? 'text-white/80' : 'text-destiny-text-subtle'}`}
            >
              {nickname}
            </div>
          </button>
        ))}
      </div>

      {/* MBTI 모르는 경우 안내 */}
      <div className="rounded-xl bg-destiny-surface-2/40 border border-destiny-border/30 p-4">
        <p className="text-sm text-destiny-text-muted mb-2">
          MBTI를 모르시나요?
        </p>
        <a
          href={MBTI_TEST_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-destiny-primary hover:text-destiny-primary-light transition-colors"
        >
          무료 검사 하러 가기 →
        </a>
      </div>
    </div>
  )
}
```

### Step 5: 확인

Run: `npx next build 2>&1 | tail -10` (타입 에러 없는지 확인)

### Step 6: Commit

```bash
git add components/ui/GenderSelector.tsx components/ui/BirthDateInput.tsx components/ui/MBTISelector.tsx components/ui/ProgressBar.tsx
git commit -m "feat: 공용 UI 컴포넌트 (GenderSelector, BirthDateInput, MBTISelector, ProgressBar) (#10)"
```

---

## Task 2: 온보딩 페이지 + 프로필 저장 API

3단계 온보딩 폼 + POST /api/profiles.

**Files:**

- Create: `app/api/profiles/route.ts`
- Create: `app/onboarding/OnboardingForm.tsx` (Client Component)
- Modify: `app/onboarding/page.tsx`
- Create: `lib/actions/saju-preview.ts` (Server Action - 생년월일 미리보기)

### Step 1: 사주/별자리 미리보기 Server Action

```typescript
// lib/actions/saju-preview.ts
// 온보딩 2단계에서 생년월일 입력 시 사주 일주/별자리를 실시간 미리보기
// Server Action이므로 'use server' 필수 (서버에서만 실행)
'use server'

import { getSajuProfile } from '@/lib/saju'
import { getZodiacSign } from '@/lib/zodiac/calculator'
import { ZODIAC_KO_NAMES, ZODIAC_EMOJI } from '@/lib/zodiac/types'

export interface SajuPreviewResult {
  dayPillar: string | null
  zodiacSign: string | null
  zodiacEmoji: string | null
}

export async function getSajuPreview(
  birthDate: string,
  birthHour: number | null
): Promise<SajuPreviewResult> {
  const result: SajuPreviewResult = {
    dayPillar: null,
    zodiacSign: null,
    zodiacEmoji: null,
  }

  try {
    const date = new Date(birthDate)
    if (isNaN(date.getTime())) return result

    // 사주 일주 계산
    const sajuProfile = await getSajuProfile(date, birthHour ?? undefined)
    result.dayPillar = sajuProfile.dayPillar.label

    // 별자리 계산
    const month = date.getUTCMonth() + 1
    const day = date.getUTCDate()
    const zodiac = getZodiacSign(month, day)
    result.zodiacSign = ZODIAC_KO_NAMES[zodiac.id]
    result.zodiacEmoji = ZODIAC_EMOJI[zodiac.id]
  } catch (error) {
    console.warn('[getSajuPreview] 계산 실패:', error)
  }

  return result
}
```

### Step 2: 프로필 저장 API

```typescript
// app/api/profiles/route.ts
// POST /api/profiles - 온보딩 완료 시 프로필 저장
// upsert로 중복 프로필 자동 처리 (이미 있으면 업데이트)
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSajuProfile } from '@/lib/saju'
import { getZodiacSign } from '@/lib/zodiac/calculator'
import type { MbtiType } from '@/lib/compatibility/types'

const VALID_MBTI_TYPES: MbtiType[] = [
  'INTJ',
  'INTP',
  'ENTJ',
  'ENTP',
  'INFJ',
  'INFP',
  'ENFJ',
  'ENFP',
  'ISTJ',
  'ISFJ',
  'ESTJ',
  'ESFJ',
  'ISTP',
  'ISFP',
  'ESTP',
  'ESFP',
]

interface ProfileRequestBody {
  name: string
  gender: 'male' | 'female'
  birthDate: string // YYYY-MM-DD
  birthTime: string | null // HH:MM or null
  mbti: string
}

export async function POST(request: NextRequest) {
  // 1. 인증 확인
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  // 2. 요청 바디 파싱
  let body: ProfileRequestBody
  try {
    body = (await request.json()) as ProfileRequestBody
  } catch {
    return NextResponse.json(
      { error: '요청 데이터를 파싱할 수 없습니다.' },
      { status: 400 }
    )
  }

  // 3. 필수값 검증
  const { name, gender, birthDate, birthTime, mbti } = body

  const trimmedName = name?.trim()
  if (!trimmedName || trimmedName.length < 1 || trimmedName.length > 20) {
    return NextResponse.json(
      { error: '이름은 1~20자로 입력해주세요.' },
      { status: 400 }
    )
  }

  if (gender !== 'male' && gender !== 'female') {
    return NextResponse.json({ error: '성별을 선택해주세요.' }, { status: 400 })
  }

  // 생년월일 형식 검증
  const dateObj = new Date(birthDate)
  if (!birthDate || isNaN(dateObj.getTime())) {
    return NextResponse.json(
      { error: '생년월일을 올바르게 입력해주세요.' },
      { status: 400 }
    )
  }
  const year = dateObj.getUTCFullYear()
  const currentYear = new Date().getFullYear()
  if (year < 1900 || year > currentYear) {
    return NextResponse.json(
      { error: `생년은 1900~${currentYear}년이어야 합니다.` },
      { status: 400 }
    )
  }

  // MBTI 필수 검증
  if (!mbti || !VALID_MBTI_TYPES.includes(mbti as MbtiType)) {
    return NextResponse.json({ error: 'MBTI를 선택해주세요.' }, { status: 400 })
  }

  // birthTime 형식 검증 (있는 경우)
  let birthHour: number | undefined
  if (birthTime) {
    const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/
    if (!TIME_REGEX.test(birthTime)) {
      return NextResponse.json(
        { error: '시간 형식이 올바르지 않습니다 (HH:MM).' },
        { status: 400 }
      )
    }
    birthHour = parseInt(birthTime.split(':')[0], 10)
  }

  // 4. 사주/별자리 계산 (실패 시 null)
  let dayPillar: string | null = null
  let zodiacSign: string | null = null

  try {
    const sajuProfile = await getSajuProfile(dateObj, birthHour)
    dayPillar = sajuProfile.dayPillar.label
  } catch (error) {
    console.warn('[POST /api/profiles] 사주 계산 실패:', error)
  }

  try {
    const month = dateObj.getUTCMonth() + 1
    const day = dateObj.getUTCDate()
    zodiacSign = getZodiacSign(month, day).id
  } catch (error) {
    console.warn('[POST /api/profiles] 별자리 계산 실패:', error)
  }

  // 5. profiles 테이블 upsert
  // onConflict: id 중복 시 update (재온보딩 허용)
  const { error: upsertError } = await supabase.from('profiles').upsert({
    id: user.id,
    nickname: trimmedName,
    gender,
    birth_date: birthDate,
    birth_time: birthTime,
    day_pillar: dayPillar,
    zodiac_sign: zodiacSign,
    mbti,
  })

  if (upsertError) {
    console.error('[POST /api/profiles] upsert 실패:', upsertError)
    return NextResponse.json(
      { error: '저장에 실패했어요. 다시 시도해주세요.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
```

### Step 3: 온보딩 폼 (Client Component)

```tsx
// app/onboarding/OnboardingForm.tsx
'use client'

import { useState, useCallback, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import GenderSelector from '@/components/ui/GenderSelector'
import BirthDateInput, {
  type BirthDateValue,
  getEmptyBirthDate,
  toBirthDateString,
  toBirthTimeString,
} from '@/components/ui/BirthDateInput'
import MBTISelector from '@/components/ui/MBTISelector'
import ProgressBar from '@/components/ui/ProgressBar'
import {
  getSajuPreview,
  type SajuPreviewResult,
} from '@/lib/actions/saju-preview'
import type { MbtiType } from '@/lib/compatibility/types'

// 온보딩 3단계:
//   0: 이름 + 성별
//   1: 생년월일시 + 사주/별자리 미리보기
//   2: MBTI 선택 (필수)
const TOTAL_STEPS = 3

export default function OnboardingForm() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [isPending, startTransition] = useTransition()

  // Step 0: 이름 + 성별
  const [name, setName] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | null>(null)

  // Step 1: 생년월일시
  const [birthDate, setBirthDate] =
    useState<BirthDateValue>(getEmptyBirthDate())
  const [preview, setPreview] = useState<SajuPreviewResult | null>(null)

  // Step 2: MBTI
  const [mbti, setMbti] = useState<MbtiType | null>(null)

  // 에러/제출 상태
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 생년월일 입력 완료 시 미리보기 요청 (디바운스)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    const dateStr = toBirthDateString(birthDate)
    if (!dateStr) {
      setPreview(null)
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const hourStr = toBirthTimeString(birthDate)
      const hour = hourStr ? parseInt(hourStr.split(':')[0], 10) : null
      startTransition(async () => {
        const result = await getSajuPreview(dateStr, hour)
        setPreview(result)
      })
    }, 500)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [birthDate])

  // 단계별 유효성
  const isStep0Valid =
    name.trim().length >= 1 && name.trim().length <= 20 && gender !== null
  const isStep1Valid =
    toBirthDateString(birthDate) !== null &&
    (birthDate.unknownTime || toBirthTimeString(birthDate) !== null)
  const isStep2Valid = mbti !== null

  const handleNext = useCallback(() => {
    setError(null)
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1)
    }
  }, [step])

  const handleBack = useCallback(() => {
    setError(null)
    if (step > 0) setStep((s) => s - 1)
  }, [step])

  const handleSubmit = useCallback(async () => {
    if (!isStep0Valid || !isStep1Valid || !isStep2Valid) return

    setError(null)
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          gender,
          birthDate: toBirthDateString(birthDate),
          birthTime: toBirthTimeString(birthDate),
          mbti,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? '저장에 실패했어요. 다시 시도해주세요.')
        return
      }

      router.push('/profile')
    } catch {
      setError('네트워크 오류가 발생했어요. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }, [
    name,
    gender,
    birthDate,
    mbti,
    isStep0Valid,
    isStep1Valid,
    isStep2Valid,
    router,
  ])

  const canProceed =
    step === 0 ? isStep0Valid : step === 1 ? isStep1Valid : isStep2Valid

  return (
    <div className="flex flex-col min-h-screen">
      {/* 헤더 */}
      <div className="px-6 pt-8 pb-4 space-y-4">
        <ProgressBar variant="step" current={step} total={TOTAL_STEPS} />
        <h1 className="text-xl font-bold text-destiny-text">
          {step === 0 && '반가워요!'}
          {step === 1 && '생년월일을 알려주세요'}
          {step === 2 && 'MBTI를 선택해주세요'}
        </h1>
        <p className="text-sm text-destiny-text-muted">
          {step === 0 && '궁합 분석에 사용할 기본 정보를 입력해주세요.'}
          {step === 1 && '정확한 사주와 별자리를 계산할게요.'}
          {step === 2 && '성격 유형으로 더 정확한 궁합을 분석해요.'}
        </p>
      </div>

      {/* 폼 영역 */}
      <div className="flex-1 px-6 py-4">
        {/* Step 0: 이름 + 성별 */}
        {step === 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <label className="text-sm font-medium text-destiny-text">
                이름
              </label>
              <input
                type="text"
                placeholder="이름을 입력해주세요"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                className="
                  w-full bg-destiny-surface border border-destiny-border rounded-xl px-4 py-3.5
                  text-destiny-text text-base placeholder:text-destiny-text-subtle
                  focus:border-destiny-primary focus:outline-none focus:ring-1 focus:ring-destiny-primary/50
                  transition-colors
                "
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-destiny-text">
                성별
              </label>
              <GenderSelector value={gender} onChange={setGender} />
            </div>
          </div>
        )}

        {/* Step 1: 생년월일시 */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <BirthDateInput
              value={birthDate}
              onChange={setBirthDate}
              showPreview
              preview={preview}
            />
          </div>
        )}

        {/* Step 2: MBTI */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <MBTISelector value={mbti} onChange={setMbti} />
          </div>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="px-6 pb-2">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* 하단 버튼 */}
      <div className="px-6 pb-8 pt-4 flex gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={handleBack}
            className="
              rounded-xl px-6 py-3.5 text-base font-medium
              bg-destiny-surface border border-destiny-border text-destiny-text-muted
              hover:border-destiny-primary/50 transition-colors
            "
          >
            이전
          </button>
        )}
        <button
          type="button"
          onClick={step === TOTAL_STEPS - 1 ? handleSubmit : handleNext}
          disabled={!canProceed || isSubmitting}
          className={`
            flex-1 rounded-xl py-3.5 text-base font-bold transition-all duration-200
            ${
              canProceed && !isSubmitting
                ? 'bg-destiny-primary text-white hover:bg-destiny-primary-hover shadow-[0_0_24px_rgba(139,92,246,0.3)]'
                : 'bg-destiny-surface-2 text-destiny-text-subtle cursor-not-allowed'
            }
          `}
        >
          {isSubmitting
            ? '저장 중...'
            : step === TOTAL_STEPS - 1
              ? '시작하기'
              : '다음'}
        </button>
      </div>
    </div>
  )
}
```

### Step 4: 온보딩 페이지 Server Component

```tsx
// app/onboarding/page.tsx
// 온보딩 페이지 - 이미 프로필이 있으면 /profile로 리다이렉트
// Server Component에서 프로필 존재 여부 확인 후 클라이언트 폼 렌더링
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OnboardingForm from './OnboardingForm'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 이미 프로필이 있으면 메인으로 보냄
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (profile) redirect('/profile')

  return <OnboardingForm />
}
```

### Step 5: 확인

Run: `npx next build 2>&1 | tail -10`

### Step 6: Commit

```bash
git add app/onboarding/page.tsx app/onboarding/OnboardingForm.tsx app/api/profiles/route.ts lib/actions/saju-preview.ts
git commit -m "feat: 온보딩 3단계 폼 + 프로필 저장 API (#10, #11)"
```

---

## Task 3: DB 마이그레이션 (MBTI 필수화 + idol 관계 유형) + 기존 코드 수정

**Files:**

- Create: `supabase/migrations/20260226000001_mbti_required_and_idol.sql`
- Modify: `lib/compatibility/types.ts` — RelationshipType에 `idol` 추가, PersonCompatibilityInput.mbti null 제거
- Modify: `lib/compatibility/mbti/calculator.ts` — null 처리 제거
- Modify: `lib/compatibility/ai/prompt.ts` — RELATIONSHIP_KO에 idol 추가
- Modify: `app/api/compatibility/route.ts` — VALID_RELATIONSHIP_TYPES에 idol 추가, MBTI null 허용 제거
- Modify: `lib/compatibility/__tests__/calculator.test.ts` — null MBTI 테스트 수정
- Modify: `lib/compatibility/mbti/__tests__/mbti-compatibility.test.ts` — null 테스트 제거
- Modify: `lib/compatibility/ai/__tests__/prompt.test.ts` — idol 테스트 추가

### Step 1: 마이그레이션 SQL 작성

```sql
-- supabase/migrations/20260226000001_mbti_required_and_idol.sql
-- 1. MBTI 필수화 (온보딩에서 반드시 입력)
-- 2. idol 관계 유형 추가 (아이돌 궁합)

-- 1. MBTI NOT NULL 추가
-- 주의: 기존 null MBTI 데이터가 있으면 마이그레이션 실패
-- MVP 시점에서 실제 사용자 데이터 없으므로 안전
ALTER TABLE profiles
  ALTER COLUMN mbti SET NOT NULL;

-- 2. relationship_type에 idol 추가
ALTER TABLE compatibility_results
  DROP CONSTRAINT IF EXISTS compatibility_results_relationship_type_check;

ALTER TABLE compatibility_results
  ADD CONSTRAINT compatibility_results_relationship_type_check
  CHECK (relationship_type = ANY (ARRAY[
    'lover'::text,
    'ex'::text,
    'crush'::text,
    'friend'::text,
    'colleague'::text,
    'family'::text,
    'idol'::text
  ]));
```

### Step 2: types.ts 수정

`lib/compatibility/types.ts` 변경:

1. RelationshipType에 `'idol'` 추가:

```typescript
export type RelationshipType =
  | 'lover' // 연인
  | 'ex' // 전연인
  | 'crush' // 썸
  | 'friend' // 친구
  | 'colleague' // 동료
  | 'family' // 가족
  | 'idol' // 아이돌
```

2. PersonCompatibilityInput.mbti에서 `| null` 제거:

```typescript
export interface PersonCompatibilityInput {
  dayPillar: import('../saju/types').Pillar | null
  zodiacId: import('../zodiac/types').ZodiacId | null
  /** MBTI - 필수 (온보딩에서 반드시 입력) */
  mbti: MbtiType
  name: string
  gender: string | null
}
```

### Step 3: MBTI calculator null 처리 제거

`lib/compatibility/mbti/calculator.ts` 변경:

```typescript
export function calculateMbtiCompatibility(
  m1: MbtiType,
  m2: MbtiType
): CompatibilityScore {
  const score = MBTI_COMPATIBILITY[m1][m2]
  // ... 나머지 동일 (null 처리 분기 삭제)
}
```

### Step 4: prompt.ts에 idol 추가

`lib/compatibility/ai/prompt.ts` 변경:

```typescript
const RELATIONSHIP_KO: Record<RelationshipType, string> = {
  lover: '연인',
  ex: '전연인',
  crush: '썸',
  friend: '친구',
  colleague: '동료',
  family: '가족',
  idol: '아이돌',
}
```

### Step 5: route.ts에 idol 추가 + MBTI null 허용 제거

`app/api/compatibility/route.ts` 변경:

1. VALID_RELATIONSHIP_TYPES 배열에 `'idol'` 추가
2. 파트너 MBTI가 없을 때 오류 반환 대신 기존 로직 유지 (파트너는 직접 입력이므로 여전히 nullable)

> 주의: 파트너의 MBTI는 여전히 선택사항 (직접 입력 시 상대방 MBTI를 모를 수 있음).
> 요청자의 MBTI만 필수 (프로필에서 보장). 파트너 MBTI null이면 API에서 처리 필요.
> → PersonCompatibilityInput.mbti를 `MbtiType`로 바꾸되, API route에서 파트너 MBTI null일 때 기본값을 전달하는 방식으로 처리.

실제로 calculator의 시그니처는 `MbtiType`을 받으므로, API route에서 파트너 MBTI가 null이면 에러가 아니라 특별 처리가 필요:

- PersonCompatibilityInput.mbti를 다시 `MbtiType | null`로 유지
- 대신 calculator에서 null 체크를 유지하되 주석만 변경

**재수정**: 파트너의 MBTI는 여전히 모를 수 있으므로:

- `PersonCompatibilityInput.mbti: MbtiType | null` (기존 유지)
- `calculateMbtiCompatibility(m1: MbtiType | null, m2: MbtiType | null)` (기존 유지)
- 변경점은 **온보딩에서 MBTI 필수** + **DB에서 profiles.mbti NOT NULL** + **idol 추가** 뿐

### Step 5 (수정): 변경 범위 확정

실제 변경:

1. `types.ts`: RelationshipType에 `'idol'` 추가만 (PersonCompatibilityInput.mbti는 그대로 `| null` 유지)
2. `mbti/calculator.ts`: 변경 없음 (파트너 MBTI null 처리 필요)
3. `prompt.ts`: RELATIONSHIP_KO에 `idol` 추가
4. `route.ts`: VALID_RELATIONSHIP_TYPES에 `'idol'` 추가
5. DB: `profiles.mbti` NOT NULL + `relationship_type` CHECK에 idol

### Step 6: 테스트 수정

`lib/compatibility/ai/__tests__/prompt.test.ts`에 idol 테스트 추가:

```typescript
it('idol 관계 유형이 한국어로 포함된다', () => {
  const prompt = buildCompatibilityPrompt({
    person1,
    person2,
    relationshipType: 'idol',
    totalScore: 70,
    breakdown: mockBreakdown,
  })
  expect(prompt).toContain('아이돌')
})
```

### Step 7: 테스트 실행

Run: `npx vitest run`
Expected: 모든 기존 테스트 pass + 새 테스트 pass

### Step 8: 마이그레이션 적용

MCP `apply_migration`으로 DB에 적용

### Step 9: Commit

```bash
git add supabase/migrations/20260226000001_mbti_required_and_idol.sql lib/compatibility/types.ts lib/compatibility/ai/prompt.ts app/api/compatibility/route.ts lib/compatibility/ai/__tests__/prompt.test.ts
git commit -m "feat: MBTI 필수화 마이그레이션 + idol 관계 유형 추가 (#11, #23)"
```

---

## Task 4: 점수 계산 함수 분리 + Server Action

기존 `calculateCompatibility`에서 점수만 계산하는 함수를 추출하고, Server Action으로 감싼다.

**Files:**

- Modify: `lib/compatibility/calculator.ts` — `calculateCompatibilityScore()` 함수 추출
- Create: `lib/compatibility/__tests__/score.test.ts` — 점수 함수 단위 테스트
- Create: `lib/actions/compatibility-preview.ts` — Server Action

### Step 1: 점수 테스트 작성 (TDD)

```typescript
// lib/compatibility/__tests__/score.test.ts
import { describe, it, expect } from 'vitest'
import { calculateCompatibilityScore } from '../calculator'
import type { PersonCompatibilityInput } from '../types'

function makePerson(
  stem: string,
  branch: string,
  element: string,
  zodiacId: string,
  mbti: string | null = 'INTJ'
): PersonCompatibilityInput {
  return {
    dayPillar: {
      stem: stem as import('../../saju/types').HeavenlyStem,
      branch: branch as import('../../saju/types').EarthlyBranch,
      label: `${stem}${branch}`,
      element: element as import('../../saju/types').FiveElement,
    },
    zodiacId: zodiacId as import('../../zodiac/types').ZodiacId,
    mbti: mbti as import('../types').MbtiType | null,
    name: '테스트',
    gender: null,
  }
}

describe('calculateCompatibilityScore - 점수만 계산 (LLM 없음)', () => {
  it('totalScore는 0-100 범위이다', () => {
    const result = calculateCompatibilityScore(
      makePerson('갑', '인', 'wood', 'aries', 'INTJ'),
      makePerson('병', '오', 'fire', 'leo', 'ENFP')
    )
    expect(result.totalScore).toBeGreaterThanOrEqual(0)
    expect(result.totalScore).toBeLessThanOrEqual(100)
  })

  it('breakdown에 3체계 점수가 포함된다', () => {
    const result = calculateCompatibilityScore(
      makePerson('갑', '인', 'wood', 'aries', 'INTJ'),
      makePerson('병', '오', 'fire', 'leo', 'ENFP')
    )
    expect(result.breakdown.saju).toBeDefined()
    expect(result.breakdown.zodiac).toBeDefined()
    expect(result.breakdown.mbti).toBeDefined()
  })

  it('가중치 계산: 사주 40% + 별자리 30% + MBTI 30%', () => {
    const result = calculateCompatibilityScore(
      makePerson('갑', '인', 'wood', 'aries', 'INTJ'),
      makePerson('병', '오', 'fire', 'leo', 'ENFP')
    )
    const expected = Math.round(
      result.breakdown.saju.score * 0.4 +
        result.breakdown.zodiac.score * 0.3 +
        result.breakdown.mbti.score * 0.3
    )
    expect(result.totalScore).toBe(expected)
  })

  it('dayPillar null이면 사주 기본 50점', () => {
    const result = calculateCompatibilityScore(
      {
        dayPillar: null,
        zodiacId: 'aries',
        mbti: 'INTJ',
        name: '테스트',
        gender: null,
      },
      makePerson('병', '오', 'fire', 'leo', 'ENFP')
    )
    expect(result.breakdown.saju.score).toBe(50)
  })
})
```

### Step 2: 테스트 실패 확인

Run: `npx vitest run lib/compatibility/__tests__/score.test.ts`
Expected: FAIL (calculateCompatibilityScore 함수 없음)

### Step 3: calculateCompatibilityScore 구현

`lib/compatibility/calculator.ts`에 추가:

```typescript
/** 점수 계산 결과 (LLM 해설 없음) */
export interface CompatibilityScoreResult {
  totalScore: number
  breakdown: {
    saju: CompatibilityScore
    zodiac: CompatibilityScore
    mbti: CompatibilityScore
  }
}

/**
 * 3체계 점수만 계산합니다 (LLM 호출 없음, 동기적).
 * Server Action에서 티저 점수 미리보기에 사용.
 */
export function calculateCompatibilityScore(
  person1: PersonCompatibilityInput,
  person2: PersonCompatibilityInput
): CompatibilityScoreResult {
  const sajuScore =
    person1.dayPillar && person2.dayPillar
      ? calculateSajuCompatibility(person1.dayPillar, person2.dayPillar)
      : DEFAULT_SAJU_SCORE
  const zodiacScore =
    person1.zodiacId && person2.zodiacId
      ? calculateZodiacCompatibility(person1.zodiacId, person2.zodiacId)
      : DEFAULT_ZODIAC_SCORE
  const mbtiScore = calculateMbtiCompatibility(person1.mbti, person2.mbti)

  const totalScore = Math.round(
    sajuScore.score * 0.4 + zodiacScore.score * 0.3 + mbtiScore.score * 0.3
  )

  return {
    totalScore,
    breakdown: { saju: sajuScore, zodiac: zodiacScore, mbti: mbtiScore },
  }
}
```

기존 `calculateCompatibility` 함수도 내부에서 `calculateCompatibilityScore`를 호출하도록 리팩터:

```typescript
export async function calculateCompatibility(
  person1: PersonCompatibilityInput,
  person2: PersonCompatibilityInput,
  relationshipType: RelationshipType,
  provider: LLMProvider
): Promise<CompatibilityResult> {
  // 1. 점수 계산 (추출된 함수 재사용)
  const { totalScore, breakdown } = calculateCompatibilityScore(
    person1,
    person2
  )
  const { saju: sajuScore, zodiac: zodiacScore, mbti: mbtiScore } = breakdown

  // 2. LLM 해설 생성 (나머지 동일)
  // ...
}
```

### Step 4: 테스트 통과 확인

Run: `npx vitest run`
Expected: 모든 테스트 pass (기존 + 신규)

### Step 5: Server Action

```typescript
// lib/actions/compatibility-preview.ts
// 궁합 점수 미리보기 Server Action
// 티저 화면에서 점수만 즉시 계산 (LLM 없음, DB 저장 없음)
'use server'

import { createClient } from '@/lib/supabase/server'
import { parseDayPillar } from '@/lib/saju'
import { getSajuProfile } from '@/lib/saju'
import { getZodiacSign } from '@/lib/zodiac/calculator'
import { calculateCompatibilityScore, type CompatibilityScoreResult } from '@/lib/compatibility/calculator'
import type { PersonCompatibilityInput, MbtiType, RelationshipType } from '@/lib/compatibility/types'
import type { ZodiacId } from '@/lib/zodiac/types'
import type { Pillar } from '@/lib/saju/types'

const VALID_MBTI_TYPES: MbtiType[] = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
]

const VALID_ZODIAC_IDS: ZodiacId[] = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
]

interface PreviewInput {
  partner: {
    name: string
    birthDate: string    // YYYY-MM-DD
    birthTime?: string   // HH:MM
    mbti?: string
    gender?: string
  }
}

export interface PreviewResult {
  success: true
  data: CompatibilityScoreResult
} | {
  success: false
  error: string
}

export async function calculateCompatibilityPreview(
  input: PreviewInput
): Promise<PreviewResult> {
  // 1. 인증 확인 + 요청자 프로필 조회
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: '로그인이 필요합니다.' }

  const { data: requesterProfile } = await supabase
    .from('profiles')
    .select('day_pillar, zodiac_sign, mbti, nickname, gender')
    .eq('id', user.id)
    .single()

  if (!requesterProfile) return { success: false, error: '프로필을 먼저 완성해주세요.' }

  // 2. 요청자 PersonCompatibilityInput 구성
  let requesterDayPillar: Pillar | null = null
  if (requesterProfile.day_pillar) {
    try { requesterDayPillar = parseDayPillar(requesterProfile.day_pillar) } catch {}
  }

  const requesterZodiacId =
    requesterProfile.zodiac_sign && VALID_ZODIAC_IDS.includes(requesterProfile.zodiac_sign as ZodiacId)
      ? (requesterProfile.zodiac_sign as ZodiacId)
      : null

  const requesterMbti =
    requesterProfile.mbti && VALID_MBTI_TYPES.includes(requesterProfile.mbti as MbtiType)
      ? (requesterProfile.mbti as MbtiType)
      : null

  const person1: PersonCompatibilityInput = {
    dayPillar: requesterDayPillar,
    zodiacId: requesterZodiacId,
    mbti: requesterMbti,
    name: requesterProfile.nickname ?? '나',
    gender: requesterProfile.gender ?? null,
  }

  // 3. 파트너 PersonCompatibilityInput 구성
  const { partner } = input
  const birthDate = new Date(partner.birthDate)
  if (isNaN(birthDate.getTime())) return { success: false, error: '생년월일이 올바르지 않습니다.' }

  let partnerDayPillar: Pillar | null = null
  try {
    const hour = partner.birthTime ? parseInt(partner.birthTime.split(':')[0], 10) : undefined
    const sajuProfile = await getSajuProfile(birthDate, hour)
    partnerDayPillar = sajuProfile.dayPillar
  } catch {}

  let partnerZodiacId: ZodiacId | null = null
  try {
    const zodiac = getZodiacSign(birthDate.getUTCMonth() + 1, birthDate.getUTCDate())
    partnerZodiacId = zodiac.id
  } catch {}

  const partnerMbti =
    partner.mbti && VALID_MBTI_TYPES.includes(partner.mbti as MbtiType)
      ? (partner.mbti as MbtiType)
      : null

  const person2: PersonCompatibilityInput = {
    dayPillar: partnerDayPillar,
    zodiacId: partnerZodiacId,
    mbti: partnerMbti,
    name: partner.name,
    gender: partner.gender ?? null,
  }

  // 4. 점수 계산 (LLM 없음)
  const scoreResult = calculateCompatibilityScore(person1, person2)

  return { success: true, data: scoreResult }
}
```

### Step 6: Commit

```bash
git add lib/compatibility/calculator.ts lib/compatibility/__tests__/score.test.ts lib/actions/compatibility-preview.ts
git commit -m "feat: 점수 계산 함수 분리 + 궁합 미리보기 Server Action (#23)"
```

---

## Task 5: 궁합 페이지 컴포넌트 + 페이지

**Files:**

- Create: `components/compatibility/RelationshipTypeSelector.tsx`
- Create: `components/compatibility/PartnerInputForm.tsx`
- Create: `components/compatibility/TeaserResult.tsx`
- Create: `components/compatibility/LoadingOverlay.tsx`
- Create: `app/(main)/compatibility/CompatibilityFlow.tsx` (Client Component)
- Modify: `app/(main)/compatibility/page.tsx`

### Step 1: RelationshipTypeSelector

```tsx
// components/compatibility/RelationshipTypeSelector.tsx
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
  { value: 'idol', label: '아이돌', emoji: '⭐', description: '최애와의 궁합' },
  { value: 'colleague', label: '동료', emoji: '💼', description: '직장 동료' },
  { value: 'family', label: '가족', emoji: '🏠', description: '가족 관계' },
]

export default function RelationshipTypeSelector({
  value,
  onChange,
}: RelationshipTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {RELATIONSHIP_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`
            flex flex-col items-start gap-1 rounded-xl p-4 text-left
            transition-all duration-200
            ${
              value === option.value
                ? 'bg-destiny-primary/15 border-2 border-destiny-primary shadow-[0_0_20px_rgba(139,92,246,0.2)]'
                : 'bg-destiny-surface border border-destiny-border hover:border-destiny-primary/40'
            }
          `}
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
```

### Step 2: PartnerInputForm

```tsx
// components/compatibility/PartnerInputForm.tsx
'use client'

import { useState, useCallback } from 'react'
import GenderSelector from '@/components/ui/GenderSelector'
import BirthDateInput, {
  type BirthDateValue,
  getEmptyBirthDate,
  toBirthDateString,
  toBirthTimeString,
} from '@/components/ui/BirthDateInput'
import MBTISelector from '@/components/ui/MBTISelector'
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
      <div className="space-y-2">
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
      <div className="space-y-2">
        <label className="text-sm font-medium text-destiny-text">
          성별{' '}
          <span className="text-destiny-text-subtle font-normal">(선택)</span>
        </label>
        <GenderSelector value={gender} onChange={setGender} />
      </div>

      {/* 생년월일시 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-destiny-text">
          생년월일시
        </label>
        <BirthDateInput value={birthDate} onChange={setBirthDate} />
      </div>

      {/* MBTI (선택, 토글) */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setShowMbti(!showMbti)}
          className="flex items-center gap-2 text-sm text-destiny-text-muted hover:text-destiny-primary-light transition-colors"
        >
          <span>{showMbti ? '▾' : '▸'}</span>
          MBTI <span className="text-destiny-text-subtle">(선택)</span>
        </button>
        {showMbti && <MBTISelector value={mbti} onChange={setMbti} />}
      </div>

      {/* 제출 */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!isValid || isSubmitting}
        className={`
          w-full rounded-xl py-3.5 text-base font-bold transition-all duration-200
          ${
            isValid && !isSubmitting
              ? 'bg-destiny-primary text-white hover:bg-destiny-primary-hover shadow-[0_0_24px_rgba(139,92,246,0.3)]'
              : 'bg-destiny-surface-2 text-destiny-text-subtle cursor-not-allowed'
          }
        `}
      >
        {isSubmitting ? '계산 중...' : '궁합 보기'}
      </button>
    </div>
  )
}
```

### Step 3: TeaserResult

```tsx
// components/compatibility/TeaserResult.tsx
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
  const { totalScore, breakdown } = scores

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 종합 점수 */}
      <div className="text-center space-y-3 py-6">
        <p className="text-sm text-destiny-text-muted">나 & {partnerName}</p>
        <div className={`text-6xl font-black ${getScoreColor(totalScore)}`}>
          {totalScore}
          <span className="text-2xl text-destiny-text-subtle">점</span>
        </div>
        <p className="text-base text-destiny-text">
          {getScoreMessage(totalScore)}
        </p>
      </div>

      {/* 3체계 점수 */}
      <div className="space-y-3">
        {[
          { label: '사주 궁합', score: breakdown.saju.score, weight: '40%' },
          {
            label: '별자리 궁합',
            score: breakdown.zodiac.score,
            weight: '30%',
          },
          { label: 'MBTI 궁합', score: breakdown.mbti.score, weight: '30%' },
        ].map(({ label, score, weight }) => (
          <div key={label} className="flex items-center gap-3">
            <span className="text-sm text-destiny-text-muted w-24">
              {label}
            </span>
            <div className="flex-1 h-2 rounded-full bg-destiny-surface-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-destiny-primary to-destiny-primary-light transition-all duration-1000"
                style={{ width: `${score}%` }}
              />
            </div>
            <span className="text-sm font-bold text-destiny-text w-10 text-right">
              {score}
            </span>
          </div>
        ))}
      </div>

      {/* 블러 처리된 상세 해설 영역 (유료 잠금 표현) */}
      <div className="relative rounded-xl bg-destiny-surface border border-destiny-border p-6 overflow-hidden">
        <div className="blur-sm select-none space-y-3">
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

      {/* CTA 버튼 */}
      <button
        type="button"
        onClick={onViewFull}
        disabled={isLoading}
        className="
          w-full rounded-xl py-4 text-base font-bold
          bg-gradient-to-r from-destiny-primary to-destiny-accent text-white
          hover:shadow-[0_0_32px_rgba(139,92,246,0.4)]
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {isLoading ? '분석 중...' : '전체 궁합 리포트 보기'}
      </button>
    </div>
  )
}
```

### Step 4: LoadingOverlay

```tsx
// components/compatibility/LoadingOverlay.tsx
'use client'

import { useState, useEffect } from 'react'
import ProgressBar from '@/components/ui/ProgressBar'

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

export default function LoadingOverlay({ isVisible }: LoadingOverlayProps) {
  const [progress, setProgress] = useState(0)
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    if (!isVisible) {
      setProgress(0)
      setMessageIndex(0)
      return
    }

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
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-destiny-bg/95 animate-in fade-in duration-300">
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
```

### Step 5: 궁합 플로우 Client Component

```tsx
// app/(main)/compatibility/CompatibilityFlow.tsx
'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import RelationshipTypeSelector from '@/components/compatibility/RelationshipTypeSelector'
import PartnerInputForm, {
  type PartnerData,
} from '@/components/compatibility/PartnerInputForm'
import TeaserResult from '@/components/compatibility/TeaserResult'
import LoadingOverlay from '@/components/compatibility/LoadingOverlay'
import { calculateCompatibilityPreview } from '@/lib/actions/compatibility-preview'
import type { CompatibilityScoreResult } from '@/lib/compatibility/calculator'
import type { RelationshipType } from '@/lib/compatibility/types'

// 궁합 플로우 상태: 관계선택 → 상대입력 → 티저(점수) → 로딩 → 결과
type FlowStep = 'select-type' | 'input-partner' | 'teaser' | 'loading'

export default function CompatibilityFlow() {
  const router = useRouter()
  const [flowStep, setFlowStep] = useState<FlowStep>('select-type')
  const [relationshipType, setRelationshipType] =
    useState<RelationshipType | null>(null)
  const [partnerData, setPartnerData] = useState<PartnerData | null>(null)
  const [scores, setScores] = useState<CompatibilityScoreResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 1. 관계 유형 선택
  const handleTypeSelect = useCallback((type: RelationshipType) => {
    setRelationshipType(type)
    setFlowStep('input-partner')
    setError(null)
  }, [])

  // 2. 상대방 정보 제출 → 점수 미리보기
  const handlePartnerSubmit = useCallback(async (data: PartnerData) => {
    setPartnerData(data)
    setIsCalculating(true)
    setError(null)

    const result = await calculateCompatibilityPreview({
      partner: {
        name: data.name,
        birthDate: data.birthDate,
        birthTime: data.birthTime ?? undefined,
        mbti: data.mbti ?? undefined,
        gender: data.gender ?? undefined,
      },
    })

    setIsCalculating(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    setScores(result.data)
    setFlowStep('teaser')
  }, [])

  // 3. 전체 리포트 보기 → LLM API 호출
  const handleViewFull = useCallback(async () => {
    if (!relationshipType || !partnerData) return

    setFlowStep('loading')

    try {
      const res = await fetch('/api/compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          relationshipType,
          partner: {
            name: partnerData.name,
            birthDate: partnerData.birthDate,
            birthTime: partnerData.birthTime,
            mbti: partnerData.mbti,
            gender: partnerData.gender,
          },
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? '궁합 분석에 실패했어요.')
        setFlowStep('teaser')
        return
      }

      const data = await res.json()
      if (data.id) {
        router.push(`/result/${data.id}`)
      } else {
        setError('결과 저장에 실패했어요.')
        setFlowStep('teaser')
      }
    } catch {
      setError('네트워크 오류가 발생했어요.')
      setFlowStep('teaser')
    }
  }, [relationshipType, partnerData, router])

  // 뒤로가기
  const handleBack = useCallback(() => {
    setError(null)
    if (flowStep === 'input-partner') setFlowStep('select-type')
    else if (flowStep === 'teaser') setFlowStep('input-partner')
  }, [flowStep])

  return (
    <div className="flex flex-col min-h-screen">
      <LoadingOverlay isVisible={flowStep === 'loading'} />

      <div className="px-6 pt-6 pb-4 space-y-1">
        {flowStep !== 'select-type' && (
          <button
            type="button"
            onClick={handleBack}
            className="text-sm text-destiny-text-muted hover:text-destiny-primary-light transition-colors mb-2"
          >
            ← 이전
          </button>
        )}
        <h1 className="text-xl font-bold text-destiny-text">
          {flowStep === 'select-type' && '어떤 사이인가요?'}
          {flowStep === 'input-partner' && '상대방 정보'}
          {flowStep === 'teaser' && '궁합 결과'}
        </h1>
      </div>

      <div className="flex-1 px-6 py-4">
        {flowStep === 'select-type' && (
          <div className="animate-in fade-in duration-300">
            <RelationshipTypeSelector
              value={relationshipType}
              onChange={handleTypeSelect}
            />
          </div>
        )}

        {flowStep === 'input-partner' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <PartnerInputForm
              onSubmit={handlePartnerSubmit}
              isSubmitting={isCalculating}
            />
          </div>
        )}

        {flowStep === 'teaser' && scores && partnerData && (
          <div className="animate-in fade-in duration-300">
            <TeaserResult
              partnerName={partnerData.name}
              scores={scores}
              onViewFull={handleViewFull}
            />
          </div>
        )}

        {error && (
          <div className="mt-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
```

### Step 6: 궁합 페이지 Server Component

```tsx
// app/(main)/compatibility/page.tsx
// 궁합 탭 - 프로필이 있는 사용자만 접근 가능
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CompatibilityFlow from './CompatibilityFlow'

export default async function CompatibilityPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 프로필 미완성 시 온보딩으로
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  return <CompatibilityFlow />
}
```

### Step 7: 확인

Run: `npx next build 2>&1 | tail -10`

### Step 8: Commit

```bash
git add components/compatibility/ app/\\(main\\)/compatibility/
git commit -m "feat: 궁합 입력 + 티저 결과 + 로딩 UX (#23, #22)"
```

---

## Task 6: LLM 프롬프트 수정 (영역 확장 + 순서 변경)

8~10개 영역으로 확장, 29금→마무리 순서.

**Files:**

- Modify: `lib/compatibility/types.ts` — CompatibilitySection.area 확장
- Modify: `lib/compatibility/ai/prompt.ts` — areas 확장, 순서 변경
- Modify: `lib/compatibility/calculator.ts` — getFallbackAnalysis 영역 확장
- Modify: `lib/compatibility/__tests__/calculator.test.ts` — mock 데이터 업데이트

### Step 1: types.ts area 확장

```typescript
// CompatibilitySection.area에 신규 영역 추가
area:
  | 'communication' // 소통
  | 'emotion'       // 감정
  | 'values'        // 가치관
  | 'lifestyle'     // 생활습관
  | 'conflict'      // 갈등 해결
  | 'growth'        // 성장과 발전
  | 'trust'         // 신뢰와 안정감
  | 'fun'           // 재미와 유머
  | 'intimacy'      // 친밀도 (연인/썸/전연인만)
```

### Step 2: CompatibilityAnalysis 필드 순서 변경

```typescript
export interface CompatibilityAnalysis {
  summary: string
  sections: CompatibilitySection[]
  /** 29금 친밀도 점수 - 연인/썸/전연인만 (비연인 관계에서는 undefined) */
  intimacyScores?: IntimacyScores
  /** 마무리 정리 (29금 다음에 위치) */
  finalSummary: string
}
```

### Step 3: prompt.ts 영역 확장

areas 배열을 8개로 확장:

```typescript
const areas = [
  '소통(communication): 대화 스타일, 공감 방식',
  '감정(emotion): 애정 표현, 감정 처리 방식',
  '가치관(values): 삶의 방향성, 우선순위',
  '생활습관(lifestyle): 일상 패턴, 취향',
  '갈등 해결(conflict): 갈등 처리 방식',
  '성장과 발전(growth): 함께 성장하는 가능성',
  '신뢰와 안정감(trust): 서로에 대한 믿음과 의지',
  '재미와 유머(fun): 함께하는 즐거움, 유머 코드',
]
if (isIntimate) areas.push('친밀도(intimacy): 신체적·정서적 친밀감 표현 방식')
```

JSON 출력 형식에서 순서 변경: `intimacyScores` 다음에 `finalSummary`.

### Step 4: calculator.ts fallback 영역 확장

```typescript
function getFallbackAnalysis(totalScore: number): CompatibilityAnalysis {
  const level =
    totalScore >= 80 ? '높은' : totalScore >= 60 ? '양호한' : '도전적인'
  return {
    summary: `두 분의 궁합 점수는 ${totalScore}점으로 ${level} 궁합입니다`,
    sections: [
      {
        title: '두 사람의 소통 방식',
        content:
          '서로의 특성을 존중하는 대화가 관계를 더욱 풍요롭게 만들 수 있습니다.',
        area: 'communication',
      },
      {
        title: '감정 표현의 온도차',
        content:
          '감정 표현 방식의 차이를 인정하고 배려하는 것이 깊은 신뢰를 쌓는 첫걸음입니다.',
        area: 'emotion',
      },
      {
        title: '가치관, 얼마나 맞을까?',
        content:
          '삶에서 중요하게 여기는 것들이 비슷할수록 장기적인 관계가 편안해집니다.',
        area: 'values',
      },
      {
        title: '함께 하는 일상',
        content:
          '일상 속 작은 습관과 취향이 맞을수록 함께하는 시간이 즐거워집니다.',
        area: 'lifestyle',
      },
      {
        title: '갈등이 생기면?',
        content:
          '모든 관계에서 갈등은 자연스러운 일입니다. 상대방의 입장에서 생각해보는 것이 현명한 시작입니다.',
        area: 'conflict',
      },
      {
        title: '함께 성장할 수 있을까?',
        content:
          '서로의 꿈과 목표를 응원하고 함께 발전해 나갈 때 관계는 더 깊어집니다.',
        area: 'growth',
      },
      {
        title: '믿음과 안정감',
        content:
          '서로를 신뢰하고 의지할 수 있을 때 관계의 기반이 탄탄해집니다.',
        area: 'trust',
      },
      {
        title: '함께라서 즐거운 순간',
        content: '비슷한 유머 코드와 취미가 있으면 일상이 더 특별해집니다.',
        area: 'fun',
      },
    ],
    finalSummary: `${totalScore}점의 궁합, 서로를 이해하고 노력한다면 더 좋은 관계로 발전할 수 있습니다.`,
  }
}
```

### Step 5: 테스트 mock 데이터 업데이트

`lib/compatibility/__tests__/calculator.test.ts`의 mockProvider가 반환하는 sections를 8개로 확장:

```typescript
const mockProvider: LLMProvider = {
  name: 'mock',
  model: 'mock-model',
  generateText: vi.fn().mockResolvedValue(
    JSON.stringify({
      summary: '테스트 요약',
      sections: [
        { title: '소통', content: '내용', area: 'communication' },
        { title: '감정', content: '내용', area: 'emotion' },
        { title: '가치관', content: '내용', area: 'values' },
        { title: '생활', content: '내용', area: 'lifestyle' },
        { title: '갈등', content: '내용', area: 'conflict' },
        { title: '성장', content: '내용', area: 'growth' },
        { title: '신뢰', content: '내용', area: 'trust' },
        { title: '재미', content: '내용', area: 'fun' },
      ],
      finalSummary: '테스트 마무리',
    })
  ),
}
```

### Step 6: 테스트 실행

Run: `npx vitest run`
Expected: 모든 테스트 pass

### Step 7: Commit

```bash
git add lib/compatibility/types.ts lib/compatibility/ai/prompt.ts lib/compatibility/calculator.ts lib/compatibility/__tests__/calculator.test.ts
git commit -m "feat: LLM 프롬프트 8영역 확장 + 29금→마무리 순서 변경 (#21)"
```

---

## Task 7: 결과 페이지

**Files:**

- Create: `components/result/SummaryHeader.tsx`
- Create: `components/result/ScoreDisplay.tsx`
- Create: `components/result/AnalysisSection.tsx`
- Create: `components/result/IntimacySection.tsx`
- Create: `components/result/FinalSummary.tsx`
- Modify: `app/result/[id]/page.tsx`

### Step 1: 결과 컴포넌트

```tsx
// components/result/ScoreDisplay.tsx
// 종합 점수 - 큰 숫자 + 점수별 색상
interface ScoreDisplayProps {
  totalScore: number
  breakdown: {
    saju: number
    zodiac: number
    mbti: number
  }
}

function getScoreGradient(score: number): string {
  if (score >= 85) return 'from-destiny-accent to-amber-300'
  if (score >= 70) return 'from-destiny-primary to-destiny-primary-light'
  if (score >= 55) return 'from-destiny-primary-light to-blue-300'
  return 'from-destiny-text-muted to-destiny-text-subtle'
}

export default function ScoreDisplay({
  totalScore,
  breakdown,
}: ScoreDisplayProps) {
  return (
    <div className="text-center space-y-6 py-8">
      <div
        className={`text-7xl font-black bg-gradient-to-br ${getScoreGradient(totalScore)} bg-clip-text text-transparent`}
      >
        {totalScore}
        <span className="text-3xl">점</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '사주', score: breakdown.saju },
          { label: '별자리', score: breakdown.zodiac },
          { label: 'MBTI', score: breakdown.mbti },
        ].map(({ label, score }) => (
          <div key={label} className="text-center">
            <div className="text-xs text-destiny-text-subtle mb-1">{label}</div>
            <div className="text-lg font-bold text-destiny-text">{score}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

```tsx
// components/result/SummaryHeader.tsx
// 두 사람 요약 카드
interface SummaryHeaderProps {
  summary: string
  requesterName: string
  partnerName: string
  relationshipType: string
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  lover: '연인',
  ex: '전연인',
  crush: '썸',
  friend: '친구',
  colleague: '동료',
  family: '가족',
  idol: '아이돌',
}

export default function SummaryHeader({
  summary,
  requesterName,
  partnerName,
  relationshipType,
}: SummaryHeaderProps) {
  return (
    <div className="rounded-2xl bg-destiny-surface border border-destiny-border p-6 space-y-4">
      <div className="flex items-center justify-center gap-4">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full bg-destiny-primary/20 flex items-center justify-center mx-auto mb-1">
            <span className="text-lg">✨</span>
          </div>
          <p className="text-sm font-medium text-destiny-text">
            {requesterName}
          </p>
        </div>
        <div className="text-destiny-text-subtle text-xs px-3 py-1 rounded-full bg-destiny-surface-2">
          {RELATIONSHIP_LABELS[relationshipType] ?? relationshipType}
        </div>
        <div className="text-center">
          <div className="h-12 w-12 rounded-full bg-destiny-accent/20 flex items-center justify-center mx-auto mb-1">
            <span className="text-lg">💫</span>
          </div>
          <p className="text-sm font-medium text-destiny-text">{partnerName}</p>
        </div>
      </div>
      <p className="text-sm text-destiny-text-muted text-center leading-relaxed">
        {summary}
      </p>
    </div>
  )
}
```

```tsx
// components/result/AnalysisSection.tsx
// 영역별 해설 섹션
interface AnalysisSectionProps {
  title: string
  content: string
  area: string
  index: number
}

const AREA_EMOJI: Record<string, string> = {
  communication: '💬',
  emotion: '💗',
  values: '🧭',
  lifestyle: '🏡',
  conflict: '⚡',
  growth: '🌱',
  trust: '🛡️',
  fun: '🎭',
  intimacy: '🔥',
}

export default function AnalysisSection({
  title,
  content,
  area,
  index,
}: AnalysisSectionProps) {
  return (
    <div
      className="rounded-xl bg-destiny-surface border border-destiny-border p-5 space-y-3"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{AREA_EMOJI[area] ?? '📖'}</span>
        <h3 className="text-base font-bold text-destiny-text">{title}</h3>
      </div>
      <p className="text-sm text-destiny-text-muted leading-relaxed whitespace-pre-wrap">
        {content}
      </p>
    </div>
  )
}
```

```tsx
// components/result/IntimacySection.tsx
// 29금 친밀도 (연인계만)
import type { IntimacyScores } from '@/lib/compatibility/types'

interface IntimacySectionProps {
  scores: IntimacyScores
}

export default function IntimacySection({ scores }: IntimacySectionProps) {
  const bars = [
    {
      label: '텐션',
      value: scores.tension,
      color: 'from-rose-500 to-pink-400',
    },
    {
      label: '리듬',
      value: scores.rhythm,
      color: 'from-violet-500 to-purple-400',
    },
    {
      label: '경계선 대화',
      value: scores.boundary,
      color: 'from-amber-500 to-yellow-400',
    },
  ]

  return (
    <div className="rounded-xl bg-destiny-surface-2 border border-destiny-border p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">🔥</span>
        <h3 className="text-base font-bold text-destiny-text">29금 친밀도</h3>
      </div>

      <div className="space-y-3">
        {bars.map(({ label, value, color }) => (
          <div key={label} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-destiny-text-muted">{label}</span>
              <span className="text-destiny-text font-medium">{value}</span>
            </div>
            <div className="h-2 rounded-full bg-destiny-surface overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-1000`}
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2 text-sm text-destiny-text-muted pt-2 border-t border-destiny-border">
        <p>💪 {scores.strength}</p>
        <p>⚠️ {scores.caution}</p>
        <p>💡 {scores.advice}</p>
      </div>
    </div>
  )
}
```

```tsx
// components/result/FinalSummary.tsx
// 최종 마무리 섹션
interface FinalSummaryProps {
  content: string
}

export default function FinalSummary({ content }: FinalSummaryProps) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-destiny-primary/10 to-destiny-accent/5 border border-destiny-primary/20 p-6 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">🌟</span>
        <h3 className="text-base font-bold text-destiny-text">마무리</h3>
      </div>
      <p className="text-sm text-destiny-text-muted leading-relaxed whitespace-pre-wrap">
        {content}
      </p>
    </div>
  )
}
```

### Step 2: 결과 페이지 Server Component

```tsx
// app/result/[id]/page.tsx
// 궁합 결과 상세 리포트 (Server Component)
// DB에서 결과 조회 → 전체 리포트 렌더링
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SummaryHeader from '@/components/result/SummaryHeader'
import ScoreDisplay from '@/components/result/ScoreDisplay'
import AnalysisSection from '@/components/result/AnalysisSection'
import IntimacySection from '@/components/result/IntimacySection'
import FinalSummary from '@/components/result/FinalSummary'
import type { CompatibilityAnalysis } from '@/lib/compatibility/types'

type Props = {
  params: Promise<{ id: string }>
}

export default async function ResultPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // RLS가 requester_id = auth.uid()인 결과만 반환하므로
  // 다른 사용자의 결과는 자동으로 null 반환
  const { data: result, error } = await supabase
    .from('compatibility_results')
    .select(
      '*, requester:profiles!compatibility_results_requester_id_fkey(nickname)'
    )
    .eq('id', id)
    .single()

  if (error || !result) notFound()

  // ai_summary는 JSON 문자열로 저장됨
  let analysis: CompatibilityAnalysis | null = null
  try {
    if (result.ai_summary) {
      analysis = JSON.parse(result.ai_summary) as CompatibilityAnalysis
    }
  } catch {
    console.error('[ResultPage] ai_summary 파싱 실패')
  }

  const requesterName =
    (result.requester as { nickname: string | null })?.nickname ?? '나'
  const partnerName = result.partner_name ?? '파트너'

  return (
    <main className="px-6 py-8 space-y-6 pb-20">
      {/* 요약 헤더 */}
      <SummaryHeader
        summary={
          analysis?.summary ??
          `두 분의 궁합 점수는 ${result.total_score}점입니다.`
        }
        requesterName={requesterName}
        partnerName={partnerName}
        relationshipType={result.relationship_type}
      />

      {/* 종합 점수 */}
      <ScoreDisplay
        totalScore={result.total_score}
        breakdown={{
          saju: result.saju_score ?? 50,
          zodiac: result.zodiac_score ?? 50,
          mbti: result.mbti_score ?? 50,
        }}
      />

      {/* 영역별 해설 */}
      {analysis?.sections.map((section, i) => (
        <AnalysisSection
          key={section.area}
          title={section.title}
          content={section.content}
          area={section.area}
          index={i}
        />
      ))}

      {/* 29금 친밀도 (연인계만, 순서: sections 다음, finalSummary 이전) */}
      {analysis?.intimacyScores && (
        <IntimacySection scores={analysis.intimacyScores} />
      )}

      {/* 마무리 */}
      {analysis?.finalSummary && (
        <FinalSummary content={analysis.finalSummary} />
      )}
    </main>
  )
}
```

### Step 3: 확인

Run: `npx vitest run && npx next build 2>&1 | tail -10`

### Step 4: Commit

```bash
git add components/result/ app/result/\\[id\\]/page.tsx
git commit -m "feat: 궁합 결과 리포트 페이지 (#21)"
```

---

## Task 8: 통합 테스트 + 마무리

**Files:**

- 모든 기존 테스트 실행 + 빌드 확인

### Step 1: 전체 테스트

Run: `npx vitest run`
Expected: 모든 테스트 pass

### Step 2: 빌드

Run: `npx next build`
Expected: 빌드 성공

### Step 3: 최종 Commit

```bash
git add -A
git commit -m "feat: 4~5단계 온보딩 + 궁합 플로우 구현 완료 (#10, #11, #23, #22, #21)"
```

---

## 구현 순서 요약

| Task | 내용                           | 이슈     | 파일 수 |
| ---- | ------------------------------ | -------- | ------- |
| 0    | Root middleware.ts             | -        | 1       |
| 1    | 공용 UI 컴포넌트               | #10      | 4       |
| 2    | 온보딩 + 프로필 API            | #10, #11 | 4       |
| 3    | DB 마이그레이션 + 코드 수정    | #11, #23 | 7       |
| 4    | 점수 함수 분리 + Server Action | #23      | 3       |
| 5    | 궁합 페이지 컴포넌트 + 페이지  | #23, #22 | 7       |
| 6    | LLM 프롬프트 수정              | #21      | 4       |
| 7    | 결과 페이지                    | #21      | 6       |
| 8    | 통합 테스트 + 마무리           | -        | -       |

**총 예상 파일**: ~36개 (신규 ~25개, 수정 ~11개)
