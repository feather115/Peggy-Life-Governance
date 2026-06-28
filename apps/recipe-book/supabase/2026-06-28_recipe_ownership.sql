-- ============================================================
--  食譜擁有者 + 分享機制
--
--  每個食譜屬於一個 user_id；is_shared = true 才會被其他人（含未登入訪客）看到。
--
--  ⚠️ 跑這支之前要：
--  1. 已經跑過 schema.sql + 2026-06-28_schema_isolation.sql
--  2. feather115@gmail.com 這個帳號已存在於 auth.users（之後 backfill 用）
--
--  ⚠️ 如果你的 owner email 不是 feather115@gmail.com，請改下面 backfill 那行
-- ============================================================

begin;

alter table recipe_book.recipes
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists is_shared boolean not null default false;

-- 把舊有的食譜歸給專案擁有者（feather115@gmail.com）
update recipe_book.recipes
  set user_id = (select id from auth.users where email = 'feather115@gmail.com' limit 1)
  where user_id is null;

create index if not exists recipes_user_id_idx on recipe_book.recipes (user_id);
create index if not exists recipes_is_shared_idx on recipe_book.recipes (is_shared) where is_shared = true;

-- 移除舊的「所有人都能讀」policy
drop policy if exists "recipes are readable by everyone" on recipe_book.recipes;
drop policy if exists "Users can read own or shared recipes" on recipe_book.recipes;
drop policy if exists "Users can insert own recipes" on recipe_book.recipes;
drop policy if exists "Users can update own recipes" on recipe_book.recipes;
drop policy if exists "Users can delete own recipes" on recipe_book.recipes;

-- 讀：分享出去的食譜任何人（含 anon）可讀，私人食譜只有擁有者可讀
create policy "Users can read own or shared recipes"
  on recipe_book.recipes for select
  to anon, authenticated
  using (is_shared = true or auth.uid() = user_id);

-- 寫：只能對自己的食譜做 insert / update / delete
create policy "Users can insert own recipes"
  on recipe_book.recipes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own recipes"
  on recipe_book.recipes for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own recipes"
  on recipe_book.recipes for delete
  to authenticated
  using (auth.uid() = user_id);

grant insert, update, delete on recipe_book.recipes to authenticated;

commit;
