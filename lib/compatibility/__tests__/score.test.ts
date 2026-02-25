import { describe, it, expect } from 'vitest'

import { calculateCompatibilityScore } from '../calculator'
import type { PersonCompatibilityInput } from '../types'

function makePerson(
  stem: string,
  branch: string,
  element: string,
  zodiacId: string,
  mbti: string | null = 'INTJ'
): PersonCompatibilityInput {
  return {
    dayPillar: {
      stem: stem as import('../../saju/types').HeavenlyStem,
      branch: branch as import('../../saju/types').EarthlyBranch,
      label: `${stem}${branch}`,
      element: element as import('../../saju/types').FiveElement,
    },
    zodiacId: zodiacId as import('../../zodiac/types').ZodiacId,
    mbti: mbti as import('../types').MbtiType | null,
    name: '테스트',
    gender: null,
  }
}

describe('calculateCompatibilityScore - 점수만 계산 (LLM 없음)', () => {
  it('totalScore는 0-100 범위이다', () => {
    const result = calculateCompatibilityScore(
      makePerson('갑', '인', 'wood', 'aries', 'INTJ'),
      makePerson('병', '오', 'fire', 'leo', 'ENFP')
    )
    expect(result.totalScore).toBeGreaterThanOrEqual(0)
    expect(result.totalScore).toBeLessThanOrEqual(100)
  })

  it('breakdown에 3체계 점수가 포함된다', () => {
    const result = calculateCompatibilityScore(
      makePerson('갑', '인', 'wood', 'aries', 'INTJ'),
      makePerson('병', '오', 'fire', 'leo', 'ENFP')
    )
    expect(result.breakdown.saju).toBeDefined()
    expect(result.breakdown.zodiac).toBeDefined()
    expect(result.breakdown.mbti).toBeDefined()
  })

  it('가중치 계산: 사주 40% + 별자리 30% + MBTI 30%', () => {
    const result = calculateCompatibilityScore(
      makePerson('갑', '인', 'wood', 'aries', 'INTJ'),
      makePerson('병', '오', 'fire', 'leo', 'ENFP')
    )
    const expected = Math.round(
      result.breakdown.saju.score * 0.4 +
        result.breakdown.zodiac.score * 0.3 +
        result.breakdown.mbti.score * 0.3
    )
    expect(result.totalScore).toBe(expected)
  })

  it('dayPillar null이면 사주 기본 50점', () => {
    const result = calculateCompatibilityScore(
      {
        dayPillar: null,
        zodiacId: 'aries',
        mbti: 'INTJ',
        name: '테스트',
        gender: null,
      },
      makePerson('병', '오', 'fire', 'leo', 'ENFP')
    )
    expect(result.breakdown.saju.score).toBe(50)
  })
})
