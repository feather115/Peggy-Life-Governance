-- ============================================================
--  Weight Challenge feature — 一鍵建表 SQL
--  用法：Supabase SQL Editor → 貼上整段 → Run
--  本 migration 不會動到原本飲食卡路里 App 的表。
-- ============================================================

-- 1) challenges ───────────────────────────────────────────────
create table if not exists public.challenges (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  start_date      date not null,
  end_date        date not null,
  status          text not null default 'active' check (status in ('active','ended')),
  winner_user_id  uuid references auth.users(id) on delete set null,
  creator_user_id uuid not null references auth.users(id) on delete cascade,
  invite_code     text not null unique,
  created_at      timestamptz not null default now()
);
create index if not exists challenges_creator_idx on public.challenges (creator_user_id);
create index if not exists challenges_code_idx on public.challenges (invite_code);

-- 2) challenge_members (多對多) ───────────────────────────────
create table if not exists public.challenge_members (
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  joined_at    timestamptz not null default now(),
  color        text,
  primary key (challenge_id, user_id)
);
create index if not exists challenge_members_user_idx on public.challenge_members (user_id);

-- 3) weight_entries ───────────────────────────────────────────
create table if not exists public.weight_entries (
  id           uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  kg_diff      numeric not null,
  week_label   date not null,
  recorded_at  timestamptz not null default now(),
  unique (challenge_id, user_id, week_label)
);
create index if not exists weight_entries_challenge_idx on public.weight_entries (challenge_id);

-- ============================================================
--  RLS — 「同挑戰成員可互相看到資料；只能改自己的」
-- ============================================================
alter table public.challenges        enable row level security;
alter table public.challenge_members enable row level security;
alter table public.weight_entries    enable row level security;

-- helper: 確認自己是某挑戰的成員（避免 RLS 遞迴查詢自身）
create or replace function public.is_challenge_member(cid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.challenge_members
    where challenge_id = cid and user_id = auth.uid()
  );
$$;

-- 用邀請碼查詢挑戰（給「還沒加入」的人用，繞過下面 select policy 的限制）
create or replace function public.find_challenge_by_code(p_code text)
returns table(id uuid, name text)
language sql
security definer
stable
set search_path = public
as $$
  select id, name from public.challenges where invite_code = upper(p_code);
$$;

-- challenges ──────────────────────────────────────────────────
-- 讀：(a) 自己建立的  (b) 自己是成員的  (c) 任何人皆可透過 invite_code 查詢（為了「輸入邀請碼加入」流程）
drop policy if exists "members & creator can read" on public.challenges;
create policy "members & creator can read" on public.challenges
  for select using (
    creator_user_id = auth.uid()
    or public.is_challenge_member(id)
  );

-- 寫：任何登入者可建立（必須 creator_user_id = self），只有建立者可更新、刪除
drop policy if exists "create own challenge" on public.challenges;
create policy "create own challenge" on public.challenges
  for insert with check (creator_user_id = auth.uid());

drop policy if exists "update own challenge" on public.challenges;
create policy "update own challenge" on public.challenges
  for update using (creator_user_id = auth.uid())
              with check (creator_user_id = auth.uid());

drop policy if exists "delete own challenge" on public.challenges;
create policy "delete own challenge" on public.challenges
  for delete using (creator_user_id = auth.uid());

-- challenge_members ───────────────────────────────────────────
-- 讀：自己是成員的挑戰，其他成員 row 可見
drop policy if exists "members can read members" on public.challenge_members;
create policy "members can read members" on public.challenge_members
  for select using (public.is_challenge_member(challenge_id));

-- 寫：只能加入/退出自己這一列
drop policy if exists "join self" on public.challenge_members;
create policy "join self" on public.challenge_members
  for insert with check (user_id = auth.uid());

drop policy if exists "leave self" on public.challenge_members;
create policy "leave self" on public.challenge_members
  for delete using (user_id = auth.uid());

drop policy if exists "update own color" on public.challenge_members;
create policy "update own color" on public.challenge_members
  for update using (user_id = auth.uid())
              with check (user_id = auth.uid());

-- weight_entries ──────────────────────────────────────────────
-- 讀：自己是成員的挑戰，所有成員的紀錄可見（排行榜需要）
drop policy if exists "members can read entries" on public.weight_entries;
create policy "members can read entries" on public.weight_entries
  for select using (public.is_challenge_member(challenge_id));

-- 寫：只能寫自己的 row，且必須是該挑戰的成員
drop policy if exists "members write own entries" on public.weight_entries;
create policy "members write own entries" on public.weight_entries
  for insert with check (
    user_id = auth.uid() and public.is_challenge_member(challenge_id)
  );

drop policy if exists "members update own entries" on public.weight_entries;
create policy "members update own entries" on public.weight_entries
  for update using (user_id = auth.uid())
              with check (user_id = auth.uid());

drop policy if exists "members delete own entries" on public.weight_entries;
create policy "members delete own entries" on public.weight_entries
  for delete using (user_id = auth.uid());

-- ============================================================
--  讓 weight_entries 可被「同 challenge 其他成員的 display_name」查詢
--  方法：透過 user_settings 的 RLS — 但 user_settings 預設只能看自己的
--  解法：另外開一條 policy 讓「同 challenge 成員」可以互相看 display_name
-- ============================================================
drop policy if exists "co-members can read display_name" on public.user_settings;
create policy "co-members can read display_name" on public.user_settings
  for select using (
    exists (
      select 1 from public.challenge_members cm1
      join public.challenge_members cm2 on cm1.challenge_id = cm2.challenge_id
      where cm1.user_id = auth.uid() and cm2.user_id = user_settings.user_id
    )
  );
