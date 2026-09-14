-- ============================================================================
-- Backfill marketplace metadata for the 3 tracks that predate the
-- marketplace (0002 added the columns with blank/default values). Without
-- this, the new marketplace page would show real courses with empty
-- summaries and "0 hours" — this makes it look like the real thing it is.
--
-- Additive data only; safe to re-run.
-- ============================================================================

update public.tracks set
  tier = 'intermediate',
  summary = 'Build fluency with modern AI tools, then ship real agents, products, and workflows.',
  domain = 'ai',
  estimated_hours = 140,
  effort_per_week = '5–8 hrs'
where id = 'ai';

update public.tracks set
  tier = 'foundational',
  summary = 'Learn to read financial statements, model valuations, and speak the language of deals.',
  domain = 'finance',
  estimated_hours = 90,
  effort_per_week = '4–6 hrs'
where id = 'finance';

update public.tracks set
  tier = 'foundational',
  summary = 'Think and communicate like a consultant — structured problem-solving, frameworks, and client craft.',
  domain = 'consulting',
  estimated_hours = 70,
  effort_per_week = '3–5 hrs'
where id = 'consulting';
