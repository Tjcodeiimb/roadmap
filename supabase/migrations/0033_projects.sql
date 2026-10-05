-- Projects: the CV-points half of the app.
--
-- Courses teach a skill; nothing in the app helped anyone produce the thing
-- that gets them hired. A project playbook is admin-authored reference
-- content for one kind of deliverable — a thesis, an MVP, a research study, a
-- business report, a data analysis, a case competition entry — carrying the
-- formats it has to come in, the dos and donts, the tools, the export
-- options, and an ordered set of stages. A learner starts a project from a
-- playbook, works the stages, and pushes the finished thing onto their
-- resume's PROJECTS section.
--
-- Shape notes:
--
-- * formats / dos / donts / tools / exports are jsonb on the playbook, not
--   five more tables. They are read-only reference lists rendered as lists;
--   nothing joins or filters on them, and normalising them would mean five
--   tables and five seed passes to render five bulleted lists.
--
-- * stages ARE a table: progress is tracked per stage, and tutorials attach
--   to them.
--
-- * project_stages.skill_id is the tutorial mechanism. Each stage names the
--   skill that stage needs. If the learner has not unlocked it, the app
--   leads with "learn this first" and the stage's tutorial resources; if
--   they have, the tutorial collapses to one line and gets out of the way.
--   So the teaching is competence-gated by the skills engine already in
--   place, rather than every learner being shown every tutorial.
--   track_id is the deeper "go do the whole course" pointer.
--
-- Content tables follow the same admin-write / authenticated-read policy
-- pair as tracks and cohorts; per-user tables are self-scoped.

-- ----------------------------------------------------------------------------
-- Content
-- ----------------------------------------------------------------------------

create table if not exists public.project_playbooks (
  id text primary key,
  name text not null,
  label text not null,
  summary text not null default '',
  kind text not null default 'project',
  tier text not null default 'foundational' check (tier in ('foundational', 'intermediate', 'advanced')),
  estimated_weeks text,
  icon_key text,
  order_index int not null default 0,
  -- How the finished thing reads on a CV, and what it physically is.
  cv_line text not null default '',
  outcome_label text not null default '',
  formats jsonb not null default '[]'::jsonb,
  dos jsonb not null default '[]'::jsonb,
  donts jsonb not null default '[]'::jsonb,
  tools jsonb not null default '[]'::jsonb,
  exports jsonb not null default '[]'::jsonb,
  published boolean not null default true
);

create table if not exists public.project_stages (
  id text primary key,
  playbook_id text not null references public.project_playbooks(id) on delete cascade,
  order_index int not null default 0,
  title text not null,
  description text not null default '',
  checklist jsonb not null default '[]'::jsonb,
  -- Nullable and ON DELETE SET NULL: a stage must survive its skill or track
  -- being renamed out of the seed data. The stage still reads fine without
  -- them; it just loses its competence gate and its course pointer.
  skill_id text references public.skills(id) on delete set null,
  track_id text references public.tracks(id) on delete set null,
  estimated_days int
);

create index if not exists project_stages_playbook_idx on public.project_stages(playbook_id, order_index);

create table if not exists public.project_stage_resources (
  id text primary key,
  stage_id text not null references public.project_stages(id) on delete cascade,
  order_index int not null default 0,
  title text not null,
  url text not null,
  source text,
  format text,
  length text,
  note text
);

create index if not exists project_stage_resources_stage_idx on public.project_stage_resources(stage_id, order_index);

-- ----------------------------------------------------------------------------
-- Per-user
-- ----------------------------------------------------------------------------

create table if not exists public.user_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- restrict, not cascade: deleting a playbook must not silently delete the
  -- work people did from it.
  playbook_id text not null references public.project_playbooks(id) on delete restrict,
  title text not null,
  summary text not null default '',
  link text not null default '',
  outcome text not null default '',
  status text not null default 'planning' check (status in ('planning', 'in_progress', 'done', 'shelved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists user_projects_user_idx on public.user_projects(user_id, updated_at desc);

create table if not exists public.user_project_stages (
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.user_projects(id) on delete cascade,
  stage_id text not null references public.project_stages(id) on delete cascade,
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  notes text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, project_id, stage_id)
);

create index if not exists user_project_stages_project_idx on public.user_project_stages(project_id);

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------

alter table public.project_playbooks enable row level security;
alter table public.project_stages enable row level security;
alter table public.project_stage_resources enable row level security;
alter table public.user_projects enable row level security;
alter table public.user_project_stages enable row level security;

drop policy if exists "content read" on public.project_playbooks;
create policy "content read" on public.project_playbooks for select
  to authenticated using (true);
drop policy if exists "content write" on public.project_playbooks;
create policy "content write" on public.project_playbooks for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "content read" on public.project_stages;
create policy "content read" on public.project_stages for select
  to authenticated using (true);
drop policy if exists "content write" on public.project_stages;
create policy "content write" on public.project_stages for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "content read" on public.project_stage_resources;
create policy "content read" on public.project_stage_resources for select
  to authenticated using (true);
drop policy if exists "content write" on public.project_stage_resources;
create policy "content write" on public.project_stage_resources for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "own rows" on public.user_projects;
create policy "own rows" on public.user_projects for all
  to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on public.user_project_stages;
create policy "own rows" on public.user_project_stages for all
  to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Migration 0030 gave admins read-only visibility of other learners' work by
-- explicit request, on the understanding that this is a small trusted group.
-- Projects join that set, read-only, for the same reason: the admin learner
-- page is where someone's real output is reviewed.
drop policy if exists "admin read" on public.user_projects;
create policy "admin read" on public.user_projects for select
  to authenticated using (public.is_admin());

drop policy if exists "admin read" on public.user_project_stages;
create policy "admin read" on public.user_project_stages for select
  to authenticated using (public.is_admin());

-- ----------------------------------------------------------------------------
-- XP
-- ----------------------------------------------------------------------------
-- XP stays fully recomputed rather than incremented, so it self-heals across
-- re-seeds and retries. Two new terms, and the same trigger shape the
-- resource and skill tables already use.

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
    + coalesce((
      select count(*) * 25
      from public.user_project_stages
      where user_id = p_user_id and status = 'done'
    ), 0)
    + coalesce((
      select count(*) * 250
      from public.user_projects
      where user_id = p_user_id and status = 'done'
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

create or replace function public.trg_user_project_recompute_xp()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.recompute_xp(coalesce(new.user_id, old.user_id));
  return null;
end;
$$;

drop trigger if exists trg_user_projects_recompute_xp on public.user_projects;
create trigger trg_user_projects_recompute_xp
  after insert or update or delete on public.user_projects
  for each row execute function public.trg_user_project_recompute_xp();

drop trigger if exists trg_user_project_stages_recompute_xp on public.user_project_stages;
create trigger trg_user_project_stages_recompute_xp
  after insert or update or delete on public.user_project_stages
  for each row execute function public.trg_user_project_recompute_xp();

-- ----------------------------------------------------------------------------
-- RPCs
-- ----------------------------------------------------------------------------

-- Starting a project also lays down a todo row per stage, so the workspace
-- has something to render and the stage list can never drift from the
-- playbook the learner actually started.
create or replace function public.start_project(p_playbook_id text, p_title text)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_project uuid;
  v_title text := nullif(btrim(p_title), '');
begin
  if v_user is null then raise exception 'not authenticated'; end if;

  if v_title is null then
    select label into v_title from public.project_playbooks where id = p_playbook_id;
    if v_title is null then raise exception 'no such playbook'; end if;
  end if;

  insert into public.user_projects (user_id, playbook_id, title, status)
  values (v_user, p_playbook_id, v_title, 'in_progress')
  returning id into v_project;

  insert into public.user_project_stages (user_id, project_id, stage_id, status)
  select v_user, v_project, s.id, 'todo'
  from public.project_stages s
  where s.playbook_id = p_playbook_id;

  return v_project;
end;
$$;

create or replace function public.set_project_stage(
  p_project_id uuid,
  p_stage_id text,
  p_status text,
  p_notes text default null
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'not authenticated'; end if;
  if p_status not in ('todo', 'doing', 'done') then raise exception 'bad status'; end if;

  -- Scope the write to a project this user owns. Without this check a caller
  -- could pass someone else's project_id: the function is SECURITY DEFINER,
  -- so RLS is not doing it for us here.
  if not exists (
    select 1 from public.user_projects
    where id = p_project_id and user_id = v_user
  ) then
    raise exception 'no such project';
  end if;

  insert into public.user_project_stages (user_id, project_id, stage_id, status, notes, updated_at)
  values (v_user, p_project_id, p_stage_id, p_status, coalesce(p_notes, ''), now())
  on conflict (user_id, project_id, stage_id) do update
    set status = excluded.status,
        notes = coalesce(p_notes, public.user_project_stages.notes),
        updated_at = now();

  update public.user_projects
  set updated_at = now(),
      status = case when status = 'planning' then 'in_progress' else status end
  where id = p_project_id and user_id = v_user;
end;
$$;

create or replace function public.update_project(
  p_project_id uuid,
  p_title text default null,
  p_summary text default null,
  p_link text default null,
  p_outcome text default null,
  p_status text default null
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'not authenticated'; end if;
  if p_status is not null and p_status not in ('planning', 'in_progress', 'done', 'shelved') then
    raise exception 'bad status';
  end if;

  update public.user_projects
  set title = coalesce(nullif(btrim(p_title), ''), title),
      summary = coalesce(p_summary, summary),
      link = coalesce(p_link, link),
      outcome = coalesce(p_outcome, outcome),
      status = coalesce(p_status, status),
      completed_at = case
                       when p_status = 'done' then coalesce(completed_at, now())
                       when p_status is not null and p_status <> 'done' then null
                       else completed_at
                     end,
      updated_at = now()
  where id = p_project_id and user_id = v_user;

  if not found then raise exception 'no such project'; end if;
end;
$$;

create or replace function public.delete_project(p_project_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'not authenticated'; end if;
  delete from public.user_projects where id = p_project_id and user_id = v_user;
  if not found then raise exception 'no such project'; end if;
end;
$$;

-- Postgres grants EXECUTE to PUBLIC on every new function and Supabase adds
-- its own grant to anon; both have to be closed (see migration 0015).
revoke execute on function public.start_project(text, text) from public, anon;
revoke execute on function public.set_project_stage(uuid, text, text, text) from public, anon;
revoke execute on function public.update_project(uuid, text, text, text, text, text) from public, anon;
revoke execute on function public.delete_project(uuid) from public, anon;
grant execute on function public.start_project(text, text) to authenticated, service_role;
grant execute on function public.set_project_stage(uuid, text, text, text) to authenticated, service_role;
grant execute on function public.update_project(uuid, text, text, text, text, text) to authenticated, service_role;
grant execute on function public.delete_project(uuid) to authenticated, service_role;
