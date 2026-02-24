/**
 * 3체계 통합 궁합 계산기
 *
 * 사주(40%) + 별자리(30%) + MBTI(30%) 가중 합산으로 통합 점수 계산.
 * LLMProvider를 주입받아 영역별 한국어 해설 생성.
 *
 * LLMProvider를 주입받는 이유:
 *   - 테스트 시 mock provider로 교체 → 실제 API 호출 없이 빠른 테스트
 *   - API route에서는 createLLMProvider()로 생성한 provider 주입
 *   - 미래에 다른 LLM으로 교체 시 provider만 바꾸면 됨
 *
 * 3체계 점수를 독립적으로 계산하므로 Promise.all로 병렬 실행
 * 참고: https://vercel.com/blog/introducing-react-best-practices
 */
import { calculateSajuCompatibility } from './saju/calculator'
import { calculateZodiacCompatibility } from './zodiac/calculator'
import { calculateMbtiCompatibility } from './mbti/calculator'
import { buildCompatibilityPrompt } from './ai'
import type { LLMProvider } from '../llm/types'
import type {
  PersonCompatibilityInput,
  RelationshipType,
  CompatibilityResult,
  CompatibilityScore,
  CompatibilityAnalysis,
} from './types'

const DEFAULT_SAJU_SCORE: CompatibilityScore = {
  score: 50,
  reason: '사주 정보 없음 - 기본 점수 적용',
  details: [],
}

const DEFAULT_ZODIAC_SCORE: CompatibilityScore = {
  score: 50,
  reason: '별자리 정보 없음 - 기본 점수 적용',
  details: [],
}

/** LLM JSON 파싱 실패 시 점수 기반 기본 해설 */
function getFallbackAnalysis(totalScore: number): CompatibilityAnalysis {
  const level = totalScore >= 80 ? '높은' : totalScore >= 60 ? '양호한' : '도전적인'
  return {
    summary: `두 분의 궁합 점수는 ${totalScore}점으로 ${level} 궁합입니다`,
    sections: [
      { title: '두 사람의 소통 방식', content: '서로의 특성을 존중하는 대화가 관계를 더욱 풍요롭게 만들 수 있습니다.', area: 'communication' },
      { title: '감정 표현의 온도차', content: '감정 표현 방식의 차이를 인정하고 배려하는 것이 깊은 신뢰를 쌓는 첫걸음입니다.', area: 'emotion' },
      { title: '가치관, 얼마나 맞을까?', content: '삶에서 중요하게 여기는 것들이 비슷할수록 장기적인 관계가 편안해집니다.', area: 'values' },
      { title: '함께 하는 일상', content: '일상 속 작은 습관과 취향이 맞을수록 함께하는 시간이 즐거워집니다.', area: 'lifestyle' },
      { title: '갈등이 생기면?', content: '모든 관계에서 갈등은 자연스러운 일입니다. 상대방의 입장에서 생각해보는 것이 현명한 시작입니다.', area: 'conflict' },
    ],
    finalSummary: `${totalScore}점의 궁합, 서로를 이해하고 노력한다면 더 좋은 관계로 발전할 수 있습니다.`,
  }
}

/**
 * 3체계 통합 궁합을 계산합니다.
 *
 * @param person1 - 사람1 입력 데이터
 * @param person2 - 사람2 입력 데이터
 * @param relationshipType - 관계 유형
 * @param provider - LLM provider (테스트 시 mock 주입 가능)
 */
export async function calculateCompatibility(
  person1: PersonCompatibilityInput,
  person2: PersonCompatibilityInput,
  relationshipType: RelationshipType,
  provider: LLMProvider
): Promise<CompatibilityResult> {
  // 1. 3체계 점수 병렬 계산 (독립적이므로 Promise.all - 순차 실행 대비 3배 빠름)
  const [sajuScore, zodiacScore, mbtiScore] = await Promise.all([
    Promise.resolve(
      person1.dayPillar && person2.dayPillar
        ? calculateSajuCompatibility(person1.dayPillar, person2.dayPillar)
        : DEFAULT_SAJU_SCORE
    ),
    Promise.resolve(
      person1.zodiacId && person2.zodiacId
        ? calculateZodiacCompatibility(person1.zodiacId, person2.zodiacId)
        : DEFAULT_ZODIAC_SCORE
    ),
    Promise.resolve(calculateMbtiCompatibility(person1.mbti, person2.mbti)),
  ])

  // 2. 가중 평균 (사주 40% + 별자리 30% + MBTI 30%)
  const totalScore = Math.round(
    sajuScore.score * 0.4 + zodiacScore.score * 0.3 + mbtiScore.score * 0.3
  )

  // 3. LLM 해설 생성 (실패 시 폴백)
  const prompt = buildCompatibilityPrompt({
    person1,
    person2,
    relationshipType,
    totalScore,
    breakdown: { saju: sajuScore, zodiac: zodiacScore, mbti: mbtiScore },
  })
  let analysis: CompatibilityAnalysis
  try {
    const rawText = await provider.generateText(prompt)
    analysis = JSON.parse(rawText) as CompatibilityAnalysis
  } catch (error) {
    // LLM 호출 실패 또는 JSON 파싱 실패 시 폴백
    console.error('[calculateCompatibility] LLM 실패, 폴백 사용:', error)
    analysis = getFallbackAnalysis(totalScore)
  }

  return {
    totalScore,
    breakdown: { saju: sajuScore, zodiac: zodiacScore, mbti: mbtiScore },
    analysis,
  }
}
