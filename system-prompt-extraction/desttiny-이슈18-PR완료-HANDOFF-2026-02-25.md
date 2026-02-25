# desttiny 이슈 #18 PR 완료 핸드오프

**작성일**: 2026-02-25
**이슈**: #18 - 3체계 통합 점수 계산 및 Claude API 해설 생성
**브랜치**: `feat/issue-18-compatibility-api`
**워크트리**: `/Users/yessorae/desttiny/.worktrees/feat-issue-18`
**PR**: https://github.com/nosorae/desttiny/pull/68

---

## 완료된 태스크 전체

| Task | 커밋 | 내용 |
|------|------|------|
| Task 0 | `e2ac88b` | 워크트리 + `@anthropic-ai/sdk` 설치 |
| Task 1 | `c902692` | `lib/llm/` - LLMProvider 인터페이스 + AnthropicProvider |
| Task 2 | `1717e3b` | 타입 확장 + `parseDayPillar()` |
| Task 3 | `5ecdd22` | AI 프롬프트 빌더 + 통합 계산기 |
| Task 3b | `a07d378` | LLM 프롬프트에 계산 엔진 결과(breakdown) 포함 |
| Task 4 | `3ec1a77` → `9a20c3a` | API 엔드포인트 + 코드리뷰 반영 |
| Task 5 | `ec6640a` | Anthropic 통합 테스트 |
| 최종 수정 | `b6dc88d` | 코드리뷰 최종 반영 |

**테스트 현황**: 65 pass, 2 skip (통합 테스트), 4 todo (사주 크로스체크)

---

## 구현된 파일 목록

| 파일 | 내용 |
|------|------|
| `lib/llm/types.ts` | `LLMProvider` 인터페이스 |
| `lib/llm/factory.ts` | `createLLMProvider()` - env 기반 교체 |
| `lib/llm/providers/anthropic.ts` | `AnthropicProvider` (claude-sonnet-4-6) |
| `lib/llm/providers/__tests__/anthropic.test.ts` | 유닛 테스트 3개 |
| `lib/llm/providers/__tests__/anthropic.integration.test.ts` | 통합 테스트 (skip) |
| `lib/compatibility/types.ts` | `RelationshipType`, `PersonCompatibilityInput`, `CompatibilityResult` 추가 |
| `lib/saju/index.ts` | `parseDayPillar()` 추가 |
| `lib/compatibility/ai/prompt.ts` | `buildCompatibilityPrompt()` (breakdown 포함) |
| `lib/compatibility/calculator.ts` | `calculateCompatibility()` (LLMProvider 주입) |
| `app/api/compatibility/route.ts` | POST /api/compatibility |
| `supabase/migrations/20260225000001_compatibility_api_setup.sql` | `relationship_type` 제약 + `use_daily_slot()` 함수 |

---

## DB 변경 (이미 적용됨)

1. `compatibility_results.relationship_type` CHECK 제약:
   - 기존: `('romantic', 'friend', 'business')`
   - 신규: `('lover', 'ex', 'crush', 'friend', 'colleague', 'family')`

2. `use_daily_slot(p_slot_date DATE) RETURNS BOOLEAN` 함수:
   - SECURITY DEFINER (RLS 우회)
   - 원자적 UPDATE (race condition 방지)
   - 슬롯 소진 시 `false` 반환

---

## 핵심 설계

1. **LLM Provider**: `LLMProvider` 인터페이스, `LLM_PROVIDER` env로 교체
2. **계산기**: `calculateCompatibility(p1, p2, type, provider)` - provider 주입
3. **프롬프트**: breakdown(사주/별자리/MBTI 상세결과)을 LLM에 전달하여 풍부한 해설 생성
4. **슬롯**: `supabase.rpc('use_daily_slot')` 원자적 처리
5. **debug 필드**: 항상 포함 (production 배포 전 `NODE_ENV` 조건 추가 TODO 있음)

---

## 주의사항

- `profiles.zodiac_sign`: 영문 ZodiacId("aquarius") 형식으로 저장 필요 (스키마 주석 수정 완료)
- `lib/zodiac/calculator.ts`에 pre-existing TypeScript 에러 (`@types/zodiac-signs` 없음). 이슈 #18과 무관.
- 무료 슬롯 테스트 전 DB row 삽입 필요:
  ```sql
  INSERT INTO daily_free_slots (slot_date, max_count, used_count)
  VALUES (CURRENT_DATE, 100, 0)
  ON CONFLICT (slot_date) DO UPDATE SET max_count = 100;
  ```
- 환경변수: `.env.local`에 `ANTHROPIC_API_KEY`, `LLM_PROVIDER=anthropic` 설정 필요

---

## 다음 단계

PR #68 리뷰 후 `develop` 브랜치에 merge.
이후 온보딩 플로우 구현 시 `profiles.zodiac_sign`에 영문 ZodiacId 저장되도록 확인 필요.
