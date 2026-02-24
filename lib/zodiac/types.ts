// lib/zodiac/types.ts

export type ZodiacId =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces'

export type ZodiacElement = 'fire' | 'earth' | 'air' | 'water'

export interface ZodiacSign {
  id: ZodiacId
  /** 한국어 이름 */
  ko: string
  /** 4원소 */
  element: ZodiacElement
  /** 유니코드 이모지 기호 */
  emoji: string
}

/** 별자리 ID → 한국어 이름 매핑 */
export const ZODIAC_KO_NAMES: Record<ZodiacId, string> = {
  aries: '양자리',
  taurus: '황소자리',
  gemini: '쌍둥이자리',
  cancer: '게자리',
  leo: '사자자리',
  virgo: '처녀자리',
  libra: '천칭자리',
  scorpio: '전갈자리',
  sagittarius: '사수자리',
  capricorn: '염소자리',
  aquarius: '물병자리',
  pisces: '물고기자리',
}

/** 별자리 ID → 이모지 매핑 */
export const ZODIAC_EMOJI: Record<ZodiacId, string> = {
  aries: '♈',
  taurus: '♉',
  gemini: '♊',
  cancer: '♋',
  leo: '♌',
  virgo: '♍',
  libra: '♎',
  scorpio: '♏',
  sagittarius: '♐',
  capricorn: '♑',
  aquarius: '♒',
  pisces: '♓',
}

/** 4원소 → 한국어 이름 매핑 (사용자에게 표시할 이름) */
export const ZODIAC_ELEMENT_KO: Record<ZodiacElement, string> = {
  fire: '불',
  earth: '흙',
  air: '바람',
  water: '물',
}

/**
 * 별자리 ID → 4원소 매핑
 * 전통 점성술 4원소 분류
 * 참고: https://en.wikipedia.org/wiki/Astrological_sign
 * 참고: https://www.britannica.com/topic/zodiac
 */
export const ZODIAC_ELEMENT: Record<ZodiacId, ZodiacElement> = {
  aries: 'fire',
  leo: 'fire',
  sagittarius: 'fire',
  taurus: 'earth',
  virgo: 'earth',
  capricorn: 'earth',
  gemini: 'air',
  libra: 'air',
  aquarius: 'air',
  cancer: 'water',
  scorpio: 'water',
  pisces: 'water',
}
