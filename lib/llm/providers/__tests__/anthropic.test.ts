import { describe, it, expect, vi } from 'vitest'

// @anthropic-ai/sdk를 mock하여 실제 API 호출 없이 테스트
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: '{"summary":"테스트","sections":[],"finalSummary":"마무리"}' }],
        }),
      },
    })),
  }
})

import { AnthropicProvider } from '../anthropic'

describe('AnthropicProvider', () => {
  it('name이 "anthropic"이다', () => {
    const provider = new AnthropicProvider()
    expect(provider.name).toBe('anthropic')
  })

  it('model이 "claude-sonnet-4-6"이다', () => {
    const provider = new AnthropicProvider()
    expect(provider.model).toBe('claude-sonnet-4-6')
  })

  it('generateText가 문자열을 반환한다', async () => {
    const provider = new AnthropicProvider()
    const result = await provider.generateText('테스트 프롬프트')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})
