-- ===== desttiny 초기 DB 스키마 =====
-- 4개 테이블: profiles, compatibility_results, payments, daily_free_slots
-- RLS(Row Level Security) 정책 포함
-- 참고: https://supabase.com/docs/guides/auth/row-level-security

-- ===== 1. profiles 테이블 =====
-- 사용자 프로필 정보 (사주/별자리/MBTI 등)
-- Supabase Auth의 auth.users와 1:1 관계
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  gender text check (gender in ('male', 'female')),
  birth_date date not null,
  birth_time time, -- 시간 모를 경우 null
  day_pillar text, -- 사주 일주 (예: "갑자")
  zodiac_sign text, -- 별자리 (예: "물병자리")
  mbti text check (mbti ~* '^[EI][SN][TF][JP]$'), -- 정규식으로 유효성 검사
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

comment on table profiles is '사용자 프로필 - 사주/별자리/MBTI 정보 포함';

-- ===== 2. compatibility_results 테이블 =====
-- 궁합 분석 결과 저장
create table compatibility_results (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references profiles(id) on delete cascade,
  partner_id uuid references profiles(id) on delete set null,
  -- partner_id가 null이면 비회원 상대 (직접 정보 입력)
  partner_name text,
  partner_birth_date date,
  partner_birth_time time,
  partner_gender text check (partner_gender in ('male', 'female')),
  partner_day_pillar text,
  partner_zodiac_sign text,
  partner_mbti text check (partner_mbti ~* '^[EI][SN][TF][JP]$'),
  relationship_type text not null check (relationship_type in ('romantic', 'friend', 'business')),
  total_score integer not null check (total_score between 0 and 100),
  saju_score integer check (saju_score between 0 and 100),
  zodiac_score integer check (zodiac_score between 0 and 100),
  mbti_score integer check (mbti_score between 0 and 100),
  ai_summary text, -- Claude가 생성한 궁합 해석 텍스트
  is_paid boolean default false not null, -- 결제 여부 (무료/유료 구분)
  created_at timestamptz default now() not null
);

comment on table compatibility_results is '궁합 분석 결과 - 사주/별자리/MBTI 종합 점수';

-- ===== 3. payments 테이블 =====
-- PortOne V2 결제 내역
create table payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  compatibility_result_id uuid references compatibility_results(id) on delete set null,
  amount integer not null check (amount > 0), -- 결제 금액 (원)
  portone_payment_id text unique, -- PortOne 결제 고유 ID (서버 검증용)
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'cancelled')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

comment on table payments is '결제 내역 - PortOne V2 연동';

-- ===== 4. daily_free_slots 테이블 =====
-- 일일 선착순 무료 궁합 슬롯 (하루 최대 20개)
create table daily_free_slots (
  id uuid primary key default gen_random_uuid(),
  slot_date date not null default current_date,
  used_count integer not null default 0 check (used_count >= 0),
  max_count integer not null default 20,
  created_at timestamptz default now() not null,
  -- 날짜별 1개 레코드만 허용
  constraint unique_slot_date unique (slot_date)
);

comment on table daily_free_slots is '일일 선착순 무료 궁합 슬롯 (하루 최대 20개)';

-- ===== updated_at 자동 갱신 트리거 =====
-- profiles, payments 테이블의 updated_at을 자동으로 현재 시각으로 갱신
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

create trigger payments_updated_at
  before update on payments
  for each row execute function update_updated_at();

-- ===== RLS (Row Level Security) 정책 =====
-- 로그인한 사용자만 본인 데이터에 접근 가능

-- profiles: 본인 프로필만 CRUD 가능
alter table profiles enable row level security;

create policy "profiles_select_own"
  on profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on profiles for update
  using (auth.uid() = id);

create policy "profiles_delete_own"
  on profiles for delete
  using (auth.uid() = id);

-- compatibility_results: 본인이 요청한 궁합 결과만 조회/생성 가능
alter table compatibility_results enable row level security;

create policy "compatibility_select_own"
  on compatibility_results for select
  using (auth.uid() = requester_id);

create policy "compatibility_insert_own"
  on compatibility_results for insert
  with check (auth.uid() = requester_id);

-- payments: 본인 결제 내역만 조회/생성 가능
alter table payments enable row level security;

create policy "payments_select_own"
  on payments for select
  using (auth.uid() = user_id);

create policy "payments_insert_own"
  on payments for insert
  with check (auth.uid() = user_id);

-- payments update는 서버(service_role)에서만 가능 - 결제 상태 위변조 방지
-- 클라이언트에서 결제 상태를 직접 변경할 수 없음

-- daily_free_slots: 모든 인증 사용자가 조회 가능, 수정은 서버에서만
alter table daily_free_slots enable row level security;

create policy "daily_free_slots_select_authenticated"
  on daily_free_slots for select
  using (auth.role() = 'authenticated');

-- daily_free_slots insert/update는 서버(service_role)에서만 가능
-- 선착순 슬롯의 카운트 조작 방지
