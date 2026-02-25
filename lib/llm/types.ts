/**
 * LLM Provider 추상화 인터페이스
 *
 * 이 인터페이스를 구현하면 어떤 LLM이든 궁합 해설 생성에 사용 가능.
 * 현재 구현: AnthropicProvider (claude-sonnet-4-6)
 * 향후 추가: OpenAIProvider, GeminiProvider, GrokProvider 등
 *
 * 교체 방법: 환경변수 LLM_PROVIDER=anthropic|openai|gemini 설정 후
 * createLLMProvider()가 자동으로 해당 provider 반환
 */
export interface LLMProvider {
  /** provider 이름 (로그·디버그용) */
  readonly name: string
  /** 사용 중인 모델명 (로그·디버그용) */
  readonly model: string
  /**
   * 프롬프트를 받아 텍스트를 생성합니다.
   * @param prompt - 전달할 프롬프트 문자열
   * @returns 생성된 텍스트
   * @throws LLM API 호출 실패 시 Error (호출자가 폴백 처리)
   */
  generateText(prompt: string): Promise<string>
}
