// lib/compatibility/types.ts

export interface CompatibilityScore {
  /** 0-100 정규화된 궁합 점수 */
  score: number
  /** 사용자에게 보여줄 한국어 요약 설명 */
  reason: string
  /** 상세 분석 항목들 */
  details: string[]
}

/** MBTI 16개 유형 */
export type MbtiType =
  | 'INTJ'
  | 'INTP'
  | 'ENTJ'
  | 'ENTP'
  | 'INFJ'
  | 'INFP'
  | 'ENFJ'
  | 'ENFP'
  | 'ISTJ'
  | 'ISFJ'
  | 'ESTJ'
  | 'ESFJ'
  | 'ISTP'
  | 'ISFP'
  | 'ESTP'
  | 'ESFP'
