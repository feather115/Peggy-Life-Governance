-- ============================================================
--  暫時回退：把 line_links 從 shared 搬回 calorie_tracker schema
--
--  原因：2026-06-28 把 line_links 搬到新建的 shared schema 後，發現
--  Supabase 平台這個專案的 Data API 一直無法把 `shared` 真正加入
--  exposed schemas（即使 Management API 的 db_schema 設定已確認
--  正確、且做過多次 Restart project，PostgREST 仍持續回
--  PGRST106 invalid schema）。懷疑是這個專案的平台端 bug 或延遲，
--  非我們設定錯誤。
--
--  在平台問題解決前，先把 line_links 搬回 calorie_tracker
--  （已確認在 exposed schemas 清單裡，原本就能正常運作），讓
--  LINE 登入/連結功能恢復。shared schema 留著（之後平台修好可以
--  再搬一次），但暫時不用它。
-- ============================================================

begin;

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'shared' and table_name = 'line_links'
  ) then
    alter table shared.line_links set schema calorie_tracker;
  end if;
end $$;

-- 兜底：全新環境如果還沒建過，直接在 calorie_tracker 建
create table if not exists calorie_tracker.line_links (
  line_sub  text primary key,
  user_id   uuid not null references auth.users(id) on delete cascade,
  linked_at timestamptz not null default now()
);
create index if not exists line_links_user_idx on calorie_tracker.line_links (user_id);

alter table calorie_tracker.line_links enable row level security;
grant select, insert, update, delete on calorie_tracker.line_links to service_role;

commit;
