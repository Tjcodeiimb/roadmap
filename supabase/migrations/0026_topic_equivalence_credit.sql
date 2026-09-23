-- Cross-course credit, part 2: the same underlying topic taught in two
-- courses through entirely different resources — no shared URL for
-- 0024/0025's mechanism to match on.
--
-- The concrete case that motivated this: Finance & Business Operations Prep
-- teaches "Cost of Capital: Cost of Debt, Cost of Equity & WACC"
-- (fprep-p8-t2) end to end — CAPM, after-tax cost of debt, the blend — and
-- Finance's "Cost of Capital & WACC" (fin-p2-t1) teaches the identical
-- concept, at the identical depth, through a different pair of articles.
-- Finishing one is finishing the other; nothing about the resources
-- themselves says so.
--
-- topic_equivalence_groups is the hand-curated map that says so: topics
-- sharing a group_id are asserted, by a human, to be the same material.
-- This has to be curated rather than inferred — matching on title
-- similarity would mark topics equivalent that only sound alike, silently
-- crediting content a learner never actually saw. It ships with one
-- verified pair; adding another is one row, no code change.
--
-- A topic only credits from a FULLY finished counterpart (user_progress
-- status = 'done', which itself already requires every one of its
-- resources done) — never from partial progress. Reading the income
-- statement half of a three-way split doesn't finish a combined
-- "three financial statements" topic elsewhere, so a group is only ever
-- built from topics whose scope genuinely matches 1:1, not a many-topics-
-- to-one split.

create table if not exists public.topic_equivalence_groups (
  group_id text not null,
  topic_id text not null references public.topics(id) on delete cascade,
  primary key (group_id, topic_id)
);

alter table public.topic_equivalence_groups enable row level security;

drop policy if exists "content read" on public.topic_equivalence_groups;
create policy "content read" on public.topic_equivalence_groups for select using (auth.role() = 'authenticated');
drop policy if exists "content write" on public.topic_equivalence_groups;
create policy "content write" on public.topic_equivalence_groups for all using (public.is_admin()) with check (public.is_admin());

-- Supersedes 0024's credit_duplicate_resources — same job (crediting
-- content a learner already finished elsewhere), now covering both a
-- literal duplicate URL and a curated equivalent topic. Same call sites
-- (track and topic pages, before reading progress), same guarantees:
-- idempotent, track-scoped, never touches a real completion's own status
-- or provenance.
drop function if exists public.credit_duplicate_resources(text);

create or replace function public.credit_cross_course_progress(p_track_id text)
returns text[]
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_url_topics text[];
  v_equiv_topics text[];
  v_topic_ids text[];
begin
  if v_user is null or p_track_id is null then
    return '{}';
  end if;

  -- Part 1: an identical resource (same url), completed elsewhere.
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
          credited_via_resource_id = coalesce(
            user_resource_progress.credited_via_resource_id,
            case when user_resource_progress.status <> 'done' then excluded.credited_via_resource_id end
          ),
          completed_at = coalesce(user_resource_progress.completed_at, now()),
          updated_at = now()
    where user_resource_progress.status is distinct from 'done'
    returning resource_id
  )
  select coalesce(array_agg(distinct c.topic_id), '{}') into v_url_topics
  from candidates c join upserted u on u.resource_id = c.resource_id;

  -- Part 2: a different topic teaching the same thing, already finished in
  -- full. Every resource under a not-yet-done topic in this track, whose
  -- equivalence group already has a DONE counterpart topic, is credited.
  -- One done resource from that counterpart is carried along purely to
  -- resolve the "Already completed in {course}" label — the real reason is
  -- the topic match, not that specific resource, but the label-resolving
  -- code already knows how to turn a resource id into a course name and
  -- reusing it here needs nothing new.
  --
  -- Excludes anything Part 1 just credited above: a resource can be both a
  -- url-duplicate and sit in an equivalent topic, and touching the same row
  -- twice in a row that's still open from this same call would raise
  -- Postgres's "command cannot affect row a second time" — checking
  -- against user_resource_progress here (not the Part 1 candidate list) is
  -- what actually prevents that, since Part 1 already committed within
  -- this same function call.
  with equivalent_source as (
    select distinct on (mine.topic_id) mine.topic_id, urp.resource_id as source_resource_id
    from public.topic_equivalence_groups mine
    join public.topics t on t.id = mine.topic_id
    join public.phases ph on ph.id = t.phase_id
    join public.topic_equivalence_groups other
      on other.group_id = mine.group_id and other.topic_id <> mine.topic_id
    join public.user_progress up
      on up.topic_id = other.topic_id and up.user_id = v_user and up.status = 'done'
    join public.resources other_r on other_r.topic_id = other.topic_id
    join public.user_resource_progress urp
      on urp.resource_id = other_r.id and urp.user_id = v_user and urp.status = 'done'
    where ph.track_id = p_track_id
      and coalesce(
            (select up2.status from public.user_progress up2
              where up2.topic_id = mine.topic_id and up2.user_id = v_user),
            'todo'
          ) <> 'done'
    order by mine.topic_id, urp.resource_id
  ),
  candidates as (
    select r.id as resource_id, es.topic_id, es.source_resource_id
    from public.resources r
    join equivalent_source es on es.topic_id = r.topic_id
    where not exists (
      select 1 from public.user_resource_progress urp
      where urp.resource_id = r.id and urp.user_id = v_user and urp.status = 'done'
    )
  ),
  upserted as (
    insert into public.user_resource_progress (
      user_id, resource_id, status, credited_via_resource_id, completed_at, updated_at
    )
    select v_user, c.resource_id, 'done', c.source_resource_id, now(), now()
    from candidates c
    on conflict (user_id, resource_id) do update
      set status = 'done',
          credited_via_resource_id = coalesce(
            user_resource_progress.credited_via_resource_id,
            case when user_resource_progress.status <> 'done' then excluded.credited_via_resource_id end
          ),
          completed_at = coalesce(user_resource_progress.completed_at, now()),
          updated_at = now()
    where user_resource_progress.status is distinct from 'done'
    returning resource_id
  )
  select coalesce(array_agg(distinct c.topic_id), '{}') into v_equiv_topics
  from candidates c join upserted u on u.resource_id = c.resource_id;

  select coalesce(array_agg(distinct x), '{}') into v_topic_ids
  from unnest(v_url_topics || v_equiv_topics) x;

  if v_topic_ids is not null and array_length(v_topic_ids, 1) > 0 then
    for i in 1 .. array_length(v_topic_ids, 1) loop
      perform public.sync_topic_progress(v_topic_ids[i]);
    end loop;
    return public.evaluate_skills(v_user);
  end if;

  return '{}';
end;
$$;
