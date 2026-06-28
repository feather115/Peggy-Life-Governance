-- ============================================================
--  記錄「每個食物上次被選用/新增/編輯的時間」，用來把食物庫排序成
--  最近用過的在最上面（內建食物用 id 如 'egg'，自訂食物用 custom_foods.id）
--  用法：Supabase SQL Editor → 貼上整段 → Run
-- ============================================================

create table if not exists public.food_usage (
  user_id      uuid not null references auth.users(id) on delete cascade,
  food_ref     text not null,
  last_used_at timestamptz not null default now(),
  primary key (user_id, food_ref)
);

alter table public.food_usage enable row level security;

drop policy if exists "own food_usage" on public.food_usage;
create policy "own food_usage" on public.food_usage
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
