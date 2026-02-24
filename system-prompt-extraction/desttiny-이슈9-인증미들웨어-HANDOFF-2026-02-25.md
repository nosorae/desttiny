# desttiny 이슈 #9 - 인증 미들웨어 구현 완료 핸드오프

**작성일**: 2026-02-25
**완료 이슈**: #9 [SUB][EPIC-2] 인증 미들웨어 & 보호된 라우트 설정
**상태**: ✅ 완료 및 main 머지 (프로덕션 배포 완료)

---

## 완료된 작업 요약

### 구현 파일

**`lib/supabase/middleware.ts`** (신규 생성)
- `updateSession(request: NextRequest)` 함수
- 세션 토큰 자동 갱신 (쿠키 관리)
- `getUser()` 서버 재검증 (보안 강화, `getSession()` / `getClaims()` 대신)
- 보호 경로: `/profile`, `/compatibility`, `/payment`, `/onboarding`, `/result`
  - 비로그인 → `/login` 리다이렉트
  - 리다이렉트 시 갱신된 세션 쿠키도 함께 전달
- 인증 경로: `/login` — 로그인 상태 → `/profile` 리다이렉트
- 경로 매칭: `pathname === path || pathname.startsWith(path + '/')` (오탐 방지)

**`proxy.ts`** (수정)
- `@/lib/supabase/proxy` → `@/lib/supabase/middleware`로 import 변경
- Next.js 16에서 `middleware.ts` 대신 `proxy.ts`가 미들웨어 역할

**`lib/supabase/proxy.ts`** (삭제)
- 데드 코드 제거 (`getClaims()` 기반의 구버전 로직)

### 주의사항: Next.js 16 미들웨어 파일명
- Next.js 16에서는 `middleware.ts` → **`proxy.ts`** 로 명칭 변경
- `proxy` 함수를 export해야 Next.js가 미들웨어로 인식
- `middleware.ts`와 `proxy.ts` 동시 존재 시 빌드 에러 발생

### 커밋 이력
```
009e3b2 fix: 리다이렉트 시 갱신된 세션 쿠키 전달 (#9)
0771d7b refactor: 경로 매칭 개선 및 데드 코드 삭제 (#9)
6a8c155 feat: 인증 미들웨어 구현 - 보호된 라우트 접근 제어 (#9)
```

---

## 현재 인증 플로우

```
비로그인 사용자
  → /profile, /compatibility, /payment, /onboarding, /result 접근
  → proxy.ts가 /login으로 리다이렉트

로그인 (카카오 OAuth)
  → /auth/callback 처리
  → profiles 테이블에 row 있으면 → /profile
  → 없으면 → /onboarding (신규 사용자)

로그인 상태에서 /login 접근
  → proxy.ts가 /profile로 리다이렉트
```

### 현재 페이지 상태 (플레이스홀더)
| 경로 | 상태 |
|------|------|
| `/` (랜딩) | 제목+소제목만 (TODO #34, 마지막 작업) |
| `/login` | ✅ 카카오 로그인 버튼 구현 완료 |
| `/onboarding` | "기본 정보 입력" 제목만 (TODO #10, #11) |
| `/profile` | 비어있음 |
| `/compatibility` | 비어있음 |

---

## 테스트 환경 설정 (중요)

### Supabase Redirect URLs 현황
| URL | 용도 |
|-----|------|
| `http://localhost:3000/auth/callback` | 로컬 개발 |
| `https://desttiny.vercel.app/auth/callback` | 프로덕션 |
| `https://desttiny-*-nosoraes-projects.vercel.app/auth/callback` | Vercel Preview 전체 (와일드카드) |

> Preview URL에서 테스트 시 위 와일드카드가 없으면 `/?code=...`로 잘못 리다이렉트됨
> 이슈 #7 댓글에도 기록되어 있음

### Supabase Site URL
- `https://desttiny.vercel.app`

### Vercel 환경 배포 현황
| 브랜치 | 배포 URL | 용도 |
|--------|----------|------|
| `main` | `https://desttiny.vercel.app` | 프로덕션 |
| `develop` | Preview URL (매 머지마다 고유) | 개발 확인 |

---

## 브랜치 상태

- **main**: 이슈 #9 포함 최신 (2026-02-25 머지)
- **develop**: main과 동기화 완료
- 현재 체크아웃: `develop` 브랜치

---

## 다음 작업 후보 (SSOT 기준)

현재 **2단계(인증)** 완료. SSOT `docs/collaboration.md` 개발 순서:

### 3단계: 계산 엔진 `ai-only` (2단계와 병렬 가능)
- **#13** 사주 일주 계산 엔진
- **#15** 서양 별자리 계산 엔진
- → 둘 완료 후: **#16** 사주 궁합 점수, **#17** 별자리/MBTI 궁합 매핑
- → 둘 완료 후: **#18** 3체계 통합 점수 + Claude API 해설

### 4단계: 온보딩 & 프로필 `ai-only`
- **#10** 온보딩 스텝 UI (이름/성별/생년월일시)
- **#11** MBTI 선택 & 온보딩 완료 처리 (profiles DB 저장)
- ⚠️ 선행 조건: 3단계 완료 (생년월일 입력 시 사주/별자리 미리보기 때문)

> 3단계 계산 엔진은 UI 없는 순수 로직이므로 TDD로 빠르게 진행 가능

---

## SSOT 문서 링크

- [제품 스펙 (Notion)](https://www.notion.so/fuschia-basement-f24/SSOT-30ff3bfa920480cb997ee49f87d1231a)
- [디자인 스펙 (Notion)](https://www.notion.so/fuschia-basement-f24/SSOT-30ff3bfa920480d8aa03ef3afdd3981c)
- Notion MCP 사용 가능 (필요 시 활성화)
