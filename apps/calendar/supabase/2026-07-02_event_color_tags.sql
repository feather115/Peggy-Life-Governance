-- 事件加上顏色與標籤欄位（設計改版新增：事件表單的顏色選擇器 + 標籤）

alter table calendar.events add column if not exists color text;
alter table calendar.events add column if not exists tags text[] not null default '{}';
