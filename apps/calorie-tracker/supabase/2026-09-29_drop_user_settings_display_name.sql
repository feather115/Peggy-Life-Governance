-- 清掉 calorie_tracker.user_settings 已停用的 display_name 欄位。
-- 2026-07-06 起暱稱改存三個 app 共用的 shared.user_profiles（見 packages/shared/supabase/
-- 2026-07-06_shared_user_profiles.sql，當時已 backfill），前端與 api 都不再讀寫這個欄位。
--
-- 一併刪掉當初為了「同挑戰成員互看暱稱」開的 policy "co-members can read display_name"：
-- 現在挑戰成員名稱改查 shared.user_profiles，這條 policy 只剩下讓同挑戰成員互相讀到
-- 彼此的目標設定與 email，沒有任何功能在用。
--
-- 在 Supabase SQL Editor 手動執行。drop column 無法復原。

begin;

drop policy if exists "co-members can read display_name" on calorie_tracker.user_settings;
alter table calorie_tracker.user_settings drop column if exists display_name;

commit;

notify pgrst, 'reload schema';
