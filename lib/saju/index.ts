/**
 * @gracefullight/saju 라이브러리 래퍼
 *
 * 이 라이브러리는 다음 기준으로 4주를 계산합니다:
 * - 일주: Julian Day Number (JDN) 기반 천문학적 계산
 * - 년주: 입춘(Lichun, 立春) 시각 기준
 * - 월주: 태양 황경(solar longitude) 기반 24절기
 * - 시주: 전통 12시진(shichen, 時辰)
 *
 * 참고: https://github.com/gracefullight/pkgs/tree/main/packages/saju
 * 참고: @gracefullight/saju SPEC.md - https://github.com/gracefullight/pkgs/blob/main/packages/saju/SPEC.md
 */

import { getFourPillars } from '@gracefullight/saju'
import { createLuxonAdapter } from '@gracefullight/saju/adapters/luxon'
import { DateTime } from 'luxon'

import type { SajuProfile, Pillar } from './types'
import {
  HANJA_STEM_TO_KOREAN,
  HANJA_BRANCH_TO_KOREAN,
  STEM_TO_ELEMENT,
} from './types'

/** 어댑터 초기화 (한 번만 실행) */
let adapterPromise: ReturnType<typeof createLuxonAdapter> | null = null

async function getAdapter() {
  if (!adapterPromise) {
    adapterPromise = createLuxonAdapter()
  }
  return adapterPromise
}

/**
 * 한자 천간/지지를 한글 Pillar로 변환
 * @gracefullight/saju는 한자(甲, 乙 등)로 반환하므로 한글로 변환
 */
function toPillar(hanjaGanzhi: string): Pillar {
  // 예: '甲子' → stem='갑', branch='자'
  const hanjaStem = hanjaGanzhi[0]
  const hanjaBranch = hanjaGanzhi[1]

  const stem = HANJA_STEM_TO_KOREAN[hanjaStem]
  const branch = HANJA_BRANCH_TO_KOREAN[hanjaBranch]

  // 라이브러리 업데이트로 알 수 없는 한자가 오면 명시적으로 에러 발생
  // silent undefined 대신 fast-fail로 디버깅 용이
  if (!stem || !branch) {
    throw new Error(
      `알 수 없는 한자 간지: "${hanjaGanzhi}" (천간=${hanjaStem}, 지지=${hanjaBranch})`
    )
  }

  return {
    stem,
    branch,
    label: `${stem}${branch}`,
    element: STEM_TO_ELEMENT[stem],
  }
}

/**
 * 생년월일시로 사주 4주를 계산합니다.
 *
 * @param birthDate - 생년월일 (KST 기준으로 처리)
 * @param birthHour - 생시 (0-23), 없으면 시주 null
 * @returns 사주 4주 프로필
 */
export async function getSajuProfile(
  birthDate: Date,
  birthHour?: number
): Promise<SajuProfile> {
  const adapter = await getAdapter()

  const hour = birthHour ?? 0
  const minute = 0

  // UTC getter 사용: 호출자가 날짜 값만 전달하므로 타임존 해석 없이 그대로 읽음
  // getFullYear() 등 로컬 타임존 getter는 Vercel(UTC) 환경과 일치하지만
  // UTC- 환경에서는 의도치 않게 하루 밀릴 수 있어 UTC getter로 명시
  const dt = DateTime.fromObject(
    {
      year: birthDate.getUTCFullYear(),
      month: birthDate.getUTCMonth() + 1,
      day: birthDate.getUTCDate(),
      hour,
      minute,
    },
    { zone: 'Asia/Seoul' }
  )

  // getFourPillars는 { year, month, day, hour, lunar, meta } 형태로 반환
  const result = getFourPillars(dt, { adapter })

  return {
    yearPillar: toPillar(result.year),
    monthPillar: toPillar(result.month),
    dayPillar: toPillar(result.day),
    // 시간 정보 없으면 null로 외부 노출
    hourPillar: birthHour !== undefined ? toPillar(result.hour) : null,
  }
}

export type {
  SajuProfile,
  Pillar,
  FiveElement,
  HeavenlyStem,
  EarthlyBranch,
} from './types'
export { STEM_TO_ELEMENT, BRANCH_TO_ELEMENT } from './types'
