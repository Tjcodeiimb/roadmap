-- ============================================================================
-- Finance just gained 2 new phases (Advanced Financial Modeling: 3-statement
-- modeling, LBOs, credit/debt schedules; Private Equity & Alternative
-- Investments: PE, hedge funds, VC) via scripts/seed-data/finance.json, on
-- top of the 7 existing phases. Bump the marketplace metadata set by 0003
-- to match: no longer a foundational-only track, and materially longer.
--
-- Additive data only; safe to re-run.
-- ============================================================================

update public.tracks set
  tier = 'intermediate',
  summary = 'Learn to read financial statements, model valuations and LBOs, and speak the language of deals — from fundamentals through private equity and venture capital.',
  estimated_hours = 130,
  effort_per_week = '5–7 hrs'
where id = 'finance';
