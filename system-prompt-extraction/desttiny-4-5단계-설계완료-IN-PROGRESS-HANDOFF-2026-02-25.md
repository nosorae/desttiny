# desttiny 4~5단계 설계 완료 핸드오프

**작성일**: 2026-02-25
**상태**: 🔄 IN-PROGRESS (설계 완료, 구현 계획 작성 + 구현 대기)
**현재 브랜치**: `develop`
**레포**: `nosorae/desttiny`

---

## 다음 세션에서 할 일

### 즉시 실행

```bash
cd /Users/yessorae/desttiny
git log --oneline -5           # HEAD 확인
npm test                        # 65 pass 확인
```

### 1단계: 설계 문서 읽기 (필수)

```bash
cat docs/plans/2026-02-25-stage4-5-onboarding-compatibility-design.md
```

이 파일에 전체 설계가 담겨 있음:
- 전체 플로우
- 컴포넌트 설계 (재사용 구조)
- 데이터 흐름 (Server Action, API 분리)
- 에러 처리
- 기존 코드 수정 목록
- 구현 순서

### 2단계: writing-plans 스킬로 구현 계획 작성

설계 문서 기반으로 `superpowers:writing-plans` 스킬을 호출하여 상세 구현 계획 작성.

### 3단계: 구현 시작 (접근 A: 화면 단위 순차)

```
1. 온보딩 (#10, #11)
   1-1. 공용 컴포넌트 (BirthDateInput, MBTISelector, GenderSelector)
   1-2. 온보딩 페이지 (3단계 스텝)
   1-3. 프로필 저장 API
   1-4. MBTI 필수화 마이그레이션 + 기존 코드 수정

2. 궁합 입력 + 티저 (#23, #22)
   2-1. idol 추가 마이그레이션 + 기존 코드 수정
   2-2. 점수 계산 함수 분리 (calculateCompatibilityScore)
   2-3. 점수 미리보기 Server Action
   2-4. 궁합 입력 페이지 (관계 선택 + 상대 입력 + 티저)
   2-5. 로딩 UX

3. 전체 결과 (#21)
   3-1. LLM 프롬프트 수정 (8~10영역, 29금/마무리 순서)
   3-2. 결과 페이지 컴포넌트
   3-3. 결과 페이지 라우트
```

---

## 참고 이슈 (GitHub)

### 4단계: 온보딩

| 이슈 | 제목 | 핵심 내용 |
|------|------|----------|
| [#10](https://github.com/nosorae/desttiny/issues/10) | 온보딩 스텝 UI (이름/성별/생년월일시) | 1~2단계 UI + 공용 컴포넌트 (BirthDateInput, GenderSelector, ProgressBar) |
| [#11](https://github.com/nosorae/desttiny/issues/11) | MBTI 선택 & 온보딩 완료 | 3단계 MBTI 필수 + 프로필 저장 API + MBTI 필수화 DB/코드 수정 |

### 5단계: 핵심 궁합 플로우

| 이슈 | 제목 | 핵심 내용 |
|------|------|----------|
| [#23](https://github.com/nosorae/desttiny/issues/23) | 관계 유형 선택 & 상대방 정보 입력 | 7개 관계 유형 + 직접 입력 + 점수 Server Action + idol API 추가 |
| [#22](https://github.com/nosorae/desttiny/issues/22) | 티저 결과 화면 & 결제 CTA | 룰베이스 점수 즉시 표시 → CTA 클릭 → 로딩 → API → /result/[id] |
| [#21](https://github.com/nosorae/desttiny/issues/21) | 궁합 결과 리포트 UI | 8~10개 영역 + 29금→마무리 순서 + LLM 프롬프트 수정 |

---

## 이 세션에서 한 것

### 1. 브레인스토밍 및 설계 (brainstorming 스킬)

SSOT 제품 스펙/디자인 스펙과 GitHub 이슈를 기반으로 4~5단계 통합 설계 진행.
사용자와 Q&A를 통해 아래 결정 확정:

| 결정 | 내용 |
|------|------|
| 4+5단계 통합 | 온보딩 + 궁합 플로우를 함께 설계/구현 |
| 온보딩 3단계 | 이름/성별 → 생년월일시 → MBTI |
| MBTI 필수 | 건너뛰기 불가, 모르면 외부 검사 필수 |
| 직접 입력만 (UI) | API는 partnerId도 지원하지만 UI에서는 사용 안 함 |
| 관계 유형 7개 | 친구/연인/전연인/썸/아이돌/동료/가족 (합집합) |
| 티저 플로우 | 점수 즉시 → 티저 → CTA 클릭 → 로딩 → API |
| 해설 8~10개 영역 | 기존 5~6개에서 확장 |
| 29금 → 마무리 순서 | 기존 마무리 → 29금에서 변경 |
| 접근 방식 A | 화면 단위 순차 구현 (온보딩 → 궁합 → 결과) |

### 2. SSOT 문서 업데이트

Notion MCP를 통해 두 문서 직접 수정:

**제품 스펙 SSOT** (https://www.notion.so/30ff3bfa920480cb997ee49f87d1231a)
- MBTI: "선택 입력" → "필수 입력 (모르면 외부 검사 후 입력)"
- Flow 1: "모름 선택" → "필수, 온보딩 완료 불가"
- 관계 유형: 5개 → 7개 (동료/가족 추가)
- 온보딩 단계: [1단계]/[2단계]/[3단계] 명시
- 해설 영역: 8~10개 + 29금→마무리 순서

**디자인 스펙 SSOT** (https://www.notion.so/30ff3bfa920480d8aa03ef3afdd3981c)
- 완료 조건: "이름/성별/생년월일 필수" → "이름/성별/생년월일/MBTI 필수"
- MBTI: "미확인 시 외부 링크" → "필수, 외부 검사 후 입력"
- IA: 온보딩 3단계 구분
- 관계 유형: 7개
- 결과 섹션: 8~10개 영역 + 29금→마무리 순서

### 3. GitHub 이슈 업데이트

5개 이슈 (#10, #11, #23, #22, #21) 본문을 스펙 변경 반영하여 상세 업데이트.
각 이슈에 설계 문서 경로, 구현 세부사항, 기존 코드 수정 목록, 완료 기준 포함.

### 4. 설계 문서 작성

`docs/plans/2026-02-25-stage4-5-onboarding-compatibility-design.md` 작성.
전체 플로우, 컴포넌트 설계, 데이터 흐름, 에러 처리, 테스트 전략, 기존 코드 수정 목록 포함.

---

## 스펙 변경으로 인한 기존 코드 수정 요약

⚠️ 다음 세션에서 구현 시 기존 코드 수정이 필요한 항목:

| # | 항목 | 영향 파일 | 처리 이슈 |
|---|------|----------|----------|
| 1 | `idol` 관계 유형 추가 | types.ts, route.ts, prompt.ts, DB migration | #23 |
| 2 | MBTI 필수화 (null 제거) | DB migration, types.ts, mbti/calculator.ts, route.ts | #11 |
| 3 | 해설 영역 5~6 → 8~10 | types.ts, prompt.ts, calculator.ts (폴백) | #21 |
| 4 | 29금/마무리 순서 변경 | types.ts, prompt.ts | #21 |
| 5 | 점수/LLM 함수 분리 | calculator.ts, 신규 Server Action | #23 |

---

## 현재 프로젝트 상태

```
브랜치: develop
테스트: 65 pass, 2 skip, 4 todo
추적 안 하는 파일: .claude/, supabase/.temp/
```

### 완료된 단계
- ✅ 0단계: 코드베이스 생성
- ✅ 1단계: 외부 서비스 설정
- ✅ 2단계: 인증 완성
- ✅ 3단계: 계산 엔진

### 현재 단계
- 🔄 4단계 + 5단계: 설계 완료, 구현 계획 작성 + 구현 대기

---

## 주요 참고 파일

| 파일 | 용도 |
|------|------|
| `docs/plans/2026-02-25-stage4-5-onboarding-compatibility-design.md` | **4~5단계 통합 설계 (이것부터 읽기)** |
| `docs/collaboration.md` | 개발 로드맵 |
| `app/api/compatibility/route.ts` | 기존 궁합 API (수정 대상) |
| `lib/compatibility/types.ts` | 궁합 타입 정의 (수정 대상) |
| `lib/compatibility/ai/prompt.ts` | LLM 프롬프트 (수정 대상) |
| `lib/compatibility/calculator.ts` | 궁합 계산기 (함수 분리 대상) |
| `lib/compatibility/mbti/calculator.ts` | MBTI 계산기 (null 제거 대상) |
| `app/onboarding/page.tsx` | 온보딩 (skeleton → 구현) |
| `app/(main)/compatibility/page.tsx` | 궁합 탭 (skeleton → 구현) |
| `app/result/[id]/page.tsx` | 결과 페이지 (미구현 → 구현) |

---

## 세션 시작 방법

```bash
cd /Users/yessorae/desttiny
git log --oneline -3                    # HEAD 확인
npm test                                 # 65 pass 확인

# 설계 문서 읽기 (필수)
cat docs/plans/2026-02-25-stage4-5-onboarding-compatibility-design.md

# 다음 단계: writing-plans 스킬로 구현 계획 작성 후 구현 시작
```
