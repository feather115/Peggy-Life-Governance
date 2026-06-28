-- ============================================================
--  Hotfix: 把 recipe_book.recipes 上所有 SELECT policy 清乾淨，
--  只保留新的「擁有者或已分享」policy。
--
--  問題：跑了 2026-06-28_recipe_ownership.sql 之後，anon 還是看得到全部食譜。
--  原因：舊的「recipes are readable by everyone」policy 可能還在
--  （schema 搬移 + drop policy if exists 的名字大小寫不一致等）。
--  PostgreSQL 多個 SELECT policy 是 OR 邏輯，舊的 using (true) 一旦留著就會
--  讓所有人看到全部。
-- ============================================================

begin;

-- 動態 drop 所有 recipe_book.recipes 上的 SELECT policy（最保險）
do $$
declare
  pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'recipe_book' and tablename = 'recipes' and cmd = 'SELECT'
  loop
    execute format('drop policy %I on recipe_book.recipes', pol.policyname);
  end loop;
end $$;

-- 重建擁有者或分享才看得到的 select policy
create policy "Users can read own or shared recipes"
  on recipe_book.recipes for select
  to anon, authenticated
  using (is_shared = true or auth.uid() = user_id);

commit;
