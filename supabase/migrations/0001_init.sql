-- ============================================================================
-- UpForge Consulting — Employee Development Platform
-- Initial schema: content tables (tracks/phases/topics/resources),
-- per-user progress tables, gamification (XP/streak/spaced-repetition),
-- RLS policies, and the RPC functions the app calls for atomic mutations.
--
-- Run this once in the Supabase SQL Editor (see docs/SETUP.md, step "Database
-- schema"). Safe to re-run: every statement is idempotent (CREATE ... IF NOT
-- EXISTS / OR REPLACE / DROP POLICY IF EXISTS before CREATE POLICY).
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- CONTENT TABLES (readable by all signed-in users, writable by admins only)
-- ----------------------------------------------------------------------------

create table if not exists public.tracks (
  id text primary key,
  name text not null,
  label text not null,
  order_index int not null default 0
);

create table if not exists public.phases (
  id text primary key,
  track_id text not null references public.tracks(id) on delete cascade,
  order_index int not null default 0,
  title text not null,
  description text not null default '',
  estimated_weeks text,
  color text
);

create table if not exists public.topics (
  id text primary key,
  phase_id text not null references public.phases(id) on delete cascade,
  order_index int not null default 0,
  title text not null,
  section text,
  tags text[] not null default '{}',
  estimated_time text,
  description text not null default '',
  steps jsonb not null default '[]'::jsonb
);

create table if not exists public.resources (
  id text primary key,
  topic_id text not null references public.topics(id) on delete cascade,
  order_index int not null default 0,
  title text not null,
  url text not null,
  source text,
  format text,
  length text,
  note text,
  icon text
);

create index if not exists phases_track_id_idx on public.phases(track_id);
create index if not exists topics_phase_id_idx on public.topics(phase_id);
create index if not exists resources_topic_id_idx on public.resources(topic_id);

-- ----------------------------------------------------------------------------
-- PROFILES (one row per auth.users row)
-- ----------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'employee' check (role in ('employee', 'admin')),
  theme text not null default 'light' check (theme in ('light', 'dark')),
  leaderboard_opt_in boolean not null default false,
  created_at timestamptz not null default now()
);

-- Creates a profile row automatically the first time someone signs in.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ----------------------------------------------------------------------------
-- PER-USER STATE
-- ----------------------------------------------------------------------------

create table if not exists public.user_track_selection (
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id text not null references public.tracks(id) on delete cascade,
  selected_at timestamptz not null default now(),
  primary key (user_id, track_id)
);

create table if not exists public.user_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id text not null references public.topics(id) on delete cascade,
  status text not null default 'todo' check (status in ('todo', 'next', 'active', 'done')),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, topic_id)
);

create index if not exists user_progress_user_id_idx on public.user_progress(user_id);
create index if not exists user_progress_status_idx on public.user_progress(user_id, status);

create table if not exists public.user_xp (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_xp int not null default 0,
  level int not null default 1,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_streak (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_visit_date date,
  updated_at timestamptz not null default now()
);

create table if not exists public.spaced_repetition (
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id text not null references public.topics(id) on delete cascade,
  next_review_date date not null,
  interval_stage int not null default 0,
  ease numeric not null default 2.5,
  reps int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, topic_id)
);

create index if not exists spaced_repetition_due_idx on public.spaced_repetition(user_id, next_review_date);

create table if not exists public.build_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  status text not null default 'in_progress' check (status in ('idea', 'in_progress', 'done')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists build_projects_user_id_idx on public.build_projects(user_id);

-- ----------------------------------------------------------------------------
-- XP: recomputed (not incremented) from current topic statuses, exactly like
-- the original tool's calcXP() — done = 50 XP, active = 10 XP, per topic.
-- ----------------------------------------------------------------------------

create or replace function public.xp_level(p_xp int)
returns int
language sql
immutable
as $$
  select case
    when p_xp >= 3500 then 8
    when p_xp >= 2000 then 7
    when p_xp >= 1200 then 6
    when p_xp >= 700  then 5
    when p_xp >= 350  then 4
    when p_xp >= 150  then 3
    when p_xp >= 50   then 2
    else 1
  end;
$$;

create or replace function public.recompute_xp(p_user_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_xp int;
begin
  select coalesce(sum(case status when 'done' then 50 when 'active' then 10 else 0 end), 0)
  into v_xp
  from public.user_progress
  where user_id = p_user_id;

  insert into public.user_xp (user_id, total_xp, level, updated_at)
  values (p_user_id, v_xp, public.xp_level(v_xp), now())
  on conflict (user_id) do update
    set total_xp = excluded.total_xp,
        level = excluded.level,
        updated_at = now();
end;
$$;

create or replace function public.trg_user_progress_recompute_xp()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.recompute_xp(coalesce(new.user_id, old.user_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists user_progress_xp_trigger on public.user_progress;
create trigger user_progress_xp_trigger
  after insert or update or delete on public.user_progress
  for each row execute function public.trg_user_progress_recompute_xp();

-- ----------------------------------------------------------------------------
-- RPCs the app calls (SECURITY DEFINER, but every one scopes strictly to
-- auth.uid() so a user can only ever mutate their own rows)
-- ----------------------------------------------------------------------------

-- Spaced-repetition review intervals, in days — ported verbatim from the
-- original tool's SR_INTERVALS constant.
create or replace function public.sr_interval_days(p_stage int)
returns int
language sql
immutable
as $$
  select (array[1,3,7,14,30,90])[least(greatest(p_stage, 0), 5) + 1];
$$;

create or replace function public.set_topic_status(p_topic_id text, p_status text)
returns void
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
  end if;
end;
$$;

create or replace function public.review_topic(p_topic_id text, p_quality int)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_stage int;
  v_ease numeric;
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

  v_stage := least(v_stage + p_quality, 5);
  v_ease := greatest(1.3, v_ease + (array[-0.3, 0, 0.1])[p_quality + 1]);

  update public.spaced_repetition
  set interval_stage = v_stage,
      ease = v_ease,
      reps = reps + 1,
      next_review_date = current_date + public.sr_interval_days(v_stage),
      updated_at = now()
  where user_id = v_user and topic_id = p_topic_id;
end;
$$;

create or replace function public.touch_streak()
returns table (current_streak int, longest_streak int)
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_row public.user_streak;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  select * into v_row from public.user_streak where user_id = v_user for update;

  if not found then
    insert into public.user_streak (user_id, current_streak, longest_streak, last_visit_date)
    values (v_user, 1, 1, current_date)
    returning * into v_row;
  elsif v_row.last_visit_date = current_date then
    -- already visited today, nothing to do
    null;
  elsif v_row.last_visit_date = current_date - 1 then
    update public.user_streak
    set current_streak = v_row.current_streak + 1,
        longest_streak = greatest(v_row.longest_streak, v_row.current_streak + 1),
        last_visit_date = current_date,
        updated_at = now()
    where user_id = v_user
    returning * into v_row;
  else
    update public.user_streak
    set current_streak = 1,
        last_visit_date = current_date,
        updated_at = now()
    where user_id = v_user
    returning * into v_row;
  end if;

  return query select v_row.current_streak, v_row.longest_streak;
end;
$$;

-- Opt-in leaderboard: only ever exposes users who set leaderboard_opt_in = true,
-- and only the three fields needed to render it.
create or replace function public.get_leaderboard()
returns table (full_name text, total_xp int, current_streak int)
language sql
security definer set search_path = public
stable
as $$
  select p.full_name, coalesce(x.total_xp, 0), coalesce(s.current_streak, 0)
  from public.profiles p
  left join public.user_xp x on x.user_id = p.id
  left join public.user_streak s on s.user_id = p.id
  where p.leaderboard_opt_in = true
  order by coalesce(x.total_xp, 0) desc
  limit 100;
$$;

-- Admin-only aggregate completion stats (never per-employee progress).
create or replace function public.get_admin_track_stats()
returns table (track_id text, phase_id text, phase_title text, topic_count int, completions bigint)
language sql
security definer set search_path = public
stable
as $$
  select t.id, ph.id, ph.title,
    (select count(*) from public.topics tp where tp.phase_id = ph.id)::int,
    coalesce((
      select count(*) from public.user_progress up
      join public.topics tp2 on tp2.id = up.topic_id
      where tp2.phase_id = ph.id and up.status = 'done'
    ), 0)
  from public.tracks t
  join public.phases ph on ph.track_id = t.id
  where public.is_admin()
  order by t.order_index, ph.order_index;
$$;

create or replace function public.get_admin_roster()
returns table (id uuid, email text, full_name text, role text, created_at timestamptz)
language sql
security definer set search_path = public
stable
as $$
  select u.id, u.email, p.full_name, p.role, p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.is_admin()
  order by p.created_at desc;
$$;

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------

alter table public.tracks enable row level security;
alter table public.phases enable row level security;
alter table public.topics enable row level security;
alter table public.resources enable row level security;
alter table public.profiles enable row level security;
alter table public.user_track_selection enable row level security;
alter table public.user_progress enable row level security;
alter table public.user_xp enable row level security;
alter table public.user_streak enable row level security;
alter table public.spaced_repetition enable row level security;
alter table public.build_projects enable row level security;

-- Content tables: readable by any signed-in user, writable only by admins.
drop policy if exists "content read" on public.tracks;
create policy "content read" on public.tracks for select using (auth.role() = 'authenticated');
drop policy if exists "content write" on public.tracks;
create policy "content write" on public.tracks for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "content read" on public.phases;
create policy "content read" on public.phases for select using (auth.role() = 'authenticated');
drop policy if exists "content write" on public.phases;
create policy "content write" on public.phases for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "content read" on public.topics;
create policy "content read" on public.topics for select using (auth.role() = 'authenticated');
drop policy if exists "content write" on public.topics;
create policy "content write" on public.topics for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "content read" on public.resources;
create policy "content read" on public.resources for select using (auth.role() = 'authenticated');
drop policy if exists "content write" on public.resources;
create policy "content write" on public.resources for all using (public.is_admin()) with check (public.is_admin());

-- Profiles: everyone can read+update their own row; admins can read every row
-- (needed for the roster / invite screen) but still cannot write other rows.
drop policy if exists "own profile select" on public.profiles;
create policy "own profile select" on public.profiles for select using (auth.uid() = id or public.is_admin());
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Every remaining table: strictly self-scoped.
drop policy if exists "own rows" on public.user_track_selection;
create policy "own rows" on public.user_track_selection for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on public.user_progress;
create policy "own rows" on public.user_progress for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on public.user_xp;
create policy "own rows" on public.user_xp for select using (auth.uid() = user_id);

drop policy if exists "own rows" on public.user_streak;
create policy "own rows" on public.user_streak for select using (auth.uid() = user_id);

drop policy if exists "own rows" on public.spaced_repetition;
create policy "own rows" on public.spaced_repetition for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on public.build_projects;
create policy "own rows" on public.build_projects for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- user_xp / user_streak are written only through the SECURITY DEFINER
-- functions above (recompute_xp, touch_streak), which run with elevated
-- privilege and enforce auth.uid() themselves — so no insert/update policy
-- is granted to regular users on those two tables.
