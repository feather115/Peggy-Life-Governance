-- ============================================================
--  料理行事曆紀錄 (cooking_history)
--
--  每個使用者哪一天做了哪些料理。前端「行事曆」分頁用。
--  直接建在 recipe_book schema（schema isolation 已完成）。
--
--  ⚠️ 跑這支之前要：
--  1. 已經跑過 schema.sql（recipes 表存在）
--  2. 已經跑過 2026-06-28_schema_isolation.sql（recipes 在 recipe_book schema）
--  3. Settings → API → Exposed schemas 已含 `recipe_book`
-- ============================================================

begin;

create table if not exists recipe_book.cooking_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id uuid not null references recipe_book.recipes(id) on delete cascade,
  cooked_date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, cooked_date, recipe_id)
);

create index if not exists cooking_history_user_date_idx
  on recipe_book.cooking_history (user_id, cooked_date desc);

alter table recipe_book.cooking_history enable row level security;

drop policy if exists "Users can manage own recipe cook records" on recipe_book.cooking_history;
create policy "Users can manage own recipe cook records"
  on recipe_book.cooking_history for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on recipe_book.cooking_history to authenticated, service_role;

commit;
