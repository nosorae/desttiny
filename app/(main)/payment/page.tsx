// [탭3] 결제/이력 페이지 (Server Component)
// 사용자의 궁합 결제 내역 조회 및 관리 페이지
//
// 표시 내용:
//   - 구매한 AI 궁합 리포트 목록 (결제일, 상대방, 종합 점수)
//   - 각 리포트 클릭 시 /result/[id]로 이동
//   - 일일 선착순 무료 혜택 잔여 횟수 표시
//
// 결제 수단: PortOne V2 (카카오페이/토스페이먼츠) - 건당 결제 모델
//   결제 대상: "AI 궁합 분석 리포트" (티저 결과 → 전체 결과 잠금 해제)
//
// 데이터 흐름: Server Component에서 Supabase payments 테이블 직접 조회
//   → 결제 내역 리스트 렌더링 (Android RecyclerView의 .map() 버전)
// TODO(#25): PortOne 결제 연동
// TODO(#28): 결제/이력 탭 UI 구현
export default function PaymentPage() {
  return (
    <main className="px-6 py-8">
      <h1 className="text-xl font-bold text-destiny-text">결제 이력</h1>
    </main>
  );
}
