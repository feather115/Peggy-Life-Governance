-- 日記地點改多選：diary_entries.location（text）→ locations（text[]）
-- 既有單一地點轉成單元素陣列，空值/空字串轉成空陣列。
-- 在 Supabase SQL Editor 手動執行。

alter table calendar.diary_entries rename column location to locations;

alter table calendar.diary_entries
  alter column locations type text[]
  using case
    when locations is null or trim(locations) = '' then '{}'::text[]
    else array[locations]
  end;

notify pgrst, 'reload schema';
