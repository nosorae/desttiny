# desttiny 계산 엔진 완료 핸드오프

**작성일**: 2026-02-25
**완료 이슈**: #13, #15, #16, #17 (계산 엔진 전체)
**상태**: ✅ 완료 및 main 머지 (PR #67)

---

## 완료된 작업 요약

### 구현 파일 목록

| 파일 | 내용 |
|------|------|
| `lib/saju/types.ts` | HeavenlyStem, EarthlyBranch, FiveElement, Pillar, SajuProfile 타입 + 한자→한글 매핑 + ELEMENT_KO_NAME |
| `lib/saju/index.ts` | `getSajuProfile()` - @gracefullight/saju 래퍼 |
| `lib/zodiac/types.ts` | ZodiacId, ZodiacElement, ZodiacSign 타입 + ZODIAC_ELEMENT_KO |
| `lib/zodiac/calculator.ts` | `getZodiacSign()` - zodiac-signs CJS 래퍼 |
| `lib/compatibility/types.ts` | CompatibilityScore, MbtiType |
| `lib/compatibility/saju/constants.ts` | GENERATES, CONTROLS, SIX_COMBINATION_PAIRS, SAJU_SCORE_CONSTANTS |
| `lib/compatibility/saju/calculator.ts` | `calculateSajuCompatibility()` |
| `lib/compatibility/zodiac/compatibility-map.ts` | ELEMENT_COMPATIBILITY (4원소 점수 행렬) |
| `lib/compatibility/zodiac/calculator.ts` | `calculateZodiacCompatibility()` |
| `lib/compatibility/mbti/compatibility-map.ts` | MBTI_COMPATIBILITY (16×16 점수 행렬) |
| `lib/compatibility/mbti/calculator.ts` | `calculateMbtiCompatibility()` |
| `vitest.config.ts` | 테스트 환경 설정 (@ alias, ESM 인라인 설정) |

### 테스트 현황
- **44 tests passing**, 4 todo (만세력 앱 크로스체크 - 사용자 수동 확인 필요)

---

## 계획 대비 변경사항 & 문제 해결 이력

### 1. @gracefullight/saju API 차이
- **계획**: `result.pillars.year` 형태
- **실제**: `result.year` 직접 반환
- **상태**: 구현에서 수정 완료

### 2. vitest ESM 모듈 해석 문제
- **문제**: `@gracefullight/saju`가 extensionless imports 사용 → Vite resolve 실패
- **에러**: `Cannot find module '.../dist/core/four-pillars'`
- **해결**: `vitest.config.ts`에 `server.deps.inline: ['@gracefullight/saju', 'luxon']`

### 3. zodiac-signs 날짜 경계 차이
- **문제**: 라이브러리 날짜 범위가 일반 알마낙과 1일 차이 (황소자리 4/21 시작, 일반 4/20)
- **해결**: 테스트 날짜를 라이브러리 JSON 기준으로 수정
- **이슈 댓글**: #15에 전체 비교표 기록됨

### 4. zodiac-signs element undefined 버그
- **문제**: 경계일(각 별자리 마지막 날)에 `result.element = undefined` 반환
- **해결**: `ZODIAC_ELEMENT` 자체 매핑 사용 (라이브러리 element 미사용)

### 5. zodiac-signs ESLint no-require-imports
- **문제**: CJS 모듈이므로 `require()` 필요 → ESLint 에러
- **해결**: `import zodiacSignsFactory from 'zodiac-signs'` + `as unknown as` 타입 캐스팅

### 6. 사주 궁합 대칭성 버그 (코드 리뷰에서 발견)
- **문제**: 상생 점수 GENERATES=20, GENERATED_BY=15로 A↔B ≠ B↔A
- **해결**: 모두 18로 통일, 상생 쌍 대칭성 테스트 추가

### 7. 코드 리뷰 반영 (Critical/Important)
- `toPillar()` 런타임 가드: unknown 한자 → fast-fail Error
- `getFullYear()` → `getUTCFullYear()` (UTC-negative 환경 대응)
- user-facing details 한국어화: `ELEMENT_KO_NAME`, `ZODIAC_ELEMENT_KO` 추가

---

## 사용 예시 (이슈 #18에서 사용)

```typescript
// 사주 계산
import { getSajuProfile } from '@/lib/saju'
const profile = await getSajuProfile(new Date('1990-01-15'), 14)
// profile.dayPillar.element === 'wood' 등

// 별자리 계산
import { getZodiacSign } from '@/lib/zodiac/calculator'
const sign = getZodiacSign(3, 21) // { id: 'aries', ko: '양자리', element: 'fire', emoji: '♈' }

// 사주 궁합 점수
import { calculateSajuCompatibility } from '@/lib/compatibility/saju/calculator'
const sajuScore = calculateSajuCompatibility(person1.dayPillar, person2.dayPillar)
// { score: 68, reason: '무난한 관계입니다', details: ['화(火)이 목(木)를 생함 - 상생(相生) 관계'] }

// 별자리 궁합
import { calculateZodiacCompatibility } from '@/lib/compatibility/zodiac/calculator'
const zodiacScore = calculateZodiacCompatibility('aries', 'leo') // score: 75

// MBTI 궁합
import { calculateMbtiCompatibility } from '@/lib/compatibility/mbti/calculator'
const mbtiScore = calculateMbtiCompatibility('INTJ', 'ENFP') // score: 90 (황금 쌍)
// mbtiScore = calculateMbtiCompatibility(null, 'INTJ') → score: 60 (MBTI 미입력 기본값)

// 이슈 #18: 3체계 병렬 계산 패턴
const [sajuScore, zodiacScore, mbtiScore] = await Promise.all([
  calculateSajuCompatibility(p1.dayPillar, p2.dayPillar),
  calculateZodiacCompatibility(p1.zodiacId, p2.zodiacId),
  calculateMbtiCompatibility(p1.mbti, p2.mbti),
])
```

---

## 브랜치 상태

- **main**: 이슈 #13, #15, #16, #17 포함 최신 (PR #67 squash merge)
- **develop**: main과 동기화 완료
- **현재 체크아웃**: `develop` 브랜치

---

## 다음 작업: 이슈 #18

**#18**: 3체계 통합 점수 + Claude API 해설

### 선행 조건 충족 현황
- ✅ #13 사주 일주 계산 (`getSajuProfile`)
- ✅ #15 별자리 계산 (`getZodiacSign`)
- ✅ #16 사주 궁합 점수 (`calculateSajuCompatibility`)
- ✅ #17 별자리/MBTI 궁합 점수 (`calculateZodiacCompatibility`, `calculateMbtiCompatibility`)

### #18 예상 작업
1. **3체계 통합 점수**: 사주/별자리/MBTI 점수를 가중 평균 → 최종 0-100 점수
2. **Claude API 해설**: claude-sonnet-4-6으로 자연어 궁합 해설 생성
3. `lib/compatibility/` 하위 3개 calculator 병렬 호출 후 통합

### 주의사항 (만세력 크로스체크 TODO)
`lib/saju/__tests__/saju.test.ts`에 `it.todo`로 표시된 4개 테스트를
sajuplus.com에서 실제 날짜별 일진 확인 후 채워야 함.

---

## 참고 링크

- PR #67: https://github.com/nosorae/desttiny/pull/67
- GitHub 이슈 #13: https://github.com/nosorae/desttiny/issues/13
- GitHub 이슈 #15: https://github.com/nosorae/desttiny/issues/15
- GitHub 이슈 #16: https://github.com/nosorae/desttiny/issues/16
- GitHub 이슈 #17: https://github.com/nosorae/desttiny/issues/17
