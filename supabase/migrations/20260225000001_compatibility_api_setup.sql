-- 이슈 #18: 3체계 통합 궁합 API를 위한 DB 변경
--
-- 1. compatibility_results.relationship_type CHECK constraint 업데이트
--    기존: ('romantic', 'friend', 'business') - 3개
--    신규: lib/compatibility/types.ts RelationshipType 6개 값으로 확장
--
-- 2. use_daily_slot() 함수 생성
--    SECURITY DEFINER + 원자적 UPDATE로 race condition 방지
--    API route에서 user-role client로 호출 가능 (RLS 우회)

-- 1. relationship_type CHECK constraint 업데이트
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
    'family'::text
  ]));

-- 2. use_daily_slot 함수 생성
--
-- 동작: p_slot_date에 해당하는 daily_free_slots row의 used_count를 원자적으로 +1
--       used_count < max_count 조건을 만족할 때만 업데이트
--
-- 반환: TRUE = 슬롯 사용 성공, FALSE = 슬롯 없음 또는 소진
--
-- SECURITY DEFINER: 함수 소유자(service role) 권한으로 실행
--   → RLS를 우회하여 authenticated user도 호출 가능
--   → daily_free_slots UPDATE는 일반 유저가 직접 할 수 없음 (악용 방지)
--
-- 원자적 처리: SELECT + UPDATE 분리 방식 대비 동시 요청 시 race condition 없음
CREATE OR REPLACE FUNCTION use_daily_slot(p_slot_date DATE)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- used_count < max_count 조건으로 원자적 업데이트
  UPDATE daily_free_slots
  SET used_count = used_count + 1
  WHERE slot_date = p_slot_date
    AND used_count < max_count;

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  -- 1개 row가 업데이트됐으면 슬롯 사용 성공
  RETURN updated_count > 0;
END;
$$;

-- 인증된 사용자가 use_daily_slot 함수를 호출할 수 있도록 권한 부여
GRANT EXECUTE ON FUNCTION use_daily_slot(DATE) TO authenticated;
