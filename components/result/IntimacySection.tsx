// 29금 친밀도 섹션 (Server Component)
// 연인/썸/전연인 관계에서만 표시 - 텐션/리듬/경계선 대화 3종 바 + 강점/주의/권장
import type { IntimacyScores } from '@/lib/compatibility/types'

interface IntimacySectionProps {
  scores: IntimacyScores
}

export default function IntimacySection({ scores }: IntimacySectionProps) {
  const bars = [
    {
      label: '텐션',
      value: scores.tension,
      color: 'from-rose-500 to-pink-400',
    },
    {
      label: '리듬',
      value: scores.rhythm,
      color: 'from-violet-500 to-purple-400',
    },
    {
      label: '경계선 대화',
      value: scores.boundary,
      color: 'from-amber-500 to-yellow-400',
    },
  ]

  return (
    <div className="rounded-xl bg-destiny-surface-2 border border-destiny-border p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">🔥</span>
        <h3 className="text-base font-bold text-destiny-text">29금 친밀도</h3>
      </div>

      <div className="space-y-3">
        {bars.map(({ label, value, color }) => (
          <div key={label} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-destiny-text-muted">{label}</span>
              <span className="text-destiny-text font-medium">{value}</span>
            </div>
            <div className="h-2 rounded-full bg-destiny-surface overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${color}`}
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2 text-sm text-destiny-text-muted pt-2 border-t border-destiny-border">
        <p>💪 {scores.strength}</p>
        <p>⚠️ {scores.caution}</p>
        <p>💡 {scores.advice}</p>
      </div>
    </div>
  )
}
