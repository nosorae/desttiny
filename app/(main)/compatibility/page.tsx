// [탭2] 궁합 페이지 (Server Component)
// 서비스의 핵심 기능 - 두 사람의 운명적 궁합을 3체계로 분석
//
// 궁합 분석 3체계:
//   1) 사주 궁합: 일주(日柱)의 천간지지 오행 상생상극으로 점수 산출
//   2) 별자리 궁합: 서양 점성술 기반 조화도 매핑
//   3) MBTI 궁합: 성격 유형 간 상호 보완성 점수
//   → 세 가지 점수를 가중평균하여 종합 궁합 점수 생성
//
// 사용자 플로우:
//   관계 유형 선택(연인/친구/동료 등) → 상대방 정보 입력 → 티저 결과(무료)
//   → 결제 CTA → 결제 완료 시 AI(Claude) 생성 상세 리포트 공개 (/result/[id])
//
// 데이터 흐름: Server Component에서 내 프로필 조회 → 상대방 정보 입력(Client Component)
//   → API Route에서 엔진 계산 + Claude API 해설 생성
// TODO(#23): 관계 유형 선택 & 상대방 정보 입력
// TODO(#22): 티저 결과 화면 & 결제 CTA
export default function CompatibilityPage() {
  return (
    <main className="px-6 py-8">
      <h1 className="text-xl font-bold text-destiny-text">궁합</h1>
    </main>
  );
}
