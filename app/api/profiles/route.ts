/**
 * POST /api/profiles - 프로필 저장 (온보딩 완료) API
 *
 * 온보딩 폼에서 수집한 사용자 정보를 profiles 테이블에 upsert
 * 생년월일로 사주 일주(dayPillar)와 별자리(zodiacSign)를 서버에서 계산하여 저장
 *
 * 클라이언트에서 계산하지 않는 이유:
 * - 사주 계산 라이브러리(@gracefullight/saju)가 서버 전용
 * - 클라이언트 조작 방지 (프로필 데이터 무결성 보장)
 */

import { NextRequest, NextResponse } from 'next/server'

import type { MbtiType } from '@/lib/compatibility/types'
import { getSajuProfile } from '@/lib/saju'
import { createClient } from '@/lib/supabase/server'
import { getZodiacSign } from '@/lib/zodiac/calculator'

// ===== 유효값 상수 =====

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

// ===== 요청 바디 타입 =====

interface ProfileRequestBody {
  name: string
  gender: string
  birthDate: string // YYYY-MM-DD
  birthTime: string | null // HH:MM 또는 null (시간 모름)
  mbti: string // MBTI 필수
}

// ===== 메인 핸들러 =====

export async function POST(request: NextRequest) {
  // ===== 1. 인증 확인 =====
  // Supabase Auth 세션으로 본인 확인 (RLS upsert 정책도 auth.uid() = id)
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  // ===== 2. 요청 바디 파싱 =====
  let body: ProfileRequestBody
  try {
    body = (await request.json()) as ProfileRequestBody
  } catch {
    return NextResponse.json(
      { error: '요청 바디를 파싱할 수 없습니다.' },
      { status: 400 }
    )
  }

  const { name, gender, birthDate, birthTime, mbti } = body

  // ===== 3. 유효성 검사 =====

  // 이름: 공백 제거 후 1-20자
  const trimmedName = name?.trim()
  if (!trimmedName || trimmedName.length < 1 || trimmedName.length > 20) {
    return NextResponse.json(
      { error: '이름은 1~20자로 입력해주세요.' },
      { status: 400 }
    )
  }

  // 성별: male 또는 female만 허용
  if (gender !== 'male' && gender !== 'female') {
    return NextResponse.json({ error: '성별을 선택해주세요.' }, { status: 400 })
  }

  // 생년월일: YYYY-MM-DD 형식 + 유효한 날짜 범위 (1900 ~ 현재)
  const parsedDate = new Date(birthDate)
  if (!birthDate || isNaN(parsedDate.getTime())) {
    return NextResponse.json(
      { error: '생년월일 형식이 올바르지 않습니다. (YYYY-MM-DD)' },
      { status: 400 }
    )
  }
  const year = parsedDate.getUTCFullYear()
  const currentYear = new Date().getUTCFullYear()
  if (year < 1900 || year > currentYear) {
    return NextResponse.json(
      { error: `생년은 1900~${currentYear}년 사이여야 합니다.` },
      { status: 400 }
    )
  }

  // 태어난 시간: null이면 시간 모름, 있으면 HH:MM 형식 검증
  let birthHour: number | undefined
  if (birthTime) {
    const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/
    if (!TIME_REGEX.test(birthTime)) {
      return NextResponse.json(
        { error: '시간 형식이 올바르지 않습니다. (HH:MM)' },
        { status: 400 }
      )
    }
    birthHour = parseInt(birthTime.split(':')[0], 10)
  }

  // MBTI: 16개 유형 중 하나 (필수)
  if (!mbti || !VALID_MBTI_TYPES.includes(mbti as MbtiType)) {
    return NextResponse.json({ error: 'MBTI를 선택해주세요.' }, { status: 400 })
  }

  // ===== 4. 사주/별자리 서버 계산 =====
  // 클라이언트 미리보기 결과가 아니라 서버에서 직접 재계산하여 무결성 보장
  let dayPillarLabel: string | null = null
  let zodiacSignId: string | null = null

  try {
    const sajuProfile = await getSajuProfile(parsedDate, birthHour)
    dayPillarLabel = sajuProfile.dayPillar.label
  } catch (error) {
    // 사주 계산 실패 시 null 저장 (궁합에서 기본값 50점 적용)
    console.error('[POST /api/profiles] 사주 계산 실패:', error)
  }

  try {
    const month = parsedDate.getUTCMonth() + 1
    const day = parsedDate.getUTCDate()
    const zodiac = getZodiacSign(month, day)
    zodiacSignId = zodiac.id
  } catch (error) {
    console.error('[POST /api/profiles] 별자리 계산 실패:', error)
  }

  // ===== 5. Upsert (INSERT or UPDATE) =====
  // profiles 테이블 PK = auth.users.id → 재온보딩 시 기존 프로필 덮어쓰기
  // RLS: profiles_insert_own + profiles_update_own 정책으로 본인 row만 쓰기 가능
  const { error: upsertError } = await supabase.from('profiles').upsert({
    id: user.id,
    nickname: trimmedName,
    gender,
    birth_date: birthDate,
    birth_time: birthTime,
    day_pillar: dayPillarLabel,
    zodiac_sign: zodiacSignId,
    mbti: mbti as MbtiType,
    updated_at: new Date().toISOString(),
  })

  if (upsertError) {
    console.error('[POST /api/profiles] 프로필 저장 실패:', upsertError)
    return NextResponse.json(
      { error: '프로필 저장에 실패했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
