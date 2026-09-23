-- Cross-course completion crediting.
--
-- Cohorts bundle several courses together, and courses increasingly share
-- real content: validate-seed.mjs's "duplicate URL" warning already lists
-- dozens of resources across the catalogue that point at the exact same
-- page. Until now, finishing that page in one course counted for nothing in
-- any other course that also links to it — the learner would see it listed
-- as an unstarted resource again, with no way to tell it apart from
-- something genuinely new.
--
-- This credits it automatically: any resource sharing a URL with one the
-- learner has already completed is marked done too, the moment they view a
-- track or topic that contains it. It reuses the exact "done" write path
-- (sync_topic_progress, evaluate_skills) that a real completion goes
-- through, so topic status, XP and skill unlocks all follow correctly — a
-- learner who already earned a skill's resources elsewhere sees it unlock
-- here too, not just a checkmark with no consequence.
--
-- credited_via_resource_id records which resource supplied the credit, so
-- the UI can say "Already completed in {that resource's course}" instead of
-- presenting it as a fresh, unexplained checkmark.
--
-- Idempotent and additive only: a resource already marked done — by the
-- learner or by an earlier run of this — is never touched again, and
-- nothing here can ever downgrade or un-credit a completion.

alter table public.user_resource_progress
  add column if not exists credited_via_resource_id text references public.resources(id) on delete set null;

comment on column public.user_resource_progress.credited_via_resource_id is
  'Set when this row was auto-completed because the learner already finished a different resource with the same URL. Null for a completion the learner actually did here.';

-- Duplicate-URL lookups (this migration's join, and the validator's own
-- check) both scan resources.url; nothing indexed it until now.
create index if not exists resources_url_idx on public.resources(url);

-- No user id parameter, for the same reason sync_topic_progress and
-- set_resource_progress take none: a SECURITY DEFINER function that accepted
-- one would let any authenticated caller write another user's progress.
create or replace function public.credit_duplicate_resources(p_track_id text)
returns text[]
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_topic_ids text[];
begin
  if v_user is null or p_track_id is null then
    return '{}';
  end if;

  with candidates as (
    select r.id as resource_id, t.id as topic_id, min(done_r.id) as source_resource_id
    from public.resources r
    join public.topics t on t.id = r.topic_id
    join public.phases ph on ph.id = t.phase_id
    join public.resources done_r on done_r.url = r.url and done_r.id <> r.id
    join public.user_resource_progress done_urp
      on done_urp.resource_id = done_r.id
     and done_urp.user_id = v_user
     and done_urp.status = 'done'
    where ph.track_id = p_track_id
      and not exists (
        select 1 from public.user_resource_progress urp
        where urp.resource_id = r.id and urp.user_id = v_user and urp.status = 'done'
      )
    group by r.id, t.id
  ),
  upserted as (
    insert into public.user_resource_progress (
      user_id, resource_id, status, credited_via_resource_id, completed_at, updated_at
    )
    select v_user, c.resource_id, 'done', c.source_resource_id, now(), now()
    from candidates c
    on conflict (user_id, resource_id) do update
      set status = 'done',
          -- Never overwrite a real completion's provenance, and never
          -- regrant credit that was already recorded.
          credited_via_resource_id = coalesce(
            user_resource_progress.credited_via_resource_id,
            case when user_resource_progress.status <> 'done' then excluded.credited_via_resource_id end
          ),
          completed_at = coalesce(user_resource_progress.completed_at, now()),
          updated_at = now()
    where user_resource_progress.status is distinct from 'done'
    returning resource_id
  )
  select coalesce(array_agg(distinct c.topic_id), '{}')
    into v_topic_ids
  from candidates c
  join upserted u on u.resource_id = c.resource_id;

  if v_topic_ids is not null and array_length(v_topic_ids, 1) > 0 then
    for i in 1 .. array_length(v_topic_ids, 1) loop
      perform public.sync_topic_progress(v_topic_ids[i]);
    end loop;
    return public.evaluate_skills(v_user);
  end if;

  return '{}';
end;
$$;

do $$
declare
  v_dupe_urls int;
  v_dupe_resources int;
begin
  select count(*) into v_dupe_urls from (
    select url from public.resources group by url having count(*) > 1
  ) d;

  select count(*) into v_dupe_resources
  from public.resources r
  where exists (select 1 from public.resources r2 where r2.url = r.url and r2.id <> r.id);

  raise notice 'Duplicate-URL resources in the catalogue right now: % resources sharing % distinct URLs. credit_duplicate_resources() will retroactively credit these for any learner who already completed one side, the next time they view the affected track.', v_dupe_resources, v_dupe_urls;
end;
$$;
