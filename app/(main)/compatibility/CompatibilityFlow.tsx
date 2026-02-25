// 궁합 전체 플로우 Client Component
// 'use client' 필요: useState로 플로우 단계 관리 + Server Action / fetch 호출
//
// 플로우: 관계선택 → 상대입력 → 티저(점수) → 로딩 → 결과 리다이렉트
// Server Action(calculateCompatibilityPreview)으로 점수만 먼저 계산 후
// 전체 리포트는 기존 API Route(/api/compatibility)로 LLM 해설까지 생성
'use client'

import { useRouter } from 'next/navigation'
import { useState, useCallback } from 'react'

import LoadingOverlay from '@/components/compatibility/LoadingOverlay'
import PartnerInputForm, {
  type PartnerData,
} from '@/components/compatibility/PartnerInputForm'
import RelationshipTypeSelector from '@/components/compatibility/RelationshipTypeSelector'
import TeaserResult from '@/components/compatibility/TeaserResult'
import { calculateCompatibilityPreview } from '@/lib/actions/compatibility-preview'
import type { CompatibilityScoreResult } from '@/lib/compatibility/calculator'
import type { RelationshipType } from '@/lib/compatibility/types'

// 궁합 플로우 상태: 관계선택 → 상대입력 → 티저(점수) → 로딩 → 결과
type FlowStep = 'select-type' | 'input-partner' | 'teaser' | 'loading'

export default function CompatibilityFlow() {
  const router = useRouter()
  const [flowStep, setFlowStep] = useState<FlowStep>('select-type')
  const [relationshipType, setRelationshipType] =
    useState<RelationshipType | null>(null)
  const [partnerData, setPartnerData] = useState<PartnerData | null>(null)
  const [scores, setScores] = useState<CompatibilityScoreResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 1. 관계 유형 선택
  const handleTypeSelect = useCallback((type: RelationshipType) => {
    setRelationshipType(type)
    setFlowStep('input-partner')
    setError(null)
  }, [])

  // 2. 상대방 정보 제출 → 점수 미리보기 (Server Action, LLM 없음)
  const handlePartnerSubmit = useCallback(async (data: PartnerData) => {
    setPartnerData(data)
    setIsCalculating(true)
    setError(null)

    const result = await calculateCompatibilityPreview({
      partner: {
        name: data.name,
        birthDate: data.birthDate,
        birthTime: data.birthTime ?? undefined,
        mbti: data.mbti ?? undefined,
        gender: data.gender ?? undefined,
      },
    })

    setIsCalculating(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    setScores(result.data)
    setFlowStep('teaser')
  }, [])

  // 3. 전체 리포트 보기 → LLM API 호출
  const handleViewFull = useCallback(async () => {
    // 이중 제출 방지: 이미 로딩 중이면 무시
    if (!relationshipType || !partnerData || flowStep === 'loading') return

    setFlowStep('loading')

    try {
      const res = await fetch('/api/compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          relationshipType,
          partner: {
            name: partnerData.name,
            birthDate: partnerData.birthDate,
            birthTime: partnerData.birthTime,
            mbti: partnerData.mbti,
            gender: partnerData.gender,
          },
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? '궁합 분석에 실패했어요.')
        setFlowStep('teaser')
        return
      }

      const data = await res.json()
      if (data.id) {
        router.push(`/result/${data.id}`)
      } else {
        setError('결과 저장에 실패했어요.')
        setFlowStep('teaser')
      }
    } catch {
      setError('네트워크 오류가 발생했어요.')
      setFlowStep('teaser')
    }
  }, [relationshipType, partnerData, flowStep, router])

  // 뒤로가기
  const handleBack = useCallback(() => {
    setError(null)
    if (flowStep === 'input-partner') setFlowStep('select-type')
    else if (flowStep === 'teaser') setFlowStep('input-partner')
  }, [flowStep])

  return (
    <div className="flex flex-col min-h-screen">
      <LoadingOverlay isVisible={flowStep === 'loading'} />

      <div className="px-6 pt-6 pb-4 space-y-1">
        {flowStep !== 'select-type' && (
          <button
            type="button"
            onClick={handleBack}
            className="text-sm text-destiny-text-muted hover:text-destiny-primary-light transition-colors mb-2 cursor-pointer"
          >
            ← 이전
          </button>
        )}
        <h1 className="text-xl font-bold text-destiny-text">
          {flowStep === 'select-type' && '어떤 사이인가요?'}
          {flowStep === 'input-partner' && '상대방 정보'}
          {flowStep === 'teaser' && '궁합 결과'}
        </h1>
      </div>

      <div className="flex-1 px-6 py-4">
        {flowStep === 'select-type' && (
          <div className="animate-fade-in">
            <RelationshipTypeSelector
              value={relationshipType}
              onChange={handleTypeSelect}
            />
          </div>
        )}

        {flowStep === 'input-partner' && (
          <div className="animate-fade-slide-right">
            <PartnerInputForm
              onSubmit={handlePartnerSubmit}
              isSubmitting={isCalculating}
            />
          </div>
        )}

        {flowStep === 'teaser' && scores && partnerData && (
          <div className="animate-scale-in">
            <TeaserResult
              partnerName={partnerData.name}
              scores={scores}
              onViewFull={handleViewFull}
            />
          </div>
        )}

        {error && (
          <div className="mt-4 animate-fade-in">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
