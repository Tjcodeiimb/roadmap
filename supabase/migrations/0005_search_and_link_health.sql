-- ============================================================================
-- Phase 3 — Discovery & Freshness (search + link health)
--
-- Additive only, safe to re-run. Postgres full-text search instead of a
-- paid search service, and plain columns/cron instead of new infra — same
-- $0/month constraint as everything before this.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SEARCH — a generated tsvector + GIN index per searchable table
-- ----------------------------------------------------------------------------

alter table public.tracks add column if not exists search_vector tsvector
  generated always as (to_tsvector('english', coalesce(label, '') || ' ' || coalesce(summary, ''))) stored;
create index if not exists tracks_search_idx on public.tracks using gin (search_vector);

alter table public.topics add column if not exists search_vector tsvector
  generated always as (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))) stored;
create index if not exists topics_search_idx on public.topics using gin (search_vector);

alter table public.resources add column if not exists search_vector tsvector
  generated always as (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(note, ''))) stored;
create index if not exists resources_search_idx on public.resources using gin (search_vector);

alter table public.skills add column if not exists search_vector tsvector
  generated always as (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))) stored;
create index if not exists skills_search_idx on public.skills using gin (search_vector);

alter table public.cohorts add column if not exists search_vector tsvector
  generated always as (to_tsvector('english', coalesce(label, '') || ' ' || coalesce(summary, ''))) stored;
create index if not exists cohorts_search_idx on public.cohorts using gin (search_vector);

-- Single ranked search across all five, filtering out unpublished
-- tracks/cohorts. Empty/whitespace queries are rejected client-side before
-- this is ever called, so no special-casing needed here.
create or replace function public.search_catalog(p_query text)
returns table (
  type text,
  id text,
  parent_track_id text,
  title text,
  snippet text,
  rank real
)
language sql
security definer set search_path = public
stable
as $$
  with q as (select websearch_to_tsquery('english', p_query) as tsq)
  select 'track'::text, t.id, t.id, t.label, t.summary, ts_rank_cd(t.search_vector, q.tsq)
  from public.tracks t, q
  where t.published and t.search_vector @@ q.tsq
  union all
  select 'topic'::text, tp.id, ph.track_id, tp.title, tp.description, ts_rank_cd(tp.search_vector, q.tsq)
  from public.topics tp
  join public.phases ph on ph.id = tp.phase_id
  join public.tracks tr on tr.id = ph.track_id, q
  where tr.published and tp.search_vector @@ q.tsq
  union all
  select 'resource'::text, r.id, ph.track_id, r.title, r.note, ts_rank_cd(r.search_vector, q.tsq)
  from public.resources r
  join public.topics tp on tp.id = r.topic_id
  join public.phases ph on ph.id = tp.phase_id
  join public.tracks tr on tr.id = ph.track_id, q
  where tr.published and r.search_vector @@ q.tsq
  union all
  select 'skill'::text, s.id, null, s.name, s.description, ts_rank_cd(s.search_vector, q.tsq)
  from public.skills s, q
  where s.search_vector @@ q.tsq
  union all
  select 'cohort'::text, c.id, null, c.label, c.summary, ts_rank_cd(c.search_vector, q.tsq)
  from public.cohorts c, q
  where c.published and c.search_vector @@ q.tsq
  order by rank desc
  limit 30;
$$;

-- ----------------------------------------------------------------------------
-- LINK HEALTH — never auto-hides content; a "broken" result is a hint for
-- a human to confirm in the admin panel, not a verdict.
-- ----------------------------------------------------------------------------

alter table public.resources
  add column if not exists link_status text not null default 'unchecked',
  add column if not exists last_checked_at timestamptz,
  add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'resources_link_status_check') then
    alter table public.resources add constraint resources_link_status_check
      check (link_status in ('ok', 'broken', 'unchecked'));
  end if;
end $$;

create index if not exists resources_link_check_idx on public.resources (last_checked_at nulls first);
create index if not exists resources_created_at_idx on public.resources (created_at desc);

-- ----------------------------------------------------------------------------
-- TRENDING — aggregate-only, no PII: just a track id and a count, across
-- all users, computed inside the function rather than exposed via a
-- user-scoped table (RLS would otherwise only return the caller's own rows).
-- ----------------------------------------------------------------------------

create or replace function public.get_trending_tracks(p_days int default 14, p_limit int default 5)
returns table (track_id text, completions bigint)
language sql
security definer set search_path = public
stable
as $$
  select ph.track_id, count(*) as completions
  from public.user_progress up
  join public.topics tp on tp.id = up.topic_id
  join public.phases ph on ph.id = tp.phase_id
  where up.status = 'done' and up.completed_at >= now() - (p_days || ' days')::interval
  group by ph.track_id
  order by completions desc
  limit p_limit;
$$;
