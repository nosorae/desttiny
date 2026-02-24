// lib/compatibility/saju/__tests__/saju-compatibility.test.ts
import { describe, it, expect } from 'vitest'

import type { Pillar } from '../../../saju/types'
import { calculateSajuCompatibility } from '../calculator'

// 테스트용 Pillar 생성 헬퍼
function makePillar(stem: string, branch: string, element: string): Pillar {
  return {
    stem: stem as Pillar['stem'],
    branch: branch as Pillar['branch'],
    label: `${stem}${branch}`,
    element: element as Pillar['element'],
  }
}

describe('calculateSajuCompatibility - 오행 궁합 점수', () => {
  it('상생 관계: 목(갑인) ↔ 화(병오) → 높은 점수', () => {
    const p1 = makePillar('갑', '인', 'wood')
    const p2 = makePillar('병', '오', 'fire')
    const result = calculateSajuCompatibility(p1, p2)
    expect(result.score).toBeGreaterThan(60)
  })

  it('비화 관계: 갑인 ↔ 을묘 (둘 다 wood) → 중간 점수', () => {
    const p1 = makePillar('갑', '인', 'wood')
    const p2 = makePillar('을', '묘', 'wood')
    const result = calculateSajuCompatibility(p1, p2)
    expect(result.score).toBeGreaterThanOrEqual(40)
    expect(result.score).toBeLessThanOrEqual(70)
  })

  it('상극 관계: 목(갑인) ↔ 토(무진) → 낮은 점수', () => {
    const p1 = makePillar('갑', '인', 'wood')
    const p2 = makePillar('무', '진', 'earth')
    const result = calculateSajuCompatibility(p1, p2)
    expect(result.score).toBeLessThan(50)
  })

  it('지지 합(자축합): 갑자 ↔ 을축 → 보너스 적용됨', () => {
    const p1 = makePillar('갑', '자', 'wood')
    const p2 = makePillar('을', '축', 'wood')
    const withCombination = calculateSajuCompatibility(p1, p2)

    const p1NoCombo = makePillar('갑', '인', 'wood')
    const p2NoCombo = makePillar('을', '묘', 'wood')
    const withoutCombination = calculateSajuCompatibility(p1NoCombo, p2NoCombo)

    // 합이 있는 경우가 더 높아야 함
    expect(withCombination.score).toBeGreaterThanOrEqual(
      withoutCombination.score
    )
  })

  it('지지 충(자오충): 갑자 ↔ 병오 → 충 페널티 적용됨', () => {
    const p1 = makePillar('갑', '자', 'wood')
    const p2 = makePillar('병', '오', 'fire')
    const withClash = calculateSajuCompatibility(p1, p2)

    const p1NoClash = makePillar('갑', '인', 'wood')
    const p2NoClash = makePillar('병', '사', 'fire')
    const withoutClash = calculateSajuCompatibility(p1NoClash, p2NoClash)

    // 충이 있는 경우가 더 낮아야 함
    expect(withClash.score).toBeLessThanOrEqual(withoutClash.score)
  })

  it('점수는 항상 0-100 범위이다', () => {
    const combinations: [Pillar, Pillar][] = [
      [makePillar('갑', '자', 'wood'), makePillar('갑', '자', 'wood')],
      [makePillar('경', '신', 'metal'), makePillar('갑', '인', 'wood')],
      [makePillar('임', '자', 'water'), makePillar('병', '오', 'fire')],
    ]

    for (const [p1, p2] of combinations) {
      const result = calculateSajuCompatibility(p1, p2)
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
    }
  })

  it('결과에 reason과 details가 포함된다', () => {
    const p1 = makePillar('갑', '자', 'wood')
    const p2 = makePillar('병', '오', 'fire')
    const result = calculateSajuCompatibility(p1, p2)
    expect(result.reason).toBeTruthy()
    expect(Array.isArray(result.details)).toBe(true)
  })

  it('대칭성: A↔B 결과와 B↔A 결과가 동일하다 (상극 쌍: 목↔토)', () => {
    const p1 = makePillar('갑', '자', 'wood')
    const p2 = makePillar('무', '진', 'earth')
    const ab = calculateSajuCompatibility(p1, p2)
    const ba = calculateSajuCompatibility(p2, p1)
    expect(ab.score).toBe(ba.score)
  })

  it('대칭성: A↔B 결과와 B↔A 결과가 동일하다 (상생 쌍: 목↔화)', () => {
    const woodPillar = makePillar('갑', '인', 'wood')
    const firePillar = makePillar('병', '사', 'fire')
    const ab = calculateSajuCompatibility(woodPillar, firePillar)
    const ba = calculateSajuCompatibility(firePillar, woodPillar)
    expect(ab.score).toBe(ba.score)
  })
})
