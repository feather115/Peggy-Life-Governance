-- ============================================================
--  custom_foods 加「品牌」「備註」兩個選填欄位
--  用法：Supabase SQL Editor → 貼上整段 → Run
-- ============================================================

alter table public.custom_foods add column if not exists brand text;
alter table public.custom_foods add column if not exists note text;
