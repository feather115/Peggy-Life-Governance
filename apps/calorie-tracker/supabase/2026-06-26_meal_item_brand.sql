-- ============================================================
--  meal_items 加「品牌」欄位（顯示在今日餐點清單上，跟著快照走）
--  用法：Supabase SQL Editor → 貼上整段 → Run
-- ============================================================

alter table public.meal_items add column if not exists brand text;
