# desttiny 이슈 #18 완료 핸드오프

**작성일**: 2026-02-25
**이슈**: #18 - 3체계 통합 점수 계산 및 Claude API 해설 생성
**상태**: ✅ PR 머지 완료, 워크트리 정리 완료
**현재 브랜치**: `develop` (커밋 `d002aac`)
**레포**: `nosorae/desttiny` (NOT yessorae)

---

## 완료된 작업

### PR #68 (squash merged → `d002aac`)

**핵심 구현:**
- `POST /api/compatibility` API 엔드포인트
- LLM Provider 추상화 (`lib/llm/`) + AnthropicProvider (claude-sonnet-4-6)
- 3체계 통합 계산기 (`lib/compatibility/calculator.ts`)
- AI 프롬프트 빌더 (`lib/compatibility/ai/prompt.ts`)
- 29금 친밀도 점수 3종 (연인/썸/전연인만)
- DB 마이그레이션 2개 (Supabase 적용 완료)

**코드리뷰 전체 반영:**
- C1: 파트너 프로필 adminClient로 변경 (RLS 우회)
- C2: debug 필드 NODE_ENV 조건부
- I2+I3: use_daily_slot() 보안 강화 + 자동 슬롯 생성
- I4: LLM JSON 코드펜스 제거 + shape validation
- I6: UUID 검증, S1: 이름 trim, S2: 생년월일 범위, S3: 자기 자신 방지

**SSOT 노션 업데이트 완료:**
- 제품 스펙 SSOT: AI 해설 글자수 스펙 추가 (각 영역 500자±50, 마무리 500자±50)
- 궁합 결과 템플릿 v1: 글자수 기준 추가

**테스트 가이드:**
- 이슈 #18 댓글에 상세 수동 테스트 가이드 작성 (STEP 0~9)
- https://github.com/nosorae/desttiny/issues/18#issuecomment-3955970090

---

## 현재 프로젝트 상태

```
브랜치: develop (d002aac)
워크트리: 메인만 (/Users/yessorae/desttiny)
테스트: 65 pass, 2 skip, 4 todo
타입체크: 에러 0개
```

---

## 사용자가 아직 안 한 것

1. **수동 테스트**: 이슈 #18 댓글의 STEP 0~9 실행 (curl로 API 동작 확인)
2. **SSOT 노션 확인**: 업데이트한 글자수 스펙이 맞는지 본인 눈으로 확인

---

## 미해결 항목 (후속 이슈 후보)

| 항목 | 설명 | 우선순위 |
|------|------|----------|
| API route 단위 테스트 | `app/api/compatibility/route.ts` 테스트 없음 | 중 |
| 유저별 일일 사용 제한 | 1명이 하루 슬롯 전체 독점 가능 (TODO 주석만) | 중 |
| 29금 친밀도 별도 섹션 | SSOT은 별도 섹션(점수3종+해석)인데 현재는 프롬프트 기반 | 낮 |
| 티저 결과 화면 | 프론트엔드 이슈 | 별도 |
| 비주얼 카드 공유 | 프론트엔드 이슈 | 별도 |
| 관계 대시보드 | 프론트엔드 이슈 (DB 저장은 완료) | 별도 |

---

## 아키텍처 요약

```
POST /api/compatibility
  ├── Supabase Auth 인증
  ├── 요청 검증 (관계유형, UUID, 자기자신, 이름trim, 날짜범위)
  ├── 요청자 프로필 (user-scope supabase)
  ├── 파트너 정보
  │   ├── A: UUID → adminClient (RLS 우회)
  │   └── B: 생년월일 → 사주/별자리 계산
  ├── use_daily_slot() RPC (원자적 슬롯 + 자동 row 생성)
  ├── calculateCompatibility(p1, p2, type, provider)
  │   ├── 사주 40% + 별자리 30% + MBTI 30%
  │   └── LLM 해설 (코드펜스 제거 + shape 검증)
  ├── DB 저장 (compatibility_results)
  └── 응답 { id, totalScore, breakdown, analysis, debug(dev only) }

연인계 관계 시 추가:
  - sections에 intimacy 영역 추가 (6개)
  - intimacyScores: { tension, rhythm, boundary, strength, caution, advice }
```

## DB 마이그레이션 이력

| 파일 | 내용 | Supabase |
|------|------|----------|
| `20260224000001_initial_schema.sql` | 초기 스키마 | ✅ |
| `20260225000001_compatibility_api_setup.sql` | relationship_type 확장 + use_daily_slot | ✅ |
| `20260225200000_fix_use_daily_slot_security.sql` | search_path + 자동 슬롯 생성 | ✅ |

## 환경 변수

```
ANTHROPIC_API_KEY=sk-ant-...    # LLM 호출용
LLM_PROVIDER=anthropic          # 기본값
SUPABASE_SERVICE_ROLE_KEY=...   # adminClient용 (파트너 프로필 조회)
```

## 세션 시작 방법

```bash
cd /Users/yessorae/desttiny
git log --oneline -3    # HEAD: d002aac 확인
npm test                 # 65 pass 확인
```
