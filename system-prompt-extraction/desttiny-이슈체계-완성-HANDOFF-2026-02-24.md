# desttiny - GitHub 이슈 체계 완성 Handoff

## Goal

사주+별자리+MBTI 궁합 웹서비스 desttiny를 Next.js 15로 MVP 개발. 지금은 개발 시작 직전 단계.

## Current Phase

**0단계 직전**: GitHub 이슈 체계 완비 완료. 다음 세션은 이슈 #3 (Next.js 초기화)부터 실제 코딩 시작.

## What Was Done

### GitHub 이슈 체계 (총 49개 이슈)

- **라벨 체계**: ai-only / human-only / collaborative / epic / subtask / design 등 26개 라벨
- **이슈 분류**:
  - `human-only` (#4 Supabase, #5 Vercel, #7 카카오OAuth, #25 PortOne): step-by-step 설명 + Android 비유 본문 작성
  - `ai-only` (코드 구현 전체): 기술 설명 + Android 개념 매핑 코멘트 추가
  - `collaborative` (모든 EPIC): 역할 분리 명시
- **DESIGN 이슈** (#37~#45): 각 UI EPIC 별 Figma 적용 placeholder (나중에 채울 예정)
- **React Best Practices 이슈** (#46~#49): EPIC + 서브태스크 3개
- **협업 가이드 PR #51** → 머지 완료: `docs/collaboration.md`

### 검증 완료 (context7)

- `@supabase/ssr` 패키지 (구 `@supabase/auth-helpers-nextjs`): 이슈 #3, #9에 최신 패턴 코멘트
- PortOne V2 `@portone/browser-sdk/v2`: 이슈 #25에 최신 코드 패턴
- Anthropic SDK 최신 모델명 `claude-sonnet-4-6`: 이슈 #18에 반영
- `next/og` (별도 설치 불필요, Next.js 내장): 이슈 #30에 반영

### 프로젝트 파일

- `CLAUDE.md` (main 커밋): 주석 규칙 (WHY/INTENT), Server/Client Component 원칙, 이슈 작업 규칙
- `docs/collaboration.md` (main 머지): Android 개발자용 협업 가이드, 개발 순서 권장사항
- `~/.claude/skills/react-best-practices.md`: 다음 세션부터 자동 available

## Key Decisions Made

- **디자인 먼저 X**: 기능 구현 이슈 완료 → Figma 나오면 → DESIGN 이슈 별도 진행
- **이슈 = 작업 단위**: 모든 작업(기획 변경, 디자인, 개발)은 이슈로 추적
- **0단계 먼저**: #3 Next.js 초기화가 코드베이스의 시작점. 반드시 가장 먼저.
- **human-only 선행**: #4, #7, #5는 사람이 외부 서비스 계정 설정 후 Claude Code에게 코드 작업 넘김
- **사주 엔진**: 룰베이스 우선, AI 문장 생성은 통합 점수 해설만
- **주석 원칙**: WHAT이 아닌 WHY/INTENT, 도메인 로직에 참고 자료 링크 필수

## What Worked

- 서브에이전트 병렬 실행으로 36개 이슈 라벨 분류 + 코멘트 추가를 빠르게 처리
- Android 개념 매핑 방식 (Activity→page.tsx 등) - 이해도 높이는 데 효과적
- context7 MCP로 최신 라이브러리 패턴 즉시 검증 가능

## What Didn't Work / Caveats

- 이슈 번호가 병렬 생성으로 비선형 (#1, #8, #12, #14, #20, #19 혼재)
  → 번호보다 제목/라벨로 식별하는 게 더 명확
- 이슈 body 전체 교체(`gh issue edit --body`)는 기존 내용 소실 위험
  → 코멘트 추가 방식이 더 안전 (기존 내용 보존)
- `~/.claude/skills/`에 생성한 스킬은 세션 시작 시 로드 → 현재 세션에서는 안 보임

## Key Files

- `/Users/yessorae/desttiny/CLAUDE.md` - Claude Code 개발 규칙 (주석, 브랜치, 커밋 규칙)
- `/Users/yessorae/desttiny/docs/collaboration.md` - 협업 가이드 + 개발 순서 권장사항
- `/Users/yessorae/desttiny/README.md` - 프로젝트 README (기술 스택, 디렉토리 구조)
- `/Users/yessorae/claude-obsidian-daily/docs/03-moc/MOC-Desttiny.md` - 프로젝트 MOC
- `~/.claude/skills/react-best-practices.md` - React 성능 최적화 스킬
- GitHub Issues: https://github.com/nosorae/desttiny/issues (1~49)

## Remaining Plan

### 0단계 (다음 세션 즉시 시작 가능, ai-only)

1. 이슈 #3: Next.js 15 + TypeScript 프로젝트 초기화
   - `npx create-next-app@latest` 실행
   - 디렉토리 구조 설정 (app/, components/, lib/, types/, supabase/)
   - Tailwind CSS 설정
   - `.env.example` 작성
2. 이슈 #6: ESLint + Prettier + Husky 설정

### 1단계 (사람이 먼저 해야 함)

- `#4` Supabase 설정 → 이슈 코멘트의 step-by-step 따라 진행
- `#7` 카카오 개발자 센터 앱 등록 (#4 완료 후)
- `#5` Vercel 배포 연결 (#4 완료 후)

### 이후 (docs/collaboration.md 섹션 8 참고)

- 2단계: #9 인증 미들웨어
- 3단계: #13/#15/#16/#17/#18 계산 엔진 (병렬 가능)
- 4단계: #10/#11 온보딩 UI
- ...

## Notes for Next Session

- **개발자 배경**: Android 앱 개발 경험 있음. 웹 개발은 처음.
  → 설명 시 Android 비유 적극 활용 (Activity→page.tsx, Retrofit→fetch 등)
- **워크플로우**: 이슈 하나 → 브랜치 생성 → PR → 사용자 리뷰 → 머지
  → 브랜치명: `feat/issue-N-{description}`
  → 커밋: `feat: 설명 (#N)`
  → PR body에 `Closes #N` 포함
- **디자인 방식**: 기능 먼저 구현, 픽셀 퍼펙트 디자인은 DESIGN 이슈에서 별도 처리
- **이슈 생성 규칙**: 모든 작업은 이슈로. ai-only/human-only/collaborative 라벨 필수
- **human-only 이슈**: step-by-step 설명 필수, 사람이 완료 후 Claude Code에 코드 작업 넘김
- **주석**: CLAUDE.md의 규칙 준수. WHY/INTENT 중심, 도메인 로직은 참고 링크 필수
- **이 핸드오프 파일**: `system-prompt-extraction/` 폴더에 날짜 포함 파일명으로 매번 새로 생성 (히스토리 누적)

## Quick Start Command

```
이슈 #3 작업해줘.

desttiny 프로젝트의 0단계 시작이야.
GitHub 이슈 #3 내용 확인하고 Next.js 15 + TypeScript 프로젝트 초기화해줘.
CLAUDE.md의 개발 규칙 준수하고, 브랜치 feat/issue-3-nextjs-init 생성 후 PR 올려줘.
```
