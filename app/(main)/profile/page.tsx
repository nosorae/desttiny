// [탭1] 프로필 페이지 (Server Component)
// 로그인한 사용자의 운명 프로필을 한눈에 보여주는 메인 탭
//
// 표시 정보:
//   - 기본 정보: 이름, 생년월일
//   - 사주 정보: 일주(천간+지지), 오행 속성
//   - 별자리 정보: 서양 별자리, 특성 요약
//   - MBTI: 유형 및 성향
//   → 3체계 통합 프로필 카드로 시각화
//
// 데이터 흐름: Server Component에서 Supabase profiles 테이블 직접 조회 (API 불필요)
//   Android에서 ViewModel이 Repository를 통해 DB 조회하는 것과 달리,
//   Server Component는 서버에서 실행되므로 DB에 직접 접근 가능
// TODO(#29): 프로필 탭 UI 구현
// TODO(#31): 프로필 카드 컴포넌트 & 3체계 요약 UI
import Link from 'next/link'

export default function ProfilePage() {
  return (
    <main className="px-6 py-8 space-y-6">
      <h1 className="text-xl font-bold text-destiny-text">프로필</h1>
      <p className="text-sm text-destiny-text-muted">
        프로필 상세 화면은 준비 중이에요.
      </p>
      <Link
        href="/compatibility"
        className="inline-block rounded-xl bg-destiny-primary px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        궁합 보러가기
      </Link>
    </main>
  )
}
