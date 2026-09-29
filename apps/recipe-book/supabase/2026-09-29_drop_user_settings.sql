-- 清掉已停用的 recipe_book.user_settings（暱稱第一版）。
-- 2026-07-06 起暱稱改存三個 app 共用的 shared.user_profiles，db.js 已經不讀寫這張表。
--
-- ⚠️ 一定要連 auth.users 上的 trigger 一起刪，而且要在同一個 transaction 裡先刪 trigger：
--    trigger 還在、表卻不見的話，之後每次新增使用者（Email 註冊、LINE 第一次登入）都會失敗，
--    而且 auth.users 是三個 app 共用的，會三個 app 一起壞。
-- 這張表的 RLS 允許任何登入者讀全部列（含 email），刪掉也順便少一個 email 外洩點。
--
-- 在 Supabase SQL Editor 手動執行。drop table 無法復原（表裡只有舊的暱稱/email，
-- 暱稱在 2026-07-06 已經 backfill 進 shared.user_profiles）。

begin;

drop trigger if exists on_auth_user_created_recipe_book on auth.users;
drop function if exists public.handle_new_user_recipe_book();
drop table if exists recipe_book.user_settings;

commit;

notify pgrst, 'reload schema';
