-- ============================================================
--  shared.user_profiles — 暱稱跨 app 共用（calorie-tracker / recipe-book / calendar）
--
--  三個 app 本來各自有自己的暱稱欄位（calorie_tracker.user_settings.display_name、
--  recipe_book.user_settings.display_name），使用者要在每個 app 分開設定。這支表跟
--  shared.line_links 一樣放在共用的 shared schema，任何一個 app 改暱稱，其他 app
--  立刻看到同一個名字。
--
--  ⚠️ 跑這支之前要先跑過：
--  1. packages/shared/supabase/2026-07-01_line_links_to_shared.sql（建立 shared schema）
--  2. apps/recipe-book/supabase/2026-07-04_recipe_book_user_settings.sql
--     （backfill 要 join recipe_book.user_settings，這張表要先存在）
-- ============================================================

begin;

create table if not exists shared.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  created_at timestamptz not null default now()
);

-- backfill：優先沿用 calorie-tracker 既有的暱稱（歷史最久），沒有的話用 recipe-book 的，
-- 兩邊都沒設過暱稱/沒用過那個 app 的人，用 auth.users.email 補一列當後備顯示名稱。
insert into shared.user_profiles (user_id, display_name, email)
select
  u.id,
  coalesce(ct.display_name, rb.display_name),
  coalesce(ct.email, rb.email, u.email)
from auth.users u
left join calorie_tracker.user_settings ct on ct.user_id = u.id
left join recipe_book.user_settings rb on rb.user_id = u.id
on conflict (user_id) do nothing;

alter table shared.user_profiles enable row level security;

drop policy if exists "own profile write" on shared.user_profiles;
create policy "own profile write" on shared.user_profiles
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 暱稱不是敏感資料，開放給所有登入使用者互相讀取（「誰按讚」、挑戰賽排行榜都需要看到
-- 別人的暱稱），比 calorie-tracker 舊的「只有同挑戰成員」政策更寬，但風險可接受。
drop policy if exists "authenticated can read profiles" on shared.user_profiles;
create policy "authenticated can read profiles" on shared.user_profiles
  for select
  to authenticated
  using (true);

grant select, insert, update on shared.user_profiles to authenticated;

-- 新使用者註冊時自動建一列。
-- ⚠️ 這是第三個獨立的 trigger + function，跟 calorie-tracker 的 on_auth_user_created /
-- public.handle_new_user()、recipe-book 的 on_auth_user_created_recipe_book /
-- public.handle_new_user_recipe_book() 都是不同名字——auth.users 上可以同時掛多個
-- trigger，但絕對不能同名，否則 create/drop trigger 會互相覆蓋掉。
create or replace function public.handle_new_user_shared_profile()
returns trigger
language plpgsql
security definer
set search_path = shared, public
as $$
begin
  insert into shared.user_profiles (user_id, email) values (new.id, new.email)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_shared_profile on auth.users;
create trigger on_auth_user_created_shared_profile
  after insert on auth.users
  for each row execute procedure public.handle_new_user_shared_profile();

commit;
