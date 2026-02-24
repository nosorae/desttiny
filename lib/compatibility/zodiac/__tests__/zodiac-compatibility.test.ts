// lib/compatibility/zodiac/__tests__/zodiac-compatibility.test.ts
import { describe, it, expect } from 'vitest'

import { calculateZodiacCompatibility } from '../calculator'

describe('calculateZodiacCompatibility - 별자리 궁합', () => {
  // 같은 원소 조합 (높은 호환성)
  it('같은 불 원소: 양자리 ↔ 사자자리 → 높은 점수', () => {
    const result = calculateZodiacCompatibility('aries', 'leo')
    expect(result.score).toBeGreaterThanOrEqual(70)
  })

  // 보완 원소 조합 (불↔바람, 흙↔물 = 상생)
  it('불↔바람 보완: 양자리 ↔ 쌍둥이자리 → 높은 점수', () => {
    const result = calculateZodiacCompatibility('aries', 'gemini')
    expect(result.score).toBeGreaterThanOrEqual(70)
  })

  it('흙↔물 보완: 황소자리 ↔ 게자리 → 높은 점수', () => {
    const result = calculateZodiacCompatibility('taurus', 'cancer')
    expect(result.score).toBeGreaterThanOrEqual(70)
  })

  // 대칭성 테스트
  it('대칭성: A↔B = B↔A', () => {
    const ab = calculateZodiacCompatibility('aries', 'taurus')
    const ba = calculateZodiacCompatibility('taurus', 'aries')
    expect(ab.score).toBe(ba.score)
  })

  // 점수 범위
  it('점수는 항상 0-100 범위이다', () => {
    const result = calculateZodiacCompatibility('aries', 'scorpio')
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('동일 별자리 = 중간 이상 점수', () => {
    const result = calculateZodiacCompatibility('aries', 'aries')
    expect(result.score).toBeGreaterThanOrEqual(60)
  })

  it('결과에 reason과 details가 포함된다', () => {
    const result = calculateZodiacCompatibility('aries', 'leo')
    expect(result.reason).toBeTruthy()
    expect(Array.isArray(result.details)).toBe(true)
  })
})
