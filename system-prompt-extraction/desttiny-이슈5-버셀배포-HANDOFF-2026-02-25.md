# desttiny 이슈 #5 - Vercel 배포 파이프라인 설정 완료 핸드오프

**작성일**: 2026-02-25
**완료 이슈**: #5 [SUB][EPIC-1] Vercel 배포 파이프라인 설정
**상태**: ✅ 완료 및 이슈 Close

---

## 완료된 작업 요약

### 1. Vercel 배포
- **프로덕션 URL**: https://desttiny.vercel.app
- main 브랜치 push 시 자동 배포
- Vercel Deployment Protection → Disabled (외부 접속 허용)

### 2. Slack 배포 알림 자동화
- main 브랜치 머지 시 Slack 자동 알림 발송
- **파일**: `.github/workflows/slack-deploy-notify.yml`, `scripts/files-to-routes.js`
- curl 직접 호출 방식 (slackapi action 대신)
- **GitHub Secret**: `SLACK_WEBHOOK_URL` 등록 완료

### 3. Vercel 환경변수 (현재 등록된 것)
| 변수 | 비고 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ 서버 전용 |
| `ANTHROPIC_API_KEY` | ✅ 서버 전용, 아직 코드에서 미사용 |
| `NEXT_PUBLIC_SITE_URL` | ✅ `https://desttiny.vercel.app` |

> ⚠️ PORTONE 관련 키들은 결제 기능 구현 이슈 작업 시 추가 필요

### 4. 카카오 / Supabase 도메인 설정
- 카카오 Developers → 플랫폼 키 → Web 사이트 도메인: `https://desttiny.vercel.app` 추가
- 카카오 앱 대표 도메인: `https://desttiny.vercel.app` 변경
- Supabase → Authentication → URL Configuration
  - Site URL: `https://desttiny.vercel.app`
  - Redirect URLs: `https://desttiny.vercel.app/auth/callback` 추가

---

## 트러블슈팅 기록 (이슈 댓글에도 기록됨)

1. **Vercel Root Directory 오류** → 빈 칸(기본값) 유지해야 함
2. **main 브랜치에 코드 없음** → develop → main PR #57 머지로 해결
3. **Deployment Protection** → Settings에서 Disabled로 변경
4. **Slack Webhook URL 만료** → 새로 발급 후 GitHub Secrets 교체
5. **slackapi/slack-github-action@v2.1.0 에러 묵살** → curl로 교체 (#63)

---

## 현재 브랜치 상태

- **main**: 프로덕션 (Vercel 자동 배포)
- **develop**: 개발 기준 브랜치 (main과 동기화 완료)
- 불필요한 구 브랜치들 정리 필요 (feat/issue-5-vercel-slack-deploy 등)

---

## 다음 작업 후보

열린 이슈 기준 우선순위:
- **p0 디자인 이슈**: #44 랜딩 페이지, #45 관계 대시보드 등 (ai-only)
- **p1 React Best Practices**: #46 EPIC, #47~#49 서브태스크 (ai-only)

> 다음 세션 시작 시 `gh issue list --state open` 으로 현황 재확인 권장
