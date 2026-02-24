import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { LLMProvider } from '../../llm/types'
import type { PersonCompatibilityInput } from '../types'

// 테스트용 Mock LLM Provider - 실제 API 호출 없이 테스트
const mockProvider: LLMProvider = {
  name: 'mock',
  model: 'mock-model',
  generateText: vi.fn().mockResolvedValue(
    JSON.stringify({
      summary: '테스트 요약',
      sections: [
        { title: '소통', content: '내용', area: 'communication' },
        { title: '감정', content: '내용', area: 'emotion' },
        { title: '가치관', content: '내용', area: 'values' },
        { title: '생활', content: '내용', area: 'lifestyle' },
        { title: '갈등', content: '내용', area: 'conflict' },
      ],
      finalSummary: '테스트 마무리',
    })
  ),
}

import { calculateCompatibility } from '../calculator'

function makePerson(
  stem: string, branch: string, element: string,
  zodiacId: string, mbti: string | null = null
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

describe('calculateCompatibility - 3체계 통합', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('통합 점수는 0-100 범위이다', async () => {
    const result = await calculateCompatibility(
      makePerson('갑', '인', 'wood', 'aries', 'INTJ'),
      makePerson('병', '오', 'fire', 'leo', 'ENFP'),
      'friend', mockProvider
    )
    expect(result.totalScore).toBeGreaterThanOrEqual(0)
    expect(result.totalScore).toBeLessThanOrEqual(100)
  })

  it('breakdown에 3체계 점수가 모두 포함된다', async () => {
    const result = await calculateCompatibility(
      makePerson('갑', '인', 'wood', 'aries', 'INTJ'),
      makePerson('병', '오', 'fire', 'leo', 'ENFP'),
      'friend', mockProvider
    )
    expect(result.breakdown.saju.score).toBeGreaterThanOrEqual(0)
    expect(result.breakdown.zodiac.score).toBeGreaterThanOrEqual(0)
    expect(result.breakdown.mbti.score).toBeGreaterThanOrEqual(0)
  })

  it('가중치 계산이 올바르다 (사주 40% + 별자리 30% + MBTI 30%)', async () => {
    const result = await calculateCompatibility(
      makePerson('갑', '인', 'wood', 'aries', 'INTJ'),
      makePerson('병', '오', 'fire', 'leo', 'ENFP'),
      'friend', mockProvider
    )
    const expected = Math.round(
      result.breakdown.saju.score * 0.4 +
      result.breakdown.zodiac.score * 0.3 +
      result.breakdown.mbti.score * 0.3
    )
    expect(result.totalScore).toBe(expected)
  })

  it('MBTI null이어도 계산된다', async () => {
    const result = await calculateCompatibility(
      makePerson('갑', '인', 'wood', 'aries', null),
      makePerson('병', '오', 'fire', 'leo', null),
      'friend', mockProvider
    )
    expect(result.totalScore).toBeGreaterThanOrEqual(0)
  })

  it('dayPillar null이면 사주 점수 기본값 50을 사용한다', async () => {
    const result = await calculateCompatibility(
      { dayPillar: null, zodiacId: 'aries', mbti: 'INTJ', name: '테스트', gender: null },
      makePerson('병', '오', 'fire', 'leo', 'ENFP'),
      'friend', mockProvider
    )
    expect(result.breakdown.saju.score).toBe(50)
  })

  it('analysis에 summary와 sections이 포함된다', async () => {
    const result = await calculateCompatibility(
      makePerson('갑', '인', 'wood', 'aries', 'INTJ'),
      makePerson('병', '오', 'fire', 'leo', 'ENFP'),
      'lover', mockProvider
    )
    expect(result.analysis.summary).toBeTruthy()
    expect(Array.isArray(result.analysis.sections)).toBe(true)
    expect(result.analysis.finalSummary).toBeTruthy()
  })

  it('LLM JSON 파싱 실패 시 폴백 해설을 반환한다', async () => {
    const badProvider: LLMProvider = {
      name: 'bad',
      model: 'bad-model',
      generateText: vi.fn().mockResolvedValue('이건 JSON이 아닙니다'),
    }
    const result = await calculateCompatibility(
      makePerson('갑', '인', 'wood', 'aries', 'INTJ'),
      makePerson('병', '오', 'fire', 'leo', 'ENFP'),
      'friend', badProvider
    )
    expect(result.analysis.summary).toBeTruthy()
    expect(result.totalScore).toBeGreaterThanOrEqual(0)
  })
})
