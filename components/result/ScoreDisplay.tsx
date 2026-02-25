// 종합 점수 디스플레이 (Server Component)
// 큰 숫자 + 점수별 그라데이션 색상 + 3체계 점수 요약
// 결과 페이지 상단에 배치되어 시선을 집중시키는 역할

interface ScoreDisplayProps {
  totalScore: number
  breakdown: {
    saju: number
    zodiac: number
    mbti: number
  }
}

function getScoreGradient(score: number): string {
  if (score >= 85) return 'from-destiny-accent to-amber-300'
  if (score >= 70) return 'from-destiny-primary to-destiny-primary-light'
  if (score >= 55) return 'from-destiny-primary-light to-blue-300'
  return 'from-destiny-text-muted to-destiny-text-subtle'
}

export default function ScoreDisplay({
  totalScore,
  breakdown,
}: ScoreDisplayProps) {
  return (
    <div className="text-center space-y-6 py-8">
      <div
        className={`text-7xl font-black bg-gradient-to-br ${getScoreGradient(totalScore)} bg-clip-text text-transparent`}
      >
        {totalScore}
        <span className="text-3xl">점</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '사주', score: breakdown.saju },
          { label: '별자리', score: breakdown.zodiac },
          { label: 'MBTI', score: breakdown.mbti },
        ].map(({ label, score }) => (
          <div key={label} className="text-center">
            <div className="text-xs text-destiny-text-subtle mb-1">{label}</div>
            <div className="text-lg font-bold text-destiny-text">{score}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
