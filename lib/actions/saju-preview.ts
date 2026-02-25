'use server'

// Server Action: 생년월일 입력 시 사주 일주 + 별자리를 실시간으로 미리보기 제공
// 온보딩 Step 1에서 BirthDateInput의 showPreview에 사용
// 클라이언트에서 debounce(500ms) 후 호출하여 불필요한 서버 호출 최소화

import { getSajuProfile } from '@/lib/saju'
import { getZodiacSign } from '@/lib/zodiac/calculator'
import { ZODIAC_KO_NAMES, ZODIAC_EMOJI } from '@/lib/zodiac/types'

export interface SajuPreviewResult {
  dayPillar: string | null
  zodiacSign: string | null
  zodiacEmoji: string | null
}

/**
 * 생년월일로 사주 일주와 별자리를 계산하여 미리보기 데이터 반환
 *
 * 계산 실패 시 null 값으로 반환 (사용자 입력 중이므로 에러 표시 불필요)
 *
 * @param birthDate - YYYY-MM-DD 형식 문자열
 * @param birthHour - 태어난 시간 (0-23), 모르면 null
 */
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

    // 사주 일주 계산 (birthHour가 null이면 시주 생략)
    const sajuProfile = await getSajuProfile(date, birthHour ?? undefined)
    result.dayPillar = sajuProfile.dayPillar.label

    // 별자리 계산 - UTC getter 사용 (new Date('YYYY-MM-DD')는 UTC 자정으로 파싱)
    const month = date.getUTCMonth() + 1
    const day = date.getUTCDate()
    const zodiac = getZodiacSign(month, day)
    result.zodiacSign = ZODIAC_KO_NAMES[zodiac.id]
    result.zodiacEmoji = ZODIAC_EMOJI[zodiac.id]
  } catch (error) {
    // 사용자 입력 중 부분적 날짜로 계산 실패하는 것은 정상
    console.warn('[getSajuPreview] 계산 실패:', error)
  }

  return result
}
