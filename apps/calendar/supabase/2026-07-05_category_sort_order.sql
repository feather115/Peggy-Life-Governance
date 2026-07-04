alter table calendar.tag_categories add column if not exists sort_order int not null default 0;

with ordered as (
  select id, row_number() over (partition by user_id order by created_at) - 1 as rn
  from calendar.tag_categories
)
update calendar.tag_categories t
set sort_order = ordered.rn
from ordered
where t.id = ordered.id;
