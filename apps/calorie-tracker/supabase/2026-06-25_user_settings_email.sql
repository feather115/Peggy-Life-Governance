-- ============================================================
--  user_settings 加 email 欄位（給挑戰排行榜當「沒設暱稱時的後備名稱」）
--  用法：Supabase SQL Editor → 貼上整段 → Run
-- ============================================================

alter table public.user_settings
  add column if not exists email text;

-- 為已存在的使用者補資料
update public.user_settings us
set email = u.email
from auth.users u
where us.user_id = u.id and us.email is null;

-- 把註冊 trigger 改成也順便存 email
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_settings (user_id, email) values (new.id, new.email);
  insert into public.tag_defs (user_id, type, label, sort_order) values
    (new.id, 'fasting', '168 斷食', 0),
    (new.id, 'fasting', '16:8',     1),
    (new.id, 'fasting', '20:4',     2),
    (new.id, 'fasting', 'OMAD',     3),
    (new.id, 'other',   '聚餐',     0),
    (new.id, 'other',   '外食',     1),
    (new.id, 'other',   '旅行',     2),
    (new.id, 'other',   '放縱日',   3);
  return new;
end;
$$;
