-- ============================================================
--  Schema isolation migration (2026-06-28)
--
--  把 calorie-tracker 用到的 11 張表 + 2 個 RPC function 從 public
--  搬到獨立的 calorie_tracker schema，與 recipe-book（搬到 recipe_book
--  schema）在邏輯上完全隔開。auth.users 維持在 auth schema（兩個 app
--  共用使用者池）。
--
--  ⚠️ 執行前要先做：
--  1. Supabase Dashboard → Settings → API → Exposed schemas
--     加上 `calorie_tracker`（與 `recipe_book`，如果還沒加）
--  2. 儲存，等 30 秒讓 PostgREST 重新載入
--
--  ⚠️ 執行後一定要：
--  - 重新部署 calorie-tracker（程式碼會用 db.schema = 'calorie_tracker'
--    連線，不重新部署的話舊 deploy 會 404）
--
--  本檔可重複執行（搬完後再跑會在 alter table set schema 那步報錯，
--  但不會弄壞資料；建議要重跑時先註解掉已執行過的 alter table 行）。
-- ============================================================

begin;

-- 1) 建 schema 並授權給 PostgREST 用的 role
create schema if not exists calorie_tracker;
grant usage on schema calorie_tracker to anon, authenticated;

-- 2) 搬資料表（FK / 索引 / RLS 開關 / policy 都會跟著走，
--    policy body 裡的 public.xxx 寫法不會被自動改寫，下面會 drop & recreate）
alter table public.user_settings     set schema calorie_tracker;
alter table public.tag_defs          set schema calorie_tracker;
alter table public.custom_foods      set schema calorie_tracker;
alter table public.day_records       set schema calorie_tracker;
alter table public.day_tags          set schema calorie_tracker;
alter table public.meal_items        set schema calorie_tracker;
alter table public.food_usage        set schema calorie_tracker;
alter table public.challenges        set schema calorie_tracker;
alter table public.challenge_members set schema calorie_tracker;
alter table public.weight_entries    set schema calorie_tracker;
alter table public.line_links        set schema calorie_tracker;

-- 3) 給新 schema 的表 grant select/insert/update/delete
--    （PostgREST 用，實際存取仍由 RLS 控管）
grant select, insert, update, delete on all tables in schema calorie_tracker to authenticated;
grant select, insert, update, delete on all tables in schema calorie_tracker to anon;
-- 未來新增的表也自動有同樣的權限
alter default privileges in schema calorie_tracker
  grant select, insert, update, delete on tables to authenticated, anon;
alter default privileges in schema calorie_tracker
  grant usage, select on sequences to authenticated, anon;

-- 4) 重建跨表 reference 的 RLS policy
--    （policy 跟著表搬到 calorie_tracker schema 了，但 policy body 裡
--    的 public.day_records 這種寫法不會被自動改寫，所以要 drop & recreate）

drop policy if exists "own day_tags" on calorie_tracker.day_tags;
create policy "own day_tags" on calorie_tracker.day_tags
  for all
  using (exists (select 1 from calorie_tracker.day_records dr
                 where dr.id = day_tags.day_record_id and dr.user_id = auth.uid()))
  with check (exists (select 1 from calorie_tracker.day_records dr
                      where dr.id = day_tags.day_record_id and dr.user_id = auth.uid()));

drop policy if exists "own meal_items" on calorie_tracker.meal_items;
create policy "own meal_items" on calorie_tracker.meal_items
  for all
  using (exists (select 1 from calorie_tracker.day_records dr
                 where dr.id = meal_items.day_record_id and dr.user_id = auth.uid()))
  with check (exists (select 1 from calorie_tracker.day_records dr
                      where dr.id = meal_items.day_record_id and dr.user_id = auth.uid()));

drop policy if exists "co-members can read display_name" on calorie_tracker.user_settings;
create policy "co-members can read display_name" on calorie_tracker.user_settings
  for select using (
    exists (
      select 1
        from calorie_tracker.challenge_members cm1
        join calorie_tracker.challenge_members cm2 on cm1.challenge_id = cm2.challenge_id
       where cm1.user_id = auth.uid()
         and cm2.user_id = user_settings.user_id
    )
  );

-- 5) 搬 helper / RPC function 到新 schema
--    （RPC 函式要在 db.schema 設定的 schema 裡，supabase.rpc() 才能呼叫到）

drop function if exists public.is_challenge_member(uuid) cascade;
create or replace function calorie_tracker.is_challenge_member(cid uuid)
returns boolean
language sql
security definer
stable
set search_path = calorie_tracker, public
as $$
  select exists (
    select 1 from calorie_tracker.challenge_members
    where challenge_id = cid and user_id = auth.uid()
  );
$$;
grant execute on function calorie_tracker.is_challenge_member(uuid) to anon, authenticated;

drop function if exists public.find_challenge_by_code(text) cascade;
create or replace function calorie_tracker.find_challenge_by_code(p_code text)
returns table(id uuid, name text)
language sql
security definer
stable
set search_path = calorie_tracker, public
as $$
  select id, name from calorie_tracker.challenges where invite_code = upper(p_code);
$$;
grant execute on function calorie_tracker.find_challenge_by_code(text) to anon, authenticated;

-- 6) 重建剩下幾條 reference 到上面 function 的 policy
--    （上面 drop function ... cascade 會把這些 policy 砍掉，要重建）
drop policy if exists "members & creator can read" on calorie_tracker.challenges;
create policy "members & creator can read" on calorie_tracker.challenges
  for select using (
    creator_user_id = auth.uid()
    or calorie_tracker.is_challenge_member(id)
  );

drop policy if exists "members can read members" on calorie_tracker.challenge_members;
create policy "members can read members" on calorie_tracker.challenge_members
  for select using (calorie_tracker.is_challenge_member(challenge_id));

drop policy if exists "members can read entries" on calorie_tracker.weight_entries;
create policy "members can read entries" on calorie_tracker.weight_entries
  for select using (calorie_tracker.is_challenge_member(challenge_id));

drop policy if exists "members write own entries" on calorie_tracker.weight_entries;
create policy "members write own entries" on calorie_tracker.weight_entries
  for insert with check (
    user_id = auth.uid() and calorie_tracker.is_challenge_member(challenge_id)
  );

-- 7) 更新註冊 trigger function（trigger 本體留在 auth.users 上不動，
--    只把 function body 指向新 schema 的表）
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = calorie_tracker, public
as $$
begin
  insert into calorie_tracker.user_settings (user_id, email) values (new.id, new.email);
  insert into calorie_tracker.tag_defs (user_id, type, label, color, sort_order) values
    (new.id, 'fasting', '168',    null,      0),
    (new.id, 'fasting', '輕斷食', null,      1),
    (new.id, 'other',   '聚餐',   '#E8A13C', 0),
    (new.id, 'other',   '外食',   '#5FA8D3', 1),
    (new.id, 'other',   '旅行',   '#8B5CF6', 2),
    (new.id, 'other',   '放縱日', '#D9544F', 3);
  return new;
end;
$$;

commit;
