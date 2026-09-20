-- Finance course restructure: de-duplicate and resequence.
--
-- finance.json was written in two passes — phases 1–7 first, then 8–12 appended
-- later without reconciling against them. The seam left real duplication:
-- Comparable Company Analysis was taught in two separate topics with the same
-- title, "Equity Research & Valuation" existed as both a topic and a whole
-- phase, and comps appeared across five resources in three topics.
--
-- Mirrors scripts/seed-data/finance.json and fpa_reporting.json. Needed as a
-- migration because the seed script only ever upserts — removing something
-- from the JSON never removes it from an existing database.
--
-- ORDER MATTERS: resources are re-homed BEFORE any topic is dropped, because
-- resources.topic_id cascades on delete and the keepers would otherwise be
-- destroyed along with the duplicate topic they currently sit under.
--
-- Idempotent; safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Re-home the resources worth keeping
-- ---------------------------------------------------------------------------
update public.resources set topic_id = 'fin-p10-t2' where id = 'fin-p4-r3';   -- comps template
update public.resources set topic_id = 'fin-p10-t1' where id in ('fin-p4-r5','fin-p4-r6'); -- intro DCF build
update public.resources set topic_id = 'fin-p10-t3' where id = 'fin-p6-r1';   -- equity research samples
update public.resources set topic_id = 'fin-p1-t1'  where id = 'fin-p12-r4';  -- SEC guide, was under SPVs
update public.resources set topic_id = 'fin-p8-t1'  where id = 'fin-p12-r10'; -- modelling module, was under red flags

-- Titled "Accounting Fundamentals" but the URL is CFI's financial modelling
-- test. The title was the thing that was wrong, so make it honest and file it
-- with the modelling content.
update public.resources
set topic_id = 'fin-p8-t1',
    title = 'Financial Modeling Test – CFI',
    note = 'Self-assessment: build a model against a timed brief.'
where id = 'fin-p1-r5';

-- ---------------------------------------------------------------------------
-- 2. Drop duplicate and out-of-scope resources
-- ---------------------------------------------------------------------------
delete from public.resources where id in (
  'fin-p1-r2',   -- a chapter inside the module already listed as fin-p1-r10
  'fin-p4-r4',   -- 4th copy of comps
  'fin-p7-r4',   -- 5th copy of comps
  'fin-p6-r2',   -- Damodaran playlist ) three pointers at one body of material;
  'fin-p6-r3',   -- Damodaran channel  ) the session-indexed fin-p10-r4 survives
  'fin-p3-r11',  -- Technical Analysis — out of scope for this track entirely
  'fin-p7-r3'    -- titled "JPMorgan IB Simulation", URL was a comps blog post
);

-- fpa_reporting repeated the same URLs across topics — the WSP career guide 4x,
-- the CFI hub and Planful post 3x each. Keeps the first, most topically apt
-- occurrence of each.
delete from public.resources where id in (
  'fpa-p2-r2','fpa-p3-r1','fpa-p3-r6','fpa-p4-r5','fpa-p5-r2',
  'fpa-p5-r3','fpa-p5-r6','fpa-p6-r2','fpa-p6-r4','fpa-p6-r5'
);

-- ---------------------------------------------------------------------------
-- 3. Re-home surviving topics, then drop the duplicates and empty containers
-- ---------------------------------------------------------------------------
update public.topics set phase_id = 'fin-p3' where id = 'fin-p6-t2';  -- Portfolio Construction
update public.topics set phase_id = 'fin-p5' where id = 'fin-p4-t1';  -- Pitch Books

delete from public.topics where id in (
  'fin-p4-t2',  -- identical to fin-p10-t2 (Comparable Company Analysis)
  'fin-p4-t3',  -- DCF Modeling, ~70% of fin-p10-t1 (DCF Deep Dive)
  'fin-p6-t1'   -- Equity Research & Valuation, subsumed by the whole of phase 10
);

delete from public.phases where id in ('fin-p4','fin-p6');  -- no topics left

-- ---------------------------------------------------------------------------
-- 4. Remove skills stranded by the above
--
-- These are auto-generated per-topic skills whose topic no longer exists, plus
-- one whose every mapped resource was deleted, leaving it impossible to unlock.
-- user_skills.skill_id cascades, so anyone who had already earned one of these
-- loses it and their XP recomputes downward. That is the intended outcome — the
-- skill was awarded for content that is now gone — but it is a visible change
-- for existing learners.
-- ---------------------------------------------------------------------------
delete from public.skills where id in (
  'skill-topic-fin-p4-t2',
  'skill-topic-fin-p4-t3',
  'skill-topic-fin-p6-t1',
  'skill-topic-fin-p7-t2'
);

-- ---------------------------------------------------------------------------
-- 5. Resequence: modelling before valuation, PE after valuation, capstone last
-- ---------------------------------------------------------------------------
update public.phases set title = 'Investment Banking & M&A' where id = 'fin-p5';

update public.phases set order_index = v.ord
from (values
  ('fin-p1', 1), ('fin-p2', 2), ('fin-p3', 3), ('fin-p8', 4), ('fin-p5', 5),
  ('fin-p10', 6), ('fin-p9', 7), ('fin-p11', 8), ('fin-p12', 9), ('fin-p7', 10)
) as v(phase_id, ord)
where phases.id = v.phase_id;

do $$
declare
  v_phases int;
  v_topics int;
begin
  select count(*) into v_phases from public.phases where track_id = 'finance';
  select count(*) into v_topics from public.topics t
    join public.phases p on p.id = t.phase_id where p.track_id = 'finance';
  raise notice 'Finance track now has % phases and % topics.', v_phases, v_topics;
end;
$$;
