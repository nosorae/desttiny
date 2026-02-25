# 4~5단계 통합 설계: 온보딩 + 핵심 궁합 플로우

**작성일**: 2026-02-25
**상태**: approved
**관련 이슈**: #10, #11, #23, #22, #21
**SSOT 동기화**: 제품 스펙 + 디자인 스펙 모두 2026-02-25 반영 완료

---

## 1. 배경 및 결정사항

### 왜 4단계 + 5단계를 함께 설계하는가

- 4단계(온보딩)의 입력 컴포넌트가 5단계(궁합 입력)에서 그대로 재사용됨
- 온보딩 → 궁합 → 결과까지 전체 플로우를 한 번에 검증 가능
- 컴포넌트 설계를 한 번에 하면 인터페이스 불일치 방지

### 대화에서 확정된 스펙 변경 (기존 SSOT 대비)

| 항목 | 기존 | 변경 | SSOT 반영 |
|------|------|------|-----------|
| 온보딩 단계 | 명시 안 됨 | 3단계 (이름/성별 → 생년월일시 → MBTI) | ✅ |
| MBTI | 선택 (null 허용) | **필수** (모르면 외부 검사 후 입력) | ✅ |
| 관계 유형 | 5개 (SSOT) / 6개 (API) | **7개 합집합** (친구/연인/전연인/썸/아이돌/동료/가족) | ✅ |
| 상대방 입력 | 둘 다 지원 | **UI는 직접 입력만** (API는 둘 다 유지) | ✅ (기존과 일치) |
| 티저 플로우 | 입력 → API → 티저 | 입력 → **점수 즉시 계산** → 티저 → CTA → API | ✅ |
| 해설 영역 | 5~6개 | **8~10개** | ✅ |
| 섹션 순서 | 마무리 → 29금 | **29금 → 마무리** | ✅ |
| 로딩 UX | 미정 | 티저 화면에서 프로그레스 바 + 메시지 | - |

---

## 2. 전체 플로우

```
[로그인] /login
  → 카카오 OAuth
  → 프로필 존재? → /(main)/profile
  → 프로필 없음? → /onboarding

[온보딩] /onboarding (단일 페이지, 상태 전환)
  → [1단계] 이름, 성별 입력
  → [2단계] 생년월일시 입력 + 사주/별자리 미리보기
  → [3단계] MBTI 필수 선택 (모르면 외부 검사 링크)
  → POST /api/profiles → DB 저장
  → /(main)/profile 리다이렉트

[궁합] /(main)/compatibility (단일 페이지, 상태 전환)
  → [select-type] 관계 유형 선택 (7개)
  → [input-partner] 상대방 정보 직접 입력
  → Server Action: calculateCompatibilityPreview()
     - 사주 계산 (서버 전용 라이브러리)
     - 3체계 점수 계산 (순수 함수)
     - 점수만 반환 (LLM 없음, DB 저장 없음)
  → [teaser] 티저 화면 (점수 부분 공개)
  → "궁합 보기" CTA 클릭
  → [loading] 프로그레스 바 + 로딩 메시지
  → POST /api/compatibility (LLM 해설 + DB 저장)
  → /result/[id] 리다이렉트

[결과] /result/[id] (Server Component)
  → DB에서 결과 조회
  → 전체 리포트 렌더링
```

---

## 3. 라우트 구조

| 경로 | 역할 | Server/Client | 이슈 |
|------|------|---------------|------|
| `/onboarding` | 3단계 온보딩 | Page: Server, Form: Client | #10, #11 |
| `/(main)/compatibility` | 궁합 입력 + 티저 | Page: Server, 입력/티저: Client | #23, #22 |
| `/result/[id]` | 전체 결과 리포트 | Server Component | #21 |
| `POST /api/profiles` | 프로필 저장 | API Route | #11 |
| `POST /api/compatibility` | LLM 해설 + DB 저장 | API Route (기존) | #18 |
| Server Action | 점수만 계산 | Server Action | #23 |

---

## 4. 컴포넌트 설계

### 재사용 컴포넌트 (온보딩 + 궁합 입력 공용)

```
components/ui/
├── BirthDateInput.tsx      생년월일시 입력
│   Props: { value, onChange, showPreview? }
│   - 생년(4자리) / 월(1-12) / 일(1-31) 입력
│   - 시간 입력 (선택, "시 모름" 체크박스)
│   - showPreview=true 시 사주/별자리 미리보기 표시
│
├── MBTISelector.tsx        MBTI 16유형 그리드
│   Props: { value, onChange, required }
│   - 4x4 그리드
│   - 유형명 + 별명 (예: INTJ - 전략가)
│   - "MBTI를 모르겠어요" → 외부 검사 링크 안내
│   - required=true 시 건너뛰기 불가
│
├── GenderSelector.tsx      성별 선택
│   Props: { value, onChange }
│   - 남 / 여 버튼
│
└── ProgressBar.tsx         진행률 바
    Props: { current, total } 또는 { progress, message }
    - 온보딩: 단계 표시 (1/3, 2/3, 3/3)
    - 궁합 로딩: 프로그레스 애니메이션 + 메시지
```

### 궁합 전용 컴포넌트

```
components/compatibility/
├── RelationshipTypeSelector.tsx   관계 유형 7개 선택
│   Props: { value, onChange }
│   - 카드/버튼 형태로 7개 표시
│   - 선택 시 하이라이트
│
├── PartnerInputForm.tsx           상대방 정보 입력 폼
│   Props: { onSubmit }
│   - GenderSelector + BirthDateInput + MBTISelector 조합
│   - 이름 텍스트 필드 추가
│
├── TeaserResult.tsx               티저 결과 화면
│   Props: { scores, onViewFull }
│   - 종합 점수 (부분 공개)
│   - 세부 점수 (흐림 처리)
│   - "궁합 보기" CTA 버튼
│
└── LoadingOverlay.tsx             로딩 오버레이
    Props: { progress, messages[] }
    - 프로그레스 바
    - 메시지 순환 ("별들의 기운을 읽는 중...")
```

### 결과 페이지 컴포넌트

```
components/result/
├── SummaryHeader.tsx        두 사람 요약 카드
├── ScoreDisplay.tsx         종합 점수 (큰 숫자 + 색상 테마)
├── AnalysisSection.tsx      후킹 제목 + 해설 (~500자)
├── IntimacySection.tsx      29금 친밀도 (연인계만)
├── FinalSummary.tsx         최종 마무리
└── ShareButton.tsx          카드 공유 CTA (placeholder)
```

---

## 5. 데이터 흐름 상세

### 5.1 온보딩 프로필 저장

```typescript
// POST /api/profiles 요청
{
  name: string,           // 필수, 1~20자
  gender: 'male' | 'female',  // 필수
  birthDate: 'YYYY-MM-DD',    // 필수
  birthTime: 'HH:MM' | null,  // 선택 (시 모름)
  mbti: MbtiType,              // 필수 (16가지 중 하나)
}

// 서버 처리
1. 인증 확인 (Supabase Auth)
2. 입력값 검증
3. getSajuProfile(birthDate, birthHour) → dayPillar
4. getZodiacSign(month, day) → zodiacSign
5. profiles 테이블 upsert:
   { id: auth.uid(), nickname: name, gender, birth_date, birth_time,
     day_pillar, zodiac_sign, mbti }
6. 200 OK
```

### 5.2 점수 미리보기 (Server Action)

```typescript
// Server Action: calculateCompatibilityPreview
// 입력: 관계 유형 + 상대방 정보 (직접 입력)
// 출력: 3체계 점수만 (LLM 없음)

async function calculateCompatibilityPreview(input: {
  relationshipType: RelationshipType,
  partner: { name, birthDate, birthTime?, mbti, gender? },
}): Promise<{
  totalScore: number,
  breakdown: { saju: number, zodiac: number, mbti: number },
}> {
  // 1. 로그인 사용자 프로필 조회
  // 2. 상대방 사주/별자리 계산 (서버)
  // 3. 3체계 점수 계산 (순수 함수)
  //    - calculateSajuCompatibility()
  //    - calculateZodiacCompatibility()
  //    - calculateMbtiCompatibility()
  // 4. 가중평균: 사주*0.4 + 별자리*0.3 + MBTI*0.3
  // 5. return { totalScore, breakdown }
}
```

### 5.3 LLM 해설 생성 (기존 API)

```typescript
// POST /api/compatibility (기존 엔드포인트, 변경 최소화)
// 점수 재계산 + LLM 호출 + DB 저장 + 결과 반환
// 기존 플로우 그대로 유지, 변경점:
//   - idol 관계 유형 추가
//   - 영역 8~10개
//   - 29금/마무리 순서 변경
```

---

## 6. 기존 코드 수정 목록

### 6.1 관계 유형 idol 추가 (#23에서 처리)

| 파일 | 수정 내용 |
|------|----------|
| `lib/compatibility/types.ts` | RelationshipType 유니언에 `'idol'` 추가 |
| `app/api/compatibility/route.ts` | VALID_RELATIONSHIP_TYPES 배열에 `'idol'` 추가 |
| `lib/compatibility/ai/prompt.ts` | RELATIONSHIP_KO에 `idol: '아이돌'` 추가 |
| DB 마이그레이션 (신규) | CHECK constraint에 `'idol'` 추가 |
| 테스트 파일들 | idol 케이스 추가 |

### 6.2 MBTI 필수화 (#11에서 처리)

| 파일 | 수정 내용 |
|------|----------|
| DB 마이그레이션 (신규) | profiles.mbti NOT NULL 추가 |
| `lib/compatibility/types.ts` | PersonCompatibilityInput.mbti → `MbtiType` (null 제거) |
| `lib/compatibility/mbti/calculator.ts` | 함수 시그니처 null 제거, 기본값 60점 분기 제거 |
| `app/api/compatibility/route.ts` | MBTI null 허용 로직 제거, 필수 검증 추가 |
| 테스트 파일들 | null MBTI 테스트 수정/제거 |

### 6.3 해설 영역 확장 + 순서 변경 (#21에서 처리)

| 파일 | 수정 내용 |
|------|----------|
| `lib/compatibility/types.ts` | CompatibilitySection.area 유니언 확장 (8~10개) |
| `lib/compatibility/types.ts` | CompatibilityAnalysis 필드 순서: intimacyScores → finalSummary |
| `lib/compatibility/ai/prompt.ts` | areas 배열 확장, JSON 출력 순서 변경 |
| `lib/compatibility/calculator.ts` | getFallbackAnalysis 영역 확장 |
| 테스트 파일들 | mock 데이터 영역 수/순서 수정 |

### 6.4 점수/LLM 분리 (#23에서 처리)

| 파일 | 수정 내용 |
|------|----------|
| `lib/compatibility/calculator.ts` | calculateCompatibilityScore() 함수 추출 (점수만 반환) |
| 신규 Server Action | calculateCompatibilityPreview() |

---

## 7. 에러 처리

| 시점 | 에러 | 처리 |
|------|------|------|
| 온보딩 저장 | 네트워크/서버 에러 | 토스트 "저장에 실패했어요. 다시 시도해주세요" + 재시도 |
| 온보딩 저장 | 중복 프로필 | upsert로 자동 처리 |
| 점수 계산 | 사주 계산 실패 | 사주 점수 제외, 별자리+MBTI만으로 표시 + 안내 |
| 점수 계산 | 생년월일 파싱 실패 | 입력 폼으로 돌려보냄 + "생년월일을 다시 확인해주세요" |
| LLM API | 타임아웃/실패 | 폴백 해설 사용 (getFallbackAnalysis) + 안내 |
| LLM API | 무료 슬롯 소진 (402) | 5단계에서는 해당 없음. 6단계에서 결제 분기 |
| 결과 페이지 | 존재하지 않는 resultId | 404 페이지 |
| 결과 페이지 | 다른 사용자 접근 | RLS 차단 → "결과를 찾을 수 없어요" |

---

## 8. 테스트 전략

### 기존 테스트 수정

| 파일 | 수정 사유 |
|------|----------|
| `lib/compatibility/mbti/__tests__/mbti-compatibility.test.ts` | MBTI null 테스트 제거/수정 |
| `lib/compatibility/__tests__/calculator.test.ts` | null MBTI 수정, 폴백 영역 수 확장 |
| `lib/compatibility/ai/__tests__/prompt.test.ts` | idol 추가, 영역 수 검증 수정 |

### 신규 테스트

| 대상 | 내용 |
|------|------|
| calculateCompatibilityScore() | 점수만 반환 함수 단위 테스트 |
| POST /api/profiles | 필수값 검증 (MBTI 빠지면 400) |
| 관계 유형 검증 | idol 포함 7개 유효성 |

### E2E (수동)
구현 완료 후 브라우저에서 온보딩 → 궁합 → 결과 전체 플로우 확인

---

## 9. 구현 순서 (접근 A: 화면 단위 순차)

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
