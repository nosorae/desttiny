# desttiny - 이슈 #4 완료 Handoff

## Current Phase

**1단계 진행 중**: 이슈 #4 Supabase 스키마 PR #55 머지 완료. 다음은 외부 서비스 연동 (사람 선행 필요).

## What Was Done (이번 세션)

### 이슈 #4: Supabase 스키마 + RLS (PR #55 → 머지 완료 ✅)

**Supabase MCP로 직접 처리한 작업:**
- `~/.claude/claude.json`에 Supabase MCP(`https://mcp.supabase.com/mcp`) 추가
- 마이그레이션 SQL을 MCP로 직접 실행 (코드 리뷰 개선사항 포함)
- 4개 테이블 생성 확인, RLS 정책 9개 확인

**코드 리뷰 개선사항 (마이그레이션에 반영):**
- `auth.uid()` → `(select auth.uid())` 캐싱 (94-99% 성능 향상)
- `auth.role() = 'authenticated'` → `TO authenticated using (true)`
- 인덱스 추가: `compatibility_results(requester_id)`, `payments(user_id)`
- `daily_free_slots`에 `used_count <= max_count` 동시성 제약 추가

**TypeScript 타입 자동생성 설정:**
- `package.json`: `supabase` devDependency + `db:types` 스크립트 추가
- `.lintstagedrc.mjs`: 마이그레이션 파일 커밋 시 `types/database.ts` 자동 재생성
- `types/database.ts`: DB 기준으로 자동 재생성 (수동 편집 금지)

**PR #55 코멘트 처리:**
- `ai_summary` 길이: PostgreSQL `text`는 무제한, Claude API `max_tokens: 1000`으로 제어 (이슈 #18에서 확정)
- `payments` status 값: PortOne V2 기준 READY/PAID/FAILED/CANCELED 4개. `PARTIALLY_CANCELED` V2에 없음 → 스키마 변경 불필요

**문서 업데이트:**
- `CLAUDE.md`: Supabase 작업 규칙, RLS 작성 규칙, 행동 원칙(투명성) 추가
- `README.md`: 주요 스크립트 테이블 추가
- 이슈 #4 댓글: MCP 도입 + 개선사항 + 타입 자동생성 내용 정리

### 도구 추가

**Supabase MCP:**
- `~/.claude/claude.json`에 설정 완료
- `/mcp` → OAuth 로그인 → 재시작 시 자동 연결
- Claude Code가 직접 SQL 실행, 테이블 확인, RLS 확인 가능

**Gemini API:**
- API Key: 사용자 제공 (AIzaSy...)
- 사용법: `gemini-2.5-pro` + `google_search` 도구로 공식 문서 실시간 검색
- 접근 불가 URL은 Gemini 2.5 Pro + Google Search로 조회

## Branch Strategy

- `develop`: 개발 기준 브랜치 (PR은 develop로 머지)
- `main`: docs/일반 콘텐츠
- 브랜치명: `feat/issue-N-description`

## Completed Issues

| 이슈 | PR | 상태 |
|------|----|------|
| #3 Next.js 초기화 | #52 | ✅ 머지 완료 |
| #6 코드 품질 도구 | #54 | ✅ 머지 완료 |
| #4 Supabase 스키마 | #55 | ✅ 머지 완료 |

## Key Files

- `supabase/migrations/20260224000001_initial_schema.sql` - 4개 테이블 + RLS + 트리거 + 인덱스 (DB 실제 적용본)
- `types/database.ts` - 자동 생성 타입 (수동 편집 금지, `npm run db:types`로 재생성)
- `.lintstagedrc.mjs` - lint-staged 설정 (마이그레이션 커밋 시 타입 자동 재생성)
- `lib/supabase/admin.ts` - service_role Admin 클라이언트 (RLS 우회용)
- `lib/supabase/client.ts` - 브라우저용 Supabase 클라이언트
- `lib/supabase/server.ts` - 서버용 Supabase 클라이언트
- `CLAUDE.md` - 개발 규칙 (Supabase 작업 규칙, 행동 원칙 포함)

## Remaining Plan

### 1단계: 외부 서비스 연동 (사람 선행 필요)

- `#5` Vercel + Slack 배포 연결
- `#7` 카카오 개발자 센터 앱 등록 → Supabase Auth에 Provider 설정

### 2단계: 인증 (코드)

- `#9` 인증 미들웨어 + 로그인/로그아웃

### 3단계: 계산 엔진 (코드, 병렬 가능)

- `#13` 사주 일주 계산
- `#15` 별자리 계산
- `#16` MBTI 궁합 매트릭스
- `#17` 종합 궁합 점수
- `#18` Claude AI 해석 (max_tokens: 1000 확정 예정)

### 이후: collaboration.md 섹션 8 참고

## Notes for Next Session

- **개발자 배경**: Android 앱 개발 메인. 웹은 처음 → Android 비유 활용
- **워크플로우**: 이슈 → `feat/issue-N-desc` 브랜치 → PR (develop 타겟) → 머지
- **커밋 컨벤션**: `feat: 설명 (#N)`, conventional commits 강제 (commitlint)
- **pre-commit**: `.lintstagedrc.mjs` (ESLint fix + Prettier + 마이그레이션 시 타입 재생성)
- **Supabase MCP**: Claude Code가 직접 DB 작업 가능. 사람이 할 필요 없음
- **Gemini API**: 공식 문서 접근 시 `gemini-2.5-pro` + `google_search` 사용
- **행동 원칙**: 지시와 다르게 실행하거나 실패 시 반드시 먼저 명시 (CLAUDE.md 참조)
- **마이그레이션 워크플로우**: SQL 작성 → MCP로 적용 → git commit (타입 자동 재생성)

## Quick Start Command

```
이슈 #5 or #7 진행할게. 관련 이슈 읽고 시작해줘.
```
