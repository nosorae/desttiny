# 이슈 #18: 3체계 통합 점수 + LLM 해설 구현 계획 (v2)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 사주/별자리/MBTI 3체계 점수를 가중 합산하고, 교체 가능한 LLM Provider 추상화를 통해 자연어 궁합 해설을 생성하는 API 구현

**Architecture:**
- `lib/llm/`: `LLMProvider` 인터페이스 + `AnthropicProvider` (첫 구현체) + `factory`로 env 기반 교체
- `lib/compatibility/calculator.ts`: LLMProvider를 주입받아 계산 (테스트 시 mock 교체 가능)
- `app/api/compatibility/route.ts`: 인증·검증·슬롯체크·DB저장 + 응답에 `debug` 필드 항상 포함

**Tech Stack:** `@anthropic-ai/sdk`, Next.js API Routes, Supabase (서버 클라이언트), 기존 3체계 계산기

---

## 배경 지식

### 기존 계산기 (이미 구현됨, 44 tests pass)
```typescript
calculateSajuCompatibility(p1DayPillar: Pillar, p2DayPillar: Pillar): CompatibilityScore
calculateZodiacCompatibility(z1: ZodiacId, z2: ZodiacId): CompatibilityScore
calculateMbtiCompatibility(m1: MbtiType | null, m2: MbtiType | null): CompatibilityScore
```

### DB 스키마
- `profiles`: `id`, `day_pillar` (예: "갑자"), `zodiac_sign` (예: "aries"), `mbti`, `nickname`, `gender`, `birth_date`, `birth_time`
- `compatibility_results`: `id`, `requester_id`, `partner_id`, `partner_name`, `partner_birth_date`, `partner_birth_time`, `partner_day_pillar`, `partner_zodiac_sign`, `partner_mbti`, `partner_gender`, `relationship_type`, `total_score`, `saju_score`, `zodiac_score`, `mbti_score`, `ai_summary` (JSON string), `is_paid`
- `daily_free_slots`: `id`, `slot_date`, `used_count`, `max_count`

### 가중치
`total = round(saju.score * 0.4 + zodiac.score * 0.3 + mbti.score * 0.3)`

### Supabase 서버 클라이언트
```typescript
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
```

### 환경변수
```
LLM_PROVIDER=anthropic          # 또는 openai, gemini 등 (추후 추가)
ANTHROPIC_API_KEY=sk-ant-...    # Anthropic API key
```

---

## Task 0: 워크트리 + SDK 설치 ✅ (완료)

worktree `.worktrees/feat-issue-18` (브랜치 `feat/issue-18-compatibility-api`) 생성됨.
`@anthropic-ai/sdk` 설치 및 커밋 완료.

---

## Task 1: LLM Provider 추상화 레이어

**Files:**
- Create: `lib/llm/types.ts`
- Create: `lib/llm/factory.ts`
- Create: `lib/llm/providers/anthropic.ts`
- Create: `lib/llm/providers/index.ts`
- Test: `lib/llm/providers/__tests__/anthropic.test.ts`

이 태스크는 LLM을 교체 가능한 구조의 핵심이다.
`LLMProvider` 인터페이스를 정의하고 첫 구현체인 `AnthropicProvider`를 TDD로 만든다.

**Step 1: `lib/llm/types.ts` 작성**

```typescript
/**
 * LLM Provider 추상화 인터페이스
 *
 * 이 인터페이스를 구현하면 어떤 LLM이든 궁합 해설 생성에 사용 가능.
 * 현재 구현: AnthropicProvider (claude-sonnet-4-6)
 * 향후 추가: OpenAIProvider, GeminiProvider, GrokProvider 등
 *
 * 교체 방법: 환경변수 LLM_PROVIDER=anthropic|openai|gemini 설정 후
 *   createLLMProvider()가 자동으로 해당 provider 반환
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
```

**Step 2: 테스트 파일 작성 (실패 확인용)**

`lib/llm/providers/__tests__/anthropic.test.ts`:
```typescript
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
```

**Step 3: 테스트 실행 (실패 확인)**
```bash
cd /Users/yessorae/desttiny/.worktrees/feat-issue-18
npm test -- lib/llm
```
Expected: FAIL "Cannot find module '../anthropic'"

**Step 4: `lib/llm/providers/anthropic.ts` 구현**

```typescript
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
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    // 응답에서 텍스트 블록만 추출하여 합침
    return message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('')
  }
}
```

**Step 5: `lib/llm/providers/index.ts` 작성**
```typescript
export { AnthropicProvider } from './anthropic'
```

**Step 6: `lib/llm/factory.ts` 작성**

```typescript
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
```

**Step 7: 테스트 실행 (통과 확인)**
```bash
cd /Users/yessorae/desttiny/.worktrees/feat-issue-18
npm test -- lib/llm
```
Expected: 3 tests pass

**Step 8: TypeScript 타입 체크**
```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: 에러 없음

**Step 9: 커밋**
```bash
cd /Users/yessorae/desttiny/.worktrees/feat-issue-18
git add lib/llm/
git commit -m "feat: LLM Provider 추상화 레이어 + AnthropicProvider 구현 (#18)"
```

---

## Task 2: 타입 확장 + parseDayPillar

**Files:**
- Modify: `lib/compatibility/types.ts`
- Modify: `lib/saju/index.ts`
- Modify: `lib/saju/__tests__/saju.test.ts`

**Step 1: `lib/compatibility/types.ts` 끝에 추가**

```typescript
/** 관계 유형 */
export type RelationshipType =
  | 'lover'       // 연인
  | 'ex'          // 전연인
  | 'crush'       // 썸
  | 'friend'      // 친구
  | 'colleague'   // 동료
  | 'family'      // 가족

/** Claude API가 생성하는 영역별 해설 섹션 */
export interface CompatibilitySection {
  /** 후킹형 섹션 제목 (예: "둘이 싸우면 누가 이길까?") */
  title: string
  /** 상세 해설 (200-300자) */
  content: string
  /** 분석 영역 */
  area:
    | 'communication' // 소통
    | 'emotion'       // 감정
    | 'values'        // 가치관
    | 'lifestyle'     // 생활습관
    | 'conflict'      // 갈등 해결
    | 'intimacy'      // 친밀도 (연인/썸/전연인만)
}

/** LLM 해설 결과 */
export interface CompatibilityAnalysis {
  /** 한 줄 요약 */
  summary: string
  /** 영역별 해설 섹션 */
  sections: CompatibilitySection[]
  /** 마무리 정리 (100자) */
  finalSummary: string
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
```

**Step 2: `lib/saju/index.ts`에 parseDayPillar 추가**

`toPillar` 함수 바로 아래에 추가:

```typescript
/**
 * DB에 저장된 일주 문자열을 Pillar 객체로 파싱
 *
 * profiles.day_pillar는 "갑자", "을축" 등 2글자 한글 문자열로 저장됨
 * 이 함수는 기존 toPillar()를 public으로 래핑한 것.
 *
 * @param dayPillarStr - DB에 저장된 일주 문자열 (예: "갑자")
 * @throws 알 수 없는 천간/지지일 경우 Error
 */
export function parseDayPillar(dayPillarStr: string): Pillar {
  return toPillar(dayPillarStr)
}
```

그리고 파일 끝의 export에 `parseDayPillar` 추가:
```typescript
export { parseDayPillar }
```

**Step 3: `lib/saju/__tests__/saju.test.ts`에 테스트 추가**

파일 끝에 추가:
```typescript
import { parseDayPillar } from '../index'

describe('parseDayPillar - DB 문자열 → Pillar 변환', () => {
  it('갑자 → wood 오행 Pillar', () => {
    const result = parseDayPillar('갑자')
    expect(result.stem).toBe('갑')
    expect(result.branch).toBe('자')
    expect(result.element).toBe('wood')
    expect(result.label).toBe('갑자')
  })

  it('병오 → fire 오행 Pillar', () => {
    const result = parseDayPillar('병오')
    expect(result.element).toBe('fire')
  })

  it('무진 → earth 오행 Pillar', () => {
    const result = parseDayPillar('무진')
    expect(result.element).toBe('earth')
  })

  it('알 수 없는 문자열은 Error를 던진다', () => {
    expect(() => parseDayPillar('ab')).toThrow('알 수 없는 한자 간지')
  })
})
```

**Step 4: 테스트 실행**
```bash
cd /Users/yessorae/desttiny/.worktrees/feat-issue-18
npm test -- lib/saju
```
Expected: 기존 8 + 신규 4 = 12 tests pass (4 todo 제외)

**Step 5: 커밋**
```bash
git add lib/compatibility/types.ts lib/saju/index.ts lib/saju/__tests__/saju.test.ts
git commit -m "feat: 통합 궁합 타입 + parseDayPillar 추가 (#18)"
```

---

## Task 3: AI 프롬프트 빌더 + 통합 계산기 (TDD)

**Files:**
- Create: `lib/compatibility/ai/prompt.ts`
- Create: `lib/compatibility/ai/index.ts`
- Create: `lib/compatibility/calculator.ts`
- Test: `lib/compatibility/ai/__tests__/prompt.test.ts`
- Test: `lib/compatibility/__tests__/calculator.test.ts`

**Step 1: 프롬프트 테스트 작성**

`lib/compatibility/ai/__tests__/prompt.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { buildCompatibilityPrompt } from '../prompt'
import type { PersonCompatibilityInput, RelationshipType } from '../../types'

const person1: PersonCompatibilityInput = {
  dayPillar: { stem: '갑', branch: '인', label: '갑인', element: 'wood' },
  zodiacId: 'aries',
  mbti: 'INTJ',
  name: '김철수',
  gender: 'male',
}
const person2: PersonCompatibilityInput = {
  dayPillar: { stem: '병', branch: '오', label: '병오', element: 'fire' },
  zodiacId: 'leo',
  mbti: 'ENFP',
  name: '이영희',
  gender: 'female',
}

describe('buildCompatibilityPrompt', () => {
  it('두 사람 이름이 포함된다', () => {
    const prompt = buildCompatibilityPrompt({ person1, person2, relationshipType: 'lover', totalScore: 75 })
    expect(prompt).toContain('김철수')
    expect(prompt).toContain('이영희')
  })

  it('종합 점수가 포함된다', () => {
    const prompt = buildCompatibilityPrompt({ person1, person2, relationshipType: 'friend', totalScore: 82 })
    expect(prompt).toContain('82')
  })

  it('관계 유형이 한국어로 포함된다', () => {
    const prompt = buildCompatibilityPrompt({ person1, person2, relationshipType: 'friend', totalScore: 60 })
    expect(prompt).toContain('친구')
  })

  it('연인 관계는 친밀도 섹션이 포함되어 비연인보다 길다', () => {
    const loverPrompt = buildCompatibilityPrompt({ person1, person2, relationshipType: 'lover', totalScore: 80 })
    const colleaguePrompt = buildCompatibilityPrompt({ person1, person2, relationshipType: 'colleague', totalScore: 80 })
    expect(loverPrompt.length).toBeGreaterThan(colleaguePrompt.length)
  })

  it('JSON 출력 형식을 요구한다', () => {
    const prompt = buildCompatibilityPrompt({ person1, person2, relationshipType: 'friend', totalScore: 70 })
    expect(prompt).toContain('JSON')
    expect(prompt).toContain('sections')
  })
})
```

**Step 2: 계산기 테스트 작성**

`lib/compatibility/__tests__/calculator.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { LLMProvider } from '../../llm/types'
import type { PersonCompatibilityInput } from '../types'

// 테스트용 Mock LLM Provider
const mockProvider: LLMProvider = {
  name: 'mock',
  model: 'mock-model',
  generateText: vi.fn().mockResolvedValue(
    JSON.stringify({
      summary: '테스트 요약',
      sections: [
        { title: '소통', content: '내용', area: 'communication' },
        { title: '감정', content: '내용', area: 'emotion' },
        { title: '가치관', content: '내용', area: 'values' },
        { title: '생활', content: '내용', area: 'lifestyle' },
        { title: '갈등', content: '내용', area: 'conflict' },
      ],
      finalSummary: '테스트 마무리',
    })
  ),
}

import { calculateCompatibility } from '../calculator'

function makePerson(
  stem: string, branch: string, element: string,
  zodiacId: string, mbti: string | null = null
): PersonCompatibilityInput {
  return {
    dayPillar: {
      stem: stem as import('../../saju/types').HeavenlyStem,
      branch: branch as import('../../saju/types').EarthlyBranch,
      label: `${stem}${branch}`,
      element: element as import('../../saju/types').FiveElement,
    },
    zodiacId: zodiacId as import('../../zodiac/types').ZodiacId,
    mbti: mbti as import('../types').MbtiType | null,
    name: '테스트',
    gender: null,
  }
}

describe('calculateCompatibility - 3체계 통합', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('통합 점수는 0-100 범위이다', async () => {
    const result = await calculateCompatibility(
      makePerson('갑', '인', 'wood', 'aries', 'INTJ'),
      makePerson('병', '오', 'fire', 'leo', 'ENFP'),
      'friend', mockProvider
    )
    expect(result.totalScore).toBeGreaterThanOrEqual(0)
    expect(result.totalScore).toBeLessThanOrEqual(100)
  })

  it('breakdown에 3체계 점수가 모두 포함된다', async () => {
    const result = await calculateCompatibility(
      makePerson('갑', '인', 'wood', 'aries', 'INTJ'),
      makePerson('병', '오', 'fire', 'leo', 'ENFP'),
      'friend', mockProvider
    )
    expect(result.breakdown.saju.score).toBeGreaterThanOrEqual(0)
    expect(result.breakdown.zodiac.score).toBeGreaterThanOrEqual(0)
    expect(result.breakdown.mbti.score).toBeGreaterThanOrEqual(0)
  })

  it('가중치 계산이 올바르다 (사주 40% + 별자리 30% + MBTI 30%)', async () => {
    const result = await calculateCompatibility(
      makePerson('갑', '인', 'wood', 'aries', 'INTJ'),
      makePerson('병', '오', 'fire', 'leo', 'ENFP'),
      'friend', mockProvider
    )
    const expected = Math.round(
      result.breakdown.saju.score * 0.4 +
      result.breakdown.zodiac.score * 0.3 +
      result.breakdown.mbti.score * 0.3
    )
    expect(result.totalScore).toBe(expected)
  })

  it('MBTI null이어도 계산된다', async () => {
    const result = await calculateCompatibility(
      makePerson('갑', '인', 'wood', 'aries', null),
      makePerson('병', '오', 'fire', 'leo', null),
      'friend', mockProvider
    )
    expect(result.totalScore).toBeGreaterThanOrEqual(0)
  })

  it('dayPillar null이면 사주 점수 기본값 50을 사용한다', async () => {
    const result = await calculateCompatibility(
      { dayPillar: null, zodiacId: 'aries', mbti: 'INTJ', name: '테스트', gender: null },
      makePerson('병', '오', 'fire', 'leo', 'ENFP'),
      'friend', mockProvider
    )
    expect(result.breakdown.saju.score).toBe(50)
  })

  it('analysis에 summary와 sections이 포함된다', async () => {
    const result = await calculateCompatibility(
      makePerson('갑', '인', 'wood', 'aries', 'INTJ'),
      makePerson('병', '오', 'fire', 'leo', 'ENFP'),
      'lover', mockProvider
    )
    expect(result.analysis.summary).toBeTruthy()
    expect(Array.isArray(result.analysis.sections)).toBe(true)
    expect(result.analysis.finalSummary).toBeTruthy()
  })

  it('LLM JSON 파싱 실패 시 폴백 해설을 반환한다', async () => {
    const badProvider: LLMProvider = {
      name: 'bad',
      model: 'bad-model',
      generateText: vi.fn().mockResolvedValue('이건 JSON이 아닙니다'),
    }
    const result = await calculateCompatibility(
      makePerson('갑', '인', 'wood', 'aries', 'INTJ'),
      makePerson('병', '오', 'fire', 'leo', 'ENFP'),
      'friend', badProvider
    )
    // 폴백이어도 결과는 있어야 함
    expect(result.analysis.summary).toBeTruthy()
    expect(result.totalScore).toBeGreaterThanOrEqual(0)
  })
})
```

**Step 3: 테스트 실행 (실패 확인)**
```bash
cd /Users/yessorae/desttiny/.worktrees/feat-issue-18
npm test -- lib/compatibility/ai lib/compatibility/__tests__/calculator
```
Expected: 여러 FAIL (파일 없음)

**Step 4: `lib/compatibility/ai/prompt.ts` 구현**

```typescript
/**
 * LLM 궁합 해설 프롬프트 빌더
 *
 * 두 사람의 3체계 데이터를 받아 LLM에 전달할 프롬프트 문자열 생성.
 * 연인/썸/전연인 관계에만 친밀도 영역 추가.
 *
 * 출력 형식: JSON { summary, sections: [{title, content, area}], finalSummary }
 */
import type { PersonCompatibilityInput, RelationshipType } from '../types'

const RELATIONSHIP_KO: Record<RelationshipType, string> = {
  lover: '연인', ex: '전연인', crush: '썸',
  friend: '친구', colleague: '동료', family: '가족',
}

const INTIMATE_TYPES: RelationshipType[] = ['lover', 'ex', 'crush']

export interface CompatibilityPromptInput {
  person1: PersonCompatibilityInput
  person2: PersonCompatibilityInput
  relationshipType: RelationshipType
  totalScore: number
}

export function buildCompatibilityPrompt(data: CompatibilityPromptInput): string {
  const { person1, person2, relationshipType, totalScore } = data
  const relKo = RELATIONSHIP_KO[relationshipType]
  const isIntimate = INTIMATE_TYPES.includes(relationshipType)

  const describePersonSaju = (p: PersonCompatibilityInput) =>
    p.dayPillar ? `사주 일주 ${p.dayPillar.label}(${p.dayPillar.element})` : '사주 정보 없음'
  const describePersonZodiac = (p: PersonCompatibilityInput) =>
    p.zodiacId ? `별자리 ${p.zodiacId}` : '별자리 정보 없음'

  const areas = [
    '소통(communication): 대화 스타일, 공감 방식',
    '감정(emotion): 애정 표현, 감정 처리 방식',
    '가치관(values): 삶의 방향성, 우선순위',
    '생활습관(lifestyle): 일상 패턴, 취향',
    '갈등 해결(conflict): 갈등 처리 방식',
  ]
  if (isIntimate) areas.push('친밀도(intimacy): 신체적·정서적 친밀감 표현 방식')

  const intimacySection = isIntimate
    ? ',\n    { "title": "후킹 제목", "content": "상세 해설 (200-300자)", "area": "intimacy" }'
    : ''

  return `당신은 사주·별자리·MBTI 통합 궁합 전문가입니다.
다음 두 사람의 궁합을 분석하여 영역별로 상세한 해설을 작성해주세요.

[두 사람 정보]
사람1(${person1.name}): ${describePersonSaju(person1)}, ${describePersonZodiac(person1)}, MBTI ${person1.mbti ?? '미입력'}, 성별 ${person1.gender ?? '미입력'}
사람2(${person2.name}): ${describePersonSaju(person2)}, ${describePersonZodiac(person2)}, MBTI ${person2.mbti ?? '미입력'}, 성별 ${person2.gender ?? '미입력'}
관계 유형: ${relKo}
종합 점수: ${totalScore}점 / 100점

[작성 원칙]
1. 3체계를 분절하지 말고 통합적으로 해석하세요
2. 각 영역 제목은 후킹형으로 작성하세요 (예: "둘이 싸우면 누가 이길까?")
3. 본문은 구체적이고 실용적인 조언을 포함하세요 (200-300자)
4. 한국어로 작성하세요

[분석 영역]
${areas.join('\n')}

[출력 형식 - 반드시 JSON만 출력, 다른 텍스트 없이]
{
  "summary": "한 줄 요약 (50자 이내)",
  "sections": [
    { "title": "후킹 제목", "content": "상세 해설 (200-300자)", "area": "communication" },
    { "title": "후킹 제목", "content": "상세 해설 (200-300자)", "area": "emotion" },
    { "title": "후킹 제목", "content": "상세 해설 (200-300자)", "area": "values" },
    { "title": "후킹 제목", "content": "상세 해설 (200-300자)", "area": "lifestyle" },
    { "title": "후킹 제목", "content": "상세 해설 (200-300자)", "area": "conflict" }${intimacySection}
  ],
  "finalSummary": "마무리 정리 (100자 이내)"
}`
}
```

**Step 5: `lib/compatibility/ai/index.ts` 작성**
```typescript
export { buildCompatibilityPrompt } from './prompt'
export type { CompatibilityPromptInput } from './prompt'
```

**Step 6: `lib/compatibility/calculator.ts` 구현**

```typescript
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

  // 3. LLM 해설 생성
  const prompt = buildCompatibilityPrompt({ person1, person2, relationshipType, totalScore })
  let analysis: CompatibilityAnalysis
  try {
    const rawText = await provider.generateText(prompt)
    analysis = JSON.parse(rawText) as CompatibilityAnalysis
  } catch (error) {
    // LLM 호출 실패 또는 JSON 파싱 실패 시 폴백
    console.error('[calculateCompatibility] LLM 실패, 폴백 사용:', error)
    analysis = getFallbackAnalysis(totalScore)
  }

  return { totalScore, breakdown: { saju: sajuScore, zodiac: zodiacScore, mbti: mbtiScore }, analysis }
}
```

**Step 7: 테스트 실행 (통과 확인)**
```bash
cd /Users/yessorae/desttiny/.worktrees/feat-issue-18
npm test
```
Expected: 44(기존) + 3(anthropic) + 4(parseDayPillar) + 5(prompt) + 7(calculator) = 63 tests pass, 4 todo

**Step 8: 커밋**
```bash
git add lib/compatibility/ai/ lib/compatibility/calculator.ts lib/compatibility/__tests__/
git commit -m "feat: AI 프롬프트 빌더 + 3체계 통합 계산기 구현 (#18)"
```

---

## Task 4: 궁합 API 엔드포인트

**Files:**
- Create: `app/api/compatibility/route.ts`

**Step 1: `app/api/compatibility/route.ts` 구현**

```typescript
/**
 * POST /api/compatibility
 * 3체계 통합 궁합 분석 API
 *
 * 요청 Body:
 * {
 *   "relationshipType": "lover" | "ex" | "crush" | "friend" | "colleague" | "family",
 *   "partner": {
 *     // 옵션 A: 등록된 유저
 *     "partnerId": "uuid",
 *     // 옵션 B: 직접 입력
 *     "name": "이영희",
 *     "birthDate": "1995-08-15",      // YYYY-MM-DD
 *     "birthTime": "14:30",           // HH:MM (선택)
 *     "mbti": "ENFP",                 // 선택
 *     "gender": "female"              // 선택
 *   }
 * }
 *
 * 응답:
 * {
 *   "id": "uuid",
 *   "totalScore": 75,
 *   "breakdown": { "saju": {...}, "zodiac": {...}, "mbti": {...} },
 *   "analysis": { "summary": "...", "sections": [...], "finalSummary": "..." },
 *   "debug": {                        // 항상 포함 (추후 프로덕션에서 제거)
 *     "provider": "anthropic",
 *     "model": "claude-sonnet-4-6",
 *     "prompt": "...",
 *     "rawLLMResponse": "..."
 *   }
 * }
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createLLMProvider } from '@/lib/llm/factory'
import { calculateCompatibility } from '@/lib/compatibility/calculator'
import { buildCompatibilityPrompt } from '@/lib/compatibility/ai'
import { parseDayPillar } from '@/lib/saju'
import { getSajuProfile } from '@/lib/saju'
import { getZodiacSign } from '@/lib/zodiac/calculator'
import type {
  PersonCompatibilityInput,
  RelationshipType,
  MbtiType,
} from '@/lib/compatibility/types'
import type { ZodiacId } from '@/lib/zodiac/types'

const VALID_RELATIONSHIP_TYPES: RelationshipType[] = [
  'lover', 'ex', 'crush', 'friend', 'colleague', 'family',
]
const VALID_MBTI_TYPES: MbtiType[] = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP',
]
const VALID_ZODIAC_IDS: ZodiacId[] = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
]

export async function POST(request: Request) {
  // debug 정보 수집용
  let debugPrompt = ''
  let debugRawResponse = ''

  try {
    // ===== 1. 인증 확인 =====
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    // ===== 2. 요청 파싱 및 검증 =====
    const body = await request.json()
    const { relationshipType, partner } = body

    if (!VALID_RELATIONSHIP_TYPES.includes(relationshipType)) {
      return NextResponse.json({ error: '유효하지 않은 관계 유형입니다' }, { status: 400 })
    }
    if (!partner || (!partner.partnerId && !partner.birthDate)) {
      return NextResponse.json(
        { error: '파트너 정보가 필요합니다 (partnerId 또는 birthDate)' },
        { status: 400 }
      )
    }

    // ===== 3. 요청자 프로필 조회 =====
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, day_pillar, zodiac_sign, mbti, nickname, gender')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: '프로필을 찾을 수 없습니다. 온보딩을 완료해주세요' },
        { status: 404 }
      )
    }

    const person1: PersonCompatibilityInput = {
      dayPillar: profile.day_pillar ? parseDayPillar(profile.day_pillar) : null,
      zodiacId: profile.zodiac_sign && VALID_ZODIAC_IDS.includes(profile.zodiac_sign as ZodiacId)
        ? (profile.zodiac_sign as ZodiacId) : null,
      mbti: profile.mbti && VALID_MBTI_TYPES.includes(profile.mbti as MbtiType)
        ? (profile.mbti as MbtiType) : null,
      name: profile.nickname ?? '나',
      gender: profile.gender,
    }

    // ===== 4. 파트너 정보 구성 =====
    let person2: PersonCompatibilityInput
    let partnerDbFields: Record<string, string | null> = {}

    if (partner.partnerId) {
      const { data: partnerProfile, error: partnerError } = await supabase
        .from('profiles')
        .select('id, day_pillar, zodiac_sign, mbti, nickname, gender')
        .eq('id', partner.partnerId)
        .single()

      if (partnerError || !partnerProfile) {
        return NextResponse.json({ error: '파트너 사용자를 찾을 수 없습니다' }, { status: 404 })
      }

      person2 = {
        dayPillar: partnerProfile.day_pillar ? parseDayPillar(partnerProfile.day_pillar) : null,
        zodiacId: partnerProfile.zodiac_sign && VALID_ZODIAC_IDS.includes(partnerProfile.zodiac_sign as ZodiacId)
          ? (partnerProfile.zodiac_sign as ZodiacId) : null,
        mbti: partnerProfile.mbti && VALID_MBTI_TYPES.includes(partnerProfile.mbti as MbtiType)
          ? (partnerProfile.mbti as MbtiType) : null,
        name: partnerProfile.nickname ?? '상대방',
        gender: partnerProfile.gender,
      }
      partnerDbFields = {
        partner_id: partner.partnerId,
        partner_day_pillar: partnerProfile.day_pillar,
        partner_zodiac_sign: partnerProfile.zodiac_sign,
        partner_mbti: partnerProfile.mbti,
        partner_name: partnerProfile.nickname,
        partner_gender: partnerProfile.gender,
      }
    } else {
      // 직접 입력 파트너 - 생년월일로 사주/별자리 계산
      const partnerMbti = partner.mbti && VALID_MBTI_TYPES.includes(partner.mbti)
        ? partner.mbti as MbtiType : null

      let partnerDayPillar = null
      let partnerZodiacId: ZodiacId | null = null

      if (partner.birthDate) {
        try {
          const birthDate = new Date(partner.birthDate)
          const birthHour = partner.birthTime
            ? parseInt(partner.birthTime.split(':')[0], 10) : undefined

          const sajuProfile = await getSajuProfile(birthDate, birthHour)
          partnerDayPillar = sajuProfile.dayPillar

          const month = birthDate.getUTCMonth() + 1
          const day = birthDate.getUTCDate()
          partnerZodiacId = getZodiacSign(month, day).id
        } catch {
          // 계산 실패 시 null (기본 점수 50 사용)
        }
      }

      person2 = {
        dayPillar: partnerDayPillar,
        zodiacId: partnerZodiacId,
        mbti: partnerMbti,
        name: partner.name ?? '상대방',
        gender: partner.gender ?? null,
      }
      partnerDbFields = {
        partner_id: null,
        partner_name: partner.name ?? null,
        partner_birth_date: partner.birthDate,
        partner_birth_time: partner.birthTime ?? null,
        partner_day_pillar: partnerDayPillar?.label ?? null,
        partner_zodiac_sign: partnerZodiacId,
        partner_mbti: partnerMbti,
        partner_gender: partner.gender ?? null,
      }
    }

    // ===== 5. 무료 슬롯 체크 =====
    const today = new Date().toISOString().split('T')[0]
    const { data: slot, error: slotError } = await supabase
      .from('daily_free_slots')
      .select('id, used_count, max_count')
      .eq('slot_date', today)
      .single()

    if (slotError || !slot || slot.used_count >= slot.max_count) {
      return NextResponse.json(
        { error: '오늘의 무료 궁합이 모두 소진되었습니다. 결제 후 이용해주세요' },
        { status: 402 }
      )
    }

    // ===== 6. LLM Provider 생성 및 궁합 계산 =====
    // debug 정보 수집을 위해 프롬프트를 먼저 빌드
    const { totalScore: previewScore } = { totalScore: 0 } // 임시 - 실제 계산에서 override됨
    debugPrompt = buildCompatibilityPrompt({ person1, person2, relationshipType, totalScore: previewScore })

    const provider = createLLMProvider()

    // provider.generateText를 감싸서 raw response 캡처
    const originalGenerateText = provider.generateText.bind(provider)
    provider.generateText = async (prompt: string) => {
      debugPrompt = prompt
      const response = await originalGenerateText(prompt)
      debugRawResponse = response
      return response
    }

    const result = await calculateCompatibility(person1, person2, relationshipType, provider)

    // ===== 7. 슬롯 사용 처리 + DB 저장 =====
    await supabase
      .from('daily_free_slots')
      .update({ used_count: slot.used_count + 1 })
      .eq('id', slot.id)

    const { data: savedResult, error: saveError } = await supabase
      .from('compatibility_results')
      .insert({
        requester_id: user.id,
        relationship_type: relationshipType,
        total_score: result.totalScore,
        saju_score: result.breakdown.saju.score,
        zodiac_score: result.breakdown.zodiac.score,
        mbti_score: result.breakdown.mbti.score,
        ai_summary: JSON.stringify(result.analysis),
        is_paid: false,
        ...partnerDbFields,
      })
      .select('id')
      .single()

    if (saveError) {
      console.error('[POST /api/compatibility] DB 저장 실패:', saveError)
    }

    // ===== 8. 결과 반환 (debug 필드 항상 포함) =====
    return NextResponse.json({
      id: savedResult?.id ?? null,
      totalScore: result.totalScore,
      breakdown: result.breakdown,
      analysis: result.analysis,
      debug: {
        provider: provider.name,
        model: provider.model,
        prompt: debugPrompt,
        rawLLMResponse: debugRawResponse,
      },
    })
  } catch (error) {
    console.error('[POST /api/compatibility] 예상치 못한 에러:', error)
    return NextResponse.json({ error: '궁합 분석 중 오류가 발생했습니다' }, { status: 500 })
  }
}
```

**Step 2: TypeScript 타입 체크**
```bash
cd /Users/yessorae/desttiny/.worktrees/feat-issue-18
npx tsc --noEmit 2>&1 | head -30
```
Expected: 에러 없음

**Step 3: 전체 테스트**
```bash
npm test
```
Expected: 63 tests pass, 4 todo

**Step 4: 커밋**
```bash
git add app/api/compatibility/route.ts
git commit -m "feat: 궁합 API 엔드포인트 구현 - debug 필드 포함 (#18)"
```

---

## Task 5: 통합 테스트 문서 + Integration Test

**Files:**
- Create: `lib/llm/providers/__tests__/anthropic.integration.test.ts`

**Step 1: Integration Test 파일 작성**

`lib/llm/providers/__tests__/anthropic.integration.test.ts`:
```typescript
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
    })

    const result = await provider.generateText(prompt)
    const parsed = JSON.parse(result)

    expect(parsed.summary).toBeTruthy()
    expect(Array.isArray(parsed.sections)).toBe(true)
    expect(parsed.sections.length).toBeGreaterThanOrEqual(5)
    expect(parsed.finalSummary).toBeTruthy()
  }, 60000)
})
```

**Step 2: curl 테스트 명령어 확인**

개발 서버 실행 후 테스트:
```bash
# 터미널 1: 개발 서버 실행
cd /Users/yessorae/desttiny/.worktrees/feat-issue-18
npm run dev

# 터미널 2: 테스트 curl (로그인 세션이 있어야 함)
# 주의: 실제 테스트를 위해서는 브라우저에서 로그인 후 쿠키 추출 필요

# 헬스 체크 (API 라우트 존재 확인)
curl -X POST http://localhost:3000/api/compatibility \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
# Expected: 401 Unauthorized (인증 필요하다는 응답)

# 로그인 세션 쿠키로 실제 테스트
# 브라우저 DevTools > Application > Cookies에서
# sb-{project-ref}-auth-token 쿠키값 복사 후:
curl -X POST http://localhost:3000/api/compatibility \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-{project-ref}-auth-token={cookie-value}" \
  -d '{
    "relationshipType": "friend",
    "partner": {
      "name": "이영희",
      "birthDate": "1995-08-15",
      "birthTime": "14:00",
      "mbti": "ENFP",
      "gender": "female"
    }
  }'
# Expected: 200 with {id, totalScore, breakdown, analysis, debug}
```

**Step 3: 커밋**
```bash
cd /Users/yessorae/desttiny/.worktrees/feat-issue-18
git add lib/llm/providers/__tests__/anthropic.integration.test.ts
git commit -m "test: Anthropic 통합 테스트 + curl 테스트 가이드 추가 (#18)"
```

---

## Task 6: PR 생성

**Step 1: 전체 테스트 최종 확인**
```bash
cd /Users/yessorae/desttiny/.worktrees/feat-issue-18
npm test
```
Expected: 63+ tests pass, 4 todo

**Step 2: 브랜치 푸시**
```bash
git push -u origin feat/issue-18-compatibility-api
```

**Step 3: PR 생성**
```bash
gh pr create \
  --base develop \
  --title "feat: 3체계 통합 궁합 API + LLM 추상화 (#18)" \
  --body "$(cat <<'EOF'
## Summary
- `lib/llm/`: LLMProvider 인터페이스 + AnthropicProvider + factory (환경변수 LLM_PROVIDER로 교체 가능)
- `lib/saju/index.ts`: parseDayPillar() - DB 저장 문자열 → Pillar 객체
- `lib/compatibility/ai/prompt.ts`: buildCompatibilityPrompt() - 관계 유형별 맞춤 프롬프트
- `lib/compatibility/calculator.ts`: calculateCompatibility() - LLMProvider 주입, 3체계 병렬 계산
- `app/api/compatibility/route.ts`: POST 엔드포인트 (인증·검증·슬롯체크·DB저장·debug 필드)

## LLM 교체 방법
환경변수 하나로 LLM 교체:
```
LLM_PROVIDER=anthropic   # 현재 (기본값)
# 추후: LLM_PROVIDER=openai, LLM_PROVIDER=gemini 등
```
새 provider 추가 시: `lib/llm/providers/{name}.ts` 생성 + `factory.ts` case 추가

## 테스트 방법
```bash
# 유닛 테스트 (자동화)
npm test

# 통합 테스트 (실제 API 호출)
ANTHROPIC_API_KEY=sk-ant-... LLM_INTEGRATION=true npm test -- anthropic.integration

# curl 테스트 (개발 서버 필요)
npm run dev
# 브라우저에서 로그인 후 쿠키 추출하여 curl 실행
# (docs/plans/2026-02-25-issue-18-compatibility-api.md Task 5 참고)
```

## debug 필드
현재는 항상 포함 (외부 배포 없으므로):
```json
{
  "debug": {
    "provider": "anthropic",
    "model": "claude-sonnet-4-6",
    "prompt": "실제 프롬프트 전문",
    "rawLLMResponse": "LLM 원본 응답"
  }
}
```

Closes #18

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## 주요 주의사항

1. **LLM_PROVIDER 환경변수**: `.env.local`에 설정. 미설정 시 기본값 `anthropic`
2. **ANTHROPIC_API_KEY**: `.env.local`에 설정 필수. Vercel 환경변수에도 추가 (배포 시)
3. **무료 슬롯**: `daily_free_slots` 테이블에 오늘 날짜 row가 없으면 402 반환 → DB에 row 삽입 필요
4. **debug 필드**: 현재는 항상 포함 (외부 배포 시 `NODE_ENV !== 'production'` 조건 추가 예정)
5. **새 LLM provider 추가 방법**:
   - `lib/llm/providers/{name}.ts` 생성 (LLMProvider 구현)
   - `lib/llm/providers/index.ts`에 export 추가
   - `lib/llm/factory.ts`의 switch에 case 추가
   - 해당 SDK 설치 (`npm install @openai/sdk` 등)
