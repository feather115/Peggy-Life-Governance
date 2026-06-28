-- ============================================================
--  challenge_members 加 color 欄位，讓成員可自訂自己在圖表/排行榜的顏色
--  用法：Supabase SQL Editor → 貼上整段 → Run
-- ============================================================

alter table public.challenge_members add column if not exists color text;

-- 成員可以改自己那一列的顏色（原本只有 insert/delete，沒有 update）
drop policy if exists "update own color" on public.challenge_members;
create policy "update own color" on public.challenge_members
  for update using (user_id = auth.uid())
              with check (user_id = auth.uid());
