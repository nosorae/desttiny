# Claude Code와의 협업 가이드

> **대상 독자**: 안드로이드 앱 개발 경험이 있지만 웹 개발이 처음인 개발자

---

## 1. 핵심 철학

### "Claude Code는 뛰어난 시니어 개발자"처럼 활용하세요

- **내가 할 것**: 무엇을 만들지 결정, PR 리뷰, 비즈니스 로직 판단
- **Claude Code가 할 것**: 코드 작성, 버그 수정, 기술적 구현
- **함께 할 것**: 아키텍처 결정, 복잡한 설계 논의

### "이슈 하나 = 작업 하나 = PR 하나"

```
이슈 작성 → Claude Code에게 전달 → 코드 작성 → PR 생성 → 리뷰 → Merge
```

---

## 2. Android 개발 경험으로 이해하는 웹 개발

### 핵심 개념 매핑

| 안드로이드 | 웹 (이 프로젝트) | 설명 |
|-----------|----------------|------|
| Activity/Fragment | `page.tsx` 파일 | 화면 하나 |
| XML Layout | JSX (TSX) | UI를 코드로 작성 |
| ViewModel | Server Component (data fetching 부분) | 데이터 가져오기 |
| LiveData/StateFlow | `useState`, `useReducer` | 상태 관리 |
| RecyclerView + Adapter | `.map(() => <Item />)` | 리스트 렌더링 |
| Room Database | Supabase (PostgreSQL) | 로컬 → 원격 DB |
| Retrofit | Supabase 클라이언트 / fetch | 네트워크 통신 |
| SharedPreferences | Supabase 세션 (쿠키) | 로그인 상태 저장 |
| Intent (화면 이동) | `router.push('/path')` | 라우팅 |
| Bundle (데이터 전달) | URL params, React state | 화면 간 데이터 |
| `build.gradle` | `package.json` | 의존성 관리 |
| `local.properties` | `.env.local` | 환경 변수 (git 제외) |
| Gradle Build | `npm run build` | 빌드 |
| 에뮬레이터 실행 | `npm run dev` → 브라우저 | 개발 서버 실행 |
| APK 배포 | `git push` → Vercel 자동 배포 | 배포 |

### 가장 중요한 Next.js 개념: Server vs Client Component

```
Server Component (기본값)          Client Component ('use client' 있음)
─────────────────────────          ────────────────────────────────
- 서버에서 실행                    - 브라우저에서 실행
- DB 직접 접근 가능               - useState, useEffect 사용 가능
- API 키 노출 안 됨               - 버튼 클릭 등 이벤트 처리 가능
- Android Repository와 유사       - Android Fragment/Activity와 유사
- 용량이 번들에 포함 안 됨         - 번들에 포함됨 (최소화 필요)
```

**규칙**: `'use client'`는 꼭 필요할 때만 붙인다.

---

## 3. 로컬 개발 환경

### 처음 시작할 때

```bash
# 1. 의존성 설치 (Android의 gradle sync와 동일)
npm install

# 2. 환경 변수 파일 생성
cp .env.example .env.local
# .env.local 파일을 열어서 값 채우기

# 3. 개발 서버 실행 (Android의 Run 버튼과 동일)
npm run dev

# 4. 브라우저에서 확인
# http://localhost:3000 열기
```

### 화면 확인 방법 (모바일 뷰)

```
브라우저에서 F12 (개발자 도구 열기)
→ 상단의 모바일 아이콘 클릭 (📱)
→ 기기 선택: iPhone SE (375×667) 권장
→ 새로고침
```

> Android Studio의 에뮬레이터처럼 모바일 화면을 시뮬레이션합니다.

### 자주 쓰는 명령어

```bash
npm run dev        # 개발 서버 실행 (localhost:3000)
npm run build      # 배포 전 빌드 테스트 (에러 없는지 확인)
npm run lint       # 코드 스타일 검사
npm test           # 단위 테스트 실행
git status         # 변경된 파일 확인
git diff           # 변경 내용 확인
```

---

## 4. 개발 워크플로우

### Step 1: 이슈 선택

GitHub Issues에서 작업할 이슈를 선택합니다.

- **ai-only** 라벨: Claude Code에게 바로 맡길 수 있음
- **human-only** 라벨: 본인이 직접 해야 하는 외부 서비스 설정
- **collaborative** 라벨: 일부는 본인이, 일부는 Claude Code가 처리

### Step 2: Claude Code에게 이슈 전달

Claude Code에게 아래와 같이 요청하세요:

```
"이슈 #3 작업해줘"

또는 더 구체적으로:

"이슈 #13 (사주 일주 계산 로직)을 TDD로 구현해줘.
 테스트 케이스를 먼저 작성하고 구현해줘."
```

### Step 3: Claude Code의 작업 과정 이해

Claude Code가 작업 중에는:
1. 어떤 파일을 왜 만드는지 설명을 읽어보세요
2. 모르는 개념이 나오면 바로 물어보세요: `"이 코드에서 useCallback이 왜 필요해?"`
3. 구현 방향이 마음에 안 들면 중간에 조정하세요

### Step 4: 로컬에서 동작 확인

```bash
npm run dev
# 브라우저에서 해당 기능 직접 테스트
```

Android Emulator에서 기능 테스트하듯이 브라우저에서 직접 클릭하며 확인하세요.

### Step 5: PR 리뷰

Claude Code가 PR을 생성하면 GitHub에서 아래를 확인하세요:

**Files changed 탭에서 확인할 것**:
- 변경된 파일이 예상한 범위인지 (너무 많은 파일이 바뀌진 않는지)
- 주석이 충분히 작성되어 있는지
- 이해 안 가는 코드는 코멘트로 질문 남기기

**리뷰 코멘트 남기는 방법**:
```
줄 번호 옆 [+] 버튼 클릭 → 코멘트 작성 → "Start a review" 클릭
→ 모든 코멘트 작성 후 "Submit review" 클릭
  - "Comment": 단순 질문/의견
  - "Request changes": 수정 요청
  - "Approve": 승인
```

### Step 6: 수정 요청 후 재작업

리뷰 코멘트 작성 후 Claude Code에게:

```
"PR #[번호]의 리뷰 코멘트 확인하고 수정해줘"
```

---

## 5. 코드 구조 이해 가이드

### 파일을 찾는 방법

```
어떤 기능의 코드를 찾고 싶다면:

1. app/ 폴더: 화면(페이지) 관련
   - app/(auth)/login/page.tsx → 로그인 화면
   - app/(main)/profile/page.tsx → 프로필 탭

2. components/ 폴더: 재사용 컴포넌트
   - components/ui/ → 버튼, 인풋 등 기본 UI

3. lib/ 폴더: 비즈니스 로직
   - lib/saju/ → 사주 계산
   - lib/zodiac/ → 별자리 계산
   - lib/supabase/ → DB 접근

4. app/api/ 폴더: 서버 API
   - app/api/payment/ → 결제 관련 API
```

### 코드를 직접 수정하고 싶을 때

Android에서 XML을 수정하듯이 JSX/TSX를 수정할 수 있습니다:

```tsx
// 예: 버튼 색상 변경
// 변경 전
<button className="bg-purple-600 text-white px-4 py-2 rounded">
  궁합 분석하기
</button>

// 변경 후 (bg-purple-600 → bg-pink-500)
<button className="bg-pink-500 text-white px-4 py-2 rounded">
  궁합 분석하기
</button>
```

Tailwind CSS 클래스는 [tailwindcss.com/docs](https://tailwindcss.com/docs)에서 검색하세요.

---

## 6. 무엇을 직접 공부하면 좋을까?

이 프로젝트를 함께 진행하면서 자연스럽게 이해하게 될 개념들:

### 빠르게 파악하면 도움이 되는 것 (1-2시간)

1. **Tailwind CSS 기초**: [tailwindcss.com/docs](https://tailwindcss.com/docs)
   - `flex`, `grid`, `p-4`, `text-xl`, `bg-purple-600` 같은 클래스 의미
   - Android의 dp/sp를 `rem`/`px`로 대응

2. **TypeScript 기초**: 이미 Kotlin을 알면 90%는 이해 가능
   - `interface`/`type` → 데이터 클래스
   - `?` 옵셔널 → `?` 엘비스 연산자와 유사

### 나중에 이해하면 좋은 것 (점진적으로)

3. **React 핵심**: `useState`, `useEffect`, Server Component 개념
4. **Next.js App Router**: 파일 기반 라우팅, layout, page 구조
5. **SQL 기초**: Supabase 쿼리 이해를 위해

---

## 7. 트러블슈팅

### "빌드 에러가 났어요"
```bash
npm run build
# 에러 메시지를 Claude Code에게 그대로 붙여넣기
# "npm run build 에러 났어. [에러 메시지] 고쳐줘"
```

### "화면이 이상하게 보여요"
```
브라우저에서 F12 → Console 탭 확인
빨간 에러 메시지를 Claude Code에게 전달
```

### "DB 데이터가 이상해요"
```
Supabase 대시보드 → Table Editor → 해당 테이블 직접 확인
또는 Supabase 대시보드 → Logs → 에러 로그 확인
```

---

## 8. 앞으로의 개발 순서 권장사항

MVP 완성을 위한 권장 순서:

```
1단계: 인프라 설정 (human-only 먼저)
  #4 Supabase 설정 → #7 카카오 설정 → #3 Next.js 초기화 →
  #6 코드 품질 도구 → #5 Vercel 배포

2단계: 인증 완성
  #9 인증 미들웨어

3단계: 핵심 엔진 (ai-only, 병렬 가능)
  #13 사주 계산 + #15 별자리 계산 →
  #16 사주 궁합 + #17 별자리 MBTI 궁합 + #18 통합 점수

4단계: 온보딩 UI
  #10 온보딩 스텝 UI → #11 MBTI 선택

5단계: 궁합 플로우
  #23 상대방 입력 → #22 티저 결과 → #25 결제 → #21 결과 리포트

6단계: 기타 화면
  #31 프로필 탭 → #28 결제 이력 탭 → #34 랜딩 페이지
```

---

> 이 문서는 프로젝트 진행에 따라 업데이트됩니다.
> 추가로 궁금한 점이 생기면 이슈나 PR 코멘트로 남겨주세요!
