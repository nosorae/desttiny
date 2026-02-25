/**
 * LLM 궁합 해설 프롬프트 빌더
 *
 * 두 사람의 3체계 데이터를 받아 LLM에 전달할 프롬프트 문자열 생성.
 * 연인/썸/전연인 관계에만 친밀도 영역 추가.
 *
 * 출력 형식: JSON { summary, sections: [{title, content, area}], finalSummary }
 */
import type { PersonCompatibilityInput, RelationshipType, CompatibilityScore } from '../types'

const RELATIONSHIP_KO: Record<RelationshipType, string> = {
  lover: '연인', ex: '전연인', crush: '썸',
  friend: '친구', colleague: '동료', family: '가족',
}

const INTIMATE_TYPES: RelationshipType[] = ['lover', 'ex', 'crush']

export interface CompatibilityPromptInput {
  person1: PersonCompatibilityInput
  person2: PersonCompatibilityInput
  relationshipType: RelationshipType
  totalScore: number
  breakdown: {
    saju: CompatibilityScore
    zodiac: CompatibilityScore
    mbti: CompatibilityScore
  }
}

export function buildCompatibilityPrompt(data: CompatibilityPromptInput): string {
  const { person1, person2, relationshipType, totalScore, breakdown } = data
  const relKo = RELATIONSHIP_KO[relationshipType]
  const isIntimate = INTIMATE_TYPES.includes(relationshipType)

  const describePersonSaju = (p: PersonCompatibilityInput) =>
    p.dayPillar ? `사주 일주 ${p.dayPillar.label}(${p.dayPillar.element})` : '사주 정보 없음'
  const describePersonZodiac = (p: PersonCompatibilityInput) =>
    p.zodiacId ? `별자리 ${p.zodiacId}` : '별자리 정보 없음'

  // 계산 결과를 텍스트로 포맷 (details가 없으면 세부사항 섹션 생략)
  const formatScore = (label: string, weight: string, s: CompatibilityScore): string => {
    const lines = [`${label} (${weight}): ${s.score}점`, `사유: ${s.reason}`]
    if (s.details.length > 0) {
      lines.push('세부사항:')
      s.details.forEach(d => lines.push(`- ${d}`))
    }
    return lines.join('\n')
  }

  const breakdownSection = [
    formatScore('사주 궁합', '40%', breakdown.saju),
    formatScore('별자리 궁합', '30%', breakdown.zodiac),
    formatScore('MBTI 궁합', '30%', breakdown.mbti),
  ].join('\n\n')

  const areas = [
    '소통(communication): 대화 스타일, 공감 방식',
    '감정(emotion): 애정 표현, 감정 처리 방식',
    '가치관(values): 삶의 방향성, 우선순위',
    '생활습관(lifestyle): 일상 패턴, 취향',
    '갈등 해결(conflict): 갈등 처리 방식',
  ]
  if (isIntimate) areas.push('친밀도(intimacy): 신체적·정서적 친밀감 표현 방식')

  const intimacySection = isIntimate
    ? ',\n    { "title": "후킹 제목", "content": "상세 해설 (450~550자, 약 500자)", "area": "intimacy" }'
    : ''

  return `당신은 사주·별자리·MBTI 통합 궁합 전문가입니다.
다음 두 사람의 궁합을 분석하여 영역별로 상세한 해설을 작성해주세요.

[두 사람 정보]
사람1(${person1.name}): ${describePersonSaju(person1)}, ${describePersonZodiac(person1)}, MBTI ${person1.mbti ?? '미입력'}, 성별 ${person1.gender ?? '미입력'}
사람2(${person2.name}): ${describePersonSaju(person2)}, ${describePersonZodiac(person2)}, MBTI ${person2.mbti ?? '미입력'}, 성별 ${person2.gender ?? '미입력'}
관계 유형: ${relKo}
종합 점수: ${totalScore}점 / 100점

[3체계 계산 결과]
${breakdownSection}

[작성 원칙]
1. 위의 3체계 계산 결과를 바탕으로 통합적으로 해석하세요
2. 각 영역 제목은 후킹형으로 작성하세요 (예: "둘이 싸우면 누가 이길까?")
3. 본문은 구체적이고 실용적인 조언을 포함하세요 (공백 포함 450~550자, 약 500자)
4. 마무리 정리는 전체 관계를 종합적으로 정리하세요 (공백 포함 450~550자, 약 500자)
5. 한국어로 작성하세요

[분석 영역]
${areas.join('\n')}

[출력 형식 - 반드시 JSON만 출력, 다른 텍스트 없이]
{
  "summary": "한 줄 요약 (50자 이내)",
  "sections": [
    { "title": "후킹 제목", "content": "상세 해설 (450~550자, 약 500자)", "area": "communication" },
    { "title": "후킹 제목", "content": "상세 해설 (450~550자, 약 500자)", "area": "emotion" },
    { "title": "후킹 제목", "content": "상세 해설 (450~550자, 약 500자)", "area": "values" },
    { "title": "후킹 제목", "content": "상세 해설 (450~550자, 약 500자)", "area": "lifestyle" },
    { "title": "후킹 제목", "content": "상세 해설 (450~550자, 약 500자)", "area": "conflict" }${intimacySection}
  ],
  "finalSummary": "마무리 정리 (공백 포함 450~550자, 약 500자)"
}`
}
