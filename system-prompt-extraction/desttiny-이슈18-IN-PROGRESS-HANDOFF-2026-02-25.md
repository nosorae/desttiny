# desttiny 이슈 #18 진행 중 핸드오프

**작성일**: 2026-02-25
**이슈**: #18 - 3체계 통합 점수 계산 및 Claude API 해설 생성
**브랜치**: `feat/issue-18-compatibility-api`
**워크트리**: `/Users/yessorae/desttiny/.worktrees/feat-issue-18`
**계획 파일**: `docs/plans/2026-02-25-issue-18-compatibility-api.md`

---

## 완료된 태스크

### Task 0 ✅
- `.worktrees/feat-issue-18` 워크트리 생성 (브랜치: `feat/issue-18-compatibility-api`)
- `@anthropic-ai/sdk` 설치
- 커밋: `e2ac88b` - `chore: @anthropic-ai/sdk 설치 (#18)`

### Task 1 ✅ (LLM Provider 추상화)
- `lib/llm/types.ts` - `LLMProvider` 인터페이스
- `lib/llm/providers/anthropic.ts` - `AnthropicProvider` (claude-sonnet-4-6)
- `lib/llm/providers/__tests__/anthropic.test.ts` - 3 tests pass
- `lib/llm/providers/index.ts` - re-export
- `lib/llm/factory.ts` - `createLLMProvider()` (env: `LLM_PROVIDER`)
- 커밋: `c902692` - `feat: LLM Provider 추상화 레이어 + AnthropicProvider 구현 (#18)`

---

## 현재 테스트 상태

```bash
# 워크트리에서 실행
cd /Users/yessorae/desttiny/.worktrees/feat-issue-18
npm test
```
Expected: 44(기존) + 3(AnthropicProvider) = 47 tests pass, 4 todo

---

## 다음 태스크

### Task 2: 타입 확장 + parseDayPillar
**계획 파일 Task 2 참고**

수정 파일:
- `lib/compatibility/types.ts` - RelationshipType, CompatibilityAnalysis, PersonCompatibilityInput, CompatibilityResult 추가
- `lib/saju/index.ts` - parseDayPillar() 함수 추가
- `lib/saju/__tests__/saju.test.ts` - parseDayPillar 테스트 4개 추가

### Task 3: AI 프롬프트 빌더 + 통합 계산기
**계획 파일 Task 3 참고**

생성 파일:
- `lib/compatibility/ai/prompt.ts` + `lib/compatibility/ai/index.ts`
- `lib/compatibility/calculator.ts` (LLMProvider 주입 방식)
- `lib/compatibility/ai/__tests__/prompt.test.ts` (5개 테스트)
- `lib/compatibility/__tests__/calculator.test.ts` (7개 테스트)

### Task 4: 궁합 API 엔드포인트
**계획 파일 Task 4 참고**

생성 파일:
- `app/api/compatibility/route.ts` (debug 필드 항상 포함)

### Task 5: 통합 테스트 + PR
**계획 파일 Task 5, 6 참고**

생성 파일:
- `lib/llm/providers/__tests__/anthropic.integration.test.ts`

---

## 핵심 설계 결정 (대화에서 확정)

1. **LLM Provider**: 커스텀 인터페이스 (`LLMProvider`), Anthropic 퍼스트, 교체 가능
2. **계산기 시그니처**: `calculateCompatibility(p1, p2, type, provider)` - provider 주입
3. **디버그 필드**: API 응답에 `{ provider, model, prompt, rawLLMResponse }` 항상 포함
4. **테스트 전략**:
   - unit: mock LLMProvider
   - integration: `LLM_INTEGRATION=true npm test -- anthropic.integration`
   - curl: 개발 서버 + 브라우저 쿠키
5. **이슈 #18 댓글**: 설계 결정 + curl 가이드 등록 완료

---

## 주의사항

- `lib/zodiac/calculator.ts`에 pre-existing TypeScript 에러 있음 (`@types/zodiac-signs` 없음). 이슈 #18 작업과 무관.
- 무료 슬롯 테스트 전 Supabase에 row 삽입 필요:
  ```sql
  INSERT INTO daily_free_slots (slot_date, max_count, used_count)
  VALUES (CURRENT_DATE, 100, 0)
  ON CONFLICT (slot_date) DO UPDATE SET max_count = 100;
  ```
- 환경변수: `.env.local`에 `ANTHROPIC_API_KEY`, `LLM_PROVIDER=anthropic` 설정 필요

---

## GitHub 레포

- 레포: `nosorae/desttiny` (NOT yessorae)
- PR base branch: `develop`
- 이슈 #18 댓글: 설계 결정 + 테스트 가이드 등록됨

---

## 다음 세션 시작 방법

```bash
cd /Users/yessorae/desttiny/.worktrees/feat-issue-18
git log --oneline -5  # 현재 커밋 확인
npm test              # 기존 테스트 통과 확인
```

그 후 계획 파일 `docs/plans/2026-02-25-issue-18-compatibility-api.md`의 Task 2부터 이어서 진행.
