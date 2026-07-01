-- ============================================================
--  把 line_links 從 calorie_tracker 搬回 shared schema
--
--  2026-06-29 因為 shared schema 一直卡 PGRST106 (Invalid schema) 而回退到
--  calorie_tracker。2026-07-01 找到真正原因：Supabase Dashboard 的
--  Exposed schemas 設定跟 PostgREST 實際讀的 Postgres authenticator 角色
--  設定是兩層，會不同步，這是 Supabase 官方已知 bug，不是我們設定錯。
--  正確修法：ALTER ROLE authenticator SET pgrst.db_schemas + NOTIFY pgrst。
--  詳見 docs/new-app-sop.md 第 3 節。
--
--  ⚠️ 跑這支之前要確認 shared schema 已存在（2026-06-28 那次 migration 建的，
--  沒被刪掉，只是空的）
--
--  ⚠️ 跑完這支之後，一定要接著跑（在同一個 SQL Editor session 或另開一個都可以）：
--    ALTER ROLE authenticator SET pgrst.db_schemas = 'public, calorie_tracker, recipe_book, calendar, shared, graphql_public';
--    NOTIFY pgrst, 'reload config';
--  （schema 清單要包含所有現有 app 的 schema，不是只放 shared，不然會把其他 app 擠掉）
--
--  ⚠️ Supabase Dashboard → Integrations → Data API → Settings → Exposed schemas
--  也要記得把 shared 加進去勾選（雖然靠 ALTER ROLE 已經生效，但保持 Dashboard 顯示
--  一致，避免以後看 Dashboard 誤判成沒 expose）
-- ============================================================

begin;

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'calorie_tracker' and table_name = 'line_links'
  ) then
    alter table calorie_tracker.line_links set schema shared;
  end if;
end $$;

-- 兜底：全新環境如果還沒建過，直接在 shared 建
create table if not exists shared.line_links (
  line_sub  text primary key,
  user_id   uuid not null references auth.users(id) on delete cascade,
  linked_at timestamptz not null default now()
);
create index if not exists line_links_user_idx on shared.line_links (user_id);

alter table shared.line_links enable row level security;

-- 前端不會直接碰這張表，只有 service_role 能寫
grant select, insert, update, delete on shared.line_links to service_role;

commit;
