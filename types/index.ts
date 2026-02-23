// ===== desttiny 공통 TypeScript 타입 정의 =====
// TODO: 각 도메인(사주/별자리/MBTI/결제)별 타입은 해당 이슈에서 추가 예정

// 사용자 기본 정보
export type User = {
  id: string;
  email: string;
  nickname: string | null;
  createdAt: string;
};

// 온보딩 입력 정보
export type OnboardingInput = {
  birthDate: string; // YYYY-MM-DD
  birthTime: string | null; // HH:MM (시간 모를 경우 null)
  gender: "male" | "female";
  mbti: string | null;
};
