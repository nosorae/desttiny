// 궁합 결과 상세 리포트 (Server Component)
// 동적 라우트: /result/{궁합결과_id}
//
// Server Component에서 DB 조회 → 전체 리포트 렌더링
// RLS가 requester_id = auth.uid()인 결과만 반환하므로
// 다른 사용자의 결과 접근 시 자동으로 notFound 처리
//
// Next.js 15+ 변경: params가 Promise 타입으로 변경됨
// 참고: https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes
import { notFound, redirect } from 'next/navigation'

import AnalysisSection from '@/components/result/AnalysisSection'
import FinalSummary from '@/components/result/FinalSummary'
import IntimacySection from '@/components/result/IntimacySection'
import ScoreDisplay from '@/components/result/ScoreDisplay'
import SummaryHeader from '@/components/result/SummaryHeader'
import type { CompatibilityAnalysis } from '@/lib/compatibility/types'
import { createClient } from '@/lib/supabase/server'

type Props = {
  params: Promise<{ id: string }>
}

export default async function ResultPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // RLS가 requester_id = auth.uid()인 결과만 반환하므로
  // 다른 사용자의 결과는 자동으로 null 반환 → notFound
  const { data: result, error } = await supabase
    .from('compatibility_results')
    .select(
      '*, requester:profiles!compatibility_results_requester_id_fkey(nickname)'
    )
    .eq('id', id)
    .single()

  if (error || !result) notFound()

  // ai_summary는 JSON 문자열로 저장됨
  let analysis: CompatibilityAnalysis | null = null
  try {
    if (result.ai_summary) {
      analysis = JSON.parse(result.ai_summary) as CompatibilityAnalysis
    }
  } catch {
    console.error('[ResultPage] ai_summary 파싱 실패')
  }

  const requesterName =
    (result.requester as { nickname: string | null } | null)?.nickname ?? '나'
  const partnerName = result.partner_name ?? '파트너'

  return (
    <main className="px-6 py-8 space-y-6 pb-20">
      {/* 요약 헤더 */}
      <SummaryHeader
        summary={
          analysis?.summary ??
          `두 분의 궁합 점수는 ${result.total_score}점입니다.`
        }
        requesterName={requesterName}
        partnerName={partnerName}
        relationshipType={result.relationship_type}
      />

      {/* 종합 점수 */}
      <ScoreDisplay
        totalScore={result.total_score}
        breakdown={{
          saju: result.saju_score ?? 50,
          zodiac: result.zodiac_score ?? 50,
          mbti: result.mbti_score ?? 50,
        }}
      />

      {/* 영역별 해설 */}
      {analysis?.sections.map((section, i) => (
        <AnalysisSection
          key={section.area}
          title={section.title}
          content={section.content}
          area={section.area}
          index={i}
        />
      ))}

      {/* 29금 친밀도 (연인계만, 순서: sections 다음, finalSummary 이전) */}
      {analysis?.intimacyScores && (
        <IntimacySection scores={analysis.intimacyScores} />
      )}

      {/* 마무리 */}
      {analysis?.finalSummary && (
        <FinalSummary content={analysis.finalSummary} />
      )}
    </main>
  )
}
