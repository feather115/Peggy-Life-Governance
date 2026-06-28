-- ============================================================
--  LINE 帳號連結對照表：記錄「這個 LINE 使用者」對應到「哪個既有的 email 帳號」
--  只有伺服器端（service_role）會碰這張表，前端完全不會直接存取，所以開 RLS 但不開任何 policy（預設全擋）
--  用法：Supabase SQL Editor → 貼上整段 → Run
-- ============================================================

create table if not exists public.line_links (
  line_sub   text primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  linked_at  timestamptz not null default now()
);
create index if not exists line_links_user_idx on public.line_links (user_id);

alter table public.line_links enable row level security;
