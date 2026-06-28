-- ============================================================
--  Schema isolation migration (2026-06-28)
--
--  把 recipes 表從 public 搬到獨立的 recipe_book schema，與
--  calorie-tracker（搬到 calorie_tracker schema）在邏輯上隔開。
--
--  ⚠️ 執行前要先做：
--  Supabase Dashboard → Settings → API → Exposed schemas
--    → 加上 `recipe_book`，儲存後等 30 秒讓 PostgREST 重新載入
--
--  ⚠️ 執行後要重新部署 recipe-book（程式碼會用
--  db.schema = 'recipe_book' 連線）
-- ============================================================

begin;

create schema if not exists recipe_book;
grant usage on schema recipe_book to anon, authenticated, service_role;

-- 表 + 索引 + RLS + policy 都會跟著搬
alter table public.recipes set schema recipe_book;

-- PostgREST 與 service_role 用的表權限（RLS 還是會擋，但 service_role 可以繞過 RLS）
grant select, insert, update, delete on all tables in schema recipe_book to anon, authenticated, service_role;
alter default privileges in schema recipe_book
  grant select, insert, update, delete on tables to anon, authenticated, service_role;

-- recipes 唯一的 policy「recipes are readable by everyone」用 using (true)
-- 沒有跨表 reference，搬完直接生效，不用重建。

-- 建立 line_links 與 user_settings 表以支援 LINE 登入與帳號綁定
create table if not exists recipe_book.line_links (
  user_id uuid primary key references auth.users(id) on delete cascade,
  line_sub text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists recipe_book.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now()
);

-- RLS
alter table recipe_book.line_links enable row level security;
alter table recipe_book.user_settings enable row level security;

-- Policies (only users can access their own line link / settings, admin/service_role bypasses RLS)
drop policy if exists "Users can access own line link" on recipe_book.line_links;
create policy "Users can access own line link" on recipe_book.line_links
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can access own settings" on recipe_book.user_settings;
create policy "Users can access own settings" on recipe_book.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- PostgREST 與 service_role 用的表權限
grant select, insert, update, delete on all tables in schema recipe_book to anon, authenticated, service_role;

commit;
