// 두 사람 요약 카드 (Server Component)
// 요청자 이름, 파트너 이름, 관계 유형 + AI 요약 한 줄을 표시
// 결과 페이지 최상단 - 누구와 누구의 어떤 관계인지 한눈에 파악

interface SummaryHeaderProps {
  summary: string
  requesterName: string
  partnerName: string
  relationshipType: string
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  lover: '연인',
  ex: '전연인',
  crush: '썸',
  friend: '친구',
  colleague: '동료',
  family: '가족',
  idol: '아이돌',
}

export default function SummaryHeader({
  summary,
  requesterName,
  partnerName,
  relationshipType,
}: SummaryHeaderProps) {
  return (
    <div className="rounded-2xl bg-destiny-surface border border-destiny-border p-6 space-y-4">
      <div className="flex items-center justify-center gap-4">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full bg-destiny-primary/20 flex items-center justify-center mx-auto mb-1">
            <span className="text-lg">✨</span>
          </div>
          <p className="text-sm font-medium text-destiny-text">
            {requesterName}
          </p>
        </div>
        <div className="text-destiny-text-subtle text-xs px-3 py-1 rounded-full bg-destiny-surface-2">
          {RELATIONSHIP_LABELS[relationshipType] ?? relationshipType}
        </div>
        <div className="text-center">
          <div className="h-12 w-12 rounded-full bg-destiny-accent/20 flex items-center justify-center mx-auto mb-1">
            <span className="text-lg">💫</span>
          </div>
          <p className="text-sm font-medium text-destiny-text">{partnerName}</p>
        </div>
      </div>
      <p className="text-sm text-destiny-text-muted text-center leading-relaxed">
        {summary}
      </p>
    </div>
  )
}
