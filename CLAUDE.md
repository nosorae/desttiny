# desttiny - Claude Code 개발 규칙

이 파일은 Claude Code가 이 프로젝트를 개발할 때 따라야 하는 규칙을 정의합니다.

## 기술 스택 요약

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL) + `@supabase/ssr`
- **Auth**: Supabase Auth + 카카오 OAuth
- **AI**: Anthropic SDK (`claude-sonnet-4-6`)
- **Payment**: PortOne V2 (`@portone/browser-sdk`)
- **Deploy**: Vercel

## 코드 주석 작성 규칙

### 기본 원칙

**무엇을 하는지(WHAT)가 아니라, 왜 하는지(WHY)와 의도(INTENT)를 설명하라.**

```typescript
// ❌ 나쁜 주석 - 코드 그대로를 설명
const user = await getUser(id); // 유저를 가져온다

// ✅ 좋은 주석 - 의도와 이유를 설명
// 결제 검증 전에 사용자 존재 여부를 먼저 확인 (없으면 결제 진행 불필요)
const user = await getUser(id);
```

### 주석을 반드시 작성해야 하는 경우

#### 1. 도메인 계산 로직 (사주/별자리/MBTI)
사주, 별자리, MBTI 관련 모든 계산에는 **근거 문서 링크**를 반드시 포함하세요.

```typescript
/**
 * 일주(日柱) 계산 - 생년월일로부터 일진(天干地支)을 계산
 *
 * 계산 방법: 1900년 1월 1일을 기준일(갑자일)로 삼아 경과 일수로 천간/지지 계산
 * 참고: 만세력 원리 - https://ko.wikipedia.org/wiki/%EB%A7%8C%EC%84%B8%EB%A0%A5
 * 참고: 천간지지 - https://ko.wikipedia.org/wiki/%EC%B2%9C%EA%B0%84%EC%A7%80%EC%A7%80
 *
 * @param birthDate - 생년월일 (시각 포함, undefined면 시각 미상)
 * @returns 일주 객체 { heavenlyStem: 천간, earthlyBranch: 지지, label: "갑자" }
 */
export function calculateDayPillar(birthDate: Date): DayPillar {
```

#### 2. 오행 상생상극 매핑 테이블
```typescript
/**
 * 오행 상생(相生) 관계: 목→화→토→금→수→목 (생성 관계)
 * 오행 상극(相剋) 관계: 목→토→수→화→금→목 (억제 관계)
 *
 * 점수 계산 기준: 상생 +2점, 상극 -1점, 중립 0점
 * 참고: https://ko.wikipedia.org/wiki/%EC%98%A4%ED%96%89
 */
const FIVE_ELEMENTS_SCORE: Record<string, Record<string, number>> = {
```

#### 3. 웹 개발 특유의 패턴

Next.js Server/Client Component 구분, Supabase Auth 패턴 등은 Android 개발자에게 낯선 개념이므로 반드시 설명을 추가하세요.

```typescript
// Server Component: 서버에서 실행되므로 DB에 직접 접근 가능
// Android의 ViewModel + Repository에서 데이터를 가져오는 것과 유사
// 'use client' 없이는 기본적으로 Server Component
export default async function CompatibilityPage() {

// ---

// 'use client'는 이 파일이 브라우저에서 실행됨을 의미
// useState, useEffect 같은 React 훅을 사용하거나
// 버튼 클릭 같은 이벤트 핸들러가 있을 때만 붙임
// Android의 Fragment/Activity와 유사한 개념
'use client';
export function PaymentButton({ amount }: { amount: number }) {
```

#### 4. 인증/보안 관련 코드

```typescript
// Supabase Middleware: 모든 요청마다 세션 토큰을 갱신
// Android의 OkHttp Interceptor와 유사한 역할
// 이 코드가 없으면 세션이 만료되어도 갱신이 안 됨
// 참고: https://supabase.com/docs/guides/auth/server-side/nextjs
export async function updateSession(request: NextRequest) {
```

#### 5. 결제 검증 코드

```typescript
// 결제 금액 위변조 방지를 위한 서버사이드 검증
// 클라이언트에서 받은 결제 ID로 PortOne API에 직접 조회하여
// 실제 결제 금액과 DB에 저장된 금액이 일치하는지 확인
// 이 검증 없이는 클라이언트에서 금액을 조작할 수 있음
// 참고: https://developers.portone.io/docs/ko/v2-payment/webhook
const paymentData = await PortOneClient.getPayment(paymentId);
if (paymentData.amount !== expectedAmount) {
  throw new Error('결제 금액 불일치 - 위변조 의심');
}
```

#### 6. 임시 해결책 (TODO/FIXME)

```typescript
// TODO(MVP 이후): 현재는 간단한 룰베이스 계산만 구현
// 추후 더 정확한 만세력 DB를 사용하거나 외부 API 연동 검토
// 관련 이슈: #13
const dayPillar = calculateDayPillarSimple(birthDate);

// FIXME: Edge case - 자시(23:00-01:00)는 날짜가 바뀌는 시간
// 현재는 자시를 당일로 처리하지만, 엄밀히는 다음날로 봐야 함
// 참고: https://namu.wiki/w/%EC%9E%90%EC%8B%9C
```

#### 7. 비동기 병렬 처리

```typescript
// 사주/별자리/MBTI 점수를 독립적으로 계산하므로 병렬 실행
// 순차 실행 시 3배 느림 (워터폴 방지 - React Best Practices 참고)
// 참고: ~/.claude/skills/react-best-practices.md
const [sajuScore, zodiacScore, mbtiScore] = await Promise.all([
  calculateSajuCompatibility(user1.dayPillar, user2.dayPillar),
  calculateZodiacCompatibility(user1.zodiac, user2.zodiac),
  calculateMbtiCompatibility(user1.mbti, user2.mbti),
]);
```

### 주석 스타일 가이드

| 상황 | 스타일 |
|------|--------|
| 함수/클래스 문서화 | `/** JSDoc */` |
| 인라인 설명 | `// 한 줄` |
| 섹션 구분 | `// ===== 섹션명 =====` |
| 임시 코드 | `// TODO:`, `// FIXME:`, `// HACK:` |
| 참고 자료 | `// 참고: URL` |

## 코드 작성 원칙

### Server/Client Component 구분

```
기본 = Server Component (파일 최상단에 'use client' 없음)
브라우저 이벤트 필요 = Client Component ('use client' 추가)
```

Client Component는 최대한 leaf(말단) 컴포넌트로만 사용하세요.

### 파일/폴더 구조

```
app/
├── (auth)/           # 인증이 필요 없는 공개 페이지
├── (main)/           # 인증이 필요한 메인 페이지
├── api/              # API 엔드포인트 (서버에서만 실행)
components/
├── ui/               # 재사용 가능한 기본 UI 컴포넌트
├── {feature}/        # 기능별 컴포넌트
lib/
├── saju/             # 사주 계산 로직 (순수 함수, 테스트 가능)
├── zodiac/           # 별자리 계산 로직
├── compatibility/    # 궁합 분석 로직
├── supabase/         # Supabase 클라이언트 (client.ts, server.ts)
types/                # TypeScript 타입 정의
```

### 에러 처리

- API Routes에서는 반드시 try/catch로 에러 처리
- 사용자에게 보여줄 에러 메시지는 한국어로
- 서버 로그에는 상세 에러 정보 포함

### 환경 변수

- `NEXT_PUBLIC_` 접두사: 브라우저에서 접근 가능 (공개해도 되는 값)
- 접두사 없음: 서버에서만 접근 가능 (시크릿 키 등)
- 절대로 시크릿 키를 `NEXT_PUBLIC_`으로 설정하지 말 것

## 스킬 활용

개발 시 아래 스킬을 활용하세요:

- `react-best-practices`: React/Next.js 컴포넌트 개발 시 (성능 최적화 패턴)
- `feature-dev:feature-dev`: 새로운 기능 개발 시
- `superpowers:test-driven-development`: 테스트 작성 시

## 이슈 작업 규칙

1. 이슈 작업 시작 전: 해당 이슈 번호로 브랜치 생성 (`feat/issue-N-{description}`)
2. 커밋 메시지에 이슈 번호 포함: `feat: 사주 계산 엔진 구현 (#13)`
3. PR 생성 시 이슈 자동 close: `Closes #13` 포함
4. PR은 main에 직접 merge하지 말고 리뷰 후 merge

## 참고 자료

- [Next.js 15 Docs](https://nextjs.org/docs)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [PortOne V2 Docs](https://developers.portone.io/docs/ko/v2-payment/readme)
- [Anthropic API Docs](https://docs.anthropic.com/en/api/getting-started)
- [Vercel React Best Practices](https://vercel.com/blog/introducing-react-best-practices)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
