-- Remove the spaced-repetition Review feature completely: the /review page,
-- its RPC, and the table behind it.
--
-- Two functions wrote into spaced_repetition as a side effect of a topic
-- completing (set_topic_status and sync_topic_progress) — both are
-- redefined here first, with that insert removed, before the table they
-- were inserting into is dropped. Dropping the table before redefining them
-- would leave a live function whose next call fails outright.
--
-- Order matters for that reason: redefine the two writers, then drop
-- review_topic and sr_interval_days (both exist only to serve this
-- feature), then drop the table itself, which takes its own index and RLS
-- policy down with it.

create or replace function public.set_topic_status(p_topic_id text, p_status text)
returns text[]
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;
  if p_status not in ('todo', 'next', 'active', 'done') then
    raise exception 'invalid status %', p_status;
  end if;

  insert into public.user_progress (user_id, topic_id, status, completed_at, updated_at)
  values (v_user, p_topic_id, p_status, case when p_status = 'done' then now() else null end, now())
  on conflict (user_id, topic_id) do update
    set status = excluded.status,
        completed_at = excluded.completed_at,
        updated_at = now();

  if p_status = 'done' then
    return public.evaluate_skills(v_user);
  end if;

  return '{}';
end;
$$;

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
            when user_progress.status in ('done', 'active') then user_progress.status
            else 'next'
          end,
          updated_at = now();
  end if;
end;
$$;

drop function if exists public.review_topic(text, int);
drop function if exists public.sr_interval_days(int);
drop table if exists public.spaced_repetition;
