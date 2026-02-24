/**
 * 서양 별자리 궁합 점수 계산
 */

import type { ZodiacId } from '../../zodiac/types'
import { ZODIAC_ELEMENT, ZODIAC_KO_NAMES } from '../../zodiac/types'
import type { CompatibilityScore } from '../types'
import { ELEMENT_COMPATIBILITY } from './compatibility-map'

export function calculateZodiacCompatibility(
  z1: ZodiacId,
  z2: ZodiacId
): CompatibilityScore {
  const element1 = ZODIAC_ELEMENT[z1]
  const element2 = ZODIAC_ELEMENT[z2]

  const score = ELEMENT_COMPATIBILITY[element1][element2]

  const details: string[] = [
    `${ZODIAC_KO_NAMES[z1]}: ${element1} 원소`,
    `${ZODIAC_KO_NAMES[z2]}: ${element2} 원소`,
  ]

  const reason =
    score >= 80
      ? '두 별자리의 원소가 서로를 강하게 만드는 상생 관계입니다'
      : score >= 70
        ? '같은 원소 계열로 서로를 잘 이해합니다'
        : score >= 55
          ? '다른 원소이지만 함께 성장할 수 있습니다'
          : '원소의 특성이 달라 서로 이해하려는 노력이 필요합니다'

  return { score, reason, details }
}
