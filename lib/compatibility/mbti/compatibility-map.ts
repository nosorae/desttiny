/**
 * MBTI 인지기능 스택 기반 궁합 점수 매핑 테이블
 *
 * ⚠️ 주의사항:
 * 이 점수는 Carl Jung 심리학적 유형론의 인지기능(Cognitive Functions) 이론을 기반으로 하되,
 * 구체적인 점수 수치는 커뮤니티 컨센서스(PersonalityCafe 등)에서 도출된 것입니다.
 * 학술적·과학적 연구로 검증된 점수가 아닙니다. 참고 수준으로 사용하세요.
 *
 * 황금 쌍(Golden Pair) 이론:
 * 인지기능 스택이 완벽히 보완되는 쌍. 예: INTJ(Ni-Te-Fi-Se) ↔ ENFP(Ne-Fi-Te-Si)
 *
 * 참고: Carl Jung - Psychological Types (1921)
 * 참고: https://www.personalitycafe.com (커뮤니티 컨센서스)
 * 참고: https://bestieai.app/topics/love/best-mbti-matches-golden-pair-guide
 */

import type { MbtiType } from '../types'

// prettier-ignore
export const MBTI_COMPATIBILITY: Record<MbtiType, Record<MbtiType, number>> = {
  INTJ: {
    INTJ: 65, INTP: 72, ENTJ: 75, ENTP: 80,
    INFJ: 75, INFP: 72, ENFJ: 78, ENFP: 90, // ENFP = 황금 쌍
    ISTJ: 70, ISFJ: 60, ESTJ: 65, ESFJ: 55,
    ISTP: 65, ISFP: 58, ESTP: 60, ESFP: 50,
  },
  INTP: {
    INTJ: 72, INTP: 60, ENTJ: 70, ENTP: 75,
    INFJ: 80, INFP: 68, ENFJ: 90, ENFP: 78, // ENFJ = 황금 쌍
    ISTJ: 65, ISFJ: 62, ESTJ: 60, ESFJ: 58,
    ISTP: 70, ISFP: 60, ESTP: 62, ESFP: 55,
  },
  ENTJ: {
    INTJ: 75, INTP: 70, ENTJ: 62, ENTP: 72,
    INFJ: 78, INFP: 90, ENFJ: 70, ENFP: 80, // INFP = 황금 쌍
    ISTJ: 72, ISFJ: 62, ESTJ: 68, ESFJ: 60,
    ISTP: 65, ISFP: 60, ESTP: 68, ESFP: 58,
  },
  ENTP: {
    INTJ: 80, INTP: 75, ENTJ: 72, ENTP: 62,
    INFJ: 90, INFP: 78, ENFJ: 75, ENFP: 72, // INFJ = 황금 쌍
    ISTJ: 60, ISFJ: 58, ESTJ: 62, ESFJ: 60,
    ISTP: 68, ISFP: 62, ESTP: 65, ESFP: 60,
  },
  INFJ: {
    INTJ: 75, INTP: 80, ENTJ: 78, ENTP: 90, // ENTP = 황금 쌍
    INFJ: 65, INFP: 72, ENFJ: 70, ENFP: 78,
    ISTJ: 62, ISFJ: 65, ESTJ: 58, ESFJ: 62,
    ISTP: 60, ISFP: 65, ESTP: 58, ESFP: 60,
  },
  INFP: {
    INTJ: 72, INTP: 68, ENTJ: 90, ENTP: 78, // ENTJ = 황금 쌍
    INFJ: 72, INFP: 62, ENFJ: 80, ENFP: 75,
    ISTJ: 58, ISFJ: 65, ESTJ: 55, ESFJ: 65,
    ISTP: 62, ISFP: 70, ESTP: 58, ESFP: 65,
  },
  ENFJ: {
    INTJ: 78, INTP: 90, ENTJ: 70, ENTP: 75, // INTP = 황금 쌍
    INFJ: 70, INFP: 80, ENFJ: 62, ENFP: 72,
    ISTJ: 65, ISFJ: 68, ESTJ: 62, ESFJ: 65,
    ISTP: 60, ISFP: 68, ESTP: 62, ESFP: 68,
  },
  ENFP: {
    INTJ: 90, INTP: 78, ENTJ: 80, ENTP: 72, // INTJ = 황금 쌍
    INFJ: 78, INFP: 75, ENFJ: 72, ENFP: 65,
    ISTJ: 60, ISFJ: 65, ESTJ: 58, ESFJ: 68,
    ISTP: 62, ISFP: 70, ESTP: 62, ESFP: 68,
  },
  ISTJ: {
    INTJ: 70, INTP: 65, ENTJ: 72, ENTP: 60,
    INFJ: 62, INFP: 58, ENFJ: 65, ENFP: 60,
    ISTJ: 72, ISFJ: 75, ESTJ: 78, ESFJ: 72,
    ISTP: 75, ISFP: 65, ESTP: 70, ESFP: 62,
  },
  ISFJ: {
    INTJ: 60, INTP: 62, ENTJ: 62, ENTP: 58,
    INFJ: 65, INFP: 65, ENFJ: 68, ENFP: 65,
    ISTJ: 75, ISFJ: 70, ESTJ: 72, ESFJ: 78,
    ISTP: 65, ISFP: 75, ESTP: 65, ESFP: 72,
  },
  ESTJ: {
    INTJ: 65, INTP: 60, ENTJ: 68, ENTP: 62,
    INFJ: 58, INFP: 55, ENFJ: 62, ENFP: 58,
    ISTJ: 78, ISFJ: 72, ESTJ: 70, ESFJ: 75,
    ISTP: 72, ISFP: 62, ESTP: 75, ESFP: 65,
  },
  ESFJ: {
    INTJ: 55, INTP: 58, ENTJ: 60, ENTP: 60,
    INFJ: 62, INFP: 65, ENFJ: 65, ENFP: 68,
    ISTJ: 72, ISFJ: 78, ESTJ: 75, ESFJ: 72,
    ISTP: 62, ISFP: 72, ESTP: 68, ESFP: 75,
  },
  ISTP: {
    INTJ: 65, INTP: 70, ENTJ: 65, ENTP: 68,
    INFJ: 60, INFP: 62, ENFJ: 60, ENFP: 62,
    ISTJ: 75, ISFJ: 65, ESTJ: 72, ESFJ: 62,
    ISTP: 68, ISFP: 72, ESTP: 80, ESFP: 72,
  },
  ISFP: {
    INTJ: 58, INTP: 60, ENTJ: 60, ENTP: 62,
    INFJ: 65, INFP: 70, ENFJ: 68, ENFP: 70,
    ISTJ: 65, ISFJ: 75, ESTJ: 62, ESFJ: 72,
    ISTP: 72, ISFP: 68, ESTP: 72, ESFP: 78,
  },
  ESTP: {
    INTJ: 60, INTP: 62, ENTJ: 68, ENTP: 65,
    INFJ: 58, INFP: 58, ENFJ: 62, ENFP: 62,
    ISTJ: 70, ISFJ: 65, ESTJ: 75, ESFJ: 68,
    ISTP: 80, ISFP: 72, ESTP: 68, ESFP: 78,
  },
  ESFP: {
    INTJ: 50, INTP: 55, ENTJ: 58, ENTP: 60,
    INFJ: 60, INFP: 65, ENFJ: 68, ENFP: 68,
    ISTJ: 62, ISFJ: 72, ESTJ: 65, ESFJ: 75,
    ISTP: 72, ISFP: 78, ESTP: 78, ESFP: 70,
  },
}
