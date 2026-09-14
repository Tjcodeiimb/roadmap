-- ============================================================================
-- Decouples "has completed onboarding" from "has selected a track".
--
-- Onboarding no longer asks new users to pick a track directly — with the
-- marketplace/cohort system, that's now ambiguous (there are 9 courses and
-- 4 bundles, not 3 flat tracks) and redundant with the marketplace's own
-- enroll flow. Onboarding is now just the welcome + how-it-works walkthrough,
-- ending on the marketplace instead of pre-selecting a track for you.
--
-- Anyone who already has an active track selection (i.e. every real user so
-- far) is backfilled to onboarded = true so they never see onboarding again.
--
-- Additive only; safe to re-run.
-- ============================================================================

alter table public.profiles
  add column if not exists onboarded boolean not null default false;

update public.profiles p set onboarded = true
where onboarded = false
  and exists (
    select 1 from public.user_track_selection uts
    where uts.user_id = p.id
  );
