-- ============================================================================
-- UpForge Consulting — Phase 2
-- Course marketplace, cohort bundles, enrollment lifecycle, per-resource
-- progress (for the embedded player), and the skills system.
--
-- Additive only: every new column carries a default, so everything Phase 1
-- does keeps working untouched. Safe to re-run — same idempotent style as
-- 0001_init.sql.
--
-- ORDER MATTERS: the new tables are created before recompute_xp() is
-- replaced, because the new function body reads them. Replacing the
-- function first would make every user_progress write in production throw.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- COURSE METADATA (a "course" is a track; the marketplace sells these)
-- ----------------------------------------------------------------------------

alter table public.tracks
  add column if not exists tier text not null default 'foundational',
  add column if not exists summary text not null default '',
  add column if not exists domain text,
  add column if not exists estimated_hours int,
  add column if not exists effort_per_week text,
  add column if not exists icon_key text,
  add column if not exists published boolean not null default true;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'tracks_tier_check') then
    alter table public.tracks add constraint tracks_tier_check
      check (tier in ('foundational', 'intermediate', 'advanced'));
  end if;
end $$;

-- Existing tracks predate icon_key; their id doubles as the icon registry key.
update public.tracks set icon_key = id where icon_key is null;

-- ----------------------------------------------------------------------------
-- RESOURCE MEDIA METADATA (for the in-app player)
-- ----------------------------------------------------------------------------

alter table public.resources
  add column if not exists provider text,
  add column if not exists external_id text,
  add column if not exists duration_seconds int,
  add column if not exists embeddable boolean not null default false,
  add column if not exists icon_key text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'resources_provider_check') then
    alter table public.resources add constraint resources_provider_check
      check (provider is null or provider in ('youtube', 'vimeo', 'external'));
  end if;
end $$;

-- Derive provider + YouTube video id from the URL for everything already seeded.
update public.resources
set provider = case
      when url ~* 'youtube\.com/watch\?v=|youtu\.be/|youtube\.com/playlist' then 'youtube'
      when url ~* 'vimeo\.com/' then 'vimeo'
      else 'external'
    end
where provider is null;

update public.resources
set external_id = coalesce(
      substring(url from 'youtube\.com/watch\?v=([A-Za-z0-9_-]{11})'),
      substring(url from 'youtu\.be/([A-Za-z0-9_-]{11})')
    )
where provider = 'youtube' and external_id is null;

-- A single video is embeddable; a playlist or channel page is not.
update public.resources
set embeddable = true
where provider = 'youtube' and external_id is not null and embeddable = false;

-- Replace the emoji that Phase 1 stored in resources.icon with a registry key
-- the new SVG icon set understands.
update public.resources
set icon_key = case
      when provider = 'youtube' then 'video'
      when icon = '🎓' then 'course'
      when icon = '📄' then 'article'
      when icon = '🧪' then 'practice'
      when icon = '📺' then 'video'
      when icon = '🧭' then 'guide'
      when icon = '🌐' then 'web'
      when format ilike '%video%' then 'video'
      when format ilike '%course%' then 'course'
      when format ilike '%article%' or format ilike '%pdf%' or format ilike '%textbook%' then 'article'
      else 'web'
    end
where icon_key is null;

update public.resources set icon = null where icon is not null;

-- ----------------------------------------------------------------------------
-- COHORTS — a curated bundle of courses
-- ----------------------------------------------------------------------------

create table if not exists public.cohorts (
  id text primary key,
  name text not null,
  label text not null,
  summary text not null default '',
  tier text not null default 'foundational' check (tier in ('foundational', 'intermediate', 'advanced')),
  order_index int not null default 0,
  icon_key text,
  estimated_hours int,
  published boolean not null default true
);

create table if not exists public.cohort_courses (
  cohort_id text not null references public.cohorts(id) on delete cascade,
  track_id text not null references public.tracks(id) on delete cascade,
  order_index int not null default 0,
  primary key (cohort_id, track_id)
);

create index if not exists cohort_courses_track_idx on public.cohort_courses(track_id);

-- ----------------------------------------------------------------------------
-- SKILLS — unlocked by consuming the resources mapped to them
-- ----------------------------------------------------------------------------

create table if not exists public.skills (
  id text primary key,
  name text not null,
  domain text not null,
  description text not null default '',
  tier text not null default 'foundational' check (tier in ('foundational', 'intermediate', 'advanced')),
  icon_key text,
  xp_reward int not null default 100,
  -- 0 means "every mapped resource"; any other value is an absolute count.
  threshold int not null default 0
);

create table if not exists public.skill_resources (
  skill_id text not null references public.skills(id) on delete cascade,
  resource_id text not null references public.resources(id) on delete cascade,
  primary key (skill_id, resource_id)
);

create index if not exists skill_resources_resource_idx on public.skill_resources(resource_id);

-- ----------------------------------------------------------------------------
-- ENROLLMENT — extends the existing table rather than replacing it, because
-- those rows are live production enrollment. Unenrolling archives; it never
-- deletes, so progress, XP and review cards survive and come back intact.
-- ----------------------------------------------------------------------------

alter table public.user_track_selection
  add column if not exists status text not null default 'active',
  add column if not exists source text not null default 'self';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'user_track_selection_status_check') then
    alter table public.user_track_selection add constraint user_track_selection_status_check
      check (status in ('active', 'archived'));
  end if;
end $$;

create table if not exists public.user_cohort_enrollment (
  user_id uuid not null references auth.users(id) on delete cascade,
  cohort_id text not null references public.cohorts(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  primary key (user_id, cohort_id)
);

-- ----------------------------------------------------------------------------
-- PER-RESOURCE PROGRESS + UNLOCKED SKILLS
-- ----------------------------------------------------------------------------

create table if not exists public.user_resource_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  resource_id text not null references public.resources(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress', 'done')),
  seconds_watched int not null default 0,
  last_position_seconds int not null default 0,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, resource_id)
);

create index if not exists user_resource_progress_status_idx
  on public.user_resource_progress(user_id, status);

create table if not exists public.user_skills (
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id text not null references public.skills(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  -- null until the unlock animation has been shown; this is what makes the
  -- celebration fire exactly once, even across devices or a mid-animation
  -- refresh.
  seen_at timestamptz,
  primary key (user_id, skill_id)
);

create index if not exists user_skills_unseen_idx
  on public.user_skills(user_id) where seen_at is null;

-- ----------------------------------------------------------------------------
-- XP — still fully recomputed, now from three sources instead of one.
-- Recomputation (rather than incrementing) is what keeps XP self-healing
-- across content re-seeds and retried writes.
-- ----------------------------------------------------------------------------

create or replace function public.recompute_xp(p_user_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_xp int;
begin
  select
    coalesce((
      select sum(case status when 'done' then 50 when 'active' then 10 else 0 end)
      from public.user_progress where user_id = p_user_id
    ), 0)
    + coalesce((
      select count(*) * 10
      from public.user_resource_progress
      where user_id = p_user_id and status = 'done'
    ), 0)
    + coalesce((
      select sum(s.xp_reward)
      from public.user_skills us
      join public.skills s on s.id = us.skill_id
      where us.user_id = p_user_id
    ), 0)
  into v_xp;

  insert into public.user_xp (user_id, total_xp, level, updated_at)
  values (p_user_id, v_xp, public.xp_level(v_xp), now())
  on conflict (user_id) do update
    set total_xp = excluded.total_xp,
        level = excluded.level,
        updated_at = now();
end;
$$;

create or replace function public.trg_user_resource_recompute_xp()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.recompute_xp(coalesce(new.user_id, old.user_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists user_resource_progress_xp_trigger on public.user_resource_progress;
create trigger user_resource_progress_xp_trigger
  after insert or update or delete on public.user_resource_progress
  for each row execute function public.trg_user_resource_recompute_xp();

drop trigger if exists user_skills_xp_trigger on public.user_skills;
create trigger user_skills_xp_trigger
  after insert or update or delete on public.user_skills
  for each row execute function public.trg_user_resource_recompute_xp();

-- ----------------------------------------------------------------------------
-- SKILL UNLOCK ENGINE
--
-- Runs in the database, in the same transaction as the progress write, so it
-- can't be skipped by another client path or raced between two tabs.
--
-- A resource counts as consumed when the user has completed it directly OR
-- when its parent topic is marked done — otherwise anyone using Phase 1's
-- topic-level flow could never unlock anything, and existing users would
-- start from zero.
-- ----------------------------------------------------------------------------

create or replace function public.consumed_resource_ids(p_user_id uuid)
returns table (resource_id text)
language sql
security definer set search_path = public
stable
as $$
  select r.id
  from public.resources r
  where exists (
    select 1 from public.user_resource_progress urp
    where urp.user_id = p_user_id and urp.resource_id = r.id and urp.status = 'done'
  )
  or exists (
    select 1 from public.user_progress up
    where up.user_id = p_user_id and up.topic_id = r.topic_id and up.status = 'done'
  );
$$;

-- Inserts any newly-earned skills and returns ONLY the ids it actually
-- inserted, so the caller can fire the unlock animation for exactly those.
create or replace function public.evaluate_skills(p_user_id uuid)
returns text[]
language plpgsql
security definer set search_path = public
as $$
declare
  v_new text[];
begin
  with consumed as (
    select resource_id from public.consumed_resource_ids(p_user_id)
  ),
  progress as (
    select
      sr.skill_id,
      count(*) filter (where c.resource_id is not null) as done_count,
      count(*) as total_count
    from public.skill_resources sr
    left join consumed c on c.resource_id = sr.resource_id
    group by sr.skill_id
  ),
  earned as (
    select p.skill_id
    from progress p
    join public.skills s on s.id = p.skill_id
    where p.total_count > 0
      and p.done_count >= (case when s.threshold > 0 then least(s.threshold, p.total_count) else p.total_count end)
  ),
  inserted as (
    insert into public.user_skills (user_id, skill_id)
    select p_user_id, e.skill_id from earned e
    on conflict (user_id, skill_id) do nothing
    returning skill_id
  )
  select coalesce(array_agg(skill_id), '{}') into v_new from inserted;

  return v_new;
end;
$$;

-- ----------------------------------------------------------------------------
-- RPCs CALLED BY THE APP (all scope strictly to auth.uid())
-- ----------------------------------------------------------------------------

create or replace function public.enroll_track(p_track_id text, p_source text default 'self')
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'not authenticated'; end if;

  insert into public.user_track_selection (user_id, track_id, status, source)
  values (v_user, p_track_id, 'active', p_source)
  on conflict (user_id, track_id) do update
    set status = 'active', source = excluded.source;
end;
$$;

create or replace function public.unenroll_track(p_track_id text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'not authenticated'; end if;

  -- Archive, never delete: the user's progress on this track stays intact.
  update public.user_track_selection
  set status = 'archived'
  where user_id = v_user and track_id = p_track_id;
end;
$$;

create or replace function public.enroll_cohort(p_cohort_id text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'not authenticated'; end if;

  insert into public.user_cohort_enrollment (user_id, cohort_id)
  values (v_user, p_cohort_id)
  on conflict (user_id, cohort_id) do nothing;

  insert into public.user_track_selection (user_id, track_id, status, source)
  select v_user, cc.track_id, 'active', p_cohort_id
  from public.cohort_courses cc
  where cc.cohort_id = p_cohort_id
  on conflict (user_id, track_id) do update
    set status = 'active', source = excluded.source;
end;
$$;

create or replace function public.leave_cohort(p_cohort_id text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'not authenticated'; end if;

  delete from public.user_cohort_enrollment
  where user_id = v_user and cohort_id = p_cohort_id;

  -- Only archive courses this cohort pulled in and the user hasn't since
  -- claimed for themselves.
  update public.user_track_selection
  set status = 'archived'
  where user_id = v_user
    and source = p_cohort_id
    and track_id in (select track_id from public.cohort_courses where cohort_id = p_cohort_id);
end;
$$;

-- Returns the ids of any skills unlocked by this write.
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
      -- never regress a completion, and never lose accumulated watch time
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

  if p_complete then
    return public.evaluate_skills(v_user);
  end if;
  return '{}';
end;
$$;

create or replace function public.complete_resource(p_resource_id text)
returns text[]
language sql
security definer set search_path = public
as $$
  select public.set_resource_progress(p_resource_id, 0, 0, true);
$$;

create or replace function public.ack_skills(p_skill_ids text[])
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'not authenticated'; end if;

  update public.user_skills
  set seen_at = now()
  where user_id = v_user
    and seen_at is null
    and (p_skill_ids is null or skill_id = any(p_skill_ids));
end;
$$;

-- Marking a topic done also consumes its resources for skill purposes, so
-- the existing topic-level flow earns skills too.
--
-- 0001 declared this as `returns void`; Postgres refuses to change a return
-- type via CREATE OR REPLACE, so it has to be dropped first.
drop function if exists public.set_topic_status(text, text);

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
    insert into public.spaced_repetition (user_id, topic_id, next_review_date, interval_stage, ease, reps)
    values (v_user, p_topic_id, current_date + 1, 0, 2.5, 0)
    on conflict (user_id, topic_id) do nothing;

    return public.evaluate_skills(v_user);
  end if;

  return '{}';
end;
$$;

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------

alter table public.cohorts enable row level security;
alter table public.cohort_courses enable row level security;
alter table public.skills enable row level security;
alter table public.skill_resources enable row level security;
alter table public.user_cohort_enrollment enable row level security;
alter table public.user_resource_progress enable row level security;
alter table public.user_skills enable row level security;

drop policy if exists "content read" on public.cohorts;
create policy "content read" on public.cohorts for select using (auth.role() = 'authenticated');
drop policy if exists "content write" on public.cohorts;
create policy "content write" on public.cohorts for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "content read" on public.cohort_courses;
create policy "content read" on public.cohort_courses for select using (auth.role() = 'authenticated');
drop policy if exists "content write" on public.cohort_courses;
create policy "content write" on public.cohort_courses for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "content read" on public.skills;
create policy "content read" on public.skills for select using (auth.role() = 'authenticated');
drop policy if exists "content write" on public.skills;
create policy "content write" on public.skills for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "content read" on public.skill_resources;
create policy "content read" on public.skill_resources for select using (auth.role() = 'authenticated');
drop policy if exists "content write" on public.skill_resources;
create policy "content write" on public.skill_resources for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "own rows" on public.user_cohort_enrollment;
create policy "own rows" on public.user_cohort_enrollment for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on public.user_resource_progress;
create policy "own rows" on public.user_resource_progress for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Read-only for users, exactly like user_xp / user_streak: rows are written
-- only by evaluate_skills() and acknowledged only by ack_skills(), both
-- SECURITY DEFINER.
drop policy if exists "own rows" on public.user_skills;
create policy "own rows" on public.user_skills for select using (auth.uid() = user_id);
