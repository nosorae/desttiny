# desttiny - 이슈 #4 Supabase 스키마 + 이슈 #6 코드 품질 도구 Handoff

## Goal

사주+별자리+MBTI 궁합 웹서비스 desttiny를 Next.js 16으로 MVP 개발.

## Current Phase

**0단계 완료, 1단계 진행 중**: 코드베이스 초기화(#3), 코드 품질 도구(#6) 완료. Supabase 스키마(#4) PR 올림, 사람이 SQL 실행 대기 중.

## What Was Done (이번 세션)

### 이슈 #6: ESLint + Prettier + Husky 코드 품질 도구 (PR #54 → 머지 완료)

- `.prettierrc`: semi:false, singleQuote, tabWidth:2, trailingComma:es5
- `.prettierignore`: .next, node_modules, build, out
- `commitlint.config.mjs`: conventional commits 강제 + `subject-case` 비활성화 (한국어/고유명사 허용)
- `eslint.config.mjs`: import/order, unused-imports 규칙 추가, scripts/ 폴더 require() 허용
- `.husky/pre-commit`: `npx lint-staged`
- `.husky/commit-msg`: `npx --no -- commitlint --edit "$1"`
- `package.json`: lint-staged 설정, format/format:check/lint:fix 스크립트 추가

### 이슈 #4: Supabase 스키마 + RLS (PR #55 → 머지 대기)

- `supabase/migrations/20260224000001_initial_schema.sql`: 4개 테이블 DDL + RLS 정책 + updated_at 트리거
- `lib/supabase/admin.ts`: service_role Admin 클라이언트 (RLS 우회용)
- `types/database.ts`: DB 테이블 TypeScript 타입
- `.env.example`: `SUPABASE_SERVICE_ROLE_KEY` 추가

### 이슈 #3: PR #52 사후 검증 완료

- `npm run dev` → HTTP 200 ✅
- TypeScript strict: true ✅
- 9개 페이지 파일 존재 ✅
- `.env.example` 존재 ✅

### 이슈 관리

- 이슈 #4 본문 단일화: 댓글에 흩어진 정보를 본문에 통합 (최신 대시보드 경로 포함)
- 이슈 #4 자동 생성 댓글 삭제, 사용자 수동 작성 댓글 2개 복원

## 코드 리뷰에서 발견된 개선 사항 (다음 세션 참고)

PR #55 코드 리뷰에서 발견한 사항 (머지 전 수정 또는 별도 이슈로 처리):

1. **RLS 성능 최적화**: `auth.uid()` → `(select auth.uid())`로 감싸면 캐싱되어 94-99% 성능 향상
2. **`auth.role()` → `TO authenticated`**: RLS 정책에서 role 체크는 `TO` 구문이 공식 패턴
3. **인덱스 누락**: `compatibility_results(requester_id)`, `payments(user_id)` 인덱스 필요
4. **`daily_free_slots` 동시성**: `check (used_count <= max_count)` 제약 + Stored Procedure 필요
5. **`types/index.ts` vs `types/database.ts` 중복**: camelCase/snake_case 불일치, User/Profile 중복

## Branch Strategy

- `develop`: 개발 기준 브랜치 (PR은 develop로 머지)
- `main`: docs/일반 콘텐츠
- 브랜치명: `feat/issue-N-description`

## Completed Issues

| 이슈               | PR  | 상태                            |
| ------------------ | --- | ------------------------------- |
| #3 Next.js 초기화  | #52 | ✅ 머지 완료                    |
| #6 코드 품질 도구  | #54 | ✅ 머지 완료                    |
| #4 Supabase 스키마 | #55 | ⏳ 사람이 SQL 실행 후 머지 대기 |

## Key Files (이번 세션에서 수정/생성)

- `supabase/migrations/20260224000001_initial_schema.sql` - 4개 테이블 + RLS + 트리거
- `lib/supabase/admin.ts` - service_role Admin 클라이언트
- `lib/supabase/client.ts` - 브라우저용 Supabase 클라이언트 (PR #52)
- `lib/supabase/server.ts` - 서버용 Supabase 클라이언트 (PR #52)
- `lib/supabase/proxy.ts` - 세션 갱신 미들웨어 (PR #52)
- `types/database.ts` - DB 테이블 TypeScript 타입
- `types/index.ts` - 앱 레벨 타입 (User, OnboardingInput)
- `.prettierrc`, `.prettierignore`, `commitlint.config.mjs` - 코드 품질 설정
- `.husky/pre-commit`, `.husky/commit-msg` - Git 훅
- `eslint.config.mjs` - ESLint 9 flat config
- `CLAUDE.md` - 개발 규칙 (주석, 브랜치, 커밋)
- `docs/collaboration.md` - 협업 가이드 + 개발 순서

## Remaining Plan

### 이슈 #4 사람 작업 잔여 (⬅️ 현재 대기 중)

1. Supabase SQL Editor에서 마이그레이션 SQL 실행
2. Table Editor에서 4개 테이블 확인
3. Authentication → Policies에서 RLS 정책 확인
4. PR #55 머지

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
- `#18` Claude AI 해석

### 이후: collaboration.md 섹션 8 참고

## Notes for Next Session

- **개발자 배경**: Android 앱 개발 메인. 웹은 처음 → Android 비유 활용
- **워크플로우**: 이슈 → `feat/issue-N-desc` 브랜치 → PR (develop 타겟) → 머지
- **커밋 컨벤션**: `feat: 설명 (#N)`, conventional commits 강제 (commitlint)
- **pre-commit**: lint-staged (ESLint fix + Prettier) 자동 실행
- **주석 원칙**: WHY/INTENT 중심, 도메인 로직은 참고 링크 필수 (CLAUDE.md 참조)
- **Next.js 16**: App Router, Server Component 기본, `cookies()` 비동기
- **Supabase SSR**: `@supabase/ssr` 패키지 사용 (`auth-helpers` deprecated)
- **코드 리뷰 피드백**: PR 머지 전 리뷰 요청하면 최신 문서 + 스펙 대비 검증 수행

## Quick Start Command

```
이슈 #4 PR #55 머지됐어. 다음 작업 진행해줘.
collaboration.md 섹션 8의 개발 순서 참고해서 다음 이슈 알려줘.
```
