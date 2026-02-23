# desttiny (데스띠니)

> 사주+별자리+MBTI, 3가지 성격 체계로 보는 우리 사이의 케미

## 서비스 개요

**desttiny**는 사주(동양) + 별자리(서양) + MBTI(성격유형) 3가지 체계로 한 사람의 핵심 성향을 구성하고, 두 사람 사이의 궁합을 영역별로 분석하는 웹서비스입니다.

**핵심 가치**: 입력은 간단하게, 해석은 종합적이고 디테일하게

## 기술 스택

| 분류 | 기술 |
|---|---|
| **Frontend** | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| **Backend** | Next.js API Routes / Supabase Edge Functions |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth + 카카오 OAuth |
| **Infra** | Vercel (배포), Supabase (BaaS) |
| **AI** | Claude API (궁합 해설 문장 생성) |
| **Payment** | PortOne (포트원) |
| **OG Image** | @vercel/og 또는 Puppeteer (카드 이미지 생성) |

## 프로젝트 구조 (계획)

```
desttiny/
├── app/                    # Next.js App Router
│   ├── (auth)/             # 인증 관련 라우트
│   ├── (main)/             # 메인 탭 레이아웃
│   │   ├── profile/        # [탭1] 프로필
│   │   ├── compatibility/  # [탭2] 궁합
│   │   └── payment/        # [탭3] 결제/이력
│   ├── onboarding/         # 온보딩 플로우
│   ├── result/[id]/        # 궁합 결과 리포트
│   └── api/                # API Routes
├── components/             # 공통 컴포넌트
├── lib/                    # 유틸리티, 도메인 로직
│   ├── saju/               # 사주 계산 엔진
│   ├── zodiac/             # 별자리 계산
│   └── compatibility/      # 궁합 분석 엔진
├── types/                  # TypeScript 타입
└── supabase/               # Supabase 마이그레이션, 함수
```

## SSOT 문서

- [제품 스펙 (Notion)](https://www.notion.so/fuschia-basement-f24/SSOT-30ff3bfa920480cb997ee49f87d1231a)
- [디자인 스펙 (Notion)](https://www.notion.so/fuschia-basement-f24/SSOT-30ff3bfa920480d8aa03ef3afdd3981c)

## MVP 기능 목록

1. **카카오 로그인** - 소셜 로그인만 제공
2. **프로필 생성** - 이름/성별 + 생년월일시(사주/별자리 자동 계산) + MBTI
3. **1:1 궁합 분석** - 3체계 통합 점수 + 영역별 상세
4. **티저 → 결제 → 결과 플로우** - 건당 결제 (1,000~2,000원)
5. **일일 선착순 20명 무료**
6. **비주얼 카드 공유** - 프로필 카드 / 궁합 카드

## 개발 방식

- **이슈 트래킹**: 모든 작업(기획 변경, 디자인, 개발)을 GitHub Issue로 관리
- **분할 정복**: 독립적인 서브태스크 이슈를 해결하면 자연스럽게 Epic이 완성되는 구조
- **이슈 명명 규칙**:
  - Epic: `[EPIC] 기능명`
  - 서브태스크: `[SUB][EPIC-N] 세부작업명`
  - 기획 변경: `[SPEC] 변경사항`
  - 디자인: `[DESIGN] 작업명`
  - 버그: `[BUG] 버그내용`

## 개발 환경 설정

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local

# 개발 서버 실행
npm run dev
```

## 환경 변수 (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
ANTHROPIC_API_KEY=
PORTONE_API_KEY=
PORTONE_SECRET=
```
