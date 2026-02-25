/**
 * Anthropic Claude API LLM Provider
 *
 * @anthropic-ai/sdk를 사용하여 claude-sonnet-4-6 모델 호출.
 * 환경변수 ANTHROPIC_API_KEY 필요.
 *
 * 다른 provider로 교체하려면:
 *   1. lib/llm/providers/{provider}.ts 새 파일 생성 (LLMProvider 구현)
 *   2. lib/llm/factory.ts의 switch에 case 추가
 *   3. 환경변수 LLM_PROVIDER={provider} 설정
 */
import Anthropic from '@anthropic-ai/sdk'

import type { LLMProvider } from '../types'

export class AnthropicProvider implements LLMProvider {
  readonly name = 'anthropic'
  readonly model = 'claude-sonnet-4-6'

  // 싱글턴 클라이언트 (인스턴스당 1개)
  private client: Anthropic

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }

  async generateText(prompt: string): Promise<string> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    // 응답에서 텍스트 블록만 추출하여 합침
    return message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('')
  }
}
