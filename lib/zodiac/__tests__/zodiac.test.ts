// lib/zodiac/__tests__/zodiac.test.ts
import { describe, it, expect } from 'vitest'

import { getZodiacSign } from '../calculator'

/**
 * zodiac-signs 라이브러리 날짜 경계 (JSON 기준):
 * aries: 3/21 - 4/20, taurus: 4/21 - 5/21, gemini: 5/22 - 6/21
 * cancer: 6/22 - 7/22, leo: 7/23 - 8/22, virgo: 8/23 - 9/23
 * libra: 9/24 - 10/23, scorpio: 10/24 - 11/22, sagittarius: 11/23 - 12/21
 * capricorn: 12/22 - 1/20, aquarius: 1/21 - 2/19, pisces: 2/20 - 3/20
 *
 * ⚠️ 일반 별자리 기준(예: 황소자리 4/20~5/20)과 1일 차이 있음
 * → zodiac-signs 라이브러리 기준으로 테스트 작성
 */

describe('getZodiacSign - 별자리 계산', () => {
  // 각 별자리 첫날 테스트 (라이브러리 기준)
  it('3월 21일 = 양자리', () => {
    expect(getZodiacSign(3, 21).id).toBe('aries')
  })
  it('4월 21일 = 황소자리', () => {
    expect(getZodiacSign(4, 21).id).toBe('taurus')
  })
  it('5월 22일 = 쌍둥이자리', () => {
    expect(getZodiacSign(5, 22).id).toBe('gemini')
  })
  it('6월 22일 = 게자리', () => {
    expect(getZodiacSign(6, 22).id).toBe('cancer')
  })
  it('7월 23일 = 사자자리', () => {
    expect(getZodiacSign(7, 23).id).toBe('leo')
  })
  it('8월 23일 = 처녀자리', () => {
    expect(getZodiacSign(8, 23).id).toBe('virgo')
  })
  it('9월 24일 = 천칭자리', () => {
    expect(getZodiacSign(9, 24).id).toBe('libra')
  })
  it('10월 24일 = 전갈자리', () => {
    expect(getZodiacSign(10, 24).id).toBe('scorpio')
  })
  it('11월 23일 = 사수자리', () => {
    expect(getZodiacSign(11, 23).id).toBe('sagittarius')
  })
  it('12월 22일 = 염소자리', () => {
    expect(getZodiacSign(12, 22).id).toBe('capricorn')
  })
  it('1월 21일 = 물병자리', () => {
    expect(getZodiacSign(1, 21).id).toBe('aquarius')
  })
  it('2월 20일 = 물고기자리', () => {
    expect(getZodiacSign(2, 20).id).toBe('pisces')
  })

  // 경계값 테스트 (12/22~1/20: 염소자리가 연도 경계를 넘음)
  it('12월 25일 = 염소자리 (연도 경계)', () => {
    expect(getZodiacSign(12, 25).id).toBe('capricorn')
  })
  it('1월 15일 = 염소자리 (연도 경계)', () => {
    expect(getZodiacSign(1, 15).id).toBe('capricorn')
  })
  it('3월 20일 = 물고기자리 (물고기/양자리 경계 전날)', () => {
    expect(getZodiacSign(3, 20).id).toBe('pisces')
  })

  // 반환 타입 검증
  it('반환값에 ko, element, emoji가 포함된다', () => {
    const sign = getZodiacSign(3, 21)
    expect(sign.ko).toBe('양자리')
    expect(sign.element).toBe('fire')
    expect(sign.emoji).toBe('♈')
  })
})
