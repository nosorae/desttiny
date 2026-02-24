/**
 * MBTI 궁합 점수 계산
 */

import type { MbtiType, CompatibilityScore } from '../types'
import { MBTI_COMPATIBILITY } from './compatibility-map'

/**
 * 두 사람의 MBTI 유형으로 궁합 점수를 계산합니다.
 *
 * ⚠️ 이 점수는 커뮤니티 컨센서스 기반이며, 학술적 증거는 없습니다.
 * MBTI가 null인 경우 기본값 60점을 반환합니다.
 */
export function calculateMbtiCompatibility(
  m1: MbtiType | null,
  m2: MbtiType | null
): CompatibilityScore {
  // MBTI 없음 처리
  if (!m1 || !m2) {
    return {
      score: 60,
      reason: 'MBTI 정보를 알 수 없어 기본 점수를 제공합니다',
      details: ['MBTI를 입력하면 더 정확한 분석이 가능합니다'],
    }
  }

  const score = MBTI_COMPATIBILITY[m1][m2]

  const isGoldenPair = score === 90
  const details: string[] = [
    `${m1}과 ${m2}의 인지기능 스택 분석`,
    ...(isGoldenPair
      ? ['황금 쌍(Golden Pair): 인지기능이 완벽히 보완됩니다']
      : []),
  ]

  const reason =
    score >= 85
      ? '인지기능이 완벽히 보완되는 이상적인 궁합입니다'
      : score >= 75
        ? '서로를 잘 이해하고 성장을 도울 수 있는 관계입니다'
        : score >= 65
          ? '무난하게 잘 맞는 관계입니다'
          : '서로 다른 방식으로 세상을 바라보지만 그것이 강점이 될 수 있습니다'

  return { score, reason, details }
}
