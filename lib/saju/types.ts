// lib/saju/types.ts

export type HeavenlyStem =
  | '갑'
  | '을'
  | '병'
  | '정'
  | '무'
  | '기'
  | '경'
  | '신'
  | '임'
  | '계'

export type EarthlyBranch =
  | '자'
  | '축'
  | '인'
  | '묘'
  | '진'
  | '사'
  | '오'
  | '미'
  | '신'
  | '유'
  | '술'
  | '해'

export type FiveElement = 'wood' | 'fire' | 'earth' | 'metal' | 'water'

export interface Pillar {
  /** 천간 (갑, 을, 병, ...) */
  stem: HeavenlyStem
  /** 지지 (자, 축, 인, ...) */
  branch: EarthlyBranch
  /** 결합 레이블 (갑자, 을축, ...) */
  label: string
  /** 천간의 오행 */
  element: FiveElement
}

/**
 * 사주 4주 프로필
 * 연주/월주/일주/시주 각각 Pillar 타입으로 구성
 */
export interface SajuProfile {
  /** 년주 (입춘 기준으로 년이 바뀜) */
  yearPillar: Pillar
  /** 월주 (24절기 기준으로 월이 바뀜) */
  monthPillar: Pillar
  /** 일주 (궁합 분석에 주로 사용) */
  dayPillar: Pillar
  /** 시주 (시간을 모르면 null) */
  hourPillar: Pillar | null
}

/** 천간 → 오행 매핑 */
export const STEM_TO_ELEMENT: Record<HeavenlyStem, FiveElement> = {
  갑: 'wood',
  을: 'wood',
  병: 'fire',
  정: 'fire',
  무: 'earth',
  기: 'earth',
  경: 'metal',
  신: 'metal',
  임: 'water',
  계: 'water',
}

/** 지지 → 오행 매핑 */
export const BRANCH_TO_ELEMENT: Record<EarthlyBranch, FiveElement> = {
  자: 'water',
  축: 'earth',
  인: 'wood',
  묘: 'wood',
  진: 'earth',
  사: 'fire',
  오: 'fire',
  미: 'earth',
  신: 'metal',
  유: 'metal',
  술: 'earth',
  해: 'water',
}

/** 한자 천간 → 한글 변환 */
export const HANJA_STEM_TO_KOREAN: Record<string, HeavenlyStem> = {
  甲: '갑',
  乙: '을',
  丙: '병',
  丁: '정',
  戊: '무',
  己: '기',
  庚: '경',
  辛: '신',
  壬: '임',
  癸: '계',
}

/** 한자 지지 → 한글 변환 */
export const HANJA_BRANCH_TO_KOREAN: Record<string, EarthlyBranch> = {
  子: '자',
  丑: '축',
  寅: '인',
  卯: '묘',
  辰: '진',
  巳: '사',
  午: '오',
  未: '미',
  申: '신',
  酉: '유',
  戌: '술',
  亥: '해',
}
