/**
 * 서양 별자리 4원소 기반 궁합 점수 매핑
 *
 * 4원소 호환성 원리 (전통 점성술):
 * - 불(fire) + 바람(air): 상생 → 85점 (불이 바람에 의해 강해짐)
 * - 흙(earth) + 물(water): 상생 → 80점 (물이 흙을 비옥하게 함)
 * - 같은 원소: 상호 이해 → 75점
 * - 불↔흙, 불↔물, 바람↔흙, 바람↔물: 중립/긴장 → 55점
 *
 * 참고: https://en.wikipedia.org/wiki/Astrological_sign
 * 참고: https://www.britannica.com/topic/zodiac
 * 참고: 전통 점성술 4원소 호환성 원리 (Almanac.com)
 */

import type { ZodiacElement } from '../../zodiac/types'

// 두 원소 조합 → 점수 매핑 (대칭 행렬)
export const ELEMENT_COMPATIBILITY: Record<
  ZodiacElement,
  Record<ZodiacElement, number>
> = {
  fire: {
    fire: 75, // 같은 원소: 이해하지만 충돌 가능
    earth: 50, // 불↔흙: 긴장 관계
    air: 85, // 불↔바람: 상생 (바람이 불을 강하게 함)
    water: 45, // 불↔물: 상극 (물이 불을 끔)
  },
  earth: {
    fire: 50,
    earth: 75, // 같은 원소
    air: 45, // 흙↔바람: 갈등 가능
    water: 80, // 흙↔물: 상생 (물이 흙을 비옥하게 함)
  },
  air: {
    fire: 85, // 바람↔불: 상생
    earth: 45,
    air: 75, // 같은 원소
    water: 55, // 바람↔물: 중립
  },
  water: {
    fire: 45,
    earth: 80, // 물↔흙: 상생
    air: 55,
    water: 75, // 같은 원소
  },
}
