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

/** 관계 유형 (7개: 합집합 - 제품 스펙 + 디자인 스펙) */
export type RelationshipType =
  | 'lover' // 연인
  | 'ex' // 전연인
  | 'crush' // 썸
  | 'friend' // 친구
  | 'colleague' // 동료
  | 'family' // 가족
  | 'idol' // 아이돌

/** LLM이 생성하는 영역별 해설 섹션 */
export interface CompatibilitySection {
  /** 후킹형 섹션 제목 (예: "둘이 싸우면 누가 이길까?") */
  title: string
  /** 상세 해설 (200-300자) */
  content: string
  /** 분석 영역 */
  area:
    | 'communication' // 소통
    | 'emotion' // 감정
    | 'values' // 가치관
    | 'lifestyle' // 생활습관
    | 'conflict' // 갈등 해결
    | 'intimacy' // 친밀도 (연인/썸/전연인만)
}

/**
 * 29금 성인 친밀도 점수 (연인/썸/전연인 관계에서만 LLM이 생성)
 * SSOT 궁합 결과 템플릿 v1 기준: 텐션/리듬/경계선 대화 3종
 */
export interface IntimacyScores {
  /** 텐션 합 (0-100) - 설렘, 긴장감, 끌림의 강도 */
  tension: number
  /** 리듬 합 (0-100) - 감정/신체 교감의 조화도 */
  rhythm: number
  /** 경계선 대화 적합도 (0-100) - 민감한 주제를 다루는 소통 능력 */
  boundary: number
  /** 강점 한 줄 */
  strength: string
  /** 주의점 한 줄 */
  caution: string
  /** 권장 대화 한 줄 */
  advice: string
}

/** LLM 해설 결과 */
export interface CompatibilityAnalysis {
  /** 한 줄 요약 */
  summary: string
  /** 영역별 해설 섹션 */
  sections: CompatibilitySection[]
  /** 마무리 정리 */
  finalSummary: string
  /** 29금 친밀도 점수 - 연인/썸/전연인만 (비연인 관계에서는 undefined) */
  intimacyScores?: IntimacyScores
}

/** 계산기에 전달하는 1인 궁합 입력 데이터 */
export interface PersonCompatibilityInput {
  /** 사주 일주 - null이면 사주 계산 생략 (기본 50점 사용) */
  dayPillar: import('../saju/types').Pillar | null
  /** 별자리 ID - null이면 별자리 계산 생략 (기본 50점 사용) */
  zodiacId: import('../zodiac/types').ZodiacId | null
  /** MBTI - null이면 calculateMbtiCompatibility의 null 기본값 60점 사용 */
  mbti: MbtiType | null
  /** AI 프롬프트에 사용할 이름 */
  name: string
  /** 성별 (AI 프롬프트용) */
  gender: string | null
}

/** 3체계 통합 궁합 결과 */
export interface CompatibilityResult {
  /** 0-100 통합 점수 (사주 40% + 별자리 30% + MBTI 30%) */
  totalScore: number
  /** 체계별 점수 세부 */
  breakdown: {
    saju: CompatibilityScore
    zodiac: CompatibilityScore
    mbti: CompatibilityScore
  }
  /** LLM 생성 해설 */
  analysis: CompatibilityAnalysis
}
