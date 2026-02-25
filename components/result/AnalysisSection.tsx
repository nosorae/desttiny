// 영역별 해설 섹션 (Server Component)
// 8개 분석 영역(소통, 감정, 가치관 등)을 카드 형태로 표시
// 각 영역마다 이모지 + 후킹 제목 + 상세 해설 본문

interface AnalysisSectionProps {
  title: string
  content: string
  area: string
}

const AREA_EMOJI: Record<string, string> = {
  communication: '💬',
  emotion: '💗',
  values: '🧭',
  lifestyle: '🏡',
  conflict: '⚡',
  growth: '🌱',
  trust: '🛡️',
  fun: '🎭',
  intimacy: '🔥',
}

export default function AnalysisSection({
  title,
  content,
  area,
}: AnalysisSectionProps) {
  return (
    <div className="rounded-xl bg-destiny-surface border border-destiny-border p-5 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">{AREA_EMOJI[area] ?? '📖'}</span>
        <h3 className="text-base font-bold text-destiny-text">{title}</h3>
      </div>
      <p className="text-sm text-destiny-text-muted leading-relaxed whitespace-pre-wrap">
        {content}
      </p>
    </div>
  )
}
