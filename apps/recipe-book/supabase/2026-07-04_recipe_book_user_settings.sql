-- ============================================================
--  recipe_book.user_settings — 給「顯示誰按讚」用的暱稱/email 對照表
--
--  recipe-book 本來沒有任何 user profile 機制（不像 calorie-tracker 有
--  user_settings.display_name）。按讚清單只存 user_id，前端沒辦法把
--  user_id 換成人看得懂的名字，所以補這張表。
--
--  跟 calorie-tracker 的 user_settings 不一樣的地方：這裡的讀取 policy是
--  對所有登入使用者開放（不是只有「同挑戰成員」），因為 recipe-book 本來就是
--  全家共用同一本食譜、按讚名單本來就是所有登入者互相可見（loadAllLikes()
--  撈的是全部 rows），不是需要分組隔離的場景。
-- ============================================================

begin;

create table if not exists recipe_book.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  created_at timestamptz not null default now()
);

-- backfill 既有帳號（沒有的話「誰按讚」會顯示不出名字，只能等下次登入觸發 trigger）
insert into recipe_book.user_settings (user_id, email)
select id, email from auth.users
on conflict (user_id) do nothing;

alter table recipe_book.user_settings enable row level security;

drop policy if exists "own user_settings write" on recipe_book.user_settings;
create policy "own user_settings write" on recipe_book.user_settings
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "authenticated can read display names" on recipe_book.user_settings;
create policy "authenticated can read display names" on recipe_book.user_settings
  for select
  to authenticated
  using (true);

grant select, insert, update on recipe_book.user_settings to authenticated;

-- 新使用者註冊時自動建立這張表的一列。
-- ⚠️ 這是獨立的 trigger + function，跟 calorie-tracker 的 on_auth_user_created /
-- public.handle_new_user() 是兩個不同名字——auth.users 上可以同時掛多個 trigger，
-- 但如果名字一樣，drop/create 會互相覆蓋掉對方，絕對不能重名。
create or replace function public.handle_new_user_recipe_book()
returns trigger
language plpgsql
security definer
set search_path = recipe_book, public
as $$
begin
  insert into recipe_book.user_settings (user_id, email) values (new.id, new.email)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_recipe_book on auth.users;
create trigger on_auth_user_created_recipe_book
  after insert on auth.users
  for each row execute procedure public.handle_new_user_recipe_book();

commit;
