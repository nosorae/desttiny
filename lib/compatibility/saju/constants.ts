/**
 * 오행 상생(相生) 관계
 * 목→화→토→금→수→목 순환
 *
 * 참고: 오행 - 위키백과 https://ko.wikipedia.org/wiki/%EC%98%A4%ED%96%89
 * 참고: nculture 오행 상생상극 - https://ncms.nculture.org/confucianism/story/2667
 */
import type { FiveElement } from '../../saju/types'

export const GENERATES: Record<FiveElement, FiveElement> = {
  wood: 'fire',
  fire: 'earth',
  earth: 'metal',
  metal: 'water',
  water: 'wood',
}

/**
 * 오행 상극(相剋) 관계
 * 목→토→수→화→금→목 순환
 */
export const CONTROLS: Record<FiveElement, FiveElement> = {
  wood: 'earth',
  earth: 'water',
  water: 'fire',
  fire: 'metal',
  metal: 'wood',
}

/**
 * 지지 6합(六合) - 두 지지가 합이 되는 쌍
 * 참고: 명리학 합충형파해 - https://ko.wikipedia.org/wiki/%EA%B6%81%ED%95%A9
 */
export const SIX_COMBINATION_PAIRS: [string, string][] = [
  ['자', '축'], // 자축합
  ['인', '해'], // 인해합
  ['묘', '술'], // 묘술합
  ['진', '유'], // 진유합
  ['사', '신'], // 사신합
  ['오', '미'], // 오미합
]

/**
 * 지지 6충(六沖) - 두 지지가 충이 되는 쌍
 */
export const SIX_CLASH_PAIRS: [string, string][] = [
  ['자', '오'], // 자오충
  ['축', '미'], // 축미충
  ['인', '신'], // 인신충
  ['묘', '유'], // 묘유충
  ['진', '술'], // 진술충
  ['사', '해'], // 사해충
]

/**
 * 점수 상수 (MVP 버전 - 추후 조정 가능)
 * 오행 상생상극 원리에 따른 기본 점수
 */
export const SAJU_SCORE_CONSTANTS = {
  /** 상생 관계 (생하는 방향: 갑→병처럼 목→화) */
  GENERATES: 20,
  /** 역상생 관계 (생받는 방향: 병→갑처럼 화→목) */
  GENERATED_BY: 15,
  /** 비화 (같은 오행) */
  SAME_ELEMENT: 10,
  /** 상극 관계 (방향 무관 - 대칭성 보장) */
  CONTROLS: -15,
  /** 역상극 관계 - CONTROLS와 동일값으로 대칭성 보장 */
  CONTROLLED_BY: -15,
  /** 지지 합 보너스 */
  BRANCH_COMBINATION: 15,
  /** 지지 충 페널티 */
  BRANCH_CLASH: -20,
  /** 기본 점수 (계산 후 정규화 기준) */
  BASE: 50,
}
