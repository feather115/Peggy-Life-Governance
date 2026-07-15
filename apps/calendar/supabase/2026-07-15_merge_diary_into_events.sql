-- 事件與日記合併成單一實體：日記不再是獨立的一張表，改成 events 的「回顧面」欄位。
-- 設計動機：一筆行程過期後其實就是日記，兩者是同一列在時間軸上的前後階段，不是兩種東西。
-- events 保留當家（既有 id / RLS / index 不動），把 diary_entries 的欄位併進來、資料搬進來，
-- 時間統一成 start_at / end_at（timestamptz）。這是唯一有損轉換：日記的 time 是「本地牆上時間」，
-- 一律以 Asia/Taipei 換算成 timestamptz。
-- 在 Supabase SQL Editor 手動執行。跑完前應用程式的新版程式碼會查不到新欄位而報錯，兩者要一起上。

-- 1. events 補上日記側欄位（皆可空 / 有預設，不影響既有事件）
alter table calendar.events
  add column if not exists note        text,                       -- 回顧：今天的感覺（跟 description 計畫備註並存）
  add column if not exists locations   text[] not null default '{}', -- 地點改多選（併入既有單一 location）
  add column if not exists diary_tags  text[] not null default '{}', -- 分類標籤（tag_categories 那套；跟選項庫 tags 分開存）
  add column if not exists tag_details jsonb  not null default '{}'::jsonb,
  add column if not exists hashtags    text[] not null default '{}';

-- 2. 既有事件的單一 location 併進 locations 陣列
update calendar.events
  set locations = case when location is null or trim(location) = ''
                       then '{}'::text[] else array[location] end
  where locations = '{}';

-- 3. title 放寬可空（純日記可以沒有標題）
alter table calendar.events alter column title drop not null;

-- 4. 日記整批插進 events。時間換算是關鍵：diary.time / end_time 是本地牆上時間字串。
insert into calendar.events
  (user_id, title, note, start_at, end_at, all_day,
   locations, people, tags, diary_tags, tag_details, hashtags, created_at)
select
  user_id, title, note,
  case when all_day
       then (entry_date::text || ' 00:00')::timestamp at time zone 'Asia/Taipei'
       else (entry_date::text || ' ' || coalesce(nullif(time, ''), '00:00'))::timestamp at time zone 'Asia/Taipei'
  end,
  case when all_day or end_time is null or end_time = '' then null
       else (entry_date::text || ' ' || end_time)::timestamp at time zone 'Asia/Taipei'
  end,
  all_day,
  locations,
  people,
  '{}'::text[],   -- 日記沒有選項庫 tags，留空
  tags,           -- 日記原本的 tags（分類標籤）搬進 diary_tags
  tag_details,
  hashtags,
  created_at
from calendar.diary_entries;

-- 5. 驗證筆數與時間無誤後，再手動執行下面兩行（先別急著跑，確認新版 app 運作正常後才收尾）：
--    diary_entries 先改名備份、不直接 drop；location 欄位確認沒人再讀後再拿掉。
-- alter table calendar.events drop column location;
-- alter table calendar.diary_entries rename to diary_entries_bak;

notify pgrst, 'reload schema';
