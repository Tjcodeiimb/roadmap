-- ============================================================================
-- Soft-hide the ESG & Business Models track per your call: not a destructive
-- delete. Setting published = false removes it from the marketplace and new
-- enrollment immediately (getMarketplaceCourses already filters
-- .eq("published", true)) while preserving the track's content and any
-- existing user enrollment/progress rows - fully reversible by flipping this
-- back to true. The seed script no longer touches this track going forward
-- (removed from scripts/seed.mjs and scripts/validate-seed.mjs's TRACK_FILES),
-- so re-seeding won't silently re-publish it.
-- ============================================================================

update public.tracks set published = false where id = 'sustainability';
