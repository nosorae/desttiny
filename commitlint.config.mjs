// commitlint 설정 - 커밋 메시지 규칙 강제
// 허용 타입: feat, fix, docs, style, refactor, test, chore
// 예: "feat: 사주 계산 엔진 구현 (#13)"
// 참고: https://commitlint.js.org/
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 한국어 커밋 메시지 + 고유명사(ESLint, TypeScript 등) 허용
    'subject-case': [0],
  },
}
