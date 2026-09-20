-- New Finance content: the high-finance areas the course was missing.
--
-- A coverage review found restructuring/distressed, merger models and
-- accretion/dilution, deal sourcing, ECM/DCM and the technical interview
-- gauntlet absent entirely, and leveraged finance thin. Merger models and
-- accretion/dilution in particular are the most-tested technical in an
-- investment banking interview and appeared nowhere.
--
-- Every URL here was corroborated through search results returning the page's
-- own current title and body text. They could NOT be opened directly from the
-- authoring environment, which blocks these domains — so run
-- `node scripts/check-links.mjs` locally before relying on them.
--
-- Mirrors scripts/seed-data/finance.json and skills.json. Idempotent.

-- Phase
insert into public.phases (id, track_id, order_index, title, description, estimated_weeks)
values ('fin-p13', 'finance', 8, 'Leveraged Finance, Credit & Restructuring', 'The debt side of the deal, and what happens when it goes wrong: the leveraged product set, how credit agreements actually constrain a borrower, and the in- and out-of-court routes through distress.', '6–8')
on conflict (id) do update set order_index = excluded.order_index, title = excluded.title,
  description = excluded.description, estimated_weeks = excluded.estimated_weeks;

-- Topics
insert into public.topics (id, phase_id, order_index, title, description, steps, tags)
values ('fin-p13-t1', 'fin-p13', 1, 'Leveraged Loans & High Yield', 'The leveraged product set: term loan B versus senior notes, pricing and call protection, and the CLO and high-yield-fund buyer base that decides what can actually get financed.', '[{"t": "Separate the instruments", "d": "Term loan B vs senior notes: security, seniority, floating vs fixed, call protection."}, {"t": "Follow the money", "d": "Work out who buys each \u2014 CLOs, HY funds, direct lenders \u2014 and how that shapes terms."}, {"t": "Price a deal", "d": "Take a recent LBO and reason through why its capital structure was built the way it was."}]'::jsonb, '{}')
on conflict (id) do update set phase_id = excluded.phase_id, order_index = excluded.order_index,
  title = excluded.title, description = excluded.description, steps = excluded.steps;
insert into public.topics (id, phase_id, order_index, title, description, steps, tags)
values ('fin-p13-t2', 'fin-p13', 2, 'Restructuring & Chapter 11', 'In-court versus out-of-court, creditor hierarchy and the absolute priority rule, DIP financing, liquidation analysis and the plan of reorganisation — plus how restructuring interviews differ from standard IB.', '[{"t": "Learn the waterfall", "d": "Absolute priority rule: who gets paid, in what order, and where the fulcrum security sits."}, {"t": "Compare the routes", "d": "Out-of-court exchange vs Chapter 11 \u2014 the trade-offs on speed, cost and holdouts."}, {"t": "Build a liquidation analysis", "d": "Recovery by class, and what it implies for where value breaks."}, {"t": "Drill the technicals", "d": "Work the RX interview question set until the answers are yours."}]'::jsonb, '{}')
on conflict (id) do update set phase_id = excluded.phase_id, order_index = excluded.order_index,
  title = excluded.title, description = excluded.description, steps = excluded.steps;
insert into public.topics (id, phase_id, order_index, title, description, steps, tags)
values ('fin-p5-t3', 'fin-p5', 4, 'Merger Models & Accretion/Dilution', 'Build a pro-forma EPS bridge: consideration mix, synergies, foregone interest and the break-even premium. The most-tested technical in an IB interview.', '[{"t": "Build the pro-forma", "d": "Combine the two P&Ls, layer in the financing, and get to pro-forma EPS."}, {"t": "Find the break-even", "d": "Solve for the premium at which the deal stops being accretive."}, {"t": "Flex the consideration", "d": "Rerun it as all-cash, all-stock and mixed; explain why the answer moves."}]'::jsonb, '{}')
on conflict (id) do update set phase_id = excluded.phase_id, order_index = excluded.order_index,
  title = excluded.title, description = excluded.description, steps = excluded.steps;
insert into public.topics (id, phase_id, order_index, title, description, steps, tags)
values ('fin-p5-t4', 'fin-p5', 5, 'Equity & Debt Capital Markets', 'How companies actually raise money: the IPO process end to end, follow-ons and convertibles on the equity side, investment-grade issuance on the debt side, and how ECM and DCM desks differ from M&A.', '[{"t": "Walk an IPO", "d": "Underwriter selection, S-1, roadshow, bookbuilding, pricing and the first day."}, {"t": "Read a real S-1", "d": "Pull one from EDGAR and find the risk factors, use of proceeds and dilution."}, {"t": "Contrast the desks", "d": "ECM vs DCM vs LevFin \u2014 who does what, and what the work looks like day to day."}]'::jsonb, '{}')
on conflict (id) do update set phase_id = excluded.phase_id, order_index = excluded.order_index,
  title = excluded.title, description = excluded.description, steps = excluded.steps;
insert into public.topics (id, phase_id, order_index, title, description, steps, tags)
values ('fin-p5-t5', 'fin-p5', 6, 'Sell-Side Process: Teaser, NDA & CIM', 'What bankers actually produce between mandate and close, and how a buyer reads it: the anonymous teaser, the NDA, the CIM, the process letter and the buyer list.', '[{"t": "Work the sequence", "d": "Teaser to NDA to CIM to bids \u2014 what each document is for and who sees it."}, {"t": "Dissect a CIM", "d": "Read a real one and note what it asserts, what it omits, and why it never states a price."}, {"t": "Build a buyer list", "d": "Segment strategics vs sponsors for a target and justify the cut."}]'::jsonb, '{}')
on conflict (id) do update set phase_id = excluded.phase_id, order_index = excluded.order_index,
  title = excluded.title, description = excluded.description, steps = excluded.steps;
insert into public.topics (id, phase_id, order_index, title, description, steps, tags)
values ('fin-p9-t4', 'fin-p9', 4, 'Fund Economics & Value Creation', 'How a fund actually makes money and how returns get attributed: hurdle, catch-up, European vs American waterfall, and splitting an outcome into deleveraging, EBITDA growth and multiple expansion.', '[{"t": "Split a waterfall", "d": "Run an exit through European and American structures and compare GP take."}, {"t": "Attribute a return", "d": "Decompose an IRR into deleveraging, earnings growth and multiple arbitrage."}, {"t": "Judge the levers", "d": "Decide which lever did the work \u2014 and whether it was skill or the market."}]'::jsonb, '{}')
on conflict (id) do update set phase_id = excluded.phase_id, order_index = excluded.order_index,
  title = excluded.title, description = excluded.description, steps = excluded.steps;

-- Resources
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p13-r1', 'fin-p13-t1', 1, 'Leveraged Finance (LevFin): Ultimate Guide', 'https://www.wallstreetprep.com/knowledge/ultimate-guide-to-debt-leveraged-finance/', 'Wall Street Prep', 'article', 'The single best free overview of the leveraged debt market.')
on conflict (id) do update set topic_id = excluded.topic_id, order_index = excluded.order_index,
  title = excluded.title, url = excluded.url, source = excluded.source, format = excluded.format, note = excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p13-r2', 'fin-p13-t1', 2, 'Leveraged Finance 101: A Covenant Handbook', 'https://www.stblaw.com/docs/default-source/publications/leveraged-finance-101---a-covenant-handbook.pdf', 'Simpson Thacher', 'pdf', 'Law-firm primary source on covenant mechanics — incurrence vs maintenance, baskets, restricted payments.')
on conflict (id) do update set topic_id = excluded.topic_id, order_index = excluded.order_index,
  title = excluded.title, url = excluded.url, source = excluded.source, format = excluded.format, note = excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p13-r3', 'fin-p13-t2', 1, 'Financial Restructuring — Free 11-Part Series', 'https://www.wallstreetprep.com/knowledge/quick-lesson-demystifying-financial-restructuring/', 'Wall Street Prep', 'course', 'Distress, priority waterfall, valuing a distressed firm, distressed debt investing.')
on conflict (id) do update set topic_id = excluded.topic_id, order_index = excluded.order_index,
  title = excluded.title, url = excluded.url, source = excluded.source, format = excluded.format, note = excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p13-r4', 'fin-p13-t2', 2, 'Restructuring Investment Banking: How to Get In', 'https://mergersandinquisitions.com/restructuring-investment-banking-group/', 'Mergers & Inquisitions', 'article', 'What debtor-side bankers actually do, and how RX recruiting differs.')
on conflict (id) do update set topic_id = excluded.topic_id, order_index = excluded.order_index,
  title = excluded.title, url = excluded.url, source = excluded.source, format = excluded.format, note = excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p13-r5', 'fin-p13-t2', 3, 'Restructuring Interview Questions', 'https://www.wallstreetprep.com/knowledge/restructuring-interview-guide-technical-questions/', 'Wall Street Prep', 'article', 'The RX technical set with worked answers.')
on conflict (id) do update set topic_id = excluded.topic_id, order_index = excluded.order_index,
  title = excluded.title, url = excluded.url, source = excluded.source, format = excluded.format, note = excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p5-r10', 'fin-p5-t3', 1, 'Merger Model: M&A Training Tutorial + Excel Template', 'https://www.wallstreetprep.com/knowledge/merger-model/', 'Wall Street Prep', 'article', 'Full build. Article is free; the Excel template asks for an email.')
on conflict (id) do update set topic_id = excluded.topic_id, order_index = excluded.order_index,
  title = excluded.title, url = excluded.url, source = excluded.source, format = excluded.format, note = excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p5-r11', 'fin-p5-t3', 2, 'Merger Model: Accretion/Dilution', 'https://www.streetofwalls.com/articles/investment-banking/recruiting-interviewing/merger-model-accretion-dilution/', 'Street of Walls', 'article', 'The accretion/dilution logic in interview form.')
on conflict (id) do update set topic_id = excluded.topic_id, order_index = excluded.order_index,
  title = excluded.title, url = excluded.url, source = excluded.source, format = excluded.format, note = excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p5-r12', 'fin-p5-t3', 3, 'M&A Interview Questions', 'https://www.wallstreetprep.com/knowledge/ma-interview-questions/', 'Wall Street Prep', 'article', 'Merger-model concepts as they get asked.')
on conflict (id) do update set topic_id = excluded.topic_id, order_index = excluded.order_index,
  title = excluded.title, url = excluded.url, source = excluded.source, format = excluded.format, note = excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p5-r13', 'fin-p5-t4', 1, 'Equity Capital Markets (ECM): The Definitive Guide', 'https://mergersandinquisitions.com/equity-capital-markets/', 'Mergers & Inquisitions', 'article', 'Origination vs syndicate, IPOs, follow-ons, converts.')
on conflict (id) do update set topic_id = excluded.topic_id, order_index = excluded.order_index,
  title = excluded.title, url = excluded.url, source = excluded.source, format = excluded.format, note = excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p5-r14', 'fin-p5-t4', 2, 'Initial Public Offering (IPO): Definition + Process', 'https://www.wallstreetprep.com/knowledge/ipo-initial-public-offering/', 'Wall Street Prep', 'article', 'Underwriters, valuation, roadshow, pricing.')
on conflict (id) do update set topic_id = excluded.topic_id, order_index = excluded.order_index,
  title = excluded.title, url = excluded.url, source = excluded.source, format = excluded.format, note = excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p5-r15', 'fin-p5-t4', 3, 'Debt Capital Markets (DCM) Explained', 'https://mergersandinquisitions.com/debt-capital-markets/', 'Mergers & Inquisitions', 'article', 'Investment-grade issuance, and how DCM differs from LevFin.')
on conflict (id) do update set topic_id = excluded.topic_id, order_index = excluded.order_index,
  title = excluded.title, url = excluded.url, source = excluded.source, format = excluded.format, note = excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p5-r16', 'fin-p5-t4', 4, 'Investor Bulletin: Investing in an IPO', 'https://www.sec.gov/files/ipo-investorbulletin.pdf', 'SEC', 'pdf', 'Regulator primary source on registration and Form S-1.')
on conflict (id) do update set topic_id = excluded.topic_id, order_index = excluded.order_index,
  title = excluded.title, url = excluded.url, source = excluded.source, format = excluded.format, note = excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p5-r17', 'fin-p5-t5', 1, 'Confidential Information Memorandum: Guide + Examples', 'https://mergersandinquisitions.com/confidential-information-memorandum/', 'Mergers & Inquisitions', 'article', 'Teaser to NDA to CIM, with real examples.')
on conflict (id) do update set topic_id = excluded.topic_id, order_index = excluded.order_index,
  title = excluded.title, url = excluded.url, source = excluded.source, format = excluded.format, note = excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p5-r18', 'fin-p5-t5', 2, 'CIM — What It Is', 'https://corporatefinanceinstitute.com/resources/valuation/cim-confidential-information-memorandum/', 'Corporate Finance Institute', 'article', 'Short companion; note it deliberately omits valuation.')
on conflict (id) do update set topic_id = excluded.topic_id, order_index = excluded.order_index,
  title = excluded.title, url = excluded.url, source = excluded.source, format = excluded.format, note = excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p7-r5', 'fin-p7-t2', 1, 'JPMorganChase Investment Banking Simulation', 'https://www.theforage.com/simulations/JPMorgan%20Chase/investment-banking-hkyd', 'Forage', 'practice', 'Free but needs a Forage account. Build a DCF for a real-shaped M&A brief.')
on conflict (id) do update set topic_id = excluded.topic_id, order_index = excluded.order_index,
  title = excluded.title, url = excluded.url, source = excluded.source, format = excluded.format, note = excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p7-r6', 'fin-p7-t2', 2, 'Paper LBO Tutorial', 'https://www.wallstreetprep.com/knowledge/paper-lbo/', 'Wall Street Prep', 'article', 'Approximate IRR and MoM with pen and paper — the PE screen itself.')
on conflict (id) do update set topic_id = excluded.topic_id, order_index = excluded.order_index,
  title = excluded.title, url = excluded.url, source = excluded.source, format = excluded.format, note = excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p7-r7', 'fin-p7-t2', 3, 'Basic LBO Model Test: 1-Hour Tutorial', 'https://www.wallstreetprep.com/knowledge/lbo-modeling-test-example-solutions/', 'Wall Street Prep', 'article', 'A timed test with full solutions.')
on conflict (id) do update set topic_id = excluded.topic_id, order_index = excluded.order_index,
  title = excluded.title, url = excluded.url, source = excluded.source, format = excluded.format, note = excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p9-r7', 'fin-p9-t4', 1, 'How Distribution Waterfalls Work in PE & VC', 'https://carta.com/learn/private-funds/management/distribution-waterfall/', 'Carta', 'article', 'LP/GP splits, carry, European vs American.')
on conflict (id) do update set topic_id = excluded.topic_id, order_index = excluded.order_index,
  title = excluded.title, url = excluded.url, source = excluded.source, format = excluded.format, note = excluded.note;

-- Per-topic skills, matching the pattern every other topic follows
insert into public.skills (id, name, domain, description, tier, icon_key, xp_reward, threshold)
values ('skill-topic-fin-p5-t3', 'Merger Models & Accretion/Dilution', 'finance', 'Build a pro-forma EPS bridge and solve for the break-even premium — the most-tested technical in an investment banking interview.', 'advanced', 'finance', 120, 0)
on conflict (id) do update set name = excluded.name, description = excluded.description,
  tier = excluded.tier, xp_reward = excluded.xp_reward;
insert into public.skills (id, name, domain, description, tier, icon_key, xp_reward, threshold)
values ('skill-topic-fin-p5-t4', 'Equity & Debt Capital Markets', 'finance', 'How companies raise money: the IPO process end to end, follow-ons and convertibles, and investment-grade debt issuance.', 'intermediate', 'finance', 90, 0)
on conflict (id) do update set name = excluded.name, description = excluded.description,
  tier = excluded.tier, xp_reward = excluded.xp_reward;
insert into public.skills (id, name, domain, description, tier, icon_key, xp_reward, threshold)
values ('skill-topic-fin-p5-t5', 'Sell-Side Deal Process', 'finance', 'The documents a sell-side process actually runs on — teaser, NDA, CIM, process letter — and how a buyer reads them.', 'intermediate', 'finance', 90, 0)
on conflict (id) do update set name = excluded.name, description = excluded.description,
  tier = excluded.tier, xp_reward = excluded.xp_reward;
insert into public.skills (id, name, domain, description, tier, icon_key, xp_reward, threshold)
values ('skill-topic-fin-p9-t4', 'PE Fund Economics & Value Creation', 'finance', 'Waterfalls, hurdle and catch-up, and attributing a return to deleveraging, earnings growth or multiple expansion.', 'advanced', 'finance', 120, 0)
on conflict (id) do update set name = excluded.name, description = excluded.description,
  tier = excluded.tier, xp_reward = excluded.xp_reward;
insert into public.skills (id, name, domain, description, tier, icon_key, xp_reward, threshold)
values ('skill-topic-fin-p13-t1', 'Leveraged Finance & Credit Products', 'finance', 'Term loan B versus high yield, call protection, covenants, and the buyer base that decides what gets financed.', 'advanced', 'finance', 120, 0)
on conflict (id) do update set name = excluded.name, description = excluded.description,
  tier = excluded.tier, xp_reward = excluded.xp_reward;
insert into public.skills (id, name, domain, description, tier, icon_key, xp_reward, threshold)
values ('skill-topic-fin-p13-t2', 'Restructuring & Distressed', 'finance', 'Creditor hierarchy and the absolute priority rule, in- versus out-of-court routes, DIP financing and liquidation analysis.', 'advanced', 'finance', 120, 0)
on conflict (id) do update set name = excluded.name, description = excluded.description,
  tier = excluded.tier, xp_reward = excluded.xp_reward;
insert into public.skills (id, name, domain, description, tier, icon_key, xp_reward, threshold)
values ('skill-topic-fin-p7-t2', 'Deal Practice & Interview Readiness', 'finance', 'Paper LBO under time pressure, a timed modelling test, and a full simulated deal brief.', 'advanced', 'finance', 120, 0)
on conflict (id) do update set name = excluded.name, description = excluded.description,
  tier = excluded.tier, xp_reward = excluded.xp_reward;

insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p5-t3', 'fin-p5-r10') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p5-t3', 'fin-p5-r11') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p5-t3', 'fin-p5-r12') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p5-t4', 'fin-p5-r13') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p5-t4', 'fin-p5-r14') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p5-t4', 'fin-p5-r15') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p5-t4', 'fin-p5-r16') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p5-t5', 'fin-p5-r17') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p5-t5', 'fin-p5-r18') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p9-t4', 'fin-p9-r7') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p13-t1', 'fin-p13-r1') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p13-t1', 'fin-p13-r2') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p13-t2', 'fin-p13-r3') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p13-t2', 'fin-p13-r4') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p13-t2', 'fin-p13-r5') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p7-t2', 'fin-p7-r5') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p7-t2', 'fin-p7-r6') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p7-t2', 'fin-p7-r7') on conflict do nothing;

-- Reorder the tail so LevFin/Restructuring sits after PE (which teaches the
-- LBO) and before structured products.
update public.phases set order_index = v.ord
from (values ('fin-p11', 9), ('fin-p12', 10), ('fin-p7', 11)) as v(phase_id, ord)
where phases.id = v.phase_id;

update public.tracks set estimated_hours = 185 where id = 'finance';
