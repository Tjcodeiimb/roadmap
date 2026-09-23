-- Removing a single course from a cohort bundle left the cohort itself
-- still marked enrolled: user_cohort_enrollment is untouched by
-- unenroll_track, so the marketplace/cohort detail page kept showing
-- "Continue" for a cohort the learner had actually broken out of. Clicking
-- Continue just navigates (it doesn't call enroll_cohort again), so nothing
-- silently re-added the removed course today — but the learner had no way
-- to get the "Enroll in cohort" affordance back for a deliberate, explicit
-- re-enrollment (which does re-add every course, on purpose) short of
-- calling leave_cohort first.
--
-- Fix: unenrolling from any track that belongs to a cohort the user is
-- enrolled in also drops that cohort's user_cohort_enrollment row. The
-- other courses the cohort pulled in are untouched (their
-- user_track_selection rows stay active) — only the cohort-level "this is
-- one bundle" bookkeeping is cleared, so the marketplace shows "Enroll in
-- cohort" again rather than "Continue".

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

  -- Breaking any course out of a cohort bundle breaks the bundle: re-joining
  -- must be a fresh, explicit "Enroll in cohort" action (which re-adds every
  -- course), not a "Continue" that quietly implies the bundle is still whole.
  delete from public.user_cohort_enrollment
  where user_id = v_user
    and cohort_id in (
      select cohort_id from public.cohort_courses where track_id = p_track_id
    );
end;
$$;
