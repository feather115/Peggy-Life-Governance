-- ============================================================
--  修正「邀請碼加入」失敗的問題
--  原因：challenges 的 RLS 只允許「建立者」或「已經是成員」的人讀取，
--  所以還沒加入的朋友用邀請碼查詢時，資料庫直接回傳空結果（被 RLS 擋掉），
--  App 顯示「找不到這個邀請碼」——即使碼是對的。
--  解法：用 SECURITY DEFINER 函式繞過 RLS，只回傳 id/name 給任何登入者查詢。
--  用法：Supabase SQL Editor → 貼上整段 → Run
-- ============================================================

create or replace function public.find_challenge_by_code(p_code text)
returns table(id uuid, name text)
language sql
security definer
stable
set search_path = public
as $$
  select id, name from public.challenges where invite_code = upper(p_code);
$$;
