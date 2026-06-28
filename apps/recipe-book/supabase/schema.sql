-- Recipe Book schema
-- 一次跑完即可建立 recipes 表 + 公開讀取的 RLS policy。
-- cooking_history（料理行事曆紀錄）放在 2026-06-28_recipe_cook_records.sql migration，
-- 直接建在 recipe_book schema，所以這份 schema.sql 不再含 cooking_history。

create extension if not exists pgcrypto;

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text[] default '{}',          -- 多分類標籤
  ingredients jsonb default '[]'::jsonb, -- [{ name, amount, unit, ... }]
  steps jsonb default '[]'::jsonb,       -- [{ order, text, ... }]
  notes text,
  image_url text,
  last_cooked_at timestamptz,
  yield_info jsonb default '[]'::jsonb,  -- 份量/產出資訊
  parameters jsonb default '{}'::jsonb,  -- 動態製作參數（溫度、時間、配方比例等）
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recipes_category_gin on public.recipes using gin (category);
create index if not exists recipes_title_idx on public.recipes (title);

-- RLS：目前前端只用 anon key 做唯讀瀏覽
alter table public.recipes enable row level security;

drop policy if exists "recipes are readable by everyone" on public.recipes;
create policy "recipes are readable by everyone"
  on public.recipes for select
  using (true);

-- recipes 寫入暫時走 service_role 或 SQL Editor 手動匯入，所以不開放 anon 寫入
