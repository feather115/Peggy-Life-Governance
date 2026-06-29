-- ============================================================
--  把 line_links 從 calorie_tracker schema 搬到新的 shared schema
--
--  原因：line_links 是 LINE 帳號 ↔ Supabase 帳號的對照，本來就跨 app
--  共用（兩個 app 同一個 auth.users 池）。原本擺在 calorie_tracker 是
--  歷史遺留——calorie-tracker 先做 LINE 登入，recipe-book 加入後是
--  跨 schema 借用，邏輯歸屬不乾淨。
--
--  做完之後：
--  - 只剩一張 shared.line_links（結構維持原本 calorie_tracker 版：
--    line_sub PK、user_id、linked_at）
--  - 只給 service_role 用（前端不會直接碰）
--  - recipe_book.line_links（schema_isolation 建的但沒在用、結構不同）
--    順便清掉
--
--  ⚠️ 跑這支之前要：
--  Supabase Dashboard → Integrations → Data API → Settings
--    → Exposed schemas 加上 `shared`，按 Save 等 30 秒
-- ============================================================

begin;

create schema if not exists shared;
grant usage on schema shared to anon, authenticated, service_role;

-- 1) 把 calorie_tracker.line_links 搬到 shared（如果還在 calorie_tracker）
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'calorie_tracker' and table_name = 'line_links'
  ) then
    alter table calorie_tracker.line_links set schema shared;
  end if;
end $$;

-- 2) 全新環境的兜底（搬完上面就跳過 if not exists）
create table if not exists shared.line_links (
  line_sub  text primary key,
  user_id   uuid not null references auth.users(id) on delete cascade,
  linked_at timestamptz not null default now()
);
create index if not exists line_links_user_idx on shared.line_links (user_id);

-- 3) RLS 維持原本設計：開 RLS 但不開 policy → 前端 anon/authenticated 全擋
--    只有 service_role 能寫（service_role 有 BYPASSRLS）
alter table shared.line_links enable row level security;

grant select, insert, update, delete on shared.line_links to service_role;
-- 故意不 grant 給 anon/authenticated

-- 4) 清掉 recipe_book.line_links（結構不同、實際 code 沒用）
drop table if exists recipe_book.line_links;

commit;
