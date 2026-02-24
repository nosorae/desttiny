#!/usr/bin/env node

/**
 * 변경된 파일 경로를 Next.js App Router URL로 변환하는 스크립트
 *
 * GitHub Actions에서 git diff 결과를 입력받아
 * 실제 접근 가능한 페이지 URL 목록을 출력합니다.
 *
 * 사용법: node scripts/files-to-routes.js "app/page.tsx app/(auth)/login/page.tsx"
 * 환경변수: DEPLOYMENT_URL - 배포 도메인 (기본: https://desttiny.vercel.app)
 *
 * 매핑 규칙 (Next.js App Router):
 *  - app/page.tsx → /
 *  - app/about/page.tsx → /about
 *  - app/(auth)/login/page.tsx → /login  (Route Group 괄호 제거)
 *  - app/result/[id]/page.tsx → /result/[id]  (동적 라우트 유지)
 *  - app/api/** → 제외 (API 라우트)
 *  - app/_private/** → 제외 (Private 폴더)
 *  - layout.tsx, loading.tsx 등 → 제외 (페이지가 아닌 파일)
 *  - components/, lib/ 등 → "내부 로직 변경"으로 분류
 */

const fs = require('fs')
const path = require('path')

const baseUrl = process.env.DEPLOYMENT_URL || 'https://desttiny.vercel.app'

/**
 * app/ 내의 page 파일 경로를 URL 라우트로 변환
 * @param {string} filePath - 예: "app/(auth)/login/page.tsx"
 * @returns {string|null} URL 라우트 또는 null (변환 불가 시)
 */
function fileToRoute(filePath) {
  // app/ 디렉토리 내의 파일만 처리
  if (!filePath.startsWith('app/')) {
    return null
  }

  // API 라우트 제외
  if (filePath.startsWith('app/api/')) {
    return null
  }

  // Private 폴더 제외 (_로 시작하는 세그먼트)
  if (filePath.split('/').some((seg) => seg.startsWith('_'))) {
    return null
  }

  // page.tsx 또는 page.jsx만 라우트로 변환 (layout, loading 등은 제외)
  const fileName = path.basename(filePath)
  if (!/^page\.(tsx?|jsx?)$/.test(fileName)) {
    return null
  }

  // app/ 접두사와 파일명 제거 → 디렉토리 경로만 추출
  let route = path.dirname(filePath).replace(/^app\/?/, '')

  // Route Group 괄호 제거: (auth) → ""로 제거, (main) → ""로 제거
  route = route
    .split('/')
    .filter((seg) => !seg.match(/^\(.*\)$/))
    .join('/')

  // 루트 경로 처리
  return route === '' ? '/' : `/${route}`
}

// ===== 메인 실행 =====

const input = process.argv[2] || ''
const files = input
  .split(/[\s]+/)
  .map((f) => f.trim())
  .filter(Boolean)

if (files.length === 0) {
  console.log('변경된 파일이 없습니다.')
  process.exit(0)
}

// 페이지 파일과 비페이지 파일 분류
const pageRoutes = []
const nonPageFiles = []

for (const file of files) {
  const route = fileToRoute(file)
  if (route !== null) {
    pageRoutes.push(route)
  } else if (file.startsWith('app/')) {
    // app/ 내의 비페이지 파일 (layout, loading, api 등)
    nonPageFiles.push(file)
  } else {
    // app/ 외부 파일 (components/, lib/ 등)
    nonPageFiles.push(file)
  }
}

// 중복 제거 및 정렬
const uniqueRoutes = [...new Set(pageRoutes)].sort()

// Slack 메시지용 출력 생성
const lines = []

if (uniqueRoutes.length > 0) {
  for (const route of uniqueRoutes) {
    lines.push(`• <${baseUrl}${route}|${route}>`)
  }
}

if (nonPageFiles.length > 0 && uniqueRoutes.length === 0) {
  lines.push('• 내부 로직 변경 (UI 변경 없음)')
} else if (nonPageFiles.length > 0) {
  lines.push(`• +${nonPageFiles.length}개 내부 파일 변경`)
}

const output = lines.join('\n')

// stdout으로 출력 (GitHub Actions에서 캡처)
console.log(output)

// GitHub Actions output 설정
if (process.env.GITHUB_OUTPUT) {
  // 멀티라인 출력을 위한 delimiter 방식
  const delimiter = `EOF_${Date.now()}`
  fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    `routes<<${delimiter}\n${output}\n${delimiter}\n`
  )
}
