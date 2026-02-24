/**
 * 사주 일주 오행 기반 궁합 점수 계산
 *
 * 오행 상생상극 원리 (전통 명리학):
 * - 상생(相生): 목→화→토→금→수→목 (생성 관계)
 * - 상극(相剋): 목→토→수→화→금→목 (억제 관계)
 *
 * 지지 합충 관계:
 * - 6합: 자축합, 인해합, 묘술합, 진유합, 사신합, 오미합
 * - 6충: 자오충, 축미충, 인신충, 묘유충, 진술충, 사해충
 *
 * 참고: 오행 - https://ko.wikipedia.org/wiki/%EC%98%A4%ED%96%89
 * 참고: nculture 오행 상생상극 - https://ncms.nculture.org/confucianism/story/2667
 * 참고: 궁합 - https://ko.wikipedia.org/wiki/%EA%B6%81%ED%95%A9
 */

import type { Pillar } from '../../saju/types'
import { ELEMENT_KO_NAME } from '../../saju/types'
import type { CompatibilityScore } from '../types'
import {
  GENERATES,
  CONTROLS,
  SIX_COMBINATION_PAIRS,
  SIX_CLASH_PAIRS,
  SAJU_SCORE_CONSTANTS,
} from './constants'

/** 두 지지가 합 관계인지 확인 */
function hasCombination(branch1: string, branch2: string): boolean {
  return SIX_COMBINATION_PAIRS.some(
    ([a, b]) =>
      (a === branch1 && b === branch2) || (a === branch2 && b === branch1)
  )
}

/** 두 지지가 충 관계인지 확인 */
function hasClash(branch1: string, branch2: string): boolean {
  return SIX_CLASH_PAIRS.some(
    ([a, b]) =>
      (a === branch1 && b === branch2) || (a === branch2 && b === branch1)
  )
}

/**
 * 두 사람의 사주 일주를 비교하여 오행 궁합 점수를 계산합니다.
 *
 * @param p1DayPillar - 사람1의 일주
 * @param p2DayPillar - 사람2의 일주
 * @returns 0-100 궁합 점수 및 설명
 */
export function calculateSajuCompatibility(
  p1DayPillar: Pillar,
  p2DayPillar: Pillar
): CompatibilityScore {
  const C = SAJU_SCORE_CONSTANTS
  let rawScore = C.BASE
  const details: string[] = []

  const e1 = p1DayPillar.element
  const e2 = p2DayPillar.element

  const e1Ko = ELEMENT_KO_NAME[e1]
  const e2Ko = ELEMENT_KO_NAME[e2]

  // 천간 오행 관계 분석
  if (e1 === e2) {
    rawScore += C.SAME_ELEMENT
    details.push(`두 사람 모두 ${e1Ko} 오행 - 비화(比和) 관계`)
  } else if (GENERATES[e1] === e2) {
    rawScore += C.GENERATES
    details.push(`${e1Ko}이 ${e2Ko}를 생함 - 상생(相生) 관계`)
  } else if (GENERATES[e2] === e1) {
    rawScore += C.GENERATED_BY
    details.push(`${e2Ko}이 ${e1Ko}를 생함 - 상생(相生) 관계`)
  } else if (CONTROLS[e1] === e2) {
    rawScore += C.CONTROLS
    details.push(`${e1Ko}이 ${e2Ko}를 극함 - 상극(相剋) 관계`)
  } else if (CONTROLS[e2] === e1) {
    rawScore += C.CONTROLLED_BY
    details.push(`${e2Ko}이 ${e1Ko}를 극함 - 상극(相剋) 관계`)
  }

  // 지지 합충 분석
  if (hasCombination(p1DayPillar.branch, p2DayPillar.branch)) {
    rawScore += C.BRANCH_COMBINATION
    details.push(`일지 합(合) - ${p1DayPillar.branch}${p2DayPillar.branch}합`)
  } else if (hasClash(p1DayPillar.branch, p2DayPillar.branch)) {
    rawScore += C.BRANCH_CLASH
    details.push(
      `일지 충(沖) - ${p1DayPillar.branch}${p2DayPillar.branch}충 주의`
    )
  }

  // 0-100 정규화
  const score = Math.max(0, Math.min(100, rawScore))

  // 종합 설명 생성
  const reason =
    score >= 70
      ? '오행이 잘 어우러져 조화로운 관계입니다'
      : score >= 50
        ? '무난한 관계입니다'
        : '오행의 충돌이 있어 서로 이해와 배려가 필요합니다'

  return { score, reason, details }
}
