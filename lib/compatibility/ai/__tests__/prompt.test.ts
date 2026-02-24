import { describe, it, expect } from 'vitest'
import { buildCompatibilityPrompt } from '../prompt'
import type { PersonCompatibilityInput } from '../../types'

const person1: PersonCompatibilityInput = {
  dayPillar: { stem: '갑', branch: '인', label: '갑인', element: 'wood' },
  zodiacId: 'aries',
  mbti: 'INTJ',
  name: '김철수',
  gender: 'male',
}
const person2: PersonCompatibilityInput = {
  dayPillar: { stem: '병', branch: '오', label: '병오', element: 'fire' },
  zodiacId: 'leo',
  mbti: 'ENFP',
  name: '이영희',
  gender: 'female',
}

describe('buildCompatibilityPrompt', () => {
  it('두 사람 이름이 포함된다', () => {
    const prompt = buildCompatibilityPrompt({ person1, person2, relationshipType: 'lover', totalScore: 75 })
    expect(prompt).toContain('김철수')
    expect(prompt).toContain('이영희')
  })

  it('종합 점수가 포함된다', () => {
    const prompt = buildCompatibilityPrompt({ person1, person2, relationshipType: 'friend', totalScore: 82 })
    expect(prompt).toContain('82')
  })

  it('관계 유형이 한국어로 포함된다', () => {
    const prompt = buildCompatibilityPrompt({ person1, person2, relationshipType: 'friend', totalScore: 60 })
    expect(prompt).toContain('친구')
  })

  it('연인 관계는 친밀도 섹션이 포함되어 비연인보다 길다', () => {
    const loverPrompt = buildCompatibilityPrompt({ person1, person2, relationshipType: 'lover', totalScore: 80 })
    const colleaguePrompt = buildCompatibilityPrompt({ person1, person2, relationshipType: 'colleague', totalScore: 80 })
    expect(loverPrompt.length).toBeGreaterThan(colleaguePrompt.length)
  })

  it('JSON 출력 형식을 요구한다', () => {
    const prompt = buildCompatibilityPrompt({ person1, person2, relationshipType: 'friend', totalScore: 70 })
    expect(prompt).toContain('JSON')
    expect(prompt).toContain('sections')
  })
})
