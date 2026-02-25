# desttiny 4~5단계 구현 중 핸드오프

**작성일**: 2026-02-25
**상태**: 🔄 IN-PROGRESS (Task 0~3 완료, Task 4~8 대기)
**현재 브랜치**: `feat/stage4-5-onboarding-compatibility`
**base 브랜치**: `develop`
**레포**: `nosorae/desttiny`

---

## 즉시 실행 (새 세션/컴퓨터에서 시작할 때)

```bash
cd /Users/yessorae/desttiny
git checkout feat/stage4-5-onboarding-compatibility
git log --oneline -5   # 아래 4개 커밋 확인
npx vitest run          # 66 pass, 2 skip, 4 todo 확인
```

### 커밋 확인 (최신 → 오래된 순)

```
8fe0602 feat: MBTI 필수화 마이그레이션 + idol 관계 유형 추가 (#11, #23)
804907b feat: 온보딩 3단계 폼 + 프로필 저장 API (#10, #11)
1774111 feat: 공용 UI 컴포넌트 (GenderSelector, BirthDateInput, MBTISelector, ProgressBar) (#10)
c4d92a8 fix: root middleware.ts 생성 - 인증 가드 활성화 (#10)
```

---

## 완료된 태스크 (Task 0~3)

### Task 0: Root middleware.ts ✅

- `middleware.ts` 생성 → `lib/supabase/middleware.ts`의 `updateSession` 호출
- 인증 가드 활성화됨

### Task 1: 공용 UI 컴포넌트 ✅

- `components/ui/GenderSelector.tsx` — 성별 선택 (남/여 버튼)
- `components/ui/BirthDateInput.tsx` — 생년월일시 입력 + 미리보기
- `components/ui/MBTISelector.tsx` — 16 MBTI 4x4 그리드
- `components/ui/ProgressBar.tsx` — step(별자리 점)/loading(프로그레스 바) variant
- ⚠️ **모두 named export** (default export 아님): `import { GenderSelector } from '...'`

### Task 2: 온보딩 + 프로필 API ✅

- `lib/actions/saju-preview.ts` — 생년월일 미리보기 Server Action
- `app/api/profiles/route.ts` — POST /api/profiles (프로필 upsert)
- `app/onboarding/OnboardingForm.tsx` — 3단계 폼 Client Component
- `app/onboarding/page.tsx` — Server Component (프로필 있으면 /profile 리다이렉트)
- ⚠️ **animate-in 클래스**: `tailwindcss-animate` 미설치, 현재 `animate-[fadeSlideIn_300ms_ease-out]` 사용 중 → 추후 keyframes 정의 또는 플러그인 설치 필요

### Task 3: DB 마이그레이션 + 코드 수정 ✅

- `supabase/migrations/20260226000001_mbti_required_and_idol.sql` — profiles.mbti NOT NULL + idol 추가
- **DB 적용 완료** (MCP apply_migration 성공)
- `types.ts`: RelationshipType에 `idol` 추가
- `prompt.ts`: RELATIONSHIP_KO에 `idol: '아이돌'` 추가
- `route.ts`: VALID_RELATIONSHIP_TYPES에 `idol` 추가
- 테스트: idol 프롬프트 테스트 1개 추가 (66 pass)
- ⚠️ **PersonCompatibilityInput.mbti는 `| null` 유지** (파트너 MBTI를 모를 수 있으므로)

---

## 남은 태스크 (Task 4~8)

### Task 4: 점수 계산 함수 분리 + Server Action

- `lib/compatibility/calculator.ts`에서 `calculateCompatibilityScore()` 추출 (LLM 없이 점수만)
- 기존 `calculateCompatibility()`가 내부적으로 호출하도록 리팩터
- `lib/compatibility/__tests__/score.test.ts` 테스트 추가
- `lib/actions/compatibility-preview.ts` Server Action 생성

### Task 5: 궁합 페이지 컴포넌트 + 페이지

- `components/compatibility/` 4개: RelationshipTypeSelector, PartnerInputForm, TeaserResult, LoadingOverlay
- `app/(main)/compatibility/CompatibilityFlow.tsx` — 전체 플로우 Client Component
- `app/(main)/compatibility/page.tsx` — Server Component

### Task 6: LLM 프롬프트 수정 (8영역 확장)

- `types.ts`: CompatibilitySection.area에 growth/trust/fun 추가
- `prompt.ts`: areas 배열 8개로 확장
- `calculator.ts`: getFallbackAnalysis 영역 8개
- `types.ts`: CompatibilityAnalysis 순서 → intimacyScores → finalSummary
- 테스트 mock 데이터 업데이트

### Task 7: 결과 페이지

- `components/result/` 5개: SummaryHeader, ScoreDisplay, AnalysisSection, IntimacySection, FinalSummary
- `app/result/[id]/page.tsx` — Server Component (DB 조회 → 렌더링)

### Task 8: 통합 테스트 + 마무리

- 전체 테스트 + 빌드 확인

---

## 구현 계획 파일

```
docs/plans/2026-02-25-stage4-5-implementation-plan.md
```

이 파일에 각 Task의 **상세 코드**가 모두 담겨 있음. Task 4~8 구현 시 이 파일의 해당 Task 섹션을 참고.

---

## 설계 문서

```
docs/plans/2026-02-25-stage4-5-onboarding-compatibility-design.md
```

전체 플로우, 컴포넌트 설계, 데이터 흐름, 에러 처리 등.

---

## 주의사항

1. **UI 컴포넌트 named export**: Task 1 컴포넌트들이 `export function` (default export 아님)
2. **animate-in 미동작**: `tailwindcss-animate` 플러그인 없음, 필요 시 설치 또는 globals.css에 keyframes 추가
3. **파트너 MBTI nullable**: PersonCompatibilityInput.mbti는 `MbtiType | null` 유지 (직접 입력 상대방은 MBTI 모를 수 있음)
4. **마이그레이션 이미 DB 적용됨**: `20260226000001_mbti_required_and_idol.sql` — 다시 적용하지 말 것
5. **pre-commit 훅**: lint-staged (eslint + prettier) + 마이그레이션 시 types/database.ts 자동 재생성

---

## 다음 세션 시작 방법

```bash
# 1. 레포 클론 또는 기존 레포 사용
cd /Users/yessorae/desttiny  # 또는 새 컴퓨터에서 클론

# 2. 브랜치 확인
git checkout feat/stage4-5-onboarding-compatibility

# 3. 의존성 설치
npm install

# 4. 상태 확인
git log --oneline -5
npx vitest run

# 5. 핸드오프 읽기
# 이 파일 읽은 후 구현 계획 파일 참고:
# docs/plans/2026-02-25-stage4-5-implementation-plan.md

# 6. Task 4부터 이어서 구현
# writing-plans 스킬 → subagent-driven-development 또는 직접 구현
```

## 새 컴퓨터에서 작업하려면

1. **Git 레포를 클론**: `git clone <repo-url>` 후 `git checkout feat/stage4-5-onboarding-compatibility`
2. **npm install**: 의존성 설치
3. **환경 변수**: `.env.local` 파일 필요 (Supabase URL, Anon Key, Service Role Key, Anthropic API Key 등)
   - 새 컴퓨터에 `.env.local`이 없으면 기존 컴퓨터에서 복사하거나 Supabase/Anthropic 대시보드에서 확인
4. **이 핸드오프 문서 읽기** → Task 4부터 시작
5. **구현 계획**: `docs/plans/2026-02-25-stage4-5-implementation-plan.md`에 Task 4~8 상세 코드 있음
