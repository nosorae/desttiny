// lib/compatibility/mbti/__tests__/mbti-compatibility.test.ts
import { describe, it, expect } from 'vitest'

import { calculateMbtiCompatibility } from '../calculator'

describe('calculateMbtiCompatibility - MBTI 궁합', () => {
  // 황금 쌍(Golden Pair) 테스트 - 인지기능이 완벽히 보완됨
  it('INTJ ↔ ENFP: 황금 쌍 → 90점', () => {
    expect(calculateMbtiCompatibility('INTJ', 'ENFP').score).toBe(90)
  })
  it('INFJ ↔ ENTP: 황금 쌍 → 90점', () => {
    expect(calculateMbtiCompatibility('INFJ', 'ENTP').score).toBe(90)
  })
  it('INTP ↔ ENFJ: 황금 쌍 → 90점', () => {
    expect(calculateMbtiCompatibility('INTP', 'ENFJ').score).toBe(90)
  })
  it('INFP ↔ ENTJ: 황금 쌍 → 90점', () => {
    expect(calculateMbtiCompatibility('INFP', 'ENTJ').score).toBe(90)
  })

  // null MBTI 처리
  it('MBTI가 null이면 기본값 60점 반환', () => {
    const result = calculateMbtiCompatibility(null, 'INTJ')
    expect(result.score).toBe(60)
    expect(result.reason).toContain('알 수 없')
  })
  it('둘 다 null이면 60점 반환', () => {
    expect(calculateMbtiCompatibility(null, null).score).toBe(60)
  })

  // 대칭성
  it('대칭성: INTJ↔INFP = INFP↔INTJ', () => {
    const ab = calculateMbtiCompatibility('INTJ', 'INFP')
    const ba = calculateMbtiCompatibility('INFP', 'INTJ')
    expect(ab.score).toBe(ba.score)
  })

  // 점수 범위
  it('점수는 항상 0-100 범위이다', () => {
    const result = calculateMbtiCompatibility('ISTJ', 'ESFP')
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })
})
