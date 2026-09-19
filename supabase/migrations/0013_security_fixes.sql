-- Security and data-integrity fixes.

-- ============================================================================
-- 1. Privilege escalation: any employee could make themselves an admin.
--
-- The "own profile update" policy from 0001 is row-scoped but not
-- column-scoped, and profiles.role sits on that row. With the anon key being
-- public by design, any signed-in user could
--     PATCH /rest/v1/profiles?id=eq.<own uuid>  {"role":"admin"}
-- and then read every employee's email via get_admin_roster().
--
-- RLS cannot express "all columns except this one", so the column is pinned
-- with a trigger instead. setUserRole() goes through requireAdmin() and stays
-- the only way role changes.
-- ============================================================================

create or replace function public.guard_profile_privileged_columns()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- An admin acting through the admin panel may change roles; nobody else may.
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'role cannot be changed';
  end if;

  -- Identity is never rewritable, by anyone.
  if new.id is distinct from old.id then
    raise exception 'id cannot be changed';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_profile_privileged_columns on public.profiles;
create trigger trg_guard_profile_privileged_columns
  before update on public.profiles
  for each row execute function public.guard_profile_privileged_columns();

-- ============================================================================
-- 2. Leaderboard was readable without signing in.
--
-- get_leaderboard() is SECURITY DEFINER (so it bypasses RLS) and had no
-- caller check. Postgres grants EXECUTE to PUBLIC by default and Supabase
-- exposes every function over PostgREST, so an unauthenticated request
-- carrying only the public anon key returned the full name and XP of the top
-- 100 employees. 0009 had also dropped the opt-in filter, so no one consented
-- to being listed publicly.
-- ============================================================================

create or replace function public.get_leaderboard()
returns table (full_name text, total_xp int, is_you boolean)
language plpgsql
security definer set search_path = public
stable
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  return query
    select p.full_name, coalesce(x.total_xp, 0), p.id = auth.uid()
    from public.profiles p
    left join public.user_xp x on x.user_id = p.id
    order by coalesce(x.total_xp, 0) desc, p.full_name asc
    limit 100;
end;
$$;

-- EXECUTE arrives by two separate routes and both have to be closed: Postgres
-- grants it to PUBLIC on every new function, and Supabase's default privileges
-- additionally grant it to `anon` directly. Revoking only one leaves the other
-- in place. 0015 revokes from both; these lines alone are not sufficient.
revoke execute on function public.get_leaderboard() from public;
grant execute on function public.get_leaderboard() to authenticated, service_role;

-- Same class of gap, lower stakes (catalogue data only, no personal data).
revoke execute on function public.search_catalog(text) from public;
grant execute on function public.search_catalog(text) to authenticated, service_role;

revoke execute on function public.get_trending_tracks(int, int) from public;
grant execute on function public.get_trending_tracks(int, int) to authenticated, service_role;

-- ============================================================================
-- 3. Leaving a cohort archived courses the learner had enrolled in themselves.
--
-- enroll_cohort overwrote source unconditionally, so a track enrolled with
-- source='self' and later included in a cohort was recorded as belonging to
-- that cohort. leave_cohort then archived it, and the course disappeared from
-- the learner's dashboard even though they had chosen it independently.
-- Preserving 'self' makes the function match the intent leave_cohort already
-- documents.
-- ============================================================================

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
    set status = 'active',
        source = case
          when user_track_selection.source = 'self' then 'self'
          else excluded.source
        end;
end;
$$;
