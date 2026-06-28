-- 記錄原因標籤顏色：讓報表月曆可以用每個 reason tag 的自訂顏色畫點
alter table public.tag_defs add column if not exists color text;

update public.tag_defs
set color = '#E8A13C'
where type = 'other'
  and color is null;

