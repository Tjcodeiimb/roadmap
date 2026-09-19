-- Automatic topic progress.
--
-- Topic status used to be set by hand from four buttons on the topic page.
-- It is now derived from resource completion instead:
--   every resource done  -> topic 'done'   (and the next topic becomes 'next')
--   some resources done  -> topic 'active'
--   none done            -> left untouched
--
-- The derivation runs inside set_resource_progress, i.e. in the same
-- transaction as the resource write, so it cannot be skipped by a second
-- client path or raced between two tabs.

-- Takes no user argument on purpose. Postgres grants EXECUTE on functions in
-- `public` to PUBLIC by default, so a SECURITY DEFINER function accepting a
-- user id would let any authenticated caller write another user's progress.
-- Reading auth.uid() internally means it can only ever touch the caller's rows.
create or replace function public.sync_topic_progress(p_topic_id text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_total int;
  v_done int;
  v_status text;
  v_next_topic text;
begin
  if v_user is null or p_topic_id is null then
    return;
  end if;

  select count(*) into v_total
  from public.resources
  where topic_id = p_topic_id;

  -- A topic with no resources has nothing to derive from; leave it alone so
  -- it stays whatever it already was.
  if v_total = 0 then
    return;
  end if;

  select count(*) into v_done
  from public.resources r
  join public.user_resource_progress urp
    on urp.resource_id = r.id
   and urp.user_id = v_user
   and urp.status = 'done'
  where r.topic_id = p_topic_id;

  if v_done >= v_total then
    v_status := 'done';
  elsif v_done > 0 then
    v_status := 'active';
  else
    return;
  end if;

  insert into public.user_progress (user_id, topic_id, status, completed_at, updated_at)
  values (
    v_user,
    p_topic_id,
    v_status,
    case when v_status = 'done' then now() else null end,
    now()
  )
  on conflict (user_id, topic_id) do update
    set status = case
          -- never regress a finished topic
          when user_progress.status = 'done' then 'done'
          else excluded.status
        end,
        completed_at = case
          when user_progress.completed_at is not null then user_progress.completed_at
          when v_status = 'done' then now()
          else null
        end,
        updated_at = now();

  if v_status <> 'done' then
    return;
  end if;

  insert into public.spaced_repetition (user_id, topic_id, next_review_date, interval_stage, ease, reps)
  values (v_user, p_topic_id, current_date + 1, 0, 2.5, 0)
  on conflict (user_id, topic_id) do nothing;

  -- Point the learner at the next unfinished topic in the same track, in
  -- phase/topic order.
  select t.id into v_next_topic
  from public.topics t
  join public.phases p on p.id = t.phase_id
  where p.track_id = (
        select p2.track_id
        from public.topics t2
        join public.phases p2 on p2.id = t2.phase_id
        where t2.id = p_topic_id
      )
    and t.id <> p_topic_id
    and coalesce(
          (select up.status
             from public.user_progress up
            where up.user_id = v_user and up.topic_id = t.id),
          'todo'
        ) <> 'done'
  order by p.order_index, t.order_index
  limit 1;

  if v_next_topic is not null then
    insert into public.user_progress (user_id, topic_id, status, updated_at)
    values (v_user, v_next_topic, 'next', now())
    on conflict (user_id, topic_id) do update
      set status = case
            -- don't demote a topic already finished or under way
            when user_progress.status in ('done', 'active') then user_progress.status
            else 'next'
          end,
          updated_at = now();
  end if;
end;
$$;

-- Same body as 0002 plus the sync_topic_progress call.
create or replace function public.set_resource_progress(
  p_resource_id text,
  p_position int,
  p_watched int,
  p_complete boolean default false
)
returns text[]
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_topic text;
begin
  if v_user is null then raise exception 'not authenticated'; end if;

  insert into public.user_resource_progress (
    user_id, resource_id, status, seconds_watched, last_position_seconds, completed_at, updated_at
  )
  values (
    v_user,
    p_resource_id,
    case when p_complete then 'done' else 'in_progress' end,
    greatest(p_watched, 0),
    greatest(p_position, 0),
    case when p_complete then now() else null end,
    now()
  )
  on conflict (user_id, resource_id) do update
    set
      status = case
        when user_resource_progress.status = 'done' or p_complete then 'done'
        else 'in_progress'
      end,
      seconds_watched = greatest(user_resource_progress.seconds_watched, greatest(p_watched, 0)),
      last_position_seconds = greatest(p_position, 0),
      completed_at = case
        when user_resource_progress.completed_at is not null then user_resource_progress.completed_at
        when p_complete then now()
        else null
      end,
      updated_at = now();

  select topic_id into v_topic from public.resources where id = p_resource_id;
  perform public.sync_topic_progress(v_topic);

  if p_complete then
    return public.evaluate_skills(v_user);
  end if;
  return '{}';
end;
$$;

-- One-time backfill so existing learners' topics reflect the resources they
-- have already finished, rather than only what they pressed the buttons for.
do $$
declare
  rec record;
begin
  for rec in
    select urp.user_id, r.topic_id
    from public.user_resource_progress urp
    join public.resources r on r.id = urp.resource_id
    where urp.status = 'done'
    group by urp.user_id, r.topic_id
  loop
    with counts as (
      select
        (select count(*) from public.resources where topic_id = rec.topic_id) as total,
        (select count(*)
           from public.resources r2
           join public.user_resource_progress u2
             on u2.resource_id = r2.id
            and u2.user_id = rec.user_id
            and u2.status = 'done'
          where r2.topic_id = rec.topic_id) as done
    )
    insert into public.user_progress (user_id, topic_id, status, completed_at, updated_at)
    select
      rec.user_id,
      rec.topic_id,
      case when c.done >= c.total then 'done' else 'active' end,
      case when c.done >= c.total then now() else null end,
      now()
    from counts c
    where c.total > 0 and c.done > 0
    on conflict (user_id, topic_id) do update
      set status = case
            when user_progress.status = 'done' then 'done'
            else excluded.status
          end,
          completed_at = case
            when user_progress.completed_at is not null then user_progress.completed_at
            else excluded.completed_at
          end,
          updated_at = now();
  end loop;
end;
$$;
