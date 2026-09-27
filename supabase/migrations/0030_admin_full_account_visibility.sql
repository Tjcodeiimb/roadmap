-- Deliberate, explicit trade-off for a small trusted test group: an admin
-- can now read any learner's progress, resume, XP/streak, unlocked skills,
-- enrollments and cohort membership -- not just their own. This is
-- additive-only (a second permissive SELECT policy alongside each existing
-- "own rows" policy, which stays exactly as it was for writes and for a
-- non-admin's own reads) and read-only: an admin still cannot write another
-- user's rows through these policies. Mirrors the same pattern already used
-- for profiles ("own profile select" -> auth.uid() = id or is_admin()).

drop policy if exists "admin read" on public.user_progress;
create policy "admin read" on public.user_progress for select using (public.is_admin());

drop policy if exists "admin read" on public.user_resource_progress;
create policy "admin read" on public.user_resource_progress for select using (public.is_admin());

drop policy if exists "admin read" on public.resumes;
create policy "admin read" on public.resumes for select using (public.is_admin());

drop policy if exists "admin read" on public.user_xp;
create policy "admin read" on public.user_xp for select using (public.is_admin());

drop policy if exists "admin read" on public.user_streak;
create policy "admin read" on public.user_streak for select using (public.is_admin());

drop policy if exists "admin read" on public.user_track_selection;
create policy "admin read" on public.user_track_selection for select using (public.is_admin());

drop policy if exists "admin read" on public.user_skills;
create policy "admin read" on public.user_skills for select using (public.is_admin());

drop policy if exists "admin read" on public.user_cohort_enrollment;
create policy "admin read" on public.user_cohort_enrollment for select using (public.is_admin());
