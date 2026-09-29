-- 清掉 2026-07-15 事件＋日記合併時留下的備份表 calendar.diary_entries_bak
-- （見 2026-07-15_merge_diary_into_events.sql 第 5 步）。合併已上線兩個多月，
-- 程式碼只讀 events，沒有任何地方再用這張表。
--
-- 安全檢查：備份表的每一筆，在 events 都要找得到同一個使用者、同一個 created_at 的紀錄
-- （合併時 created_at 是原樣搬過去的）。找不到的話不刪、直接報錯並列出筆數。
-- 若確認那幾筆是合併後自己在 app 裡刪掉的紀錄，可以改成直接執行：
--   drop table calendar.diary_entries_bak;
--
-- 在 Supabase SQL Editor 手動執行。drop table 無法復原。

do $$
declare
  missing int;
begin
  if to_regclass('calendar.diary_entries_bak') is null then
    raise notice 'calendar.diary_entries_bak 不存在，略過';
    return;
  end if;

  select count(*) into missing
    from calendar.diary_entries_bak d
   where not exists (
     select 1 from calendar.events e
      where e.user_id = d.user_id and e.created_at = d.created_at
   );

  if missing > 0 then
    raise exception '備份表還有 % 筆在 events 找不到對應，先人工確認再刪', missing;
  end if;

  drop table calendar.diary_entries_bak;
end $$;
