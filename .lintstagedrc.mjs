// lint-staged 설정
// package.json의 lint-staged 섹션 대신 이 파일을 사용 (함수형 지원)
//
// 마이그레이션 SQL 파일은 filenames를 무시하고 db:types를 실행해야 하므로
// 함수형으로 선언 → lint-staged가 파일명을 자동으로 붙이지 않음
// 참고: https://github.com/lint-staged/lint-staged#example-use-a-function-to-create-a-config-for-each-file

const config = {
  '*.{ts,tsx,js,jsx,mjs}': ['eslint --fix', 'prettier --write'],
  '*.{json,css,md}': ['prettier --write'],

  // 마이그레이션 파일 커밋 시 DB 기준으로 TypeScript 타입 자동 재생성
  // 주의: 마이그레이션을 Supabase에 먼저 적용한 후 커밋해야 최신 타입이 반영됨
  'supabase/migrations/**/*.sql': () => [
    'npm run db:types',
    'git add types/database.ts',
  ],
}

export default config
