// 궁합 결과 상세 페이지 (Server Component)
// 동적 라우트: /result/{궁합결과_id}
// TODO: AI 생성 궁합 리포트 표시 - 이슈 #N에서 작업 예정
type Props = {
  params: Promise<{ id: string }>;
};

export default async function ResultPage({ params }: Props) {
  const { id } = await params;

  return (
    <main className="px-6 py-8">
      <h1 className="text-xl font-bold text-destiny-text">궁합 결과</h1>
      <p className="text-destiny-text-muted text-sm mt-2">ID: {id}</p>
    </main>
  );
}
