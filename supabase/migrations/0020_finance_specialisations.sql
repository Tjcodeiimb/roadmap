-- High-finance specialisations the track was missing.
--
-- A landscape review against the full range of high-finance seats found three
-- gaps where the standard model simply does not transfer, and these are the
-- classic interview-killers:
--   * FIG — a bank has no EBITDA and no free cash flow. You model the balance
--     sheet first and value on price-to-tangible-book, not EV/EBITDA.
--   * Real estate — priced on NOI and a cap rate; REITs report FFO/AFFO and
--     trade against NAV, not EPS.
--   * Project finance — a debt-sizing exercise around DSCR and LLCR inside a
--     non-recourse SPV, with no terminal value anywhere in the model.
-- Plus private credit (where the hiring now is, and taught only in its
-- syndicated form until now), distressed investing as a discipline distinct
-- from the restructuring advisory already covered, growth equity and
-- secondaries, the risk/capital/ALM vocabulary, a map of how a bank is
-- actually organised, and Indian market coverage for this audience.
--
-- Every URL was corroborated through search results returning the page's own
-- title and body text. The authoring environment blocks these domains, so none
-- was opened directly — run `node scripts/check-links.mjs` locally first.
--
-- Mirrors scripts/seed-data/finance.json and skills.json. Idempotent.

-- New phases
insert into public.phases (id, track_id, order_index, title, description, estimated_weeks)
values ('fin-p15', 'finance', 9, 'Private Credit, Distressed & Special Situations', 'Buying and holding debt rather than advising on it: bilateral lending that never gets syndicated, and investing in claims on companies in trouble.', '4–6')
on conflict (id) do update set order_index=excluded.order_index, title=excluded.title,
  description=excluded.description, estimated_weeks=excluded.estimated_weeks;
insert into public.phases (id, track_id, order_index, title, description, estimated_weeks)
values ('fin-p14', 'finance', 11, 'Specialised Coverage & Asset-Class Modelling', 'Where the standard model breaks. A bank has no EBITDA and no free cash flow; a building is priced on NOI and a cap rate; a toll road is a debt-sizing exercise with no terminal value. Each needs its own mental model.', '6–8')
on conflict (id) do update set order_index=excluded.order_index, title=excluded.title,
  description=excluded.description, estimated_weeks=excluded.estimated_weeks;

-- Phase order across the whole track
update public.phases set order_index=1 where id='fin-p1';
update public.phases set order_index=2 where id='fin-p3';
update public.phases set order_index=3 where id='fin-p2';
update public.phases set order_index=4 where id='fin-p10';
update public.phases set order_index=5 where id='fin-p8';
update public.phases set order_index=6 where id='fin-p5';
update public.phases set order_index=7 where id='fin-p9';
update public.phases set order_index=8 where id='fin-p13';
update public.phases set order_index=9 where id='fin-p15';
update public.phases set order_index=10 where id='fin-p11';
update public.phases set order_index=11 where id='fin-p14';
update public.phases set order_index=12 where id='fin-p12';
update public.phases set order_index=13 where id='fin-p7';

-- New topics
insert into public.topics (id, phase_id, order_index, title, description, steps, tags)
values ('fin-p11-t4', 'fin-p11', 4, 'Risk, Capital & ALM', 'The risk seat''s own vocabulary: value at risk for market risk, risk-weighted assets and CET1 for capital, CVA for counterparty exposure, and EVE and NII for the banking book.', '[{"t": "Compute VaR", "d": "Calculate it, then say plainly what it does not tell you."}, {"t": "Read a capital stack", "d": "Find RWA and CET1 in a real bank disclosure."}, {"t": "Price counterparty risk", "d": "Understand CVA and why Basel III charged for it."}, {"t": "Measure IRRBB", "d": "Work economic value of equity and net interest income sensitivity."}]'::jsonb, '{}')
on conflict (id) do update set phase_id=excluded.phase_id, order_index=excluded.order_index,
  title=excluded.title, description=excluded.description, steps=excluded.steps;
insert into public.topics (id, phase_id, order_index, title, description, steps, tags)
values ('fin-p14-t1', 'fin-p14', 1, 'FIG: Modelling Banks & Insurers', 'Banks have no EBITDA and no free cash flow. You model the balance sheet first, drive earnings off net interest margin and provisions, and value on price-to-tangible-book and a dividend discount model.', '[{"t": "Build from the balance sheet", "d": "Start with assets and funding, not revenue."}, {"t": "Drive the earnings", "d": "Model net interest margin, provisions and regulatory capital."}, {"t": "Value it properly", "d": "Use P/TBV and DDM \u2014 EV/EBITDA is meaningless here."}, {"t": "Run a bank merger", "d": "Work tangible book dilution and the earn-back period."}]'::jsonb, '{}')
on conflict (id) do update set phase_id=excluded.phase_id, order_index=excluded.order_index,
  title=excluded.title, description=excluded.description, steps=excluded.steps;
insert into public.topics (id, phase_id, order_index, title, description, steps, tags)
values ('fin-p14-t2', 'fin-p14', 2, 'Real Estate Finance & REITs', 'Property is valued on net operating income and a cap rate, not an EBITDA multiple. REITs report FFO and AFFO instead of EPS and trade at a premium or discount to net asset value.', '[{"t": "Underwrite a property", "d": "Build NOI, apply a cap rate, and get to an exit value."}, {"t": "Bridge to NAV", "d": "Assemble a REIT net asset value and compare it to the share price."}, {"t": "Reconcile the metrics", "d": "Tie FFO, AFFO and CAD back to net income."}, {"t": "Split a waterfall", "d": "Work a JV equity promote between sponsor and investor."}]'::jsonb, '{}')
on conflict (id) do update set phase_id=excluded.phase_id, order_index=excluded.order_index,
  title=excluded.title, description=excluded.description, steps=excluded.steps;
insert into public.topics (id, phase_id, order_index, title, description, steps, tags)
values ('fin-p14-t3', 'fin-p14', 3, 'Project & Infrastructure Finance', 'Non-recourse, single-asset financing sized off contracted cash flows. The model is a debt-sizing exercise around DSCR and LLCR inside an SPV, with no terminal value anywhere in it.', '[{"t": "Build CFADS", "d": "Construct cash flow available for debt service for one asset."}, {"t": "Sculpt the debt", "d": "Size and shape repayment to a target DSCR."}, {"t": "Test the covenants", "d": "Work LLCR and the lender protections around it."}, {"t": "Contrast the paradigm", "d": "Say why corporate finance intuitions fail on a project."}]'::jsonb, '{}')
on conflict (id) do update set phase_id=excluded.phase_id, order_index=excluded.order_index,
  title=excluded.title, description=excluded.description, steps=excluded.steps;
insert into public.topics (id, phase_id, order_index, title, description, steps, tags)
values ('fin-p15-t1', 'fin-p15', 1, 'Private Credit & Direct Lending', 'Non-bank lenders underwrite bilaterally and hold to maturity, so documentation and downside protection matter more than syndication flex. The fastest-growing seat in the market.', '[{"t": "Contrast the models", "d": "Direct lending versus broadly syndicated leveraged finance."}, {"t": "Structure a unitranche", "d": "Roll first and second lien into one tranche and price the all-in yield."}, {"t": "Build the downside", "d": "Model a case that trips a covenant and see what the lender can do."}, {"t": "Follow the capital", "d": "Understand the BDC and fund structures behind the money."}]'::jsonb, '{}')
on conflict (id) do update set phase_id=excluded.phase_id, order_index=excluded.order_index,
  title=excluded.title, description=excluded.description, steps=excluded.steps;
insert into public.topics (id, phase_id, order_index, title, description, steps, tags)
values ('fin-p15-t2', 'fin-p15', 2, 'Distressed Debt & Event-Driven Investing', 'Buying claims rather than advising on them. Find the fulcrum security, value the estate, and take a view on recovery or control — a different discipline from the restructuring advisory taught earlier.', '[{"t": "Find the fulcrum", "d": "Locate the security that converts to equity in a reorganisation."}, {"t": "Value a claim", "d": "Price the claim, not the company \u2014 at a price, with a recovery view."}, {"t": "Model loan-to-own", "d": "Run a recovery waterfall and the path to control."}, {"t": "Size a spread", "d": "Frame a catalyst and size a merger-arbitrage position."}]'::jsonb, '{}')
on conflict (id) do update set phase_id=excluded.phase_id, order_index=excluded.order_index,
  title=excluded.title, description=excluded.description, steps=excluded.steps;
insert into public.topics (id, phase_id, order_index, title, description, steps, tags)
values ('fin-p3-t4', 'fin-p3', 4, 'The Map of Finance: Coverage vs Product Groups', 'Where the seats actually are inside a bank: industry coverage versus product groups (M&A, leveraged finance, ECM/DCM, restructuring), and the financial sponsors desk that sits between the bank and private equity.', '[{"t": "Split coverage from product", "d": "Work out who originates a deal and who executes it."}, {"t": "Map a live deal", "d": "Take one announced transaction and name every group that touched it."}, {"t": "Understand the sponsors seat", "d": "Why FSG is the strongest feeder into private equity."}, {"t": "Pick two targets", "d": "Choose two groups you would actually recruit for and justify it."}]'::jsonb, '{}')
on conflict (id) do update set phase_id=excluded.phase_id, order_index=excluded.order_index,
  title=excluded.title, description=excluded.description, steps=excluded.steps;
insert into public.topics (id, phase_id, order_index, title, description, steps, tags)
values ('fin-p7-t3', 'fin-p7', 3, 'Indian Capital Markets, SEBI & Career Paths', 'The regulatory and market architecture an analyst in India is actually asked about, plus an honest read on CFA versus CA versus FRM and where the Indian deal market hires.', '[{"t": "Map the plumbing", "d": "SEBI, NSE and BSE, the depositories and clearing corporations."}, {"t": "Read a primary issue", "d": "DRHP, book-building and the anchor book."}, {"t": "Survey the market", "d": "Indian investment banking and private equity, and who hires in Mumbai."}, {"t": "Choose a credential", "d": "Pick between CFA, CA and FRM for the seat you actually want."}]'::jsonb, '{}')
on conflict (id) do update set phase_id=excluded.phase_id, order_index=excluded.order_index,
  title=excluded.title, description=excluded.description, steps=excluded.steps;
insert into public.topics (id, phase_id, order_index, title, description, steps, tags)
values ('fin-p9-t5', 'fin-p9', 5, 'Growth Equity & Secondaries', 'The two private-equity adjacencies with their own recruiting tracks: growth equity''s minority, low-leverage case study, and the secondaries market''s pricing at a discount to NAV.', '[{"t": "Run a growth case", "d": "Work cohort retention and unit economics on a real-shaped business."}, {"t": "Price a minority stake", "d": "Value it without leverage \u2014 the LBO maths does not apply."}, {"t": "Discount a portfolio", "d": "Value an LP position at a discount to NAV and justify the discount."}, {"t": "Walk a continuation fund", "d": "Follow a GP-led secondary from motive to close."}]'::jsonb, '{}')
on conflict (id) do update set phase_id=excluded.phase_id, order_index=excluded.order_index,
  title=excluded.title, description=excluded.description, steps=excluded.steps;

-- Resources
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p11-r14', 'fin-p11-t4', 1, 'Value at Risk (VaR)', 'https://corporatefinanceinstitute.com/resources/career-map/sell-side/risk-management/value-at-risk-var/', 'Corporate Finance Institute', 'article', 'The market-risk workhorse, and its limits.')
on conflict (id) do update set topic_id=excluded.topic_id, order_index=excluded.order_index,
  title=excluded.title, url=excluded.url, source=excluded.source, format=excluded.format, note=excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p11-r15', 'fin-p11-t4', 2, 'Counterparty Credit Risk in Basel III', 'https://www.bis.org/fsi/fsisummaries/ccr_in_b3.htm', 'Bank for International Settlements', 'article', 'Regulator primary source on CCR and the CVA charge.')
on conflict (id) do update set topic_id=excluded.topic_id, order_index=excluded.order_index,
  title=excluded.title, url=excluded.url, source=excluded.source, format=excluded.format, note=excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p11-r16', 'fin-p11-t4', 3, 'IRRBB: Pillar 2 Standardised Framework', 'https://www.bis.org/fsi/fsisummaries/irrbb.htm', 'Bank for International Settlements', 'article', 'Economic value of equity and banking-book rate risk.')
on conflict (id) do update set topic_id=excluded.topic_id, order_index=excluded.order_index,
  title=excluded.title, url=excluded.url, source=excluded.source, format=excluded.format, note=excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p14-r1', 'fin-p14-t1', 1, 'Valuing Financial Service Firms', 'https://pages.stern.nyu.edu/~adamodar/pdfiles/papers/finfirm09.pdf', 'Damodaran, NYU Stern', 'pdf', 'Why standard DCF breaks on banks, and what to do instead.')
on conflict (id) do update set topic_id=excluded.topic_id, order_index=excluded.order_index,
  title=excluded.title, url=excluded.url, source=excluded.source, format=excluded.format, note=excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p14-r2', 'fin-p14-t1', 2, 'Bank & Insurance Financial Modeling 101', 'https://mergersandinquisitions.com/bank-insurance-modeling-101/', 'Mergers & Inquisitions', 'article', 'Balance-sheet-first modelling, NIM and provisions.')
on conflict (id) do update set topic_id=excluded.topic_id, order_index=excluded.order_index,
  title=excluded.title, url=excluded.url, source=excluded.source, format=excluded.format, note=excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p14-r3', 'fin-p14-t1', 3, 'Price to Tangible Book Value (P/TBV)', 'https://www.wallstreetprep.com/knowledge/price-to-tangible-book-value-ptbv/', 'Wall Street Prep', 'article', 'The multiple that replaces EV/EBITDA for financials.')
on conflict (id) do update set topic_id=excluded.topic_id, order_index=excluded.order_index,
  title=excluded.title, url=excluded.url, source=excluded.source, format=excluded.format, note=excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p14-r4', 'fin-p14-t2', 1, 'REIT Valuation: 4 Common Approaches', 'https://www.wallstreetprep.com/knowledge/reit-valuation-4-most-common-approaches-used-in-practice/', 'Wall Street Prep', 'article', 'NAV, DCF, dividend discount and cap rates.')
on conflict (id) do update set topic_id=excluded.topic_id, order_index=excluded.order_index,
  title=excluded.title, url=excluded.url, source=excluded.source, format=excluded.format, note=excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p14-r5', 'fin-p14-t2', 2, 'Library of Real Estate Excel Models', 'https://www.adventuresincre.com/library-real-estate-excel-models/', 'Adventures in CRE', 'practice', 'Pay-what-you-can, so a free download path exists.')
on conflict (id) do update set topic_id=excluded.topic_id, order_index=excluded.order_index,
  title=excluded.title, url=excluded.url, source=excluded.source, format=excluded.format, note=excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p14-r6', 'fin-p14-t2', 3, 'Real Estate Investment Banking', 'https://mergersandinquisitions.com/real-estate-investment-banking-group/', 'Mergers & Inquisitions', 'article', 'How RE deals and valuation differ from corporate.')
on conflict (id) do update set topic_id=excluded.topic_id, order_index=excluded.order_index,
  title=excluded.title, url=excluded.url, source=excluded.source, format=excluded.format, note=excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p14-r7', 'fin-p14-t3', 1, 'Debt Sizing in Project Finance', 'https://www.wallstreetprep.com/knowledge/debt-sizing-in-project-finance/', 'Wall Street Prep', 'article', 'Sizing off DSCR and LLCR rather than leverage multiples.')
on conflict (id) do update set topic_id=excluded.topic_id, order_index=excluded.order_index,
  title=excluded.title, url=excluded.url, source=excluded.source, format=excluded.format, note=excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p14-r8', 'fin-p14-t3', 2, 'Debt Service Coverage Ratio: Full Tutorial', 'https://breakingintowallstreet.com/kb/project-finance/debt-service-coverage-ratio/', 'Breaking Into Wall Street', 'article', 'CFADS over debt service, with an Excel walk-through.')
on conflict (id) do update set topic_id=excluded.topic_id, order_index=excluded.order_index,
  title=excluded.title, url=excluded.url, source=excluded.source, format=excluded.format, note=excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p14-r9', 'fin-p14-t3', 3, 'Infrastructure Private Equity', 'https://mergersandinquisitions.com/infrastructure-private-equity/', 'Mergers & Inquisitions', 'article', 'Deals, returns and how the seat recruits.')
on conflict (id) do update set topic_id=excluded.topic_id, order_index=excluded.order_index,
  title=excluded.title, url=excluded.url, source=excluded.source, format=excluded.format, note=excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p15-r1', 'fin-p15-t1', 1, 'Direct Lending: Industry, Funds & Careers', 'https://mergersandinquisitions.com/direct-lending/', 'Mergers & Inquisitions', 'article', 'How non-bank lending differs from syndicated levfin.')
on conflict (id) do update set topic_id=excluded.topic_id, order_index=excluded.order_index,
  title=excluded.title, url=excluded.url, source=excluded.source, format=excluded.format, note=excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p15-r2', 'fin-p15-t1', 2, 'Unitranche Debt: Hybrid Loan Structure', 'https://www.wallstreetprep.com/knowledge/unitranche-debt/', 'Wall Street Prep', 'article', 'First and second lien rolled into a single tranche.')
on conflict (id) do update set topic_id=excluded.topic_id, order_index=excluded.order_index,
  title=excluded.title, url=excluded.url, source=excluded.source, format=excluded.format, note=excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p15-r3', 'fin-p15-t2', 1, 'Distressed Debt Hedge Funds: Detailed Guide', 'https://mergersandinquisitions.com/distressed-debt-hedge-funds/', 'Mergers & Inquisitions', 'article', 'Investing in claims — distinct from restructuring advisory.')
on conflict (id) do update set topic_id=excluded.topic_id, order_index=excluded.order_index,
  title=excluded.title, url=excluded.url, source=excluded.source, format=excluded.format, note=excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p15-r4', 'fin-p15-t2', 2, 'Event-Driven Hedge Funds', 'https://mergersandinquisitions.com/event-driven-hedge-funds/', 'Mergers & Inquisitions', 'article', 'Catalyst-led strategies and the trades behind them.')
on conflict (id) do update set topic_id=excluded.topic_id, order_index=excluded.order_index,
  title=excluded.title, url=excluded.url, source=excluded.source, format=excluded.format, note=excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p15-r5', 'fin-p15-t2', 3, 'Merger Arbitrage', 'https://mergersandinquisitions.com/merger-arbitrage/', 'Mergers & Inquisitions', 'article', 'Spread maths and deal-break risk.')
on conflict (id) do update set topic_id=excluded.topic_id, order_index=excluded.order_index,
  title=excluded.title, url=excluded.url, source=excluded.source, format=excluded.format, note=excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p3-r12', 'fin-p3-t4', 1, 'Industry Groups vs Product Groups', 'https://mergersandinquisitions.com/industry-groups-vs-product-groups/', 'Mergers & Inquisitions', 'article', 'How a bank is actually organised, and which side originates.')
on conflict (id) do update set topic_id=excluded.topic_id, order_index=excluded.order_index,
  title=excluded.title, url=excluded.url, source=excluded.source, format=excluded.format, note=excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p3-r13', 'fin-p3-t4', 2, 'Financial Sponsors Group (FSG): Overview', 'https://mergersandinquisitions.com/financial-sponsors-group-fsg/', 'Mergers & Inquisitions', 'article', 'The coverage group whose clients are PE firms — the strongest buy-side feeder.')
on conflict (id) do update set topic_id=excluded.topic_id, order_index=excluded.order_index,
  title=excluded.title, url=excluded.url, source=excluded.source, format=excluded.format, note=excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p7-r10', 'fin-p7-t3', 3, 'Investment Banking in India: Full Guide', 'https://mergersandinquisitions.com/investment-banking-in-india/', 'Mergers & Inquisitions', 'article', 'Banks, recruiting, salaries and exits in the Indian market.')
on conflict (id) do update set topic_id=excluded.topic_id, order_index=excluded.order_index,
  title=excluded.title, url=excluded.url, source=excluded.source, format=excluded.format, note=excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p7-r8', 'fin-p7-t3', 1, 'SEBI Investor Education Reading Material', 'https://investor.sebi.gov.in/iematerial.html', 'SEBI', 'article', 'Regulator primary source on Indian securities markets.')
on conflict (id) do update set topic_id=excluded.topic_id, order_index=excluded.order_index,
  title=excluded.title, url=excluded.url, source=excluded.source, format=excluded.format, note=excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p7-r9', 'fin-p7-t3', 2, 'NCFM Self-Study Modules', 'https://www.nseindia.com/static/learn/self-study-ncfm-modules-all', 'NSE India', 'course', 'Trading, clearing, settlement and the legal framework.')
on conflict (id) do update set topic_id=excluded.topic_id, order_index=excluded.order_index,
  title=excluded.title, url=excluded.url, source=excluded.source, format=excluded.format, note=excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p9-r10', 'fin-p9-t5', 3, 'GP-Led Secondaries: How They Work', 'https://carta.com/learn/private-funds/private-equity/strategies/secondaries/gp-led-secondaries/', 'Carta', 'article', 'The continuation-fund mechanic in detail.')
on conflict (id) do update set topic_id=excluded.topic_id, order_index=excluded.order_index,
  title=excluded.title, url=excluded.url, source=excluded.source, format=excluded.format, note=excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p9-r8', 'fin-p9-t5', 1, 'Growth Equity: Recruiting, Careers, Case Study', 'https://mergersandinquisitions.com/growth-equity/', 'Mergers & Inquisitions', 'article', 'Includes a sample Excel case.')
on conflict (id) do update set topic_id=excluded.topic_id, order_index=excluded.order_index,
  title=excluded.title, url=excluded.url, source=excluded.source, format=excluded.format, note=excluded.note;
insert into public.resources (id, topic_id, order_index, title, url, source, format, note)
values ('fin-p9-r9', 'fin-p9-t5', 2, 'Private Equity Secondaries', 'https://mergersandinquisitions.com/private-equity-secondaries/', 'Mergers & Inquisitions', 'article', 'LP-led and GP-led, and how continuation vehicles work.')
on conflict (id) do update set topic_id=excluded.topic_id, order_index=excluded.order_index,
  title=excluded.title, url=excluded.url, source=excluded.source, format=excluded.format, note=excluded.note;

-- Per-topic skills
insert into public.skills (id, name, domain, description, tier, icon_key, xp_reward, threshold)
values ('skill-topic-fin-p3-t4', 'Industry Map: Groups & Products', 'finance', 'Coverage versus product groups, and where the financial sponsors desk sits between a bank and private equity.', 'intermediate', 'finance', 90, 0)
on conflict (id) do update set name=excluded.name, description=excluded.description, tier=excluded.tier;
insert into public.skills (id, name, domain, description, tier, icon_key, xp_reward, threshold)
values ('skill-topic-fin-p9-t5', 'Growth Equity & Secondaries', 'finance', 'Minority growth investing without leverage, and pricing an LP position at a discount to NAV.', 'advanced', 'finance', 120, 0)
on conflict (id) do update set name=excluded.name, description=excluded.description, tier=excluded.tier;
insert into public.skills (id, name, domain, description, tier, icon_key, xp_reward, threshold)
values ('skill-topic-fin-p15-t1', 'Private Credit & Direct Lending', 'finance', 'Bilateral underwriting held to maturity: unitranche structures, negotiated covenants and downside protection.', 'advanced', 'finance', 120, 0)
on conflict (id) do update set name=excluded.name, description=excluded.description, tier=excluded.tier;
insert into public.skills (id, name, domain, description, tier, icon_key, xp_reward, threshold)
values ('skill-topic-fin-p15-t2', 'Distressed & Event-Driven Investing', 'finance', 'Fulcrum securities, valuing a claim at a price, loan-to-own and merger-arbitrage spreads.', 'advanced', 'finance', 120, 0)
on conflict (id) do update set name=excluded.name, description=excluded.description, tier=excluded.tier;
insert into public.skills (id, name, domain, description, tier, icon_key, xp_reward, threshold)
values ('skill-topic-fin-p11-t4', 'Risk, Capital & ALM', 'finance', 'Value at risk, risk-weighted assets and CET1, counterparty CVA, and banking-book rate risk.', 'advanced', 'finance', 120, 0)
on conflict (id) do update set name=excluded.name, description=excluded.description, tier=excluded.tier;
insert into public.skills (id, name, domain, description, tier, icon_key, xp_reward, threshold)
values ('skill-topic-fin-p14-t1', 'FIG Modelling: Banks & Insurers', 'finance', 'Balance-sheet-first modelling, net interest margin and provisions, and valuing on P/TBV rather than EV/EBITDA.', 'advanced', 'finance', 120, 0)
on conflict (id) do update set name=excluded.name, description=excluded.description, tier=excluded.tier;
insert into public.skills (id, name, domain, description, tier, icon_key, xp_reward, threshold)
values ('skill-topic-fin-p14-t2', 'Real Estate Finance & REITs', 'finance', 'NOI and cap rates, REIT NAV bridges, FFO and AFFO, and JV equity waterfalls.', 'advanced', 'finance', 120, 0)
on conflict (id) do update set name=excluded.name, description=excluded.description, tier=excluded.tier;
insert into public.skills (id, name, domain, description, tier, icon_key, xp_reward, threshold)
values ('skill-topic-fin-p14-t3', 'Project & Infrastructure Finance', 'finance', 'CFADS, debt sculpting to a target DSCR, LLCR, and non-recourse structures with no terminal value.', 'advanced', 'finance', 120, 0)
on conflict (id) do update set name=excluded.name, description=excluded.description, tier=excluded.tier;
insert into public.skills (id, name, domain, description, tier, icon_key, xp_reward, threshold)
values ('skill-topic-fin-p7-t3', 'Indian Capital Markets & SEBI', 'finance', 'SEBI and exchange architecture, the primary-issue process, and the Indian deal market and credential paths.', 'intermediate', 'finance', 90, 0)
on conflict (id) do update set name=excluded.name, description=excluded.description, tier=excluded.tier;

insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p3-t4', 'fin-p3-r12') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p3-t4', 'fin-p3-r13') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p9-t5', 'fin-p9-r8') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p9-t5', 'fin-p9-r9') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p9-t5', 'fin-p9-r10') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p15-t1', 'fin-p15-r1') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p15-t1', 'fin-p15-r2') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p15-t2', 'fin-p15-r3') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p15-t2', 'fin-p15-r4') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p15-t2', 'fin-p15-r5') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p11-t4', 'fin-p11-r14') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p11-t4', 'fin-p11-r15') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p11-t4', 'fin-p11-r16') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p14-t1', 'fin-p14-r1') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p14-t1', 'fin-p14-r2') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p14-t1', 'fin-p14-r3') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p14-t2', 'fin-p14-r4') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p14-t2', 'fin-p14-r5') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p14-t2', 'fin-p14-r6') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p14-t3', 'fin-p14-r7') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p14-t3', 'fin-p14-r8') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p14-t3', 'fin-p14-r9') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p7-t3', 'fin-p7-r8') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p7-t3', 'fin-p7-r9') on conflict do nothing;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p7-t3', 'fin-p7-r10') on conflict do nothing;

update public.tracks set estimated_hours = 250 where id = 'finance';

do $$
declare v_p int; v_t int; v_r int; v_empty int;
begin
  select count(*) into v_p from public.phases where track_id='finance';
  select count(*) into v_t from public.topics t join public.phases p on p.id=t.phase_id where p.track_id='finance';
  select count(*) into v_r from public.resources r join public.topics t on t.id=r.topic_id
    join public.phases p on p.id=t.phase_id where p.track_id='finance';
  select count(*) into v_empty from public.topics t join public.phases p on p.id=t.phase_id
    where p.track_id='finance' and not exists (select 1 from public.resources r where r.topic_id=t.id);
  raise notice 'Finance: % phases, % topics, % resources, % empty topics (expect 13/43/104/0).', v_p, v_t, v_r, v_empty;
end;
$$;
