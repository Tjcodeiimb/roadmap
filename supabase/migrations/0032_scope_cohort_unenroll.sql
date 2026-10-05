-- Two unenroll bugs that only became visible once cohorts started
-- overlapping heavily (16 bundles, and `excel` alone sits in 7 of them).
--
-- Bug 1 — leaving one course dropped you out of EVERY bundle containing it.
-- Migration 0027 deleted user_cohort_enrollment for all cohorts holding the
-- track: `cohort_id in (select cohort_id from cohort_courses where track_id
-- = p_track_id)`. With 4 barely-overlapping cohorts that read as "breaking a
-- course out of a bundle breaks the bundle"; with today's catalogue, leaving
-- Excel silently emptied most of the learner's bundle list, including bundles
-- whose other courses they had barely started. The cascade is now scoped to
-- the one cohort that actually pulled this course in — the `source` recorded
-- on the row being archived — which is what 0027's own comment describes.
--
-- Bug 2 — joining a bundle quietly adopted courses you had enrolled in
-- yourself, so leaving the bundle took them with it. enroll_cohort upserted
-- `source = excluded.source` unconditionally, overwriting `source = 'self'`
-- on a course that was already active. leave_cohort then archived it, since
-- it archives by `source = p_cohort_id`. leave_cohort's comment already said
-- it should only touch "courses this cohort pulled in and the user hasn't
-- since claimed for themselves" — enroll_cohort was destroying the evidence.
-- A row that is already active now keeps whatever source it had; only a new
-- or archived (re-added) row takes the cohort as its source.

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

  -- Re-running this for a bundle you are already in is also how a learner
  -- re-adds a course they left out of it, so it stays idempotent.
  insert into public.user_track_selection (user_id, track_id, status, source)
  select v_user, cc.track_id, 'active', p_cohort_id
  from public.cohort_courses cc
  where cc.cohort_id = p_cohort_id
  on conflict (user_id, track_id) do update
    set status = 'active',
        source = case
                   when user_track_selection.status = 'active' then user_track_selection.source
                   else excluded.source
                 end;
end;
$$;

create or replace function public.unenroll_track(p_track_id text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_source text;
begin
  if v_user is null then raise exception 'not authenticated'; end if;

  select source into v_source
  from public.user_track_selection
  where user_id = v_user and track_id = p_track_id;

  -- Archive, never delete: the user's progress on this track stays intact.
  update public.user_track_selection
  set status = 'archived'
  where user_id = v_user and track_id = p_track_id;

  -- Breaking a course out of the bundle that added it breaks that bundle:
  -- re-joining must be a fresh, explicit "Enroll in cohort" (which re-adds
  -- every course), not a "Continue" that implies the bundle is still whole.
  -- Other bundles that merely happen to include this course are left alone —
  -- the learner never joined this course through them.
  if v_source is not null and v_source <> 'self' then
    delete from public.user_cohort_enrollment
    where user_id = v_user
      and cohort_id = v_source
      and exists (
        select 1 from public.cohort_courses cc
        where cc.cohort_id = v_source and cc.track_id = p_track_id
      );
  end if;
end;
$$;
