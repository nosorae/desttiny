/**
 * LLM Provider 팩토리
 *
 * 환경변수 LLM_PROVIDER를 읽어 해당 provider 인스턴스를 반환.
 * 기본값: 'anthropic'
 *
 * 지원 provider:
 *   - anthropic: claude-sonnet-4-6 (ANTHROPIC_API_KEY 필요)
 *   - (추후 추가) openai: gpt-4o (OPENAI_API_KEY 필요)
 *   - (추후 추가) gemini: gemini-1.5-pro (GEMINI_API_KEY 필요)
 */
import type { LLMProvider } from './types'
import { AnthropicProvider } from './providers'

export function createLLMProvider(): LLMProvider {
  const providerName = process.env.LLM_PROVIDER ?? 'anthropic'

  switch (providerName) {
    case 'anthropic':
      return new AnthropicProvider()
    default:
      throw new Error(
        `지원하지 않는 LLM provider: "${providerName}". 지원 목록: anthropic`
      )
  }
}
