-- 挑戰成員補上兩個選填欄位：
-- start_weight / current_weight
-- 用途：獨立保存每位挑戰者自己的起始體重與目前體重，
-- 不跟每週 kg_diff 綁在一起。

alter table calorie_tracker.challenge_members
  add column if not exists start_weight numeric,
  add column if not exists current_weight numeric;
