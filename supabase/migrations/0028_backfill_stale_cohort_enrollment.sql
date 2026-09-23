-- One-time cleanup, companion to 0027. 0027 stops a FUTURE course removal
-- from leaving a stale user_cohort_enrollment row behind, but it can't
-- retroactively fix rows that already went stale before it existed — a
-- learner who enrolled in a multi-course cohort and dropped courses out of
-- it one at a time before 0027 shipped still has a user_cohort_enrollment
-- row for that cohort, even though they're now only active in one of its
-- courses. That row is what keeps showing "Continue" instead of "Enroll in
-- cohort" on the marketplace.
--
-- A user_cohort_enrollment row is stale when the user doesn't have an
-- active user_track_selection row for every course the cohort currently
-- bundles. Delete those rows; nothing else changes — the courses the user
-- is still actively enrolled in stay exactly as they are, active or
-- archived, self or cohort sourced.
--
-- Safe to re-run: once every stale row is gone, this is a no-op.

delete from public.user_cohort_enrollment uce
where exists (
  select 1
  from public.cohort_courses cc
  where cc.cohort_id = uce.cohort_id
    and not exists (
      select 1
      from public.user_track_selection uts
      where uts.user_id = uce.user_id
        and uts.track_id = cc.track_id
        and uts.status = 'active'
    )
);
