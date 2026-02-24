// 궁합 결과 상세 페이지 (Server Component)
// 동적 라우트: /result/{궁합결과_id}
//
// 표시 내용:
//   - 종합 궁합 점수 (3체계 가중평균)
//   - 영역별 점수: 사주 궁합 / 별자리 궁합 / MBTI 궁합
//   - Claude API가 생성한 자연어 해설 (두 사람의 관계 분석 리포트)
//
// 접근 조건: 결제 완료된 리포트만 전체 내용 열람 가능
//   미결제 시 /result/[id]에 접근해도 티저(점수만)만 표시
//
// 데이터 흐름: Server Component에서 Supabase compatibility_results 테이블 조회
//   → 결제 여부 확인 → 전체 리포트 or 티저 분기 렌더링
//
// Next.js 15+ 변경: params가 Promise 타입으로 변경됨
// 이유: 동적 라우트의 매개변수를 비동기로 처리하여 서버 렌더링 최적화
// (Android의 Intent extras를 suspend 함수로 받는 것과 유사한 개념)
// 참고: https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes
// TODO(#21): 궁합 결과 리포트 UI 구현
type Props = {
  params: Promise<{ id: string }>
}

export default async function ResultPage({ params }: Props) {
  const { id } = await params

  return (
    <main className="px-6 py-8">
      <h1 className="text-xl font-bold text-destiny-text">궁합 결과</h1>
      <p className="text-destiny-text-muted text-sm mt-2">ID: {id}</p>
    </main>
  )
}
