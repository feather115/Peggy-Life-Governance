-- ============================================================
--  飲食卡路里 App — Supabase 一鍵建表 SQL
--  用法：Supabase Dashboard → SQL Editor → 貼上整段 → Run
-- ============================================================

-- 1) user_settings ────────────────────────────────────────────
create table if not exists public.user_settings (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  goal_cal     int4 not null default 1500,
  goal_p       int4 not null default 110,
  goal_c       int4 not null default 150,
  goal_f       int4 not null default 50,
  updated_at   timestamptz not null default now()
);
-- 為已存在的舊資料庫補欄位（首次跑整段不影響）
alter table public.user_settings add column if not exists display_name text;

-- 2) tag_defs ─────────────────────────────────────────────────
create table if not exists public.tag_defs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null check (type in ('fasting','other')),
  label       text not null,
  color       text,
  sort_order  int4 not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists tag_defs_user_type_idx on public.tag_defs (user_id, type);
-- 為已存在的舊資料庫補欄位（首次跑整段不影響）
alter table public.tag_defs add column if not exists color text;

-- 3) custom_foods ─────────────────────────────────────────────
create table if not exists public.custom_foods (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  brand      text,
  note       text,
  unit       text not null default '1 份',
  cal        numeric not null,
  p          numeric not null default 0,
  c          numeric not null default 0,
  f          numeric not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists custom_foods_user_idx on public.custom_foods (user_id);
-- 為已存在的舊資料庫補欄位（首次跑整段不影響）
alter table public.custom_foods add column if not exists brand text;
alter table public.custom_foods add column if not exists note text;

-- 4) day_records ──────────────────────────────────────────────
create table if not exists public.day_records (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  date       date not null,
  day_note   text not null default '',
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);
create index if not exists day_records_user_date_idx on public.day_records (user_id, date desc);

-- 5) day_tags (多對多) ────────────────────────────────────────
create table if not exists public.day_tags (
  day_record_id uuid not null references public.day_records(id) on delete cascade,
  tag_def_id    uuid not null references public.tag_defs(id) on delete cascade,
  primary key (day_record_id, tag_def_id)
);

-- 6) meal_items (快照式) ──────────────────────────────────────
create table if not exists public.meal_items (
  id            uuid primary key default gen_random_uuid(),
  day_record_id uuid not null references public.day_records(id) on delete cascade,
  meal_key      text not null check (meal_key in ('breakfast','lunch','dinner','snack','midnight')),
  food_ref      text,
  name          text not null,
  brand         text,
  unit          text not null default '1 份',
  cal           numeric not null,
  p             numeric not null default 0,
  c             numeric not null default 0,
  f             numeric not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists meal_items_day_idx on public.meal_items (day_record_id);
-- 為已存在的舊資料庫補欄位（首次跑整段不影響）
alter table public.meal_items add column if not exists brand text;

-- 7) food_usage（記錄每個食物上次被選用/新增/編輯的時間，食物庫排序用）──
create table if not exists public.food_usage (
  user_id      uuid not null references auth.users(id) on delete cascade,
  food_ref     text not null,
  last_used_at timestamptz not null default now(),
  primary key (user_id, food_ref)
);

-- ============================================================
--  Row Level Security — 每位使用者只能存取自己的資料
-- ============================================================
alter table public.user_settings enable row level security;
alter table public.tag_defs      enable row level security;
alter table public.custom_foods  enable row level security;
alter table public.day_records   enable row level security;
alter table public.day_tags      enable row level security;
alter table public.meal_items    enable row level security;
alter table public.food_usage    enable row level security;

-- user_settings
drop policy if exists "own user_settings" on public.user_settings;
create policy "own user_settings" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- tag_defs
drop policy if exists "own tag_defs" on public.tag_defs;
create policy "own tag_defs" on public.tag_defs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- custom_foods
drop policy if exists "own custom_foods" on public.custom_foods;
create policy "own custom_foods" on public.custom_foods
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- day_records
drop policy if exists "own day_records" on public.day_records;
create policy "own day_records" on public.day_records
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- day_tags (走 day_records.user_id)
drop policy if exists "own day_tags" on public.day_tags;
create policy "own day_tags" on public.day_tags
  for all
  using (exists (select 1 from public.day_records dr where dr.id = day_tags.day_record_id and dr.user_id = auth.uid()))
  with check (exists (select 1 from public.day_records dr where dr.id = day_tags.day_record_id and dr.user_id = auth.uid()));

-- meal_items (走 day_records.user_id)
drop policy if exists "own meal_items" on public.meal_items;
create policy "own meal_items" on public.meal_items
  for all
  using (exists (select 1 from public.day_records dr where dr.id = meal_items.day_record_id and dr.user_id = auth.uid()))
  with check (exists (select 1 from public.day_records dr where dr.id = meal_items.day_record_id and dr.user_id = auth.uid()));

-- food_usage
drop policy if exists "own food_usage" on public.food_usage;
create policy "own food_usage" on public.food_usage
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
--  新使用者註冊時自動建立 user_settings + 預設標籤
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_settings (user_id) values (new.id);
  insert into public.tag_defs (user_id, type, label, color, sort_order) values
    (new.id, 'fasting', '168',    null,      0),
    (new.id, 'fasting', '輕斷食', null,      1),
    (new.id, 'other',   '聚餐',   '#E8A13C', 0),
    (new.id, 'other',   '外食',   '#5FA8D3', 1),
    (new.id, 'other',   '旅行',   '#8B5CF6', 2),
    (new.id, 'other',   '放縱日', '#D9544F', 3);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
