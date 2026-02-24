// lib/saju/__tests__/saju.test.ts
import { describe, it, expect } from 'vitest'

import { getSajuProfile } from '../index'

describe('getSajuProfile - 사주 4주 계산', () => {
  it('1990년 1월 1일 일주를 계산한다', async () => {
    const result = await getSajuProfile(new Date('1990-01-01'))
    expect(result.dayPillar).toBeDefined()
    expect(result.dayPillar.label).toHaveLength(2) // 예: '갑자'
  })

  it('2000년 1월 1일 0시 년주/월주/일주/시주를 계산한다', async () => {
    const result = await getSajuProfile(new Date('2000-01-01'), 0)
    expect(result.yearPillar).toBeDefined()
    expect(result.monthPillar).toBeDefined()
    expect(result.dayPillar).toBeDefined()
    expect(result.hourPillar).toBeDefined()
  })

  it('시간 정보 없으면 시주가 null이다', async () => {
    const result = await getSajuProfile(new Date('1985-05-20'))
    expect(result.hourPillar).toBeNull()
  })

  it('모든 Pillar는 stem, branch, label, element를 갖는다', async () => {
    const result = await getSajuProfile(new Date('1995-08-15'), 12)
    const pillars = [
      result.yearPillar,
      result.monthPillar,
      result.dayPillar,
      result.hourPillar!,
    ]
    for (const pillar of pillars) {
      expect(pillar.stem).toBeDefined()
      expect(pillar.branch).toBeDefined()
      expect(pillar.label).toBeDefined()
      expect(pillar.element).toBeDefined()
    }
  })
})

// 크로스체크 테스트 - 실제 만세력 앱에서 확인한 값
describe('만세력 앱 크로스체크', () => {
  // TODO: sajuplus.com에서 확인한 실제 일진 값으로 채우기
  // 확인 방법: sajuplus.com → 만세력 → 날짜 입력 → 일진 확인
  it.todo('1990-01-01 일진 크로스체크 (sajuplus.com 확인 필요)')
  it.todo('2000-06-15 일진 크로스체크')
  it.todo('1985-02-04 일진 크로스체크 (입춘 경계 테스트)')
  it.todo('2024-01-01 일진 크로스체크')
})
