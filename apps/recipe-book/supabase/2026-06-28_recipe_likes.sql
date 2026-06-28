-- ============================================================
--  食譜按讚 (recipe_likes)
--
--  任何登入者可對任何看得到的食譜按讚；按讚數所有人（含 anon）都看得到。
--  「我喜愛的食譜」= 我有按讚的 + 食譜還活著 + 我看得到（RLS 已過濾）。
--
--  ⚠️ 跑這支之前要：
--  1. 已經跑過 schema.sql + 2026-06-28_schema_isolation.sql
-- ============================================================

begin;

create table if not exists recipe_book.recipe_likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id bigint not null references recipe_book.recipes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, recipe_id)
);

create index if not exists recipe_likes_recipe_idx on recipe_book.recipe_likes (recipe_id);
create index if not exists recipe_likes_user_idx on recipe_book.recipe_likes (user_id);

alter table recipe_book.recipe_likes enable row level security;

drop policy if exists "Likes are public" on recipe_book.recipe_likes;
drop policy if exists "Users can like for themselves" on recipe_book.recipe_likes;
drop policy if exists "Users can unlike their own" on recipe_book.recipe_likes;

create policy "Likes are public"
  on recipe_book.recipe_likes for select
  to anon, authenticated
  using (true);

create policy "Users can like for themselves"
  on recipe_book.recipe_likes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can unlike their own"
  on recipe_book.recipe_likes for delete
  to authenticated
  using (auth.uid() = user_id);

grant select on recipe_book.recipe_likes to anon, authenticated;
grant insert, delete on recipe_book.recipe_likes to authenticated;

commit;
