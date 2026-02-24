# 계산 엔진 설계 (이슈 #13, #15, #16, #17)

**작성일**: 2026-02-25
**담당 이슈**: #13 사주 일주 계산, #15 서양 별자리 계산, #16 사주 궁합 점수, #17 별자리/MBTI 궁합 매핑
**상태**: 승인됨

---

## 핵심 원칙

**공신력 우선**: 모든 계산 로직은 검증된 라이브러리 또는 공신력 있는 출처에 기반.
각 이슈 댓글에 사용한 라이브러리/출처 링크를 명시해야 함.

---

## 라이브러리 결정

| 이슈 | 라이브러리 | 라이센스 | 선택 이유 |
|------|-----------|---------|-----------|
| #13 사주 4주 계산 | `@gracefullight/saju` v1.3.0 | MIT | JDN 기반 천문학적 정밀도, 24절기 기반 월주, 180+ 테스트 91%+ 커버리지 |
| #15 별자리 계산 | `zodiac-signs` v1.5.0 | MIT | 별자리 날짜 계산 + 4원소 정보 포함, 의존성 없음 |
| #16 사주 궁합 | 자체 구현 (오행 원리) | — | 전통 명리학 오행 상생상극 원리 적용, 라이브러리 없음 |
| #17 별자리 궁합 | `zodiac-signs` element 활용 | MIT | 4원소 정보 재활용 |
| #17 MBTI 궁합 | 자체 구현 (Jung 인지기능) | — | 단일 공신력 라이브러리 없음, 직접 구현 후 출처 명시 |

---

## 아키텍처

```
lib/
├── saju/
│   ├── index.ts              ← @gracefullight/saju 래퍼 (공개 API)
│   ├── types.ts              ← 프로젝트 맞춤형 타입 정의
│   └── __tests__/
│       └── saju.test.ts      ← 만세력 앱 크로스체크 테스트 (sajuplus.com, 척척만세력)
├── zodiac/
│   ├── calculator.ts         ← zodiac-signs 래퍼
│   ├── types.ts
│   └── __tests__/
│       └── zodiac.test.ts
└── compatibility/
    ├── saju/
    │   ├── calculator.ts     ← 오행 상생상극 기반 궁합 점수 (0-100)
    │   └── __tests__/
    ├── zodiac/
    │   ├── compatibility-map.ts   ← 4원소 기반 궁합 테이블
    │   └── __tests__/
    └── mbti/
        ├── compatibility-map.ts   ← Jung 인지기능 기반 궁합 테이블
        └── __tests__/
```

---

## 핵심 타입 설계

```typescript
// lib/saju/types.ts
type HeavenlyStem = '갑' | '을' | '병' | '정' | '무' | '기' | '경' | '신' | '임' | '계'
type EarthlyBranch = '자' | '축' | '인' | '묘' | '진' | '사' | '오' | '미' | '신' | '유' | '술' | '해'
type FiveElement = 'wood' | 'fire' | 'earth' | 'metal' | 'water'

interface Pillar {
  stem: HeavenlyStem
  branch: EarthlyBranch
  label: string       // '갑자', '을축' 등 한국어 레이블
  element: FiveElement  // 천간의 오행
}

interface SajuProfile {
  yearPillar: Pillar      // 년주 (입춘 기준)
  monthPillar: Pillar     // 월주 (절기 기준)
  dayPillar: Pillar       // 일주 (궁합 분석 주요 사용)
  hourPillar: Pillar | null  // 시주 (시간 모를 경우 null로 외부 노출)
}

// lib/zodiac/types.ts
type ZodiacId = 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo' |
                'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces'
type ZodiacElement = 'fire' | 'earth' | 'air' | 'water'

interface ZodiacSign {
  id: ZodiacId
  ko: string          // 한국어 이름 (양자리 등)
  element: ZodiacElement
  emoji: string
}

// lib/compatibility/types.ts
interface CompatibilityScore {
  score: number       // 0-100 정규화
  reason: string      // 한국어 요약 설명 (사용자에게 보여줄 텍스트)
  details: string[]   // 상세 분석 항목들
}

// types/index.ts (전역)
type MbtiType = 'INTJ' | 'INTP' | 'ENTJ' | 'ENTP' |
                'INFJ' | 'INFP' | 'ENFJ' | 'ENFP' |
                'ISTJ' | 'ISFJ' | 'ESTJ' | 'ESFJ' |
                'ISTP' | 'ISFP' | 'ESTP' | 'ESFP'
```

---

## 이슈별 설계

### #13 사주 일주 계산

**라이브러리**: `@gracefullight/saju`
**공신력 근거**: Julian Day Number 기반 천문학적 계산, 24절기(태양 황경) 기반 월주, Lichun(입춘) 기반 년주

```typescript
// lib/saju/index.ts
import { getFourPillars } from '@gracefullight/saju'
import { createLuxonAdapter } from '@gracefullight/saju/adapters/luxon'

/**
 * 생년월일시로 사주 4주를 계산
 *
 * @gracefullight/saju 라이브러리 사용 (MIT 라이센스)
 * - 일주: Julian Day Number (JDN) 기반 천문학적 계산
 * - 연주: 입춘(Lichun) 시각 기준
 * - 월주: 태양 황경(solar longitude) 기준 절기
 * - 시주: 전통 12시진(shichen) 시스템
 *
 * 참고: https://github.com/gracefullight/pkgs/tree/main/packages/saju
 */
export async function getSajuProfile(
  birthDate: Date,
  birthHour?: number  // 0-23, 없으면 시주 null
): Promise<SajuProfile>
```

**테스트 전략**: sajuplus.com, 척척만세력 2개 앱에서 5개 이상 날짜 크로스체크

---

### #15 서양 별자리 계산

**라이브러리**: `zodiac-signs`
**공신력 근거**: Tropical zodiac 기반 날짜 경계 (Wikipedia Astrological sign 기준)

```typescript
// lib/zodiac/calculator.ts
import ZodiacSignsLib from 'zodiac-signs'

/**
 * 생월/일로 서양 별자리를 계산
 *
 * zodiac-signs 라이브러리 사용 (MIT 라이센스)
 * Tropical zodiac 날짜 경계 기준
 *
 * 참고: https://github.com/helmasaur/zodiac-signs
 * 참고: https://en.wikipedia.org/wiki/Astrological_sign
 */
export function getZodiacSign(month: number, day: number): ZodiacSign
```

---

### #16 사주 궁합 점수

**구현**: 전통 명리학 오행 상생상극 원리 기반 자체 구현
**공신력 근거**: 오행 상생상극 원리는 전통 동양 철학의 핵심 원리로 공신력 있음

**점수 체계**:
- 오행 관계 점수: 상생(+) / 비화(같은 오행, 중립) / 상극(-)
- 지지 합충 관계: 합(+) / 충(-)
- 최종 0-100 정규화

```typescript
// lib/compatibility/saju/calculator.ts
/**
 * 두 사람의 사주 일주로 오행 궁합 점수를 계산
 *
 * 오행 상생상극 원리 (전통 명리학):
 * - 상생(相生): 목→화→토→금→수→목
 * - 상극(相剋): 목→토→수→화→금→목
 *
 * 지지 합충 관계:
 * - 6합: 자축합, 인해합, 묘술합, 진유합, 사신합, 오미합
 * - 6충: 자오충, 축미충, 인신충, 묘유충, 진술충, 사해충
 *
 * 참고: 오행 위키백과 - https://ko.wikipedia.org/wiki/%EC%98%A4%ED%96%89
 * 참고: nculture 오행 상생상극 - https://ncms.nculture.org/confucianism/story/2667
 *
 * 점수 수치는 MVP 버전으로, 추후 조정 가능한 상수로 설계
 */
export function calculateSajuCompatibility(
  p1DayPillar: Pillar,
  p2DayPillar: Pillar
): CompatibilityScore
```

---

### #17 별자리 & MBTI 궁합 매핑

**별자리 궁합**:
- `zodiac-signs` 라이브러리의 element 정보 활용
- 4원소 호환성: fire↔air (상생), earth↔water (상생), 동일 원소 (중립), 나머지 (갈등)
- 참고: 전통 점성술 4원소 원리 (Britannica, Wikipedia)

**MBTI 궁합**:
- Jung 인지기능 스택 기반 직접 구현
- 황금 쌍(Golden Pair): 인지기능 스택이 거울처럼 보완되는 쌍
- 학술적 증거 없음 명시 필요 (이슈 댓글에 "커뮤니티 컨센서스 기반" 명시)
- 참고: Carl Jung 심리학적 유형론, Socionics 파생 이론

```typescript
// lib/compatibility/zodiac/compatibility-map.ts
/**
 * 서양 별자리 4원소 기반 궁합 점수 매핑
 *
 * 4원소 호환성 원리 (전통 점성술):
 * - fire (양자리/사자/사수) + air (쌍둥이/천칭/물병): 상생 (고점)
 * - earth (황소/처녀/염소) + water (게/전갈/물고기): 상생 (고점)
 * - 동일 원소: 상호 이해 (중상점)
 * - 나머지 조합: 갈등 가능 (중하점)
 *
 * 참고: https://en.wikipedia.org/wiki/Astrological_sign
 * 참고: https://www.britannica.com/topic/zodiac
 */
export const ZODIAC_COMPATIBILITY: Record<ZodiacId, Record<ZodiacId, number>>

// lib/compatibility/mbti/compatibility-map.ts
/**
 * MBTI 인지기능 스택 기반 궁합 점수 매핑
 *
 * ⚠️ 주의: 이 점수는 Jung 심리학적 유형론 + 커뮤니티 컨센서스 기반입니다.
 * 학술적/과학적 증거는 없습니다. 참고 수준으로 사용하세요.
 *
 * 황금 쌍(Golden Pair) 이론: 인지기능 스택이 거울처럼 보완되는 쌍
 * 예: INTJ (Ni-Te-Fi-Se) ↔ ENFP (Ne-Fi-Te-Si)
 *
 * 참고: Carl Jung - Psychological Types (1921)
 * 참고: https://personalitycafe.com (커뮤니티 컨센서스)
 */
export const MBTI_COMPATIBILITY: Record<MbtiType, Record<MbtiType, number>>
```

---

## 공신력 출처 이슈 댓글 계획

각 이슈 구현 완료 후 댓글에 다음 내용 기록:

| 이슈 | 댓글 내용 |
|------|---------|
| #13 | `@gracefullight/saju` 라이브러리 링크, JDN 계산 근거, 크로스체크 결과 (sajuplus.com) |
| #15 | `zodiac-signs` 링크, Wikipedia Astrological sign 링크 |
| #16 | 오행 상생상극 위키백과/nculture 링크, 점수 수치 근거 설명 |
| #17 | 4원소 원리 Britannica 링크, MBTI "커뮤니티 컨센서스" 한계 명시 |

---

## TDD 테스트 케이스 계획

| 이슈 | 테스트 수 | 주요 케이스 |
|------|---------|------------|
| #13 | 10+ | 만세력 앱 크로스체크 날짜 5개, 시주 null 케이스, 경계값 (입춘 전/후) |
| #15 | 15+ | 12궁 각 1개, 경계값 (12/22, 1/19, 3/21 등) |
| #16 | 20+ | 상생/상극/비화/합/충 조합별 케이스 |
| #17 | 10+ | 황금 쌍 케이스, null MBTI 처리, 동일 원소 별자리 |
