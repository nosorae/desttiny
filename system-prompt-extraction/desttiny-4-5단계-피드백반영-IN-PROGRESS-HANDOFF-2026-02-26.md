# 4~5단계 피드백 반영 핸드오프

> **작성일**: 2026-02-26
> **브랜치**: `feat/stage4-5-onboarding-compatibility`
> **PR**: #69 (https://github.com/nosorae/desttiny/pull/69)
> **상태**: PR 생성 완료, 유저 브라우저 테스트 중 피드백 반영 진행 중

---

## 완료된 작업

### 4~5단계 핵심 구현 (Task 4~8)

- **Task 4**: 점수 계산 함수 분리 + Server Action (`6efe281`)
- **Task 5**: 궁합 입력 + 티저 + 로딩 UX (`2f15bcd`)
- **Task 6**: LLM 프롬프트 8영역 확장 (`cbf8f97`)
- **Task 7**: 결과 리포트 페이지 (`bcd84d1`)
- **Task 8**: 통합 테스트 + 빌드 검증

### 코드 리뷰 반영 (`7f7bdd8`)

- 입력 검증, 에러 분기, 이중 제출 방지, unused prop 정리

### 유저 피드백 반영

| 커밋      | 내용                                                             |
| --------- | ---------------------------------------------------------------- |
| `b055491` | OAuth 콜백 - Vercel 프리뷰 도메인 지원 (`VERCEL_URL` env var)    |
| `73ba0ca` | 온보딩 UX: placeholder 1998/5/29, 분 입력 추가, 프로필→궁합 링크 |
| `0dd065b` | 티저 세부 점수 블러 처리 (총점만 공개, 설계 문서 기준 준수)      |
| `f99cdbd` | LLM max_tokens 2000→4096, /profile·/payment 온보딩 가드 추가     |

---

## 현재 상태

### 자동 검증 (모두 통과)

- vitest: 70 pass, 2 skip, 4 todo
- tsc --noEmit: 에러 없음
- next build: 성공 (11 라우트)
- eslint: 0 errors

### 리다이렉트 정책 (현재)

| 레이어         | 조건                 | 동작            |
| -------------- | -------------------- | --------------- |
| 미들웨어       | 미로그인 + 보호 경로 | → `/login`      |
| 미들웨어       | 로그인 + `/login`    | → `/profile`    |
| callback       | 신규 사용자          | → `/onboarding` |
| callback       | 기존 사용자          | → `/profile`    |
| /onboarding    | 프로필 있음          | → `/profile`    |
| /compatibility | 프로필 없음          | → `/onboarding` |
| /profile       | 프로필 없음          | → `/onboarding` |
| /payment       | 프로필 없음          | → `/onboarding` |
| /result/[id]   | 미로그인             | → `/login`      |

### Vercel 프리뷰 테스트 조건

Supabase 대시보드 → Authentication → URL Configuration → Redirect URLs에 아래 추가 필요:

```
https://*-nosoraes-projects.vercel.app/**
```

---

## 미해결 이슈

### #70: 아이폰 크롬 로그인 루프

- **현상**: 아이폰 크롬에서 로그인 후 다시 `/login`으로 돌아옴 (두 번째 접속 시 정상)
- **추정 원인**: 3rd-party cookie 제한으로 `auth/callback`에서 세션 쿠키 미전달
- **상태**: 이슈만 생성, 코드 수정 안 함
- **참고**: `app/auth/callback/route.ts`, `lib/supabase/middleware.ts`

### LLM 답변 길이

- max_tokens 4096으로 늘렸지만, 실제 출력이 충분한지 **브라우저 테스트에서 재확인 필요**
- 프롬프트에서 8영역 + 친밀도 + 마무리 JSON을 요구하므로 토큰이 부족하면 JSON 파싱 에러 → 폴백 발동
- 파일: `lib/llm/providers/anthropic.ts:31`

---

## 다음 세션에서 할 일

### 1. 브라우저 테스트 이어서 진행

프리뷰 URL: `https://desttiny-git-feat-stage4-5-onboarding-b596ce-nosoraes-projects.vercel.app`

테스트 시나리오:

1. `/profile` → "궁합 보러가기" 클릭
2. 관계 유형 선택 → 상대 입력 → 점수 티저 (총점만, 세부는 블러)
3. "전체 궁합 리포트 보기" → 로딩 → 결과 페이지
4. 결과: 8영역 해설 길이 충분한지, 29금 친밀도(연인계), 마무리 확인

### 2. 피드백에 따라 추가 수정

- LLM 답변 길이가 여전히 짧으면 프롬프트 조정 또는 토큰 추가 증가
- UI/UX 추가 피드백 반영

### 3. PR 머지

- 테스트 통과 + 피드백 반영 완료 후 main에 머지
- 관련 이슈 자동 close: #10, #11, #21, #22, #23

### 4. 6단계 (결제) 준비

- `docs/collaboration.md` 6단계 참고
- PortOne V2 연동, 결제 게이트, 일일 무료 슬롯 UI

---

## 주요 파일 경로

| 파일                                                                | 역할                            |
| ------------------------------------------------------------------- | ------------------------------- |
| `app/(main)/compatibility/CompatibilityFlow.tsx`                    | 궁합 플로우 Client Component    |
| `components/compatibility/TeaserResult.tsx`                         | 티저 (총점 공개, 세부 블러)     |
| `lib/actions/compatibility-preview.ts`                              | 점수 미리보기 Server Action     |
| `lib/llm/providers/anthropic.ts`                                    | LLM provider (max_tokens: 4096) |
| `app/auth/callback/route.ts`                                        | OAuth 콜백 (프리뷰 도메인 지원) |
| `app/result/[id]/page.tsx`                                          | 결과 리포트 페이지              |
| `docs/plans/2026-02-25-stage4-5-implementation-plan.md`             | 구현 계획                       |
| `docs/plans/2026-02-25-stage4-5-onboarding-compatibility-design.md` | 설계 문서 (SSOT)                |

---

## 테스트 실행 방법

```bash
npx vitest run          # 유닛 테스트 (70 pass)
npx tsc --noEmit        # 타입 체크
npx next build          # 프로덕션 빌드
npm run dev             # 로컬 개발 서버 (http://localhost:3000)
```
