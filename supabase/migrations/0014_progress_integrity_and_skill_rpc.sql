-- Follow-up fixes from the correctness audit.

-- ============================================================================
-- 1. XP and the leaderboard were client-forgeable.
--
-- user_progress and user_resource_progress were `for all` with
-- `with check (auth.uid() = user_id)`, so a user could POST arbitrary rows for
-- themselves — a few thousand {"status":"done"} inserts recomputed XP straight
-- to the top of the (now always-on) leaderboard, and unlocked skills on the
-- way. Reads stay open; writes now go exclusively through the SECURITY DEFINER
-- RPCs, which is already how user_xp/user_streak/user_skills are handled.
--
-- Safe because nothing writes these tables from the client: every reference in
-- src/lib/queries.ts is a .select(), and all mutations already route through
-- set_topic_status / set_resource_progress / sync_topic_progress, which bypass
-- RLS as definers.
-- ============================================================================

drop policy if exists "own rows" on public.user_progress;
create policy "own rows read" on public.user_progress
  for select using (auth.uid() = user_id);

drop policy if exists "own rows" on public.user_resource_progress;
create policy "own rows read" on public.user_resource_progress
  for select using (auth.uid() = user_id);

-- ============================================================================
-- 2. "Hard" in review did not actually shorten the interval.
--
-- v_stage := least(v_stage + p_quality, 5) leaves the stage untouched when
-- quality is 0, so a card at stage 4 rated "Hard" came back in 30 days while
-- the UI promised "Rescheduled for tomorrow". Hard now resets the card to
-- stage 0, which is what the label has always claimed.
--
-- Also returns the resulting date so the toast can state the real one instead
-- of a hardcoded string.
-- ============================================================================

drop function if exists public.review_topic(text, int);

create or replace function public.review_topic(p_topic_id text, p_quality int)
returns date
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_stage int;
  v_ease numeric;
  v_next date;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;
  if p_quality not in (0, 1, 2) then
    raise exception 'invalid quality %', p_quality;
  end if;

  select interval_stage, ease into v_stage, v_ease
  from public.spaced_repetition
  where user_id = v_user and topic_id = p_topic_id
  for update;

  if not found then
    raise exception 'no spaced-repetition card for this topic yet';
  end if;

  -- Hard sends the card back to the start; Good/Easy advance as before.
  if p_quality = 0 then
    v_stage := 0;
  else
    v_stage := least(v_stage + p_quality, 5);
  end if;

  v_ease := greatest(1.3, v_ease + (array[-0.3, 0, 0.1])[p_quality + 1]);
  v_next := current_date + public.sr_interval_days(v_stage);

  update public.spaced_repetition
  set interval_stage = v_stage,
      ease = v_ease,
      reps = reps + 1,
      next_review_date = v_next,
      updated_at = now()
  where user_id = v_user and topic_id = p_topic_id;

  return v_next;
end;
$$;

-- ============================================================================
-- 3. Skills progress silently read as all-zeros at production catalogue size.
--
-- getSkillProgress() sent every distinct skill_resources.resource_id as an
-- .in() filter — ~700 ids, a ~14KB query string, three times over. Past the
-- gateway's request-line limit that returns 414; the caller destructured only
-- `data`, so the error vanished and every skill rendered "0 / N" with the
-- dashboard's "almost unlocked" rail permanently empty.
--
-- Doing the join in the database instead sends nothing but the JWT. Mirrors
-- evaluate_skills()'s consumed-resource definition so the page and the unlock
-- engine can never disagree.
-- ============================================================================

create or replace function public.get_skill_progress()
returns table (skill_id text, done_count int, total_count int)
language plpgsql
security definer set search_path = public
stable
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  return query
    with consumed as (
      select resource_id from public.consumed_resource_ids(v_user)
    )
    select
      sr.skill_id,
      count(*) filter (where c.resource_id is not null)::int,
      count(*)::int
    from public.skill_resources sr
    left join consumed c on c.resource_id = sr.resource_id
    group by sr.skill_id;
end;
$$;

revoke execute on function public.get_skill_progress() from public;
grant execute on function public.get_skill_progress() to authenticated, service_role;
