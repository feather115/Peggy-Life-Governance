-- 日記加「標題」欄位：日檢視卡片的大字標題（對應 2026-07-10 新版當日排版設計稿），
-- 選填，跟 note（文字描述）分開存。
-- 在 Supabase SQL Editor 手動執行。

alter table calendar.diary_entries
  add column title text;

notify pgrst, 'reload schema';
