-- 日記加「＃快速注記」欄位：自由發揮的俏皮短句（例如「今天吃好多」），
-- 跟結構化的 tags 分開存，不進選項庫。
-- 在 Supabase SQL Editor 手動執行。

alter table calendar.diary_entries
  add column hashtags text[] not null default '{}';

notify pgrst, 'reload schema';
