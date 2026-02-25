-- 이슈 #11, #23: MBTI 필수화 + idol 관계 유형 추가
--
-- 1. profiles.mbti NOT NULL 추가
--    온보딩에서 MBTI가 필수가 됨 (모르면 외부 검사 후 입력)
--    주의: 기존 null MBTI 데이터가 있으면 마이그레이션 실패
--    MVP 시점에서 실제 사용자 데이터 없으므로 안전
--
-- 2. compatibility_results.relationship_type에 'idol' 추가
--    7개 관계 유형: lover/ex/crush/friend/colleague/family/idol

-- 1. MBTI NOT NULL 추가
ALTER TABLE profiles
  ALTER COLUMN mbti SET NOT NULL;

-- 2. relationship_type CHECK constraint에 idol 추가
ALTER TABLE compatibility_results
  DROP CONSTRAINT IF EXISTS compatibility_results_relationship_type_check;

ALTER TABLE compatibility_results
  ADD CONSTRAINT compatibility_results_relationship_type_check
  CHECK (relationship_type = ANY (ARRAY[
    'lover'::text,
    'ex'::text,
    'crush'::text,
    'friend'::text,
    'colleague'::text,
    'family'::text,
    'idol'::text
  ]));
