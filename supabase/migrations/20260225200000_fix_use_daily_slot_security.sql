-- 이슈 #18 코드리뷰 수정: use_daily_slot 함수 보안 강화 + 자동 슬롯 생성
--
-- 변경 사항:
-- 1. SET search_path = '' 추가 (SECURITY DEFINER 함수 보안 권고 사항)
--    미설정 시 search_path에 앞서는 스키마에 동명 테이블을 생성해 우회 가능
--    참고: https://supabase.com/docs/guides/database/functions#security
--
-- 2. 슬롯 row 자동 생성 추가 (INSERT ON CONFLICT DO NOTHING)
--    기존: 운영자가 매일 daily_free_slots에 row를 수동 삽입해야 했음
--    신규: 첫 요청 시 오늘 날짜 row를 자동 생성 (max_count 기본값 20)

CREATE OR REPLACE FUNCTION public.use_daily_slot(p_slot_date DATE)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- 오늘 슬롯 row가 없으면 자동 생성 (첫 요청 시 초기화)
  -- max_count 20 = MVP 기본값, 향후 운영 설정으로 관리
  INSERT INTO public.daily_free_slots (slot_date, used_count, max_count)
  VALUES (p_slot_date, 0, 20)
  ON CONFLICT (slot_date) DO NOTHING;

  -- used_count < max_count 조건으로 원자적 업데이트 (race condition 방지)
  UPDATE public.daily_free_slots
  SET used_count = used_count + 1
  WHERE slot_date = p_slot_date
    AND used_count < max_count;

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  -- 1개 row가 업데이트됐으면 슬롯 사용 성공
  RETURN updated_count > 0;
END;
$$;

-- 인증된 사용자가 use_daily_slot 함수를 호출할 수 있도록 권한 유지
GRANT EXECUTE ON FUNCTION public.use_daily_slot(DATE) TO authenticated;
