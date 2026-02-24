/**
 * zodiac-signs 라이브러리 래퍼
 *
 * 별자리 날짜 경계는 Tropical zodiac 기준
 * 매년 1-2일 차이가 있으나 고정 날짜 사용 (점성술 관행)
 *
 * ⚠️ zodiac-signs 라이브러리 날짜 경계가 일반 알마낙 기준과 1일 차이 있음
 * 예: 황소자리 시작일 = 4/21 (일반적으로 알려진 4/20 아님)
 * → 라이브러리 JSON 기준 그대로 사용
 *
 * 참고: zodiac-signs npm - https://github.com/helmasaur/zodiac-signs
 * 참고: Wikipedia Astrological sign - https://en.wikipedia.org/wiki/Astrological_sign
 */

import zodiacSignsFactory from 'zodiac-signs'

import type { ZodiacSign, ZodiacId } from './types'
import { ZODIAC_KO_NAMES, ZODIAC_EMOJI, ZODIAC_ELEMENT } from './types'

// zodiac-signs는 CJS 팩토리 함수 → 언어 코드를 넘겨 인스턴스 생성
const zodiacLib = (
  zodiacSignsFactory as unknown as (lang: string) => {
    getSignByDate: (opts: { month: number; day: number }) => { name: string }
  }
)('en')

/**
 * 생월/일로 서양 별자리를 계산합니다.
 *
 * @param month - 생월 (1-12)
 * @param day - 생일 (1-31)
 * @returns 별자리 정보
 */
export function getZodiacSign(month: number, day: number): ZodiacSign {
  const result = zodiacLib.getSignByDate({ month, day })

  // zodiac-signs는 영문 name을 반환 (예: 'Aries')
  const englishName = result.name.toLowerCase() as ZodiacId

  return {
    id: englishName,
    ko: ZODIAC_KO_NAMES[englishName],
    // element는 라이브러리가 경계일에 undefined 반환하는 버그가 있으므로
    // 자체 ZODIAC_ELEMENT 매핑에서 조회
    element: ZODIAC_ELEMENT[englishName],
    emoji: ZODIAC_EMOJI[englishName],
  }
}
