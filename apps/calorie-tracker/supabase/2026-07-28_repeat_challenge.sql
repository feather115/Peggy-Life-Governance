-- 已結束挑戰的建立者可建立新一局，並直接複製上一局全部成員。

create or replace function calorie_tracker.repeat_challenge(
  p_source_challenge_id uuid,
  p_name text,
  p_start_date date,
  p_end_date date,
  p_invite_code text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_new_challenge_id uuid;
begin
  if auth.uid() is null then
    raise exception '必須先登入';
  end if;

  if nullif(btrim(p_name), '') is null then
    raise exception '挑戰名稱不能空白';
  end if;

  if p_end_date <= p_start_date then
    raise exception '結束日期要在開始日期之後';
  end if;

  if upper(p_invite_code) !~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$' then
    raise exception '邀請碼格式錯誤';
  end if;

  if not exists (
    select 1
    from calorie_tracker.challenges
    where id = p_source_challenge_id
      and creator_user_id = auth.uid()
      and status = 'ended'
  ) then
    raise exception '只有已結束挑戰的建立者可以再開一局';
  end if;

  insert into calorie_tracker.challenges (
    name,
    start_date,
    end_date,
    creator_user_id,
    invite_code
  )
  values (
    btrim(p_name),
    p_start_date,
    p_end_date,
    auth.uid(),
    upper(p_invite_code)
  )
  returning id into v_new_challenge_id;

  insert into calorie_tracker.challenge_members (
    challenge_id,
    user_id,
    color
  )
  select
    v_new_challenge_id,
    user_id,
    color
  from calorie_tracker.challenge_members
  where challenge_id = p_source_challenge_id;

  return v_new_challenge_id;
end;
$$;

revoke all on function calorie_tracker.repeat_challenge(uuid, text, date, date, text) from public, anon;
grant execute on function calorie_tracker.repeat_challenge(uuid, text, date, date, text) to authenticated;
