# desttiny 계산 엔진 HANDOFF

**작성일**: 2026-02-25
**완료 단계**: 3단계 계산 엔진 설계 및 계획 완료 → 다음 세션에서 구현 시작
**현재 브랜치**: `develop`

---

## 다음 세션에서 할 일

### 즉시 시작 가능

구현 계획이 완성되어 있습니다. 이 파일을 읽은 후 바로 구현을 시작하세요:

```
docs/plans/2026-02-25-calculation-engine-impl.md
```

**Task 0부터 순서대로 진행**하면 됩니다.

> 추천 스킬: `superpowers:executing-plans` 또는 `superpowers:subagent-driven-development`

---

## 이번 세션에서 결정된 내용

### 핵심 라이브러리 선택 (승인됨)

| 이슈 | 라이브러리 | 이유 |
|------|-----------|------|
| #13 사주 4주 | `@gracefullight/saju` v1.3.0 (MIT) | JDN 기반 천문학적 정밀도, 180+ 테스트 |
| #15 별자리 | `zodiac-signs` v1.5.0 (MIT) | 4원소 포함, 의존성 없음 |
| #16 사주 궁합 | 자체 구현 (오행 원리) | 라이브러리 없음 |
| #17 별자리 궁합 | `zodiac-signs` element 활용 | 4원소 정보 재활용 |
| #17 MBTI 궁합 | 자체 구현 (Jung 인지기능 기반) | 단일 공신력 라이브러리 없음 |

### 이슈 #13 버그 발견 (라이브러리로 해결됨)

이슈 원본 코드의 기준일(갑술, 인덱스 10)과 테스트케이스(1990.1.1=경오)가 불일치했음.
→ `@gracefullight/saju` 라이브러리 사용으로 문제 자체가 사라짐.

### 공신력 원칙

- 모든 이슈 완료 후 **이슈 댓글**에 사용 라이브러리/출처 링크 기록
- MBTI 궁합은 "커뮤니티 컨센서스, 학술 근거 없음" 명시
- 진행 중 추가된 작업(예: 테스트 프레임워크 설치)도 이슈 댓글에 기록

---

## 구현 계획 요약

**파일**: `docs/plans/2026-02-25-calculation-engine-impl.md`

```
Task 0: vitest 설치 + @gracefullight/saju + zodiac-signs 설치
Task 1: lib/saju/types.ts 생성
Task 2: lib/saju/index.ts + 테스트 (getSajuProfile)
Task 3: 타입 공개 export
Task 4: 이슈 #13 댓글 작성
Task 5: lib/zodiac/types.ts 생성
Task 6: lib/zodiac/calculator.ts + 테스트 (getZodiacSign)
Task 7: 이슈 #15 댓글 작성
Task 8: lib/compatibility/types.ts 생성
Task 9: lib/compatibility/saju/ + 테스트 (calculateSajuCompatibility)
Task 10: 이슈 #16 댓글 작성
Task 11: lib/compatibility/zodiac/ + 테스트 (calculateZodiacCompatibility)
Task 12: lib/compatibility/mbti/ + 테스트 (calculateMbtiCompatibility)
Task 13: 전체 테스트 + PR 생성 + 이슈 #17 댓글
```

---

## 현재 상태

- **브랜치**: `develop` (main과 동기화 상태)
- **미설치 패키지**: `@gracefullight/saju`, `luxon`, `zodiac-signs` (Task 0에서 설치)
- **테스트 프레임워크**: 미설정 (Task 0에서 vitest 설치)
- `lib/saju/`, `lib/zodiac/`, `lib/compatibility/` 폴더는 `.gitkeep`만 있음

---

## 참고 링크

- [구현 계획](../docs/plans/2026-02-25-calculation-engine-impl.md)
- [설계 문서](../docs/plans/2026-02-25-calculation-engine-design.md)
- [@gracefullight/saju GitHub](https://github.com/gracefullight/pkgs/tree/main/packages/saju)
- [@gracefullight/saju SPEC](https://github.com/gracefullight/pkgs/blob/main/packages/saju/SPEC.md)
- [zodiac-signs GitHub](https://github.com/helmasaur/zodiac-signs)
- [GitHub 이슈 #13](https://github.com/nosorae/desttiny/issues/13)
- [GitHub 이슈 #15](https://github.com/nosorae/desttiny/issues/15)
- [GitHub 이슈 #16](https://github.com/nosorae/desttiny/issues/16)
- [GitHub 이슈 #17](https://github.com/nosorae/desttiny/issues/17)
