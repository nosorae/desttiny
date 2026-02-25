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

const mockBreakdown = {
  saju: { score: 68, reason: '무난한 관계입니다', details: ['화(火)이 목(木)를 생함 - 상생(相生) 관계'] },
  zodiac: { score: 75, reason: '불 원소 궁합', details: ['양자리-사자자리 불 원소 상생'] },
  mbti: { score: 90, reason: 'INTJ+ENFP 황금 쌍', details: ['인지기능 상호보완'] },
}

describe('buildCompatibilityPrompt', () => {
  it('두 사람 이름이 포함된다', () => {
    const prompt = buildCompatibilityPrompt({ person1, person2, relationshipType: 'lover', totalScore: 75, breakdown: mockBreakdown })
    expect(prompt).toContain('김철수')
    expect(prompt).toContain('이영희')
  })

  it('종합 점수가 포함된다', () => {
    const prompt = buildCompatibilityPrompt({ person1, person2, relationshipType: 'friend', totalScore: 82, breakdown: mockBreakdown })
    expect(prompt).toContain('82')
  })

  it('관계 유형이 한국어로 포함된다', () => {
    const prompt = buildCompatibilityPrompt({ person1, person2, relationshipType: 'friend', totalScore: 60, breakdown: mockBreakdown })
    expect(prompt).toContain('친구')
  })

  it('연인 관계는 친밀도 섹션이 포함되어 비연인보다 길다', () => {
    const loverPrompt = buildCompatibilityPrompt({ person1, person2, relationshipType: 'lover', totalScore: 80, breakdown: mockBreakdown })
    const colleaguePrompt = buildCompatibilityPrompt({ person1, person2, relationshipType: 'colleague', totalScore: 80, breakdown: mockBreakdown })
    expect(loverPrompt.length).toBeGreaterThan(colleaguePrompt.length)
  })

  it('JSON 출력 형식을 요구한다', () => {
    const prompt = buildCompatibilityPrompt({ person1, person2, relationshipType: 'friend', totalScore: 70, breakdown: mockBreakdown })
    expect(prompt).toContain('JSON')
    expect(prompt).toContain('sections')
  })

  it('계산 엔진 breakdown이 프롬프트에 포함된다', () => {
    const prompt = buildCompatibilityPrompt({ person1, person2, relationshipType: 'friend', totalScore: 75, breakdown: mockBreakdown })
    expect(prompt).toContain('3체계 계산 결과')
    expect(prompt).toContain('68점')
    expect(prompt).toContain('화(火)이 목(木)를 생함')
    expect(prompt).toContain('INTJ+ENFP 황금 쌍')
  })
})
