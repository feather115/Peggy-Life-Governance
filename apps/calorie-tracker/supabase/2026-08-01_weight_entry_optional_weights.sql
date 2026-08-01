-- 挑戰賽每週登記補上兩個選填欄位：
-- start_weight / current_weight
-- 用途：協助使用者自己核對體重，也可由前端一鍵換算 kg_diff。

alter table calorie_tracker.weight_entries
  add column if not exists start_weight numeric,
  add column if not exists current_weight numeric;
