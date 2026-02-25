// 최종 마무리 섹션 (Server Component)
// 전체 관계를 종합적으로 정리하는 마무리 카드
// 그라데이션 배경으로 결과 페이지의 마무리를 시각적으로 강조

interface FinalSummaryProps {
  content: string
}

export default function FinalSummary({ content }: FinalSummaryProps) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-destiny-primary/10 to-destiny-accent/5 border border-destiny-primary/20 p-6 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">🌟</span>
        <h3 className="text-base font-bold text-destiny-text">마무리</h3>
      </div>
      <p className="text-sm text-destiny-text-muted leading-relaxed whitespace-pre-wrap">
        {content}
      </p>
    </div>
  )
}
