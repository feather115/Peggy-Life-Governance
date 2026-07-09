-- 標籤支援子標籤（第三層）：tag_categories.tags 從 text[] 改成 jsonb。
-- 新格式：[{ "name": "運動", "subs": ["跑步", "重訓"] }, ...]
-- 日記 diary_entries.tags 維持扁平文字陣列，子標籤選取後跟主標籤一樣存名字。
-- 可重複執行：型別已是 jsonb 時第一步跳過，第二步只轉換還是字串元素的舊資料。

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'calendar' and table_name = 'tag_categories'
      and column_name = 'tags' and data_type = 'ARRAY'
  ) then
    alter table calendar.tag_categories alter column tags drop default;
    alter table calendar.tag_categories alter column tags type jsonb using to_jsonb(tags);
    alter table calendar.tag_categories alter column tags set default '[]'::jsonb;
  end if;
end $$;

-- 把舊的純字串元素包成 { name, subs } 物件（只處理還沒轉換過的列）
update calendar.tag_categories
set tags = coalesce(
  (select jsonb_agg(jsonb_build_object('name', e, 'subs', '[]'::jsonb)) from jsonb_array_elements_text(tags) as e),
  '[]'::jsonb
)
where exists (
  select 1 from jsonb_array_elements(tags) as e where jsonb_typeof(e) = 'string'
);
