-- ============================================================
--  把新使用者的預設斷食標籤精簡為「168 / 輕斷食」
--  （現有使用者的標籤不會被動到 —— 他們可在「設定 → 標籤管理」自己增刪）
--  用法：Supabase SQL Editor → 貼上整段 → Run
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_settings (user_id, email) values (new.id, new.email);
  insert into public.tag_defs (user_id, type, label, sort_order) values
    (new.id, 'fasting', '168',     0),
    (new.id, 'fasting', '輕斷食',  1),
    (new.id, 'other',   '聚餐',    0),
    (new.id, 'other',   '外食',    1),
    (new.id, 'other',   '旅行',    2),
    (new.id, 'other',   '放縱日',  3);
  return new;
end;
$$;
