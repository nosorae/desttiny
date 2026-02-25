# 4~5단계 구현 검증 시나리오

> **브랜치**: `feat/stage4-5-onboarding-compatibility`
> **PR**: #69
> **관련 이슈**: #18, #21, #22, #23
> **검증일**: 2026-02-25

---

## A. 자동 검증 (Claude Code 실행 완료)

### V1. 유닛 테스트

```bash
npx vitest run
```

**결과**: ✅ 70 pass, 2 skip, 4 todo (10 파일)

| 테스트 파일                                                       | 항목 수     | 상태 |
| ----------------------------------------------------------------- | ----------- | ---- |
| `lib/saju/__tests__/saju.test.ts`                                 | 12 (4 todo) | ✅   |
| `lib/zodiac/__tests__/zodiac.test.ts`                             | 8           | ✅   |
| `lib/compatibility/saju/__tests__/saju-compatibility.test.ts`     | 9           | ✅   |
| `lib/compatibility/zodiac/__tests__/zodiac-compatibility.test.ts` | 7           | ✅   |
| `lib/compatibility/mbti/__tests__/mbti-compatibility.test.ts`     | 5           | ✅   |
| `lib/compatibility/ai/__tests__/prompt.test.ts`                   | 8           | ✅   |
| `lib/compatibility/__tests__/calculator.test.ts`                  | 8           | ✅   |
| `lib/compatibility/__tests__/score.test.ts`                       | 4           | ✅   |
| `lib/llm/providers/__tests__/anthropic.test.ts`                   | 5           | ✅   |
| `lib/llm/providers/__tests__/anthropic.integration.test.ts`       | 2 skip      | ⏭️   |

### V2. TypeScript 타입 체크

```bash
npx tsc --noEmit
```

**결과**: ✅ 에러 없음

### V3. 프로덕션 빌드

```bash
npx next build
```

**결과**: ✅ 성공 (11개 라우트 컴파일)

| 라우트               | 타입    |
| -------------------- | ------- |
| `/`                  | Static  |
| `/api/compatibility` | Dynamic |
| `/api/profiles`      | Dynamic |
| `/auth/callback`     | Dynamic |
| `/compatibility`     | Dynamic |
| `/login`             | Dynamic |
| `/onboarding`        | Dynamic |
| `/payment`           | Static  |
| `/profile`           | Static  |
| `/result/[id]`       | Dynamic |

### V4. ESLint

```bash
npx eslint app/(main)/compatibility/ components/compatibility/ components/result/ lib/actions/ lib/compatibility/ app/result/
```

**결과**: ✅ 0 errors, 0 warnings (변경 파일 대상)

---

## B. #18 이슈 검증: POST /api/compatibility

> 이슈: `[SUB][EPIC-14] 3체계 통합 점수 계산 및 Claude API 해설 생성`

### B-1. 완료 기준 체크리스트

| 기준                            | 상태 | 검증 방법                                                  |
| ------------------------------- | ---- | ---------------------------------------------------------- |
| 3체계 통합 점수 계산            | ✅   | `calculator.test.ts` — 가중합 40/30/30 검증                |
| LLM 연동 및 프롬프트 최적화     | ✅   | `prompt.test.ts` — 8영역 프롬프트 생성 검증                |
| `POST /api/compatibility` 구현  | ✅   | `route.ts` 560줄, 빌드 성공                                |
| LLM 실패 시 폴백 처리           | ✅   | `calculator.test.ts` — JSON 파싱 실패 시 폴백 반환 테스트  |
| LLM Provider 교체 가능한 추상화 | ✅   | `LLMProvider` 인터페이스 + `createLLMProvider` 팩토리 패턴 |

### B-2. API 엔드포인트 코드 검증

#### 인증 검증

- `route.ts:74-79`: `supabase.auth.getUser()` → 미인증 시 401 반환 ✅
- Supabase cookie 기반 인증 (서버사이드) ✅

#### 입력 검증

- `route.ts:81-90`: `relationshipType` — 7종 enum 검증 ✅ (lover, ex, crush, friend, colleague, family, idol)
- `route.ts:92-100`: MBTI — 16종 enum 검증 ✅
- `route.ts:102-112`: 파트너 정보 — partnerId(UUID) 또는 name+birthDate 필수 ✅
- `route.ts:114-120`: 생년월일 범위 — 1900 ~ 현재연도 ✅
- `route.ts:122-125`: 출생시간(선택) — HH:MM 정규식 검증 ✅
- `route.ts:221`: 자기 자신과 비교 방지 ✅

#### 파트너 해석 (2경로)

- **Path A**: `partnerId` → Supabase admin 클라이언트로 프로필 조회 ✅
- **Path B**: 직접 입력 → birthDate로 사주/별자리 계산 ✅

#### 무료 슬롯 시스템

- `route.ts:243-258`: `use_daily_slot()` RPC 원자적 호출 ✅
- 슬롯 소진 시 402 반환 ✅
- 슬롯 소진 → LLM 호출 순서 (남용 방지) ✅

#### LLM 호출 + DB 저장

- `calculateCompatibility()` — 3체계 병렬 점수 계산 + LLM 프롬프트 생성 ✅
- `compatibility_results` 테이블에 결과 저장 ✅
- Debug 필드 포함 (provider, model, prompt, rawLLMResponse) ✅

### B-3. 수동 API 테스트 시나리오 (dev 서버)

> 아래 시나리오는 `npm run dev` 실행 후 브라우저 로그인 → 쿠키 복사 → curl로 실행

#### 사전 준비

```sql
-- Supabase에서 무료 슬롯 충전
INSERT INTO daily_free_slots (slot_date, max_count, used_count)
VALUES (CURRENT_DATE, 100, 0)
ON CONFLICT (slot_date) DO UPDATE SET max_count = 100, used_count = 0;
```

#### 시나리오 1: 정상 요청 (직접 입력)

```bash
curl -X POST http://localhost:3000/api/compatibility \
  -H "Content-Type: application/json" \
  -H "Cookie: {auth-cookie}" \
  -d '{
    "relationshipType": "friend",
    "partner": {
      "name": "이영희",
      "birthDate": "1995-08-15",
      "mbti": "ENFP",
      "gender": "female"
    }
  }'
```

**기대**: 200 + `{ id, totalScore, breakdown, analysis, debug }`

#### 시나리오 2: 미인증 요청

```bash
curl -X POST http://localhost:3000/api/compatibility \
  -H "Content-Type: application/json" \
  -d '{ "relationshipType": "friend", "partner": { "name": "테스트", "birthDate": "1995-01-01" } }'
```

**기대**: 401 + `{ error: "로그인이 필요합니다." }`

#### 시나리오 3: 잘못된 관계 유형

```bash
curl -X POST http://localhost:3000/api/compatibility \
  -H "Content-Type: application/json" \
  -H "Cookie: {auth-cookie}" \
  -d '{ "relationshipType": "enemy", "partner": { "name": "테스트", "birthDate": "1995-01-01" } }'
```

**기대**: 400 + `{ error: "유효한 관계 유형을 선택해주세요." }`

#### 시나리오 4: 슬롯 소진

```sql
-- 슬롯 모두 소진 상태로 설정
UPDATE daily_free_slots SET used_count = max_count WHERE slot_date = CURRENT_DATE;
```

```bash
curl -X POST http://localhost:3000/api/compatibility \
  -H "Content-Type: application/json" \
  -H "Cookie: {auth-cookie}" \
  -d '{ "relationshipType": "friend", "partner": { "name": "테스트", "birthDate": "1995-01-01" } }'
```

**기대**: 402 + `{ error: "오늘의 무료 궁합이 모두 소진되었어요..." }`

#### 시나리오 5: 필수 필드 누락

```bash
curl -X POST http://localhost:3000/api/compatibility \
  -H "Content-Type: application/json" \
  -H "Cookie: {auth-cookie}" \
  -d '{ "relationshipType": "friend" }'
```

**기대**: 400 + `{ error: "파트너 이름과 생년월일을 입력해주세요..." }`

---

## C. UI/UX 플로우 검증 (브라우저 수동)

### C-1. 궁합 페이지 진입 (`/compatibility`)

| #   | 시나리오                              | 기대 결과                    |
| --- | ------------------------------------- | ---------------------------- |
| 1   | 미로그인 상태로 `/compatibility` 접근 | `/login`으로 리다이렉트      |
| 2   | 로그인 + 프로필 미완성 상태           | `/onboarding`으로 리다이렉트 |
| 3   | 로그인 + 프로필 완성 상태             | 궁합 플로우 표시             |

### C-2. 관계 유형 선택 (FlowStep: `select-type`)

| #   | 시나리오                | 기대 결과                                      |
| --- | ----------------------- | ---------------------------------------------- |
| 1   | 7개 관계 유형 카드 표시 | 연인/전연인/썸/친구/동료/가족/아이돌 모두 표시 |
| 2   | 카드 클릭               | 해당 타입 선택 + `input-partner`로 전환        |
| 3   | 카드 hover 효과         | 스케일 + 보더 색상 변경                        |
| 4   | staggered 애니메이션    | 카드가 순차적으로 나타남                       |

### C-3. 상대방 정보 입력 (FlowStep: `input-partner`)

| #   | 시나리오                                   | 기대 결과                            |
| --- | ------------------------------------------ | ------------------------------------ |
| 1   | 이름 미입력 + 제출                         | 폼 검증 실패 (required)              |
| 2   | 생년월일 미입력 + 제출                     | 폼 검증 실패 (required)              |
| 3   | 이름 + 성별 + 생년월일 + MBTI 입력 후 제출 | 점수 미리보기 호출 → `teaser`로 전환 |
| 4   | 이름 20자 초과                             | Server Action에서 에러 메시지 반환   |
| 5   | ← 이전 버튼                                | `select-type`으로 복귀               |
| 6   | 제출 중 버튼 비활성화                      | `isCalculating` 동안 disabled        |

### C-4. 티저 결과 (FlowStep: `teaser`)

| #   | 시나리오                    | 기대 결과                                    |
| --- | --------------------------- | -------------------------------------------- |
| 1   | 총점 표시                   | 0~100점 범위 내 숫자 표시                    |
| 2   | 3체계 막대 그래프           | 사주/별자리/MBTI 각각 점수 + 비율 바         |
| 3   | 블러 처리된 프리미엄 콘텐츠 | 흐린 텍스트 영역 + 자물쇠 아이콘             |
| 4   | CTA 버튼 "전체 결과 보기"   | `cosmic-pulse` 애니메이션 + 클릭 시 로딩     |
| 5   | CTA 연타 시                 | 이중 제출 방지 (flowStep === 'loading' 체크) |
| 6   | ← 이전 버튼                 | `input-partner`로 복귀                       |

### C-5. 로딩 화면 (FlowStep: `loading`)

| #   | 시나리오           | 기대 결과                          |
| --- | ------------------ | ---------------------------------- |
| 1   | 프로그레스 바      | 0%→90%까지 점진적 증가             |
| 2   | 재미있는 메시지    | 4개 메시지 순환 (3초 간격)         |
| 3   | 화면 전체 오버레이 | 배경 반투명 + 중앙 카드            |
| 4   | LLM 응답 완료      | `/result/{id}`로 리다이렉트        |
| 5   | LLM 실패           | 에러 메시지 표시 + `teaser`로 복귀 |

### C-6. 결과 리포트 페이지 (`/result/[id]`)

| #   | 시나리오              | 기대 결과                                                 |
| --- | --------------------- | --------------------------------------------------------- |
| 1   | 요약 헤더             | 요청자 이름 + 파트너 이름 + 관계 유형 라벨                |
| 2   | 종합 점수             | 그라데이션 원형 표시 + 0~100 숫자                         |
| 3   | 3체계 점수 바         | 사주/별자리/MBTI 각각 막대 그래프                         |
| 4   | 영역별 해설           | 최대 8개 카드 (소통/감정/가치관/생활/갈등/성장/신뢰/재미) |
| 5   | 각 영역 이모지        | 영역별 고유 이모지 매칭                                   |
| 6   | 29금 친밀도 (연인계)  | 연인/전연인/썸일 때만 표시, 3개 바                        |
| 7   | 마무리 요약           | 그라데이션 배경의 마무리 메시지                           |
| 8   | 존재하지 않는 ID      | 404 Not Found 페이지                                      |
| 9   | 다른 사용자의 결과 ID | RLS로 필터링 → 404 Not Found                              |
| 10  | DB 에러               | 500 에러 페이지 (PGRST116이 아닌 에러)                    |

---

## D. 점수 계산 로직 검증 (자동 — 유닛 테스트로 커버)

| 검증 항목             | 테스트 파일                    | 테스트 수 |
| --------------------- | ------------------------------ | --------- |
| 사주 오행 궁합        | `saju-compatibility.test.ts`   | 9         |
| 별자리 궁합           | `zodiac-compatibility.test.ts` | 7         |
| MBTI 궁합             | `mbti-compatibility.test.ts`   | 5         |
| 가중 합산 (40/30/30)  | `score.test.ts`                | 4         |
| 3체계 통합 + LLM 연동 | `calculator.test.ts`           | 8         |
| 프롬프트 생성         | `prompt.test.ts`               | 8         |

---

## E. Server Action 검증 (`compatibility-preview`)

| #   | 검증 항목             | 방법                                               |
| --- | --------------------- | -------------------------------------------------- |
| 1   | 미인증 시 에러        | 로그아웃 → 궁합 페이지 접근 불가 (page.tsx 가드)   |
| 2   | 프로필 미완성 시 에러 | profiles 없으면 에러 메시지 반환                   |
| 3   | 이름 검증 (1~20자)    | 빈 이름/21자 이름 → "이름은 1~20자로 입력해주세요" |
| 4   | 잘못된 생년월일       | Invalid Date → "생년월일이 올바르지 않습니다"      |
| 5   | MBTI 미입력           | null 처리 → 기본 50점                              |
| 6   | 사주 계산 실패        | 파싱 에러 → null → 기본 50점                       |
| 7   | 정상 계산             | totalScore + breakdown 반환                        |

---

## F. 코드 리뷰 반영 사항 (커밋 `7f7bdd8`)

| 이슈                    | 수정 내용                                      | 검증         |
| ----------------------- | ---------------------------------------------- | ------------ |
| C2: unused `index` prop | `AnalysisSection` 인터페이스에서 제거          | ✅ 빌드 통과 |
| I1: 이름 미검증         | Server Action에 `trimmedName` 1~20자 검증 추가 | ✅           |
| I3: 에러 분기 미분리    | PGRST116 → notFound, 기타 → throw Error        | ✅           |
| I4: 이중 제출           | `flowStep === 'loading'` 가드 + deps 추가      | ✅           |

---

## G. 검증 요약

| 카테고리                | 자동 | 수동 | 상태                   |
| ----------------------- | ---- | ---- | ---------------------- |
| 유닛 테스트 (70개)      | ✅   | -    | 통과                   |
| TypeScript 타입 체크    | ✅   | -    | 통과                   |
| 프로덕션 빌드           | ✅   | -    | 통과                   |
| ESLint                  | ✅   | -    | 통과                   |
| #18 API 완료 기준 (5개) | ✅   | -    | 모두 충족              |
| UI 플로우 (C-1~C-6)     | -    | 🔲   | **브라우저 확인 필요** |
| API curl 테스트 (B-3)   | -    | 🔲   | **dev 서버 확인 필요** |

### 결론

자동화 가능한 검증 4종 + 코드 기반 완료 기준 5개 모두 통과.
**브라우저 수동 검증(C 섹션)과 dev 서버 curl 테스트(B-3 섹션)만 남은 상태.**
