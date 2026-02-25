/**
 * Anthropic API 통합 테스트
 *
 * 실제 API 호출 - ANTHROPIC_API_KEY 환경변수 필요
 * 실행 방법: LLM_INTEGRATION=true npm test -- anthropic.integration
 *
 * CI/CD에서는 실행하지 않음 (유닛 테스트만 자동화)
 */
import { describe, it, expect } from 'vitest'

const RUN_INTEGRATION = process.env.LLM_INTEGRATION === 'true'

describe.skipIf(!RUN_INTEGRATION)('AnthropicProvider - 실제 API 통합 테스트', () => {
  it('실제 API 호출이 성공한다', async () => {
    const { AnthropicProvider } = await import('../anthropic')
    const provider = new AnthropicProvider()

    const result = await provider.generateText(
      '다음 JSON만 출력하세요 (다른 텍스트 없이): {"test": "success"}'
    )

    expect(result).toContain('success')
  }, 30000) // 30초 타임아웃

  it('궁합 프롬프트를 처리하고 JSON을 반환한다', async () => {
    const { AnthropicProvider } = await import('../anthropic')
    const { buildCompatibilityPrompt } = await import('../../../compatibility/ai/prompt')

    const provider = new AnthropicProvider()
    const prompt = buildCompatibilityPrompt({
      person1: {
        dayPillar: { stem: '갑', branch: '인', label: '갑인', element: 'wood' },
        zodiacId: 'aries', mbti: 'INTJ', name: '김철수', gender: 'male',
      },
      person2: {
        dayPillar: { stem: '병', branch: '오', label: '병오', element: 'fire' },
        zodiacId: 'leo', mbti: 'ENFP', name: '이영희', gender: 'female',
      },
      relationshipType: 'friend',
      totalScore: 72,
      breakdown: {
        saju: { score: 65, reason: '목화 상생 관계', details: ['갑목이 병화를 생함 - 상생(相生) 관계'] },
        zodiac: { score: 75, reason: '불 원소 상생', details: ['양자리(불) - 사자자리(불): 원소 일치'] },
        mbti: { score: 82, reason: 'INTJ+ENFP 황금 쌍', details: ['인지기능 상호보완 관계'] },
      },
    })

    const result = await provider.generateText(prompt)
    const parsed = JSON.parse(result)

    expect(parsed.summary).toBeTruthy()
    expect(Array.isArray(parsed.sections)).toBe(true)
    expect(parsed.sections.length).toBeGreaterThanOrEqual(5)
    expect(parsed.finalSummary).toBeTruthy()
  }, 60000)
})
