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
grant usage on schema recipe_book to anon, authenticated;

-- 表 + 索引 + RLS + policy 都會跟著搬
alter table public.recipes set schema recipe_book;

-- PostgREST 用的表權限（RLS 還是會擋）
grant select on all tables in schema recipe_book to anon, authenticated;
alter default privileges in schema recipe_book
  grant select on tables to anon, authenticated;

-- recipes 唯一的 policy「recipes are readable by everyone」用 using (true)
-- 沒有跨表 reference，搬完直接生效，不用重建。

commit;
