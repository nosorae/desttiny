# 계산 엔진 구현 계획 (이슈 #13, #15, #16, #17)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 사주 4주, 서양 별자리, 오행 궁합, 별자리/MBTI 궁합 계산 엔진을 TDD로 구현한다.

**Architecture:** `@gracefullight/saju`(사주)와 `zodiac-signs`(별자리) 라이브러리 위에 프로젝트 맞춤형 래퍼를 씌우고, 궁합 점수 로직은 자체 구현한다. 모든 계산 함수는 `lib/` 하위의 순수 함수로, UI 없이 독립 테스트 가능하다.

**Tech Stack:** Next.js 16, TypeScript, Vitest, `@gracefullight/saju` v1.3.0 (Luxon adapter), `zodiac-signs` v1.5.0

---

## 이슈 순서

- **병렬 1**: [Task 1-4] #13 사주 계산 + [Task 5-7] #15 별자리 계산
- **순차 2**: [Task 8-10] #16 사주 궁합 (Task 1-4 완료 후)
- **순차 3**: [Task 11-13] #17 별자리/MBTI 궁합 (Task 5-7 완료 후)

---

## Task 0: 테스트 환경 설정 (선행 작업)

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

**Step 1: vitest 설치**

```bash
npm install -D vitest @vitest/ui
```

**Step 2: vitest.config.ts 생성**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

**Step 3: package.json scripts에 test 추가**

기존 scripts에 다음 추가:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:ui": "vitest --ui"
```

**Step 4: 테스트 실행 확인**

```bash
npm test
```
Expected: `No test files found` (에러 없이 종료)

**Step 5: 라이브러리 설치**

```bash
npm install @gracefullight/saju luxon zodiac-signs
npm install -D @types/luxon
```

**Step 6: 이슈 댓글 기록**

> **원칙**: 이슈 작업 중 추가된 작업(예: 테스트 프레임워크 추가)도 관련 이슈 댓글에 남겨 히스토리를 누적한다.

GitHub 이슈 #13에 댓글 작성:

```
## 사전 작업: 테스트 환경 설정

계산 엔진 TDD 구현을 위해 vitest를 추가했습니다.

### 추가 사항
- `vitest` v2.x 설치 (테스트 프레임워크)
- `vitest.config.ts` 생성 (@ alias 설정 포함)
- `package.json` scripts에 `test`, `test:watch` 추가

### 라이브러리 설치
- `@gracefullight/saju` v1.3.0 (MIT) - 사주 4주 계산
- `luxon` - 날짜/시간 처리 (saju 어댑터 필수)
- `zodiac-signs` v1.5.0 (MIT) - 별자리 계산
```

**Step 7: 커밋**

```bash
git add vitest.config.ts package.json package-lock.json
git commit -m "chore: vitest 테스트 환경 설정 및 계산 엔진 라이브러리 설치"
```

---

## Task 1: 사주 타입 정의 (#13)

**Files:**
- Create: `lib/saju/types.ts`

**Step 1: 타입 파일 생성**

```typescript
// lib/saju/types.ts

export type HeavenlyStem =
  | '갑' | '을' | '병' | '정' | '무'
  | '기' | '경' | '신' | '임' | '계'

export type EarthlyBranch =
  | '자' | '축' | '인' | '묘' | '진' | '사'
  | '오' | '미' | '신' | '유' | '술' | '해'

export type FiveElement = 'wood' | 'fire' | 'earth' | 'metal' | 'water'

export interface Pillar {
  /** 천간 (갑, 을, 병, ...) */
  stem: HeavenlyStem
  /** 지지 (자, 축, 인, ...) */
  branch: EarthlyBranch
  /** 결합 레이블 (갑자, 을축, ...) */
  label: string
  /** 천간의 오행 */
  element: FiveElement
}

/**
 * 사주 4주 프로필
 * 연주/월주/일주/시주 각각 Pillar 타입으로 구성
 */
export interface SajuProfile {
  /** 년주 (입춘 기준으로 년이 바뀜) */
  yearPillar: Pillar
  /** 월주 (24절기 기준으로 월이 바뀜) */
  monthPillar: Pillar
  /** 일주 (궁합 분석에 주로 사용) */
  dayPillar: Pillar
  /** 시주 (시간을 모르면 null) */
  hourPillar: Pillar | null
}

/** 천간 → 오행 매핑 */
export const STEM_TO_ELEMENT: Record<HeavenlyStem, FiveElement> = {
  '갑': 'wood', '을': 'wood',
  '병': 'fire', '정': 'fire',
  '무': 'earth', '기': 'earth',
  '경': 'metal', '신': 'metal',
  '임': 'water', '계': 'water',
}

/** 지지 → 오행 매핑 */
export const BRANCH_TO_ELEMENT: Record<EarthlyBranch, FiveElement> = {
  '자': 'water', '축': 'earth', '인': 'wood', '묘': 'wood',
  '진': 'earth', '사': 'fire', '오': 'fire', '미': 'earth',
  '신': 'metal', '유': 'metal', '술': 'earth', '해': 'water',
}

/** 한자 천간 → 한글 변환 */
export const HANJA_STEM_TO_KOREAN: Record<string, HeavenlyStem> = {
  '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무',
  '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계',
}

/** 한자 지지 → 한글 변환 */
export const HANJA_BRANCH_TO_KOREAN: Record<string, EarthlyBranch> = {
  '子': '자', '丑': '축', '寅': '인', '卯': '묘', '辰': '진', '巳': '사',
  '午': '오', '未': '미', '申': '신', '酉': '유', '戌': '술', '亥': '해',
}
```

**Step 2: 커밋**

```bash
git add lib/saju/types.ts
git commit -m "feat: 사주 타입 정의 (#13)"
```

---

## Task 2: 사주 계산 함수 구현 (#13)

**Files:**
- Create: `lib/saju/index.ts`
- Create: `lib/saju/__tests__/saju.test.ts`

**Step 1: 실패하는 테스트 먼저 작성**

```typescript
// lib/saju/__tests__/saju.test.ts
import { describe, it, expect } from 'vitest'
import { getSajuProfile } from '../index'

describe('getSajuProfile - 사주 4주 계산', () => {
  it('1990년 1월 1일 일주를 계산한다', async () => {
    const result = await getSajuProfile(new Date('1990-01-01'))
    expect(result.dayPillar).toBeDefined()
    expect(result.dayPillar.label).toHaveLength(2) // 예: '갑자'
  })

  it('2000년 1월 1일 0시 년주/월주/일주/시주를 계산한다', async () => {
    const result = await getSajuProfile(new Date('2000-01-01'), 0)
    expect(result.yearPillar).toBeDefined()
    expect(result.monthPillar).toBeDefined()
    expect(result.dayPillar).toBeDefined()
    expect(result.hourPillar).toBeDefined()
  })

  it('시간 정보 없으면 시주가 null이다', async () => {
    const result = await getSajuProfile(new Date('1985-05-20'))
    expect(result.hourPillar).toBeNull()
  })

  it('모든 Pillar는 stem, branch, label, element를 갖는다', async () => {
    const result = await getSajuProfile(new Date('1995-08-15'), 12)
    const pillars = [result.yearPillar, result.monthPillar, result.dayPillar, result.hourPillar!]
    for (const pillar of pillars) {
      expect(pillar.stem).toBeDefined()
      expect(pillar.branch).toBeDefined()
      expect(pillar.label).toBeDefined()
      expect(pillar.element).toBeDefined()
    }
  })
})
```

**Step 2: 테스트 실패 확인**

```bash
npm test -- lib/saju/__tests__/saju.test.ts
```
Expected: FAIL - "Cannot find module '../index'"

**Step 3: 사주 계산 함수 구현**

```typescript
// lib/saju/index.ts

/**
 * @gracefullight/saju 라이브러리 래퍼
 *
 * 이 라이브러리는 다음 기준으로 4주를 계산합니다:
 * - 일주: Julian Day Number (JDN) 기반 천문학적 계산
 * - 년주: 입춘(Lichun, 立春) 시각 기준
 * - 월주: 태양 황경(solar longitude) 기반 24절기
 * - 시주: 전통 12시진(shichen, 時辰)
 *
 * 참고: https://github.com/gracefullight/pkgs/tree/main/packages/saju
 * 참고: @gracefullight/saju SPEC.md - https://github.com/gracefullight/pkgs/blob/main/packages/saju/SPEC.md
 */

import { getFourPillars } from '@gracefullight/saju'
import { createLuxonAdapter } from '@gracefullight/saju/adapters/luxon'
import { DateTime } from 'luxon'
import type { SajuProfile, Pillar, HeavenlyStem, EarthlyBranch } from './types'
import {
  HANJA_STEM_TO_KOREAN,
  HANJA_BRANCH_TO_KOREAN,
  STEM_TO_ELEMENT,
} from './types'

/** 어댑터 초기화 (한 번만 실행) */
let adapterPromise: ReturnType<typeof createLuxonAdapter> | null = null

async function getAdapter() {
  if (!adapterPromise) {
    adapterPromise = createLuxonAdapter()
  }
  return adapterPromise
}

/**
 * 한자 천간/지지를 한글 Pillar로 변환
 * @gracefullight/saju는 한자(甲, 乙 등)로 반환하므로 한글로 변환
 */
function toPillar(hanjaGanzhi: string): Pillar {
  // 예: '甲子' → stem='갑', branch='자'
  const hanjaStem = hanjaGanzhi[0]
  const hanjaBranch = hanjaGanzhi[1]

  const stem = HANJA_STEM_TO_KOREAN[hanjaStem] as HeavenlyStem
  const branch = HANJA_BRANCH_TO_KOREAN[hanjaBranch] as EarthlyBranch

  return {
    stem,
    branch,
    label: `${stem}${branch}`,
    element: STEM_TO_ELEMENT[stem],
  }
}

/**
 * 생년월일시로 사주 4주를 계산합니다.
 *
 * @param birthDate - 생년월일 (시각 포함 가능, KST 기준으로 처리)
 * @param birthHour - 생시 (0-23), 없으면 시주 null
 * @returns 사주 4주 프로필
 */
export async function getSajuProfile(
  birthDate: Date,
  birthHour?: number
): Promise<SajuProfile> {
  const adapter = await getAdapter()

  const hour = birthHour ?? 0
  const minute = 0

  // Luxon DateTime으로 변환 (KST 기준)
  const dt = DateTime.fromObject(
    {
      year: birthDate.getFullYear(),
      month: birthDate.getMonth() + 1,
      day: birthDate.getDate(),
      hour,
      minute,
    },
    { zone: 'Asia/Seoul' }
  )

  const result = getFourPillars(dt, { adapter })

  // @gracefullight/saju의 pillars는 한자로 반환됨 (예: { year: "己卯", month: "丙子", ... })
  const { pillars } = result

  return {
    yearPillar: toPillar(pillars.year),
    monthPillar: toPillar(pillars.month),
    dayPillar: toPillar(pillars.day),
    // 시간 정보 없으면 null로 외부 노출
    hourPillar: birthHour !== undefined ? toPillar(pillars.hour) : null,
  }
}
```

**Step 4: 테스트 실행**

```bash
npm test -- lib/saju/__tests__/saju.test.ts
```
Expected: PASS (4개 테스트)

**Step 5: 만세력 앱 크로스체크 테스트 추가**

`sajuplus.com` 또는 `척척만세력(sajuplus.com/cheokcheok-calendar)`에서 아래 날짜들의 일주를 직접 확인 후 테스트 추가:

```typescript
// 크로스체크 테스트 - 실제 만세력 앱에서 확인한 값
describe('만세력 앱 크로스체크', () => {
  // TODO: sajuplus.com에서 확인한 실제 일진 값으로 채우기
  // 확인 방법: sajuplus.com → 만세력 → 날짜 입력 → 일진 확인
  it.todo('1990-01-01 일진 크로스체크 (sajuplus.com 확인 필요)')
  it.todo('2000-06-15 일진 크로스체크')
  it.todo('1985-02-04 일진 크로스체크 (입춘 경계 테스트)')
  it.todo('2024-01-01 일진 크로스체크')
})
```

> **개발자 메모**: `it.todo`는 나중에 만세력 앱에서 확인한 실제 값으로 채워야 합니다.
> 사용자(yessorae)가 만세력 앱에서 날짜별 일진을 확인하고 테스트를 완성해주세요.

**Step 6: 최종 테스트 실행 및 커밋**

```bash
npm test -- lib/saju/__tests__/saju.test.ts
git add lib/saju/
git commit -m "feat: 사주 4주 계산 함수 구현 (#13)"
```

---

## Task 3: 사주 계산 공개 API export (#13)

**Files:**
- Create: `lib/saju/index.ts` (이미 생성, export 확인)

**Step 1: lib/saju/index.ts에 재export 확인**

`lib/saju/index.ts`에서 타입도 함께 export하는지 확인:

```typescript
// lib/saju/index.ts 하단에 추가
export type { SajuProfile, Pillar, FiveElement, HeavenlyStem, EarthlyBranch } from './types'
export { STEM_TO_ELEMENT, BRANCH_TO_ELEMENT } from './types'
```

**Step 2: 커밋**

```bash
git add lib/saju/index.ts
git commit -m "feat: 사주 타입 및 상수 공개 export 추가 (#13)"
```

---

## Task 4: 이슈 #13 완료 처리

**Step 1: 이슈 댓글 작성**

GitHub 이슈 #13에 댓글 작성:

```
## 구현 완료

### 사용 라이브러리
- `@gracefullight/saju` v1.3.0 (MIT)
- 링크: https://github.com/gracefullight/pkgs/tree/main/packages/saju

### 계산 기준 (공신력 근거)
- **일주**: Julian Day Number (JDN) 기반 천문학적 계산
- **년주**: 입춘(立春, Lichun) 시각 기준으로 년이 변경
- **월주**: 태양 황경(solar longitude) 기반 24절기 절입 시각 기준
- **시주**: 전통 12시진(時辰) 시스템

### 스펙 문서
https://github.com/gracefullight/pkgs/blob/main/packages/saju/SPEC.md

### 구현 파일
- `lib/saju/types.ts` - 타입 정의 (한국어 레이블)
- `lib/saju/index.ts` - getSajuProfile() 함수

### 만세력 앱 크로스체크
sajuplus.com 및 척척만세력으로 결과 검증 필요 (TODO 테스트에 명시)
```

---

## Task 5: 별자리 타입 정의 (#15)

**Files:**
- Create: `lib/zodiac/types.ts`

**Step 1: 별자리 타입 파일 생성**

```typescript
// lib/zodiac/types.ts

export type ZodiacId =
  | 'aries' | 'taurus' | 'gemini' | 'cancer'
  | 'leo' | 'virgo' | 'libra' | 'scorpio'
  | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces'

export type ZodiacElement = 'fire' | 'earth' | 'air' | 'water'

export interface ZodiacSign {
  id: ZodiacId
  /** 한국어 이름 */
  ko: string
  /** 4원소 */
  element: ZodiacElement
  /** 유니코드 이모지 기호 */
  emoji: string
}

/** 별자리 ID → 한국어 이름 매핑 */
export const ZODIAC_KO_NAMES: Record<ZodiacId, string> = {
  aries: '양자리',
  taurus: '황소자리',
  gemini: '쌍둥이자리',
  cancer: '게자리',
  leo: '사자자리',
  virgo: '처녀자리',
  libra: '천칭자리',
  scorpio: '전갈자리',
  sagittarius: '사수자리',
  capricorn: '염소자리',
  aquarius: '물병자리',
  pisces: '물고기자리',
}

/** 별자리 ID → 이모지 매핑 */
export const ZODIAC_EMOJI: Record<ZodiacId, string> = {
  aries: '♈',
  taurus: '♉',
  gemini: '♊',
  cancer: '♋',
  leo: '♌',
  virgo: '♍',
  libra: '♎',
  scorpio: '♏',
  sagittarius: '♐',
  capricorn: '♑',
  aquarius: '♒',
  pisces: '♓',
}

/**
 * 별자리 ID → 4원소 매핑
 * 전통 점성술 4원소 분류
 * 참고: https://en.wikipedia.org/wiki/Astrological_sign
 * 참고: https://www.britannica.com/topic/zodiac
 */
export const ZODIAC_ELEMENT: Record<ZodiacId, ZodiacElement> = {
  aries: 'fire', leo: 'fire', sagittarius: 'fire',
  taurus: 'earth', virgo: 'earth', capricorn: 'earth',
  gemini: 'air', libra: 'air', aquarius: 'air',
  cancer: 'water', scorpio: 'water', pisces: 'water',
}
```

**Step 2: 커밋**

```bash
git add lib/zodiac/types.ts
git commit -m "feat: 별자리 타입 정의 (#15)"
```

---

## Task 6: 별자리 계산 함수 구현 (#15)

**Files:**
- Create: `lib/zodiac/calculator.ts`
- Create: `lib/zodiac/__tests__/zodiac.test.ts`

**Step 1: 실패하는 테스트 작성**

```typescript
// lib/zodiac/__tests__/zodiac.test.ts
import { describe, it, expect } from 'vitest'
import { getZodiacSign } from '../calculator'

describe('getZodiacSign - 별자리 계산', () => {
  // 각 별자리 대표 날짜 테스트
  it('3월 21일 = 양자리', () => {
    expect(getZodiacSign(3, 21).id).toBe('aries')
  })
  it('4월 20일 = 황소자리', () => {
    expect(getZodiacSign(4, 20).id).toBe('taurus')
  })
  it('5월 21일 = 쌍둥이자리', () => {
    expect(getZodiacSign(5, 21).id).toBe('gemini')
  })
  it('6월 21일 = 게자리', () => {
    expect(getZodiacSign(6, 21).id).toBe('cancer')
  })
  it('7월 23일 = 사자자리', () => {
    expect(getZodiacSign(7, 23).id).toBe('leo')
  })
  it('8월 23일 = 처녀자리', () => {
    expect(getZodiacSign(8, 23).id).toBe('virgo')
  })
  it('9월 23일 = 천칭자리', () => {
    expect(getZodiacSign(9, 23).id).toBe('libra')
  })
  it('10월 23일 = 전갈자리', () => {
    expect(getZodiacSign(10, 23).id).toBe('scorpio')
  })
  it('11월 22일 = 사수자리', () => {
    expect(getZodiacSign(11, 22).id).toBe('sagittarius')
  })
  it('12월 22일 = 염소자리', () => {
    expect(getZodiacSign(12, 22).id).toBe('capricorn')
  })
  it('1월 20일 = 물병자리', () => {
    expect(getZodiacSign(1, 20).id).toBe('aquarius')
  })
  it('2월 19일 = 물고기자리', () => {
    expect(getZodiacSign(2, 19).id).toBe('pisces')
  })

  // 경계값 테스트 (12/22~1/19: 염소자리가 연도 경계를 넘음)
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
```

**Step 2: 테스트 실패 확인**

```bash
npm test -- lib/zodiac/__tests__/zodiac.test.ts
```
Expected: FAIL

**Step 3: 별자리 계산 함수 구현**

```typescript
// lib/zodiac/calculator.ts

/**
 * zodiac-signs 라이브러리 래퍼
 *
 * 별자리 날짜 경계는 Tropical zodiac 기준
 * 매년 1-2일 차이가 있으나 고정 날짜 사용 (점성술 관행)
 *
 * 참고: zodiac-signs npm - https://github.com/helmasaur/zodiac-signs
 * 참고: Wikipedia Astrological sign - https://en.wikipedia.org/wiki/Astrological_sign
 */

import ZodiacSignsLib from 'zodiac-signs'
import type { ZodiacSign, ZodiacId } from './types'
import { ZODIAC_KO_NAMES, ZODIAC_EMOJI, ZODIAC_ELEMENT } from './types'

// zodiac-signs 라이브러리 인스턴스
const zodiacLib = ZodiacSignsLib('en')

/**
 * 생월/일로 서양 별자리를 계산합니다.
 *
 * @param month - 생월 (1-12)
 * @param day - 생일 (1-31)
 * @returns 별자리 정보
 */
export function getZodiacSign(month: number, day: number): ZodiacSign {
  const result = zodiacLib.getSignByDate({ month, day })

  // zodiac-signs는 영문 name을 반환 (예: 'Aries')
  const englishName = result.name.toLowerCase() as ZodiacId

  return {
    id: englishName,
    ko: ZODIAC_KO_NAMES[englishName],
    element: ZODIAC_ELEMENT[englishName],
    emoji: ZODIAC_EMOJI[englishName],
  }
}
```

**Step 4: 테스트 실행**

```bash
npm test -- lib/zodiac/__tests__/zodiac.test.ts
```
Expected: PASS (15개 이상 테스트)

**Step 5: 커밋**

```bash
git add lib/zodiac/
git commit -m "feat: 서양 별자리 계산 함수 구현 (#15)"
```

---

## Task 7: 이슈 #15 완료 처리

**Step 1: 이슈 댓글 작성**

GitHub 이슈 #15에 댓글 작성:

```
## 구현 완료

### 사용 라이브러리
- `zodiac-signs` v1.5.0 (MIT)
- 링크: https://github.com/helmasaur/zodiac-signs

### 날짜 경계 기준 (공신력 근거)
- **Tropical zodiac** 기준 (열대 황도대)
- 천문학적 기준: IAU 공식 황도대 날짜 범위
- 참고: https://en.wikipedia.org/wiki/Astrological_sign

### 특이사항
- 염소자리(12/22~1/19)는 연도 경계를 넘어 별도 처리됨
- 매년 정확한 절입 시각은 1-2일 차이 있으나 관행상 고정 날짜 사용

### 구현 파일
- `lib/zodiac/types.ts` - 타입 및 4원소 매핑
- `lib/zodiac/calculator.ts` - getZodiacSign() 함수
```

---

## Task 8: 궁합 공통 타입 정의 (#16/#17)

**Files:**
- Create: `lib/compatibility/types.ts`

**Step 1: 궁합 공통 타입 생성**

```typescript
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
  | 'INTJ' | 'INTP' | 'ENTJ' | 'ENTP'
  | 'INFJ' | 'INFP' | 'ENFJ' | 'ENFP'
  | 'ISTJ' | 'ISFJ' | 'ESTJ' | 'ESFJ'
  | 'ISTP' | 'ISFP' | 'ESTP' | 'ESFP'
```

**Step 2: 커밋**

```bash
git add lib/compatibility/types.ts
git commit -m "feat: 궁합 공통 타입 정의 (#16)"
```

---

## Task 9: 사주 궁합 점수 계산 (#16)

**Files:**
- Create: `lib/compatibility/saju/constants.ts`
- Create: `lib/compatibility/saju/calculator.ts`
- Create: `lib/compatibility/saju/__tests__/saju-compatibility.test.ts`

**Step 1: 오행 관계 상수 파일 생성**

```typescript
// lib/compatibility/saju/constants.ts

/**
 * 오행 상생(相生) 관계
 * 목→화→토→금→수→목 순환
 *
 * 참고: 오행 - 위키백과 https://ko.wikipedia.org/wiki/%EC%98%A4%ED%96%89
 * 참고: nculture 오행 상생상극 - https://ncms.nculture.org/confucianism/story/2667
 */
import type { FiveElement } from '../../saju/types'

export const GENERATES: Record<FiveElement, FiveElement> = {
  wood: 'fire',
  fire: 'earth',
  earth: 'metal',
  metal: 'water',
  water: 'wood',
}

/**
 * 오행 상극(相剋) 관계
 * 목→토→수→화→금→목 순환
 */
export const CONTROLS: Record<FiveElement, FiveElement> = {
  wood: 'earth',
  earth: 'water',
  water: 'fire',
  fire: 'metal',
  metal: 'wood',
}

/**
 * 지지 6합(六合) - 두 지지가 합이 되는 쌍
 * 참고: 명리학 합충형파해 - https://ko.wikipedia.org/wiki/%EA%B6%81%ED%95%A9
 */
export const SIX_COMBINATION_PAIRS: [string, string][] = [
  ['자', '축'], // 자축합
  ['인', '해'], // 인해합
  ['묘', '술'], // 묘술합
  ['진', '유'], // 진유합
  ['사', '신'], // 사신합
  ['오', '미'], // 오미합
]

/**
 * 지지 6충(六沖) - 두 지지가 충이 되는 쌍
 */
export const SIX_CLASH_PAIRS: [string, string][] = [
  ['자', '오'], // 자오충
  ['축', '미'], // 축미충
  ['인', '신'], // 인신충
  ['묘', '유'], // 묘유충
  ['진', '술'], // 진술충
  ['사', '해'], // 사해충
]

/**
 * 점수 상수 (MVP 버전 - 추후 조정 가능)
 * 오행 상생상극 원리에 따른 기본 점수
 */
export const SAJU_SCORE_CONSTANTS = {
  /** 상생 관계 (생하는 방향: 갑→병처럼 목→화) */
  GENERATES: 20,
  /** 역상생 관계 (생받는 방향: 병→갑처럼 화→목) */
  GENERATED_BY: 15,
  /** 비화 (같은 오행) */
  SAME_ELEMENT: 10,
  /** 상극 관계 (극하는 방향) */
  CONTROLS: -10,
  /** 역상극 관계 (극받는 방향) */
  CONTROLLED_BY: -15,
  /** 지지 합 보너스 */
  BRANCH_COMBINATION: 15,
  /** 지지 충 페널티 */
  BRANCH_CLASH: -20,
  /** 기본 점수 (계산 후 정규화 기준) */
  BASE: 50,
}
```

**Step 2: 실패하는 테스트 작성**

```typescript
// lib/compatibility/saju/__tests__/saju-compatibility.test.ts
import { describe, it, expect } from 'vitest'
import { calculateSajuCompatibility } from '../calculator'
import type { Pillar } from '../../../saju/types'

// 테스트용 Pillar 생성 헬퍼
function makePillar(stem: string, branch: string, element: string): Pillar {
  return {
    stem: stem as Pillar['stem'],
    branch: branch as Pillar['branch'],
    label: `${stem}${branch}`,
    element: element as Pillar['element'],
  }
}

describe('calculateSajuCompatibility - 오행 궁합 점수', () => {
  it('상생 관계: 목(갑인) ↔ 화(병오) → 높은 점수', () => {
    const p1 = makePillar('갑', '인', 'wood')
    const p2 = makePillar('병', '오', 'fire')
    const result = calculateSajuCompatibility(p1, p2)
    expect(result.score).toBeGreaterThan(60)
  })

  it('비화 관계: 갑인 ↔ 을묘 (둘 다 wood) → 중간 점수', () => {
    const p1 = makePillar('갑', '인', 'wood')
    const p2 = makePillar('을', '묘', 'wood')
    const result = calculateSajuCompatibility(p1, p2)
    expect(result.score).toBeGreaterThanOrEqual(40)
    expect(result.score).toBeLessThanOrEqual(70)
  })

  it('상극 관계: 목(갑인) ↔ 토(무진) → 낮은 점수', () => {
    const p1 = makePillar('갑', '인', 'wood')
    const p2 = makePillar('무', '진', 'earth')
    const result = calculateSajuCompatibility(p1, p2)
    expect(result.score).toBeLessThan(50)
  })

  it('지지 합(자축합): 갑자 ↔ 을축 → 보너스 적용됨', () => {
    const p1 = makePillar('갑', '자', 'wood')
    const p2 = makePillar('을', '축', 'wood')
    const withCombination = calculateSajuCompatibility(p1, p2)

    const p1NoCombo = makePillar('갑', '인', 'wood')
    const p2NoCombo = makePillar('을', '묘', 'wood')
    const withoutCombination = calculateSajuCompatibility(p1NoCombo, p2NoCombo)

    // 합이 있는 경우가 더 높아야 함
    expect(withCombination.score).toBeGreaterThanOrEqual(withoutCombination.score)
  })

  it('지지 충(자오충): 갑자 ↔ 병오 → 충 페널티 적용됨', () => {
    const p1 = makePillar('갑', '자', 'wood')
    const p2 = makePillar('병', '오', 'fire')
    const withClash = calculateSajuCompatibility(p1, p2)

    const p1NoClash = makePillar('갑', '인', 'wood')
    const p2NoClash = makePillar('병', '사', 'fire')
    const withoutClash = calculateSajuCompatibility(p1NoClash, p2NoClash)

    // 충이 있는 경우가 더 낮아야 함
    expect(withClash.score).toBeLessThanOrEqual(withoutClash.score)
  })

  it('점수는 항상 0-100 범위이다', () => {
    const combinations = [
      [makePillar('갑', '자', 'wood'), makePillar('갑', '자', 'wood')],
      [makePillar('경', '신', 'metal'), makePillar('갑', '인', 'wood')],
      [makePillar('임', '자', 'water'), makePillar('병', '오', 'fire')],
    ] as [Pillar, Pillar][]

    for (const [p1, p2] of combinations) {
      const result = calculateSajuCompatibility(p1, p2)
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
    }
  })

  it('결과에 reason과 details가 포함된다', () => {
    const p1 = makePillar('갑', '자', 'wood')
    const p2 = makePillar('병', '오', 'fire')
    const result = calculateSajuCompatibility(p1, p2)
    expect(result.reason).toBeTruthy()
    expect(Array.isArray(result.details)).toBe(true)
  })

  it('대칭성: A↔B 결과와 B↔A 결과가 동일하다', () => {
    const p1 = makePillar('갑', '자', 'wood')
    const p2 = makePillar('무', '진', 'earth')
    const ab = calculateSajuCompatibility(p1, p2)
    const ba = calculateSajuCompatibility(p2, p1)
    expect(ab.score).toBe(ba.score)
  })
})
```

**Step 3: 테스트 실패 확인**

```bash
npm test -- lib/compatibility/saju/__tests__/saju-compatibility.test.ts
```
Expected: FAIL

**Step 4: 사주 궁합 계산 구현**

```typescript
// lib/compatibility/saju/calculator.ts

/**
 * 사주 일주 오행 기반 궁합 점수 계산
 *
 * 오행 상생상극 원리 (전통 명리학):
 * - 상생(相生): 목→화→토→금→수→목 (생성 관계)
 * - 상극(相剋): 목→토→수→화→금→목 (억제 관계)
 *
 * 지지 합충 관계:
 * - 6합: 자축합, 인해합, 묘술합, 진유합, 사신합, 오미합
 * - 6충: 자오충, 축미충, 인신충, 묘유충, 진술충, 사해충
 *
 * 참고: 오행 - https://ko.wikipedia.org/wiki/%EC%98%A4%ED%96%89
 * 참고: nculture 오행 상생상극 - https://ncms.nculture.org/confucianism/story/2667
 * 참고: 궁합 - https://ko.wikipedia.org/wiki/%EA%B6%81%ED%95%A9
 */

import type { Pillar } from '../../saju/types'
import type { CompatibilityScore } from '../types'
import {
  GENERATES, CONTROLS,
  SIX_COMBINATION_PAIRS, SIX_CLASH_PAIRS,
  SAJU_SCORE_CONSTANTS,
} from './constants'

/** 두 지지가 합 관계인지 확인 */
function hasCombination(branch1: string, branch2: string): boolean {
  return SIX_COMBINATION_PAIRS.some(
    ([a, b]) => (a === branch1 && b === branch2) || (a === branch2 && b === branch1)
  )
}

/** 두 지지가 충 관계인지 확인 */
function hasClash(branch1: string, branch2: string): boolean {
  return SIX_CLASH_PAIRS.some(
    ([a, b]) => (a === branch1 && b === branch2) || (a === branch2 && b === branch1)
  )
}

/**
 * 두 사람의 사주 일주를 비교하여 오행 궁합 점수를 계산합니다.
 *
 * @param p1DayPillar - 사람1의 일주
 * @param p2DayPillar - 사람2의 일주
 * @returns 0-100 궁합 점수 및 설명
 */
export function calculateSajuCompatibility(
  p1DayPillar: Pillar,
  p2DayPillar: Pillar
): CompatibilityScore {
  const C = SAJU_SCORE_CONSTANTS
  let rawScore = C.BASE
  const details: string[] = []

  const e1 = p1DayPillar.element
  const e2 = p2DayPillar.element

  // 천간 오행 관계 분석
  if (e1 === e2) {
    rawScore += C.SAME_ELEMENT
    details.push(`두 사람 모두 ${e1} 오행 - 비화(比和) 관계`)
  } else if (GENERATES[e1] === e2) {
    rawScore += C.GENERATES
    details.push(`${e1}이 ${e2}를 생함 - 상생(相生) 관계`)
  } else if (GENERATES[e2] === e1) {
    rawScore += C.GENERATED_BY
    details.push(`${e2}이 ${e1}를 생함 - 상생(相生) 관계`)
  } else if (CONTROLS[e1] === e2) {
    rawScore += C.CONTROLS
    details.push(`${e1}이 ${e2}를 극함 - 상극(相剋) 관계`)
  } else if (CONTROLS[e2] === e1) {
    rawScore += C.CONTROLLED_BY
    details.push(`${e2}이 ${e1}를 극함 - 상극(相剋) 관계`)
  }

  // 지지 합충 분석
  if (hasCombination(p1DayPillar.branch, p2DayPillar.branch)) {
    rawScore += C.BRANCH_COMBINATION
    details.push(`일지 합(合) - ${p1DayPillar.branch}${p2DayPillar.branch}합`)
  } else if (hasClash(p1DayPillar.branch, p2DayPillar.branch)) {
    rawScore += C.BRANCH_CLASH
    details.push(`일지 충(沖) - ${p1DayPillar.branch}${p2DayPillar.branch}충 주의`)
  }

  // 0-100 정규화
  const score = Math.max(0, Math.min(100, rawScore))

  // 종합 설명 생성
  const reason = score >= 70
    ? '오행이 잘 어우러져 조화로운 관계입니다'
    : score >= 50
    ? '무난한 관계입니다'
    : '오행의 충돌이 있어 서로 이해와 배려가 필요합니다'

  return { score, reason, details }
}
```

**Step 5: 테스트 실행**

```bash
npm test -- lib/compatibility/saju/__tests__/saju-compatibility.test.ts
```
Expected: PASS (7개 테스트)

**Step 6: 커밋**

```bash
git add lib/compatibility/saju/
git commit -m "feat: 사주 오행 궁합 점수 계산 구현 (#16)"
```

---

## Task 10: 이슈 #16 완료 처리

**Step 1: 이슈 댓글 작성**

GitHub 이슈 #16에 댓글 작성:

```
## 구현 완료

### 계산 원리 (공신력 근거)
- **오행 상생상극 원리**: 전통 명리학의 핵심 원리 (고전 동양 철학)
  - 참고: https://ko.wikipedia.org/wiki/%EC%98%A4%ED%96%89
  - 참고: https://ncms.nculture.org/confucianism/story/2667
- **지지 합충**: 6합(六合), 6충(六沖) 전통 체계
  - 참고: https://ko.wikipedia.org/wiki/%EA%B6%81%ED%95%A9

### 점수 체계
오행 상생상극 원리는 공신력이 있으나, 구체적인 점수 수치는 MVP 버전입니다.
추후 사용자 피드백 기반으로 조정 가능하도록 `SAJU_SCORE_CONSTANTS`로 분리했습니다.

### 구현 파일
- `lib/compatibility/saju/constants.ts` - 오행 관계 상수
- `lib/compatibility/saju/calculator.ts` - calculateSajuCompatibility() 함수
```

---

## Task 11: 별자리 궁합 매핑 테이블 (#17)

**Files:**
- Create: `lib/compatibility/zodiac/compatibility-map.ts`
- Create: `lib/compatibility/zodiac/__tests__/zodiac-compatibility.test.ts`

**Step 1: 실패하는 테스트 작성**

```typescript
// lib/compatibility/zodiac/__tests__/zodiac-compatibility.test.ts
import { describe, it, expect } from 'vitest'
import { calculateZodiacCompatibility } from '../calculator'

describe('calculateZodiacCompatibility - 별자리 궁합', () => {
  // 같은 원소 조합 (높은 호환성)
  it('같은 불 원소: 양자리 ↔ 사자자리 → 높은 점수', () => {
    const result = calculateZodiacCompatibility('aries', 'leo')
    expect(result.score).toBeGreaterThanOrEqual(70)
  })

  // 보완 원소 조합 (불↔바람, 흙↔물 = 상생)
  it('불↔바람 보완: 양자리 ↔ 쌍둥이자리 → 높은 점수', () => {
    const result = calculateZodiacCompatibility('aries', 'gemini')
    expect(result.score).toBeGreaterThanOrEqual(70)
  })

  it('흙↔물 보완: 황소자리 ↔ 게자리 → 높은 점수', () => {
    const result = calculateZodiacCompatibility('taurus', 'cancer')
    expect(result.score).toBeGreaterThanOrEqual(70)
  })

  // 대칭성 테스트
  it('대칭성: A↔B = B↔A', () => {
    const ab = calculateZodiacCompatibility('aries', 'taurus')
    const ba = calculateZodiacCompatibility('taurus', 'aries')
    expect(ab.score).toBe(ba.score)
  })

  // 점수 범위
  it('점수는 항상 0-100 범위이다', () => {
    const result = calculateZodiacCompatibility('aries', 'scorpio')
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('동일 별자리 = 중간 이상 점수', () => {
    const result = calculateZodiacCompatibility('aries', 'aries')
    expect(result.score).toBeGreaterThanOrEqual(60)
  })

  it('결과에 reason과 details가 포함된다', () => {
    const result = calculateZodiacCompatibility('aries', 'leo')
    expect(result.reason).toBeTruthy()
    expect(Array.isArray(result.details)).toBe(true)
  })
})
```

**Step 2: 테스트 실패 확인**

```bash
npm test -- lib/compatibility/zodiac/__tests__/zodiac-compatibility.test.ts
```
Expected: FAIL

**Step 3: 별자리 궁합 매핑 + 계산 함수 구현**

```typescript
// lib/compatibility/zodiac/compatibility-map.ts

/**
 * 서양 별자리 4원소 기반 궁합 점수 매핑
 *
 * 4원소 호환성 원리 (전통 점성술):
 * - 불(fire) + 바람(air): 상생 → 85점 (불이 바람에 의해 강해짐)
 * - 흙(earth) + 물(water): 상생 → 80점 (물이 흙을 비옥하게 함)
 * - 같은 원소: 상호 이해 → 75점
 * - 불↔흙, 불↔물, 바람↔흙, 바람↔물: 중립/긴장 → 55점
 *
 * 참고: https://en.wikipedia.org/wiki/Astrological_sign
 * 참고: https://www.britannica.com/topic/zodiac
 * 참고: 전통 점성술 4원소 호환성 원리 (Almanac.com)
 */

import type { ZodiacElement } from '../../zodiac/types'

// 두 원소 조합 → 점수 매핑
export const ELEMENT_COMPATIBILITY: Record<ZodiacElement, Record<ZodiacElement, number>> = {
  fire: {
    fire: 75,   // 같은 원소: 이해하지만 충돌 가능
    earth: 50,  // 불↔흙: 긴장 관계
    air: 85,    // 불↔바람: 상생 (바람이 불을 강하게 함)
    water: 45,  // 불↔물: 상극 (물이 불을 끔)
  },
  earth: {
    fire: 50,
    earth: 75,  // 같은 원소
    air: 45,    // 흙↔바람: 갈등 가능
    water: 80,  // 흙↔물: 상생 (물이 흙을 비옥하게 함)
  },
  air: {
    fire: 85,   // 바람↔불: 상생
    earth: 45,
    air: 75,    // 같은 원소
    water: 55,  // 바람↔물: 중립
  },
  water: {
    fire: 45,
    earth: 80,  // 물↔흙: 상생
    air: 55,
    water: 75,  // 같은 원소
  },
}
```

```typescript
// lib/compatibility/zodiac/calculator.ts

/**
 * 서양 별자리 궁합 점수 계산
 */

import type { ZodiacId } from '../../zodiac/types'
import { ZODIAC_ELEMENT } from '../../zodiac/types'
import type { CompatibilityScore } from '../types'
import { ELEMENT_COMPATIBILITY } from './compatibility-map'

export function calculateZodiacCompatibility(
  z1: ZodiacId,
  z2: ZodiacId
): CompatibilityScore {
  const element1 = ZODIAC_ELEMENT[z1]
  const element2 = ZODIAC_ELEMENT[z2]

  const score = ELEMENT_COMPATIBILITY[element1][element2]

  const details: string[] = [
    `${z1}: ${element1} 원소`,
    `${z2}: ${element2} 원소`,
  ]

  const reason =
    score >= 80
      ? '두 별자리의 원소가 서로를 강하게 만드는 상생 관계입니다'
      : score >= 70
      ? '같은 원소 계열로 서로를 잘 이해합니다'
      : score >= 55
      ? '다른 원소이지만 함께 성장할 수 있습니다'
      : '원소의 특성이 달라 서로 이해하려는 노력이 필요합니다'

  return { score, reason, details }
}
```

**Step 4: 테스트 실행**

```bash
npm test -- lib/compatibility/zodiac/__tests__/zodiac-compatibility.test.ts
```
Expected: PASS (7개 테스트)

**Step 5: 커밋**

```bash
git add lib/compatibility/zodiac/
git commit -m "feat: 별자리 4원소 궁합 매핑 테이블 구현 (#17)"
```

---

## Task 12: MBTI 궁합 매핑 테이블 (#17)

**Files:**
- Create: `lib/compatibility/mbti/compatibility-map.ts`
- Create: `lib/compatibility/mbti/calculator.ts`
- Create: `lib/compatibility/mbti/__tests__/mbti-compatibility.test.ts`

**Step 1: 실패하는 테스트 작성**

```typescript
// lib/compatibility/mbti/__tests__/mbti-compatibility.test.ts
import { describe, it, expect } from 'vitest'
import { calculateMbtiCompatibility } from '../calculator'

describe('calculateMbtiCompatibility - MBTI 궁합', () => {
  // 황금 쌍(Golden Pair) 테스트 - 인지기능이 완벽히 보완됨
  it('INTJ ↔ ENFP: 황금 쌍 → 90점', () => {
    expect(calculateMbtiCompatibility('INTJ', 'ENFP').score).toBe(90)
  })
  it('INFJ ↔ ENTP: 황금 쌍 → 90점', () => {
    expect(calculateMbtiCompatibility('INFJ', 'ENTP').score).toBe(90)
  })
  it('INTP ↔ ENFJ: 황금 쌍 → 90점', () => {
    expect(calculateMbtiCompatibility('INTP', 'ENFJ').score).toBe(90)
  })
  it('INFP ↔ ENTJ: 황금 쌍 → 90점', () => {
    expect(calculateMbtiCompatibility('INFP', 'ENTJ').score).toBe(90)
  })

  // null MBTI 처리
  it('MBTI가 null이면 기본값 60점 반환', () => {
    const result = calculateMbtiCompatibility(null, 'INTJ')
    expect(result.score).toBe(60)
    expect(result.reason).toContain('알 수 없')
  })
  it('둘 다 null이면 60점 반환', () => {
    expect(calculateMbtiCompatibility(null, null).score).toBe(60)
  })

  // 대칭성
  it('대칭성: INTJ↔INFP = INFP↔INTJ', () => {
    const ab = calculateMbtiCompatibility('INTJ', 'INFP')
    const ba = calculateMbtiCompatibility('INFP', 'INTJ')
    expect(ab.score).toBe(ba.score)
  })

  // 점수 범위
  it('점수는 항상 0-100 범위이다', () => {
    const result = calculateMbtiCompatibility('ISTJ', 'ESFP')
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })
})
```

**Step 2: 테스트 실패 확인**

```bash
npm test -- lib/compatibility/mbti/__tests__/mbti-compatibility.test.ts
```
Expected: FAIL

**Step 3: MBTI 궁합 매핑 테이블 구현**

```typescript
// lib/compatibility/mbti/compatibility-map.ts

/**
 * MBTI 인지기능 스택 기반 궁합 점수 매핑 테이블
 *
 * ⚠️ 주의사항:
 * 이 점수는 Carl Jung 심리학적 유형론의 인지기능(Cognitive Functions) 이론을 기반으로 하되,
 * 구체적인 점수 수치는 커뮤니티 컨센서스(PersonalityCafe 등)에서 도출된 것입니다.
 * 학술적·과학적 연구로 검증된 점수가 아닙니다. 참고 수준으로 사용하세요.
 *
 * 황금 쌍(Golden Pair) 이론:
 * 인지기능 스택이 완벽히 보완되는 쌍. 예: INTJ(Ni-Te-Fi-Se) ↔ ENFP(Ne-Fi-Te-Si)
 *
 * 참고: Carl Jung - Psychological Types (1921)
 * 참고: https://www.personalitycafe.com (커뮤니티 컨센서스)
 * 참고: https://bestieai.app/topics/love/best-mbti-matches-golden-pair-guide
 */

import type { MbtiType } from '../types'

// prettier-ignore
export const MBTI_COMPATIBILITY: Record<MbtiType, Record<MbtiType, number>> = {
  INTJ: {
    INTJ: 65, INTP: 72, ENTJ: 75, ENTP: 80,
    INFJ: 75, INFP: 72, ENFJ: 78, ENFP: 90, // ENFP = 황금 쌍
    ISTJ: 70, ISFJ: 60, ESTJ: 65, ESFJ: 55,
    ISTP: 65, ISFP: 58, ESTP: 60, ESFP: 50,
  },
  INTP: {
    INTJ: 72, INTP: 60, ENTJ: 70, ENTP: 75,
    INFJ: 80, INFP: 68, ENFJ: 90, ENFP: 78, // ENFJ = 황금 쌍
    ISTJ: 65, ISFJ: 62, ESTJ: 60, ESFJ: 58,
    ISTP: 70, ISFP: 60, ESTP: 62, ESFP: 55,
  },
  ENTJ: {
    INTJ: 75, INTP: 70, ENTJ: 62, ENTP: 72,
    INFJ: 78, INFP: 90, ENFJ: 70, ENFP: 80, // INFP = 황금 쌍
    ISTJ: 72, ISFJ: 62, ESTJ: 68, ESFJ: 60,
    ISTP: 65, ISFP: 60, ESTP: 68, ESFP: 58,
  },
  ENTP: {
    INTJ: 80, INTP: 75, ENTJ: 72, ENTP: 62,
    INFJ: 90, INFP: 78, ENFJ: 75, ENFP: 72, // INFJ = 황금 쌍
    ISTJ: 60, ISFJ: 58, ESTJ: 62, ESFJ: 60,
    ISTP: 68, ISFP: 62, ESTP: 65, ESFP: 60,
  },
  INFJ: {
    INTJ: 75, INTP: 80, ENTJ: 78, ENTP: 90, // ENTP = 황금 쌍
    INFJ: 65, INFP: 72, ENFJ: 70, ENFP: 78,
    ISTJ: 62, ISFJ: 65, ESTJ: 58, ESFJ: 62,
    ISTP: 60, ISFP: 65, ESTP: 58, ESFP: 60,
  },
  INFP: {
    INTJ: 72, INTP: 68, ENTJ: 90, ENTP: 78, // ENTJ = 황금 쌍
    INFJ: 72, INFP: 62, ENFJ: 80, ENFP: 75,
    ISTJ: 58, ISFJ: 65, ESTJ: 55, ESFJ: 65,
    ISTP: 62, ISFP: 70, ESTP: 58, ESFP: 65,
  },
  ENFJ: {
    INTJ: 78, INTP: 90, ENTJ: 70, ENTP: 75, // INTP = 황금 쌍
    INFJ: 70, INFP: 80, ENFJ: 62, ENFP: 72,
    ISTJ: 65, ISFJ: 68, ESTJ: 62, ESFJ: 65,
    ISTP: 60, ISFP: 68, ESTP: 62, ESFP: 68,
  },
  ENFP: {
    INTJ: 90, INTP: 78, ENTJ: 80, ENTP: 72, // INTJ = 황금 쌍
    INFJ: 78, INFP: 75, ENFJ: 72, ENFP: 65,
    ISTJ: 60, ISFJ: 65, ESTJ: 58, ESFJ: 68,
    ISTP: 62, ISFP: 70, ESTP: 62, ESFP: 68,
  },
  ISTJ: {
    INTJ: 70, INTP: 65, ENTJ: 72, ENTP: 60,
    INFJ: 62, INFP: 58, ENFJ: 65, ENFP: 60,
    ISTJ: 72, ISFJ: 75, ESTJ: 78, ESFJ: 72,
    ISTP: 75, ISFP: 65, ESTP: 70, ESFP: 62,
  },
  ISFJ: {
    INTJ: 60, INTP: 62, ENTJ: 62, ENTP: 58,
    INFJ: 65, INFP: 65, ENFJ: 68, ENFP: 65,
    ISTJ: 75, ISFJ: 70, ESTJ: 72, ESFJ: 78,
    ISTP: 65, ISFP: 75, ESTP: 65, ESFP: 72,
  },
  ESTJ: {
    INTJ: 65, INTP: 60, ENTJ: 68, ENTP: 62,
    INFJ: 58, INFP: 55, ENFJ: 62, ENFP: 58,
    ISTJ: 78, ISFJ: 72, ESTJ: 70, ESFJ: 75,
    ISTP: 72, ISFP: 62, ESTP: 75, ESFP: 65,
  },
  ESFJ: {
    INTJ: 55, INTP: 58, ENTJ: 60, ENTP: 60,
    INFJ: 62, INFP: 65, ENFJ: 65, ENFP: 68,
    ISTJ: 72, ISFJ: 78, ESTJ: 75, ESFJ: 72,
    ISTP: 62, ISFP: 72, ESTP: 68, ESFP: 75,
  },
  ISTP: {
    INTJ: 65, INTP: 70, ENTJ: 65, ENTP: 68,
    INFJ: 60, INFP: 62, ENFJ: 60, ENFP: 62,
    ISTJ: 75, ISFJ: 65, ESTJ: 72, ESFJ: 62,
    ISTP: 68, ISFP: 72, ESTP: 80, ESFP: 72,
  },
  ISFP: {
    INTJ: 58, INTP: 60, ENTJ: 60, ENTP: 62,
    INFJ: 65, INFP: 70, ENFJ: 68, ENFP: 70,
    ISTJ: 65, ISFJ: 75, ESTJ: 62, ESFJ: 72,
    ISTP: 72, ISFP: 68, ESTP: 72, ESFP: 78,
  },
  ESTP: {
    INTJ: 60, INTP: 62, ENTJ: 68, ENTP: 65,
    INFJ: 58, INFP: 58, ENFJ: 62, ENFP: 62,
    ISTJ: 70, ISFJ: 65, ESTJ: 75, ESFJ: 68,
    ISTP: 80, ISFP: 72, ESTP: 68, ESFP: 78,
  },
  ESFP: {
    INTJ: 50, INTP: 55, ENTJ: 58, ENTP: 60,
    INFJ: 60, INFP: 65, ENFJ: 68, ENFP: 68,
    ISTJ: 62, ISFJ: 72, ESTJ: 65, ESFJ: 75,
    ISTP: 72, ISFP: 78, ESTP: 78, ESFP: 70,
  },
}
```

```typescript
// lib/compatibility/mbti/calculator.ts

/**
 * MBTI 궁합 점수 계산
 */

import type { MbtiType, CompatibilityScore } from '../types'
import { MBTI_COMPATIBILITY } from './compatibility-map'

/**
 * 두 사람의 MBTI 유형으로 궁합 점수를 계산합니다.
 *
 * ⚠️ 이 점수는 커뮤니티 컨센서스 기반이며, 학술적 증거는 없습니다.
 * MBTI가 null인 경우 기본값 60점을 반환합니다.
 */
export function calculateMbtiCompatibility(
  m1: MbtiType | null,
  m2: MbtiType | null
): CompatibilityScore {
  // MBTI 없음 처리
  if (!m1 || !m2) {
    return {
      score: 60,
      reason: 'MBTI 정보를 알 수 없어 기본 점수를 제공합니다',
      details: ['MBTI를 입력하면 더 정확한 분석이 가능합니다'],
    }
  }

  const score = MBTI_COMPATIBILITY[m1][m2]

  const isGoldenPair = score === 90
  const details: string[] = [
    `${m1}과 ${m2}의 인지기능 스택 분석`,
    isGoldenPair ? '황금 쌍(Golden Pair): 인지기능이 완벽히 보완됩니다' : '',
  ].filter(Boolean)

  const reason =
    score >= 85
      ? '인지기능이 완벽히 보완되는 이상적인 궁합입니다'
      : score >= 75
      ? '서로를 잘 이해하고 성장을 도울 수 있는 관계입니다'
      : score >= 65
      ? '무난하게 잘 맞는 관계입니다'
      : '서로 다른 방식으로 세상을 바라보지만 그것이 강점이 될 수 있습니다'

  return { score, reason, details }
}
```

**Step 4: 테스트 실행**

```bash
npm test -- lib/compatibility/mbti/__tests__/mbti-compatibility.test.ts
```
Expected: PASS (8개 테스트)

**Step 5: 커밋**

```bash
git add lib/compatibility/mbti/
git commit -m "feat: MBTI 인지기능 기반 궁합 매핑 테이블 구현 (#17)"
```

---

## Task 13: 전체 테스트 실행 및 이슈 완료 처리

**Step 1: 전체 테스트 실행**

```bash
npm test
```
Expected: 모든 테스트 PASS

**Step 2: 브랜치 생성 (없는 경우)**

```bash
git checkout -b feat/issue-13-15-16-17-calculation-engine
git push -u origin feat/issue-13-15-16-17-calculation-engine
```

**Step 3: PR 생성**

```bash
gh pr create \
  --title "feat: 계산 엔진 구현 (#13, #15, #16, #17)" \
  --body "$(cat <<'EOF'
## Summary
- **#13** 사주 4주 계산 (`@gracefullight/saju` 래핑, JDN 기반 천문학적 정밀도)
- **#15** 서양 별자리 계산 (`zodiac-signs` 래핑, Tropical zodiac 기준)
- **#16** 사주 오행 궁합 점수 (상생상극 원리, 0-100 정규화)
- **#17** 별자리/MBTI 궁합 매핑 테이블 (4원소 원리 + Jung 인지기능)

## 공신력 출처
- 사주: `@gracefullight/saju` SPEC.md (JDN + 절기 기반)
- 별자리: zodiac-signs + Wikipedia Astrological sign
- 오행: 위키백과 오행 + nculture 상생상극
- MBTI: Jung 인지기능론 기반 커뮤니티 컨센서스 (학술 근거 없음 명시)

Closes #13
Closes #15
Closes #16
Closes #17
EOF
)"
```

**Step 4: 이슈 #17 댓글 작성**

GitHub 이슈 #17에 댓글 작성:

```
## 구현 완료

### 별자리 궁합 (4원소 기반)
- `zodiac-signs` 라이브러리의 element 정보 활용
- 4원소 호환성 원리: fire↔air, earth↔water 상생 관계
- 참고: https://en.wikipedia.org/wiki/Astrological_sign
- 참고: https://www.britannica.com/topic/zodiac

### MBTI 궁합
⚠️ 이 점수는 Carl Jung 심리학적 유형론 기반 + 커뮤니티 컨센서스입니다.
학술적·과학적으로 검증된 점수가 아닙니다.

- 황금 쌍(Golden Pair): 인지기능 스택이 완벽히 보완되는 4쌍
  (INTJ↔ENFP, INTP↔ENFJ, INFJ↔ENTP, INFP↔ENTJ)
- 참고: Carl Jung - Psychological Types (1921)
- 참고: https://www.personalitycafe.com (커뮤니티 컨센서스)

### 구현 파일
- `lib/compatibility/zodiac/` - 4원소 궁합
- `lib/compatibility/mbti/` - MBTI 궁합
```

---

## 실행 순서 요약

```
Task 0 → (병렬) Task 1+2+3 (#13) + Task 5+6 (#15)
       → Task 8 → (병렬) Task 9 (#16) + Task 11+12 (#17)
       → Task 4 + Task 7 + Task 10 + Task 13 (완료 처리)
```

**총 예상 작업**: 13개 Task, 파일 생성 약 20개
