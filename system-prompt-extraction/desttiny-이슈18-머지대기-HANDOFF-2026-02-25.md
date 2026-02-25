# desttiny 이슈 #18 머지 대기 핸드오프

**작성일**: 2026-02-25
**이슈**: #18 - 3체계 통합 점수 계산 및 Claude API 해설 생성
**브랜치**: `feat/issue-18-compatibility-api`
**워크트리**: `/Users/yessorae/desttiny/.worktrees/feat-issue-18`
**PR**: https://github.com/nosorae/desttiny/pull/68
**레포**: `nosorae/desttiny` (NOT yessorae)

---

## 현재 상태

- **구현 완료**: 모든 태스크 + 코드리뷰 전체 반영 완료
- **테스트**: 65 pass, 2 skip(통합), 4 todo(기존)
- **타입 체크**: `npx tsc --noEmit` 에러 0개
- **최신 커밋**: `6993ea8` - "fix: 코드리뷰 전체 반영 - 보안/버그/품질 개선 (#18)"
- **푸시**: 완료 (`origin/feat/issue-18-compatibility-api`)

---

## 이번 세션에서 한 일

### 1. 강력한 코드 리뷰 (superpowers:code-reviewer)
BASE: `a3b99d1` (develop), HEAD: `5c63874` → 리뷰 결과 수신

### 2. 코드리뷰 전체 반영 (`6993ea8`)

**Critical 수정:**
- **C1**: 파트너 프로필 조회 → `createAdminClient()` 사용
  - 기존: user-scope client → RLS가 다른 유저 row 차단 → Option A 항상 404
  - 수정: `lib/supabase/admin.ts`의 `createAdminClient()`로 RLS 우회
- **C2**: `debug` 필드 → `process.env.NODE_ENV !== 'production'` 조건부 포함
  - 기존: 항상 포함 → LLM 프롬프트/raw 응답 노출
  - 수정: production에서는 debug 필드 제거

**Important 수정:**
- **I2+I3**: `use_daily_slot()` 함수 재생성 (새 마이그레이션 `20260225200000_fix_use_daily_slot_security.sql` → Supabase 적용 완료)
  - `SET search_path = ''` 추가 (SECURITY DEFINER 보안 권고)
  - `INSERT ... ON CONFLICT DO NOTHING` 으로 슬롯 row 자동 생성 (매일 수동 삽입 불필요)
- **I4**: LLM JSON 응답 markdown 코드펜스 제거 + shape validation 추가 (`calculator.ts`)
- **I1, I5**: 설계 트레이드오프 주석 문서화 (슬롯 선소진, 유저별 제한 TODO)
- **I6**: `partnerId` UUID 형식 검증 추가

**Suggestion 수정:**
- **S1**: 파트너 이름 공백 trim 처리
- **S2**: 생년월일 범위 검증 (1900~현재 연도)
- **S3**: 자기 자신과의 궁합 방지 (400 반환)
- **S4**: 동기 함수 `Promise.resolve` 불필요 래핑 제거
- **S5**: `catch` 블록 미사용 `error` 변수 제거

**PR 댓글 반영:**
- `prompt.ts` 글자수: **각 영역 500자 ±50자, 마무리 정리 500자 ±50자** (공백 포함)

---

## 다음 세션 할 일

### 우선순위 1: SSOT 노션 문서 수동 업데이트 (본인 직접)
Claude는 Notion에 직접 접근 불가 (인증 필요).

업데이트할 내용:
- **제품 스펙 SSOT**: https://www.notion.so/fuschia-basement-f24/SSOT-30ff3bfa920480cb997ee49f87d1231a
  - 궁합 해설 각 영역 본문: **공백 포함 450~550자 (약 500자)**
  - 마무리 정리(finalSummary): **공백 포함 450~550자 (약 500자)**

### 우선순위 2: PR 머지

PR 머지 전 확인 체크리스트:
```bash
cd /Users/yessorae/desttiny/.worktrees/feat-issue-18
git log --oneline -5      # 최신 커밋: 6993ea8
npm test                   # 65 pass 확인
npx tsc --noEmit           # 에러 0개 확인
```

PR 머지 명령:
```bash
gh pr merge 68 --repo nosorae/desttiny --squash --delete-branch
# 또는 GitHub UI에서 머지
```

### 우선순위 3: (선택) 미해결 코드리뷰 항목

리뷰어가 제안했으나 이번에 구현하지 않은 항목들:
- **S6**: API route 단위 테스트 없음 (`app/api/compatibility/route.ts`)
  - 복잡한 다단계 로직이지만 테스트 미구현 상태
  - Supabase client와 LLM provider를 모킹하는 통합 테스트 필요
- **I5**: 유저별 일일 사용 제한 없음 (TODO 주석만 추가)
  - 1명이 하루 슬롯 전체 독점 소진 가능
  - MVP 이후 Vercel KV 또는 DB row 기반 카운터 검토

---

## 아키텍처 요약

```
POST /api/compatibility
  ↓
app/api/compatibility/route.ts
  ├── Supabase Auth 인증
  ├── 요청 검증 (relationshipType, partner, UUID, 자기자신, 이름trim, 날짜범위)
  ├── 요청자 프로필 조회 (profiles - user-scope supabase)
  ├── 파트너 정보 구성
  │   ├── A: UUID 조회 → adminClient (RLS 우회) ← 이번에 수정
  │   └── B: 생년월일 계산 (사주/별자리)
  ├── use_daily_slot() RPC (원자적 슬롯 소진 + 자동 row 생성) ← 이번에 수정
  ├── calculateCompatibility(p1, p2, type, debugProvider)
  │     ├── sajuScore (동기) ← Promise.resolve 제거
  │     ├── zodiacScore (동기)
  │     ├── mbtiScore (동기)
  │     └── LLM.generateText() → JSON 파싱 (코드펜스 제거 + shape 검증) ← 수정
  ├── DB 저장 (compatibility_results)
  └── 응답 { id, totalScore, breakdown, analysis, debug(dev only) } ← 수정
```

## DB 변경 이력

| 마이그레이션 | 내용 | Supabase 반영 |
|---|---|---|
| `20260224112954_initial_schema` | 초기 스키마 | ✅ |
| `20260224190429_fix_relationship_type_constraint_and_slot_function` | relationship_type 확장 + use_daily_slot 함수 | ✅ |
| `20260225200000_fix_use_daily_slot_security` | search_path + 자동 슬롯 생성 | ✅ |

## 주요 파일 경로

```
워크트리:         /Users/yessorae/desttiny/.worktrees/feat-issue-18
계획 파일:        /Users/yessorae/desttiny/docs/plans/2026-02-25-issue-18-compatibility-api.md
API route:        app/api/compatibility/route.ts
계산기:           lib/compatibility/calculator.ts
프롬프트 빌더:    lib/compatibility/ai/prompt.ts
LLM 추상화:       lib/llm/ (types.ts, factory.ts, providers/)
DB 마이그레이션:  supabase/migrations/
```

## 환경 변수 (확인 필요)

```
ANTHROPIC_API_KEY=sk-ant-...    # .env.local 및 Vercel 환경변수
LLM_PROVIDER=anthropic          # .env.local
SUPABASE_SERVICE_ROLE_KEY=...   # admin client용 (이번에 C1 수정으로 필요해짐)
```

## 세션 시작 방법

```bash
cd /Users/yessorae/desttiny/.worktrees/feat-issue-18
git log --oneline -5    # HEAD: 6993ea8 확인
npm test                 # 65 pass 확인
npx tsc --noEmit        # 에러 0개 확인
```

그 후 다음 중 하나:
1. Notion SSOT 업데이트 요청 (본인 직접 또는 Claude로 내용만 작성)
2. PR 머지 진행
3. 추가 요청 사항 처리
