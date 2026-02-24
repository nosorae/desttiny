/**
 * POST /api/compatibility - 궁합 계산 API 엔드포인트
 *
 * 로그인 사용자의 사주/별자리/MBTI와 파트너 정보를 받아 궁합을 계산합니다.
 * 파트너는 (A) 등록된 사용자 ID 또는 (B) 직접 입력 두 가지 방식으로 지정 가능.
 *
 * 무료 슬롯 시스템: use_daily_slot() RPC로 원자적으로 슬롯 확인 + 소진 처리
 * used_count >= max_count이면 false 반환 → 402 반환 (유료 결제 필요)
 *
 * Debug 필드: 개발·QA용으로 실제 LLM 프롬프트와 raw 응답을 항상 포함
 */

import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createLLMProvider } from '@/lib/llm/factory'
import { calculateCompatibility } from '@/lib/compatibility/calculator'
import { parseDayPillar, getSajuProfile } from '@/lib/saju'
import { getZodiacSign } from '@/lib/zodiac/calculator'
import type { LLMProvider } from '@/lib/llm/types'
import type {
  RelationshipType,
  MbtiType,
  PersonCompatibilityInput,
  CompatibilityResult,
} from '@/lib/compatibility/types'
import type { ZodiacId } from '@/lib/zodiac/types'
import type { Pillar } from '@/lib/saju/types'

// ===== 유효값 상수 =====

const VALID_RELATIONSHIP_TYPES: RelationshipType[] = [
  'lover',
  'ex',
  'crush',
  'friend',
  'colleague',
  'family',
]

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

// ===== 요청 바디 타입 =====

interface PartnerInput {
  // 옵션 A: 등록된 사용자 UUID
  partnerId?: string
  // 옵션 B: 직접 입력
  name?: string
  birthDate?: string   // YYYY-MM-DD
  birthTime?: string   // HH:MM (optional)
  mbti?: string
  gender?: string
}

interface RequestBody {
  relationshipType: string
  partner: PartnerInput
}

// ===== 헬퍼 함수 =====

/**
 * YYYY-MM-DD 문자열을 Date 객체로 변환
 * new Date('YYYY-MM-DD')는 UTC 자정으로 파싱되므로 UTC getter로 일관되게 사용
 */
function parseBirthDate(dateStr: string): Date {
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) {
    throw new Error(`유효하지 않은 날짜 형식: "${dateStr}"`)
  }
  return date
}

/**
 * HH:MM 형식의 시간 문자열에서 시간(hour)만 추출
 * 없으면 undefined 반환 (시주 계산 생략)
 */
function parseBirthHour(timeStr?: string): number | undefined {
  if (!timeStr) return undefined
  const [hourStr] = timeStr.split(':')
  const hour = parseInt(hourStr, 10)
  if (isNaN(hour) || hour < 0 || hour > 23) {
    throw new Error(`유효하지 않은 시간 형식: "${timeStr}"`)
  }
  return hour
}

/**
 * 직접 입력 파트너의 사주 일주를 계산
 * 실패 시 null 반환 (기본 50점 적용)
 */
async function computePartnerDayPillar(
  birthDate: Date,
  birthHour?: number
): Promise<Pillar | null> {
  try {
    const sajuProfile = await getSajuProfile(birthDate, birthHour)
    return sajuProfile.dayPillar
  } catch (error) {
    console.warn('[computePartnerDayPillar] 사주 계산 실패, null 사용:', error)
    return null
  }
}

/**
 * 직접 입력 파트너의 별자리를 계산
 * 실패 시 null 반환 (기본 50점 적용)
 */
function computePartnerZodiacId(birthDate: Date): ZodiacId | null {
  try {
    const month = birthDate.getUTCMonth() + 1
    const day = birthDate.getUTCDate()
    return getZodiacSign(month, day).id
  } catch (error) {
    console.warn('[computePartnerZodiacId] 별자리 계산 실패, null 사용:', error)
    return null
  }
}

// ===== 메인 핸들러 =====

export async function POST(request: NextRequest) {
  // ===== 1. 인증 확인 =====
  // Supabase Auth 세션 없으면 401 반환
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: '로그인이 필요합니다.' },
      { status: 401 }
    )
  }

  // ===== 2. 요청 바디 파싱 및 유효성 검사 =====
  let body: RequestBody
  try {
    body = (await request.json()) as RequestBody
  } catch {
    return NextResponse.json(
      { error: '요청 바디를 파싱할 수 없습니다.' },
      { status: 400 }
    )
  }

  const { relationshipType, partner } = body

  if (!relationshipType || !VALID_RELATIONSHIP_TYPES.includes(relationshipType as RelationshipType)) {
    return NextResponse.json(
      {
        error: `유효하지 않은 관계 유형입니다. 가능한 값: ${VALID_RELATIONSHIP_TYPES.join(', ')}`,
      },
      { status: 400 }
    )
  }

  if (!partner) {
    return NextResponse.json(
      { error: '파트너 정보가 필요합니다.' },
      { status: 400 }
    )
  }

  // 옵션 A/B 중 하나는 반드시 있어야 함
  const isPartnerById = !!partner.partnerId
  const isDirectInput = !!partner.name && !!partner.birthDate

  if (!isPartnerById && !isDirectInput) {
    return NextResponse.json(
      { error: '파트너 정보를 입력해주세요. partnerId 또는 name + birthDate가 필요합니다.' },
      { status: 400 }
    )
  }

  // MBTI 유효성 검사 (있는 경우)
  if (partner.mbti && !VALID_MBTI_TYPES.includes(partner.mbti as MbtiType)) {
    return NextResponse.json(
      { error: `유효하지 않은 MBTI 유형입니다: "${partner.mbti}"` },
      { status: 400 }
    )
  }

  // ===== 3. 요청자(로그인 사용자) 프로필 조회 =====
  const { data: requesterProfile, error: requesterError } = await supabase
    .from('profiles')
    .select('id, day_pillar, zodiac_sign, mbti, nickname, gender')
    .eq('id', user.id)
    .single()

  if (requesterError || !requesterProfile) {
    return NextResponse.json(
      { error: '사용자 프로필을 찾을 수 없습니다.' },
      { status: 404 }
    )
  }

  // 요청자 사주 일주 파싱 (없으면 null → 기본 50점)
  let requesterDayPillar: Pillar | null = null
  if (requesterProfile.day_pillar) {
    try {
      requesterDayPillar = parseDayPillar(requesterProfile.day_pillar)
    } catch (error) {
      console.warn('[POST /api/compatibility] 요청자 일주 파싱 실패:', error)
    }
  }

  // 요청자 별자리 (유효한 ZodiacId인지 확인)
  const requesterZodiacId =
    requesterProfile.zodiac_sign &&
    VALID_ZODIAC_IDS.includes(requesterProfile.zodiac_sign as ZodiacId)
      ? (requesterProfile.zodiac_sign as ZodiacId)
      : null

  // 요청자 MBTI (유효한 MbtiType인지 확인)
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

  // ===== 4. 파트너 정보 구성 =====
  let person2: PersonCompatibilityInput
  // DB 저장용 파트너 메타데이터
  let partnerIdForDb: string | null = null
  let partnerNameForDb: string | null = null
  let partnerBirthDateForDb: string | null = null
  let partnerBirthTimeForDb: string | null = null
  let partnerDayPillarForDb: string | null = null
  let partnerZodiacSignForDb: string | null = null
  let partnerMbtiForDb: string | null = null
  let partnerGenderForDb: string | null = null

  if (isPartnerById) {
    // 옵션 A: 등록된 사용자 조회
    const { data: partnerProfile, error: partnerError } = await supabase
      .from('profiles')
      .select('id, day_pillar, zodiac_sign, mbti, nickname, gender')
      .eq('id', partner.partnerId!)
      .single()

    if (partnerError || !partnerProfile) {
      return NextResponse.json(
        { error: '파트너 사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 파트너 사주 일주 파싱
    let partnerDayPillar: Pillar | null = null
    if (partnerProfile.day_pillar) {
      try {
        partnerDayPillar = parseDayPillar(partnerProfile.day_pillar)
      } catch (error) {
        console.warn('[POST /api/compatibility] 파트너 일주 파싱 실패:', error)
      }
    }

    const partnerZodiacId =
      partnerProfile.zodiac_sign &&
      VALID_ZODIAC_IDS.includes(partnerProfile.zodiac_sign as ZodiacId)
        ? (partnerProfile.zodiac_sign as ZodiacId)
        : null

    const partnerMbti =
      partnerProfile.mbti &&
      VALID_MBTI_TYPES.includes(partnerProfile.mbti as MbtiType)
        ? (partnerProfile.mbti as MbtiType)
        : null

    // 파트너 프로필의 gender는 우리 DB에서 가져오므로 이미 유효한 값
    // (profiles 테이블 CHECK 제약조건으로 보장됨)
    person2 = {
      dayPillar: partnerDayPillar,
      zodiacId: partnerZodiacId,
      mbti: partnerMbti,
      name: partnerProfile.nickname ?? '파트너',
      gender: partnerProfile.gender ?? null,
    }

    partnerIdForDb = partnerProfile.id
    partnerDayPillarForDb = partnerProfile.day_pillar ?? null
    partnerZodiacSignForDb = partnerProfile.zodiac_sign ?? null
    partnerMbtiForDb = partnerProfile.mbti ?? null
    partnerGenderForDb = partnerProfile.gender ?? null
  } else {
    // 옵션 B: 직접 입력으로 사주/별자리 계산
    let birthDate: Date
    try {
      birthDate = parseBirthDate(partner.birthDate!)
    } catch (error) {
      return NextResponse.json(
        { error: `생년월일 형식이 올바르지 않습니다. YYYY-MM-DD 형식으로 입력해주세요.` },
        { status: 400 }
      )
    }

    // Fix 4: birthTime HH:MM 형식 검증 (parseBirthHour 호출 전 먼저 형식 확인)
    // parseBirthHour는 숫자 범위만 체크하므로 "99:00" 같은 값이 통과될 수 있음
    if (partner.birthTime) {
      const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/
      if (!TIME_REGEX.test(partner.birthTime)) {
        return NextResponse.json({ error: '시간 형식이 올바르지 않습니다 (HH:MM)' }, { status: 400 })
      }
    }

    let birthHour: number | undefined
    try {
      birthHour = parseBirthHour(partner.birthTime)
    } catch (error) {
      return NextResponse.json(
        { error: `생시 형식이 올바르지 않습니다. HH:MM 형식으로 입력해주세요.` },
        { status: 400 }
      )
    }

    // 사주/별자리 계산 실패 시 null 사용 (기본 50점 적용)
    const [partnerDayPillar, partnerZodiacId] = await Promise.all([
      computePartnerDayPillar(birthDate, birthHour),
      Promise.resolve(computePartnerZodiacId(birthDate)),
    ])

    const partnerMbti =
      partner.mbti && VALID_MBTI_TYPES.includes(partner.mbti as MbtiType)
        ? (partner.mbti as MbtiType)
        : null

    // Fix 1: partner.gender가 'male' 또는 'female'이 아닌 경우 null로 처리
    // gender는 선택 필드이므로 잘못된 값은 조용히 null로 변환 (사용자 경험 우선)
    const partnerGender = partner.gender === 'male' || partner.gender === 'female'
      ? partner.gender
      : null

    person2 = {
      dayPillar: partnerDayPillar,
      zodiacId: partnerZodiacId,
      mbti: partnerMbti,
      name: partner.name!,
      gender: partnerGender,
    }

    partnerNameForDb = partner.name!
    partnerBirthDateForDb = partner.birthDate!
    partnerBirthTimeForDb = partner.birthTime ?? null
    partnerDayPillarForDb = partnerDayPillar?.label ?? null
    partnerZodiacSignForDb = partnerZodiacId
    partnerMbtiForDb = partnerMbti  // validated 값 사용 (partner.mbti는 원시 입력이므로 직접 저장하면 DB 제약 위반 가능)
    partnerGenderForDb = partnerGender
  }

  // ===== 5. 무료 슬롯 원자적 사용 =====
  // use_daily_slot()는 SECURITY DEFINER 함수로 RLS 우회 + race condition 방지
  // (SELECT + UPDATE를 분리하면 동시 요청 시 중복 소진 가능)
  const today = new Date().toISOString().slice(0, 10) // UTC 기준 (Vercel 서버 환경)
  const { data: slotUsed, error: slotError } = await supabase.rpc('use_daily_slot', {
    p_slot_date: today,
  })

  if (slotError) {
    // RPC 오류는 서버 에러 (슬롯 소진과 구분하여 클라이언트가 잘못 결제 시도하지 않도록)
    console.error('[POST /api/compatibility] 슬롯 RPC 오류:', slotError)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }

  if (!slotUsed) {
    return NextResponse.json(
      { error: '오늘의 무료 궁합이 모두 소진되었습니다. 결제 후 이용해주세요' },
      { status: 402 }
    )
  }

  // ===== 6. LLM 프롬프트/응답 캡처를 위한 debug provider 래핑 =====
  // 실제 provider를 래핑해서 프롬프트와 raw 응답을 캡처
  // 디버그 및 QA 목적으로 응답에 항상 포함
  let debugPrompt = ''
  let debugRawResponse = ''

  const realProvider = createLLMProvider()
  const debugProvider: LLMProvider = {
    name: realProvider.name,
    model: realProvider.model,
    generateText: async (prompt: string) => {
      debugPrompt = prompt
      const response = await realProvider.generateText(prompt)
      debugRawResponse = response
      return response
    },
  }

  // ===== 7. 궁합 계산 =====
  // Fix 3: calculateCompatibility 실패 시 500 반환 (LLM 오류 등)
  let result: CompatibilityResult
  try {
    result = await calculateCompatibility(
      person1,
      person2,
      relationshipType as RelationshipType,
      debugProvider
    )
  } catch (error) {
    console.error('[POST /api/compatibility] 궁합 계산 실패:', error)
    return NextResponse.json({ error: '궁합 계산 중 오류가 발생했습니다.' }, { status: 500 })
  }

  // ===== 8. DB 저장 =====
  // 저장 실패 시 로그만 남기고 결과는 정상 반환 (사용자 경험 우선)
  let savedId: string | null = null

  const { data: savedResult, error: saveError } = await supabase
    .from('compatibility_results')
    .insert({
      requester_id: user.id,
      partner_id: partnerIdForDb,
      partner_name: partnerNameForDb,
      partner_birth_date: partnerBirthDateForDb,
      partner_birth_time: partnerBirthTimeForDb,
      partner_day_pillar: partnerDayPillarForDb,
      partner_zodiac_sign: partnerZodiacSignForDb,
      partner_mbti: partnerMbtiForDb,
      partner_gender: partnerGenderForDb,
      relationship_type: relationshipType,
      total_score: result.totalScore,
      saju_score: result.breakdown.saju.score,
      zodiac_score: result.breakdown.zodiac.score,
      mbti_score: result.breakdown.mbti.score,
      // analysis 객체를 JSON 문자열로 직렬화하여 저장
      ai_summary: JSON.stringify(result.analysis),
      is_paid: false,
    })
    .select('id')
    .single()

  if (saveError) {
    console.error('[POST /api/compatibility] DB 저장 실패:', saveError)
  } else {
    savedId = savedResult?.id ?? null
  }

  // ===== 9. 응답 반환 =====
  return NextResponse.json({
    id: savedId,
    totalScore: result.totalScore,
    breakdown: result.breakdown,
    analysis: result.analysis,
    debug: {
      provider: realProvider.name,
      model: realProvider.model,
      prompt: debugPrompt,
      rawLLMResponse: debugRawResponse,
    },
  })
}
