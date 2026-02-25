// 궁합 점수 미리보기 Server Action
// 티저 화면에서 점수만 즉시 계산 (LLM 없음, DB 저장 없음)
'use server'

import {
  calculateCompatibilityScore,
  type CompatibilityScoreResult,
} from '@/lib/compatibility/calculator'
import type {
  PersonCompatibilityInput,
  MbtiType,
} from '@/lib/compatibility/types'
import { parseDayPillar } from '@/lib/saju'
import { getSajuProfile } from '@/lib/saju'
import type { Pillar } from '@/lib/saju/types'
import { createClient } from '@/lib/supabase/server'
import { getZodiacSign } from '@/lib/zodiac/calculator'
import type { ZodiacId } from '@/lib/zodiac/types'

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

const VALID_ZODIAC_IDS: ZodiacId[] = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
]

interface PreviewInput {
  partner: {
    name: string
    birthDate: string // YYYY-MM-DD
    birthTime?: string // HH:MM
    mbti?: string
    gender?: string
  }
}

export type PreviewResult =
  | { success: true; data: CompatibilityScoreResult }
  | { success: false; error: string }

export async function calculateCompatibilityPreview(
  input: PreviewInput
): Promise<PreviewResult> {
  // 1. 인증 확인 + 요청자 프로필 조회
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: '로그인이 필요합니다.' }

  const { data: requesterProfile } = await supabase
    .from('profiles')
    .select('day_pillar, zodiac_sign, mbti, nickname, gender')
    .eq('id', user.id)
    .single()

  if (!requesterProfile)
    return { success: false, error: '프로필을 먼저 완성해주세요.' }

  // 2. 요청자 PersonCompatibilityInput 구성
  let requesterDayPillar: Pillar | null = null
  if (requesterProfile.day_pillar) {
    try {
      requesterDayPillar = parseDayPillar(requesterProfile.day_pillar)
    } catch {
      // 파싱 실패 시 null로 유지 (사주 기본 50점 적용)
    }
  }

  const requesterZodiacId =
    requesterProfile.zodiac_sign &&
    VALID_ZODIAC_IDS.includes(requesterProfile.zodiac_sign as ZodiacId)
      ? (requesterProfile.zodiac_sign as ZodiacId)
      : null

  const requesterMbti =
    requesterProfile.mbti &&
    VALID_MBTI_TYPES.includes(requesterProfile.mbti as MbtiType)
      ? (requesterProfile.mbti as MbtiType)
      : null

  const person1: PersonCompatibilityInput = {
    dayPillar: requesterDayPillar,
    zodiacId: requesterZodiacId,
    mbti: requesterMbti,
    name: requesterProfile.nickname ?? '나',
    gender: requesterProfile.gender ?? null,
  }

  // 3. 파트너 입력값 검증 + PersonCompatibilityInput 구성
  const { partner } = input
  const trimmedName = partner.name?.trim()
  if (!trimmedName || trimmedName.length < 1 || trimmedName.length > 20)
    return { success: false, error: '이름은 1~20자로 입력해주세요.' }

  const birthDate = new Date(partner.birthDate)
  if (isNaN(birthDate.getTime()))
    return { success: false, error: '생년월일이 올바르지 않습니다.' }

  let partnerDayPillar: Pillar | null = null
  try {
    const hour = partner.birthTime
      ? parseInt(partner.birthTime.split(':')[0], 10)
      : undefined
    const sajuProfile = await getSajuProfile(birthDate, hour)
    partnerDayPillar = sajuProfile.dayPillar
  } catch {
    // 계산 실패 시 null로 유지 (사주 기본 50점 적용)
  }

  let partnerZodiacId: ZodiacId | null = null
  try {
    const zodiac = getZodiacSign(
      birthDate.getUTCMonth() + 1,
      birthDate.getUTCDate()
    )
    partnerZodiacId = zodiac.id
  } catch {
    // 계산 실패 시 null로 유지
  }

  const partnerMbti =
    partner.mbti && VALID_MBTI_TYPES.includes(partner.mbti as MbtiType)
      ? (partner.mbti as MbtiType)
      : null

  const person2: PersonCompatibilityInput = {
    dayPillar: partnerDayPillar,
    zodiacId: partnerZodiacId,
    mbti: partnerMbti,
    name: trimmedName,
    gender: partner.gender ?? null,
  }

  // 4. 점수 계산 (LLM 없음)
  const scoreResult = calculateCompatibilityScore(person1, person2)

  return { success: true, data: scoreResult }
}
