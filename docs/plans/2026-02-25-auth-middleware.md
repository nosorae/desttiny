# 인증 미들웨어 구현 계획 (이슈 #9)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 비로그인 사용자가 보호된 페이지에 접근할 때 로그인 페이지로 리다이렉트하는 Next.js 미들웨어 구현

**Architecture:** `lib/supabase/middleware.ts`에 세션 갱신 + 리다이렉트 로직을 담은 `updateSession` 함수를 분리하고, 프로젝트 루트 `middleware.ts`에서 호출하는 2-파일 구조. `getUser()`를 사용해 JWT를 서버에서 재검증함으로써 `getSession()` 대비 보안 강화.

**Tech Stack:** `@supabase/ssr` (`createServerClient`), Next.js Middleware (`NextRequest`, `NextResponse`)

---

## 보호 라우트 정의

| 경로 | 구분 | 동작 |
|------|------|------|
| `/profile` | 보호 | 비로그인 → `/login` |
| `/compatibility` | 보호 | 비로그인 → `/login` |
| `/payment` | 보호 | 비로그인 → `/login` |
| `/onboarding` | 보호 | 비로그인 → `/login` |
| `/result` | 보호 | 비로그인 → `/login` |
| `/login` | 공개 | 로그인 상태 → `/profile` |
| `/auth/*` | 패스스루 | 리다이렉트 없음 (OAuth 콜백) |

---

## Task 1: 브랜치 생성

**Step 1: 이슈 브랜치 생성**

```bash
git checkout develop
git pull origin develop
git checkout -b feat/issue-9-auth-middleware
```

Expected: `feat/issue-9-auth-middleware` 브랜치로 전환됨

---

## Task 2: `lib/supabase/middleware.ts` 생성

**Files:**
- Create: `lib/supabase/middleware.ts`

**Step 1: 파일 생성**

```typescript
// lib/supabase/middleware.ts
// Next.js Middleware 전용 Supabase 클라이언트
// 모든 요청마다 실행되어 세션 토큰 자동 갱신
//
// updateSession 함수는 두 가지 역할:
//   1. 만료된 세션 토큰을 갱신하고 쿠키에 저장
//   2. 보호된 라우트 접근 시 비로그인 사용자를 /login으로 리다이렉트
//
// getUser()를 사용하는 이유: getSession()은 쿠키의 JWT만 확인하지만,
// getUser()는 Supabase Auth 서버에 재검증 요청을 보내 더 안전함
// 참고: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// 비로그인 사용자가 접근할 수 없는 보호된 경로 목록
const PROTECTED_PATHS = [
  '/profile',
  '/compatibility',
  '/payment',
  '/onboarding',
  '/result',
]

// 로그인이 이미 된 사용자가 접근 시 /profile로 보낼 경로 목록
const AUTH_PATHS = ['/login']

export async function updateSession(request: NextRequest) {
  // supabaseResponse를 let으로 선언: setAll 콜백 내부에서 재할당 필요
  // IMPORTANT: 이 response 객체를 그대로 반환해야 세션 쿠키가 정상적으로 전달됨
  let supabaseResponse = NextResponse.next({
    request,
  })

  // IMPORTANT: 매 요청마다 새 클라이언트 생성 필수 (전역 변수 저장 금지)
  // Fluid compute 환경에서 전역 변수로 공유하면 세션 교차 오염 발생
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // 1단계: request 쿠키 업데이트 (이후 생성되는 NextResponse가 참조)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // 2단계: response 재생성 후 쿠키 설정
          // request 쿠키가 업데이트된 상태에서 새 response를 만들어야
          // 갱신된 세션 정보가 다음 요청에도 올바르게 전달됨
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: createServerClient와 getUser() 사이에 다른 코드를 넣지 말 것
  // 중간에 코드가 들어가면 세션 갱신 타이밍이 어긋나 사용자가 무작위로 로그아웃됨
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // 비로그인 사용자가 보호된 라우트 접근 시 /login으로 리다이렉트
  const isProtectedPath = PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path)
  )
  if (!user && isProtectedPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 로그인된 사용자가 /login 접근 시 /profile로 리다이렉트
  const isAuthPath = AUTH_PATHS.some((path) => pathname.startsWith(path))
  if (user && isAuthPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/profile'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: 반드시 supabaseResponse를 그대로 반환
  // 새 NextResponse를 만들어 반환하면 쿠키가 전달되지 않아 세션 불일치 발생
  return supabaseResponse
}
```

**Step 2: 파일 저장 확인**

```bash
cat lib/supabase/middleware.ts | head -5
```

Expected: `// lib/supabase/middleware.ts` 주석이 출력됨

---

## Task 3: `middleware.ts` 생성 (프로젝트 루트)

**Files:**
- Create: `middleware.ts`

**Step 1: 파일 생성**

```typescript
// middleware.ts
// Next.js 미들웨어 진입점 - 모든 요청이 이 파일을 거침
// Android의 OkHttp Interceptor와 유사한 역할:
//   - 요청 전처리 (세션 갱신)
//   - 인증 체크 후 리다이렉트
//
// 참고: https://supabase.com/docs/guides/auth/server-side/nextjs
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * 아래로 시작하는 경로를 제외한 모든 요청에 미들웨어 적용:
     * - _next/static (Next.js 정적 파일)
     * - _next/image (Next.js 이미지 최적화)
     * - favicon.ico (파비콘)
     * - svg, png, jpg, jpeg, gif, webp (이미지 파일)
     *
     * 이미지/정적 파일에 미들웨어를 적용하지 않는 이유:
     * Supabase getUser() 호출은 네트워크 요청이므로 정적 파일까지 실행 시 성능 저하
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Step 2: 파일 저장 확인**

```bash
cat middleware.ts | head -5
```

Expected: `// middleware.ts` 주석이 출력됨

---

## Task 4: TypeScript 빌드 검증

**Step 1: 빌드 실행**

```bash
npm run build
```

Expected: 빌드 성공 (오류 없음). 미들웨어 관련 오류가 있다면 타입 확인.

**Step 2: 린트 확인**

```bash
npm run lint
```

Expected: 오류 없음

---

## Task 5: 수동 동작 검증 (개발 서버)

**Step 1: 개발 서버 실행**

```bash
npm run dev
```

**Step 2: 비로그인 상태에서 보호 라우트 접근 확인**

브라우저에서 아래 URL 직접 접근:
- `http://localhost:3000/profile` → `/login`으로 리다이렉트 확인
- `http://localhost:3000/compatibility` → `/login`으로 리다이렉트 확인
- `http://localhost:3000/onboarding` → `/login`으로 리다이렉트 확인

**Step 3: `/auth/callback` 패스스루 확인**

`http://localhost:3000/auth/callback` 접근 시 리다이렉트 없이 처리됨 확인 (400/오류 페이지가 나와도 리다이렉트가 아니면 OK)

---

## Task 6: 커밋 및 PR

**Step 1: 스테이징**

```bash
git add lib/supabase/middleware.ts middleware.ts
```

**Step 2: 커밋**

```bash
git commit -m "feat: 인증 미들웨어 구현 - 보호된 라우트 접근 제어 (#9)"
```

**Step 3: 원격 푸시**

```bash
git push -u origin feat/issue-9-auth-middleware
```

**Step 4: PR 생성**

```bash
gh pr create \
  --base develop \
  --title "feat: 인증 미들웨어 구현 (#9)" \
  --body "$(cat <<'EOF'
## Summary
- `lib/supabase/middleware.ts`: `updateSession` 함수 구현 (세션 갱신 + 리다이렉트)
- `middleware.ts`: Next.js 미들웨어 진입점, 정적 파일 제외 matcher 설정
- 비로그인 사용자 → 보호 라우트 접근 시 `/login` 리다이렉트
- 로그인 사용자 → `/login` 접근 시 `/profile` 리다이렉트
- `getUser()` 사용으로 JWT 서버 검증 (보안 강화)

## Test plan
- [ ] 비로그인 상태에서 `/profile`, `/compatibility`, `/onboarding`, `/payment`, `/result` 접근 시 `/login` 리다이렉트 확인
- [ ] 로그인 상태에서 `/login` 접근 시 `/profile` 리다이렉트 확인
- [ ] `/auth/callback` 패스스루 확인 (리다이렉트 없음)
- [ ] `npm run build` 빌드 성공 확인

Closes #9

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## 주요 주의사항

1. **`getUser()` 필수** — `getSession()`은 쿠키의 JWT만 검증하지만 `getUser()`는 Supabase 서버에 재검증 요청 → 만료/무효 토큰 감지 가능
2. **`supabaseResponse` 반드시 반환** — 새 `NextResponse`를 만들어 반환하면 세션 쿠키가 유실되어 로그아웃 루프 발생
3. **`/auth/*` 제외** — OAuth 콜백 경로를 보호 목록에 넣으면 로그인 자체가 불가능해짐
4. **`setAll`에서 request + response 양쪽 쿠키 설정** — 한쪽만 하면 세션 불일치 발생
