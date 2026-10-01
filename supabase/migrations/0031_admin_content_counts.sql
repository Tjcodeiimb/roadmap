-- One round trip for the admin index's per-course counts.
--
-- The page used to show a bare card per course, so there was no way to tell a
-- 43-topic course from an empty one before clicking into it. Counting client
-- side would mean pulling every phase, topic and resource row (~1,700
-- resources) just to render 29 numbers, and would hit PostgREST's max-rows cap
-- if one is ever configured. This does it in the database instead, matching
-- how get_admin_track_stats and get_admin_roster already work.
--
-- learners counts ACTIVE enrollments only: unenroll archives rather than
-- deletes (migration 0002), so counting every row would include people who
-- left. Admin-only, like its neighbours.

create or replace function public.get_admin_content_counts()
returns table (
  track_id text,
  phase_count int,
  topic_count int,
  resource_count int,
  learner_count int
)
language sql
security definer set search_path = public
stable
as $$
  select
    t.id,
    (select count(*) from public.phases ph where ph.track_id = t.id)::int,
    (select count(*)
       from public.topics tp
       join public.phases ph2 on ph2.id = tp.phase_id
      where ph2.track_id = t.id)::int,
    (select count(*)
       from public.resources r
       join public.topics tp2 on tp2.id = r.topic_id
       join public.phases ph3 on ph3.id = tp2.phase_id
      where ph3.track_id = t.id)::int,
    (select count(*)
       from public.user_track_selection uts
      where uts.track_id = t.id and uts.status = 'active')::int
  from public.tracks t
  where public.is_admin()
  order by t.order_index;
$$;

-- Postgres grants EXECUTE to PUBLIC on every new function and Supabase adds
-- its own grant to anon; both have to be closed (see migration 0015).
revoke execute on function public.get_admin_content_counts() from public;
revoke execute on function public.get_admin_content_counts() from anon;
grant execute on function public.get_admin_content_counts() to authenticated, service_role;
