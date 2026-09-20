-- Finance curriculum restructure: sequence, and the missing instructional copy.
--
-- A curriculum review found the track did not actually build from zero. Three
-- breaks in the dependency chain:
--   * Time value of money was taught NOWHERE, yet WACC, CAPM and every DCF
--     downstream depend on discounting. Added as a Foundations topic.
--   * Cost of Capital sat in phase 2 but its cost-of-equity leg needs beta and
--     the equity risk premium, which lived in phase 3. Markets & Instruments
--     now comes first.
--   * LBO and merger models need an exit multiple and a football field, both
--     taught later. Valuation now precedes modelling, and within the modelling
--     phase debt schedules precede the LBO that consumes them.
--
-- It also found 12 topics with no description at all and 27 with no steps —
-- all survivors of the original skeleton pass, which rendered the "What to do"
-- panel empty. Every topic now has both.
--
-- Mirrors scripts/seed-data/finance.json. Idempotent.

-- Phase order
update public.phases set order_index = 1 where id = 'fin-p1';
update public.phases set order_index = 2 where id = 'fin-p3';
update public.phases set order_index = 3 where id = 'fin-p2';
update public.phases set order_index = 4 where id = 'fin-p10';
update public.phases set order_index = 5 where id = 'fin-p8';
update public.phases set order_index = 6 where id = 'fin-p5';
update public.phases set order_index = 7 where id = 'fin-p9';
update public.phases set order_index = 8 where id = 'fin-p13';
update public.phases set order_index = 9 where id = 'fin-p11';
update public.phases set order_index = 10 where id = 'fin-p12';
update public.phases set order_index = 11 where id = 'fin-p7';

-- New Foundations topic: the prerequisite that was missing entirely
insert into public.topics (id, phase_id, order_index, title, description, steps, tags)
values ('fin-p1-t3', 'fin-p1', 3, 'Time Value of Money & Discounting', 'Money today is worth more than money later, and every valuation in this course rests on that. Present and future value, compounding, annuities and perpetuities, and the discount rate as the price of waiting.', '[{"t": "Compound forwards", "d": "Grow a sum at a rate over n periods and see the curve bend."}, {"t": "Discount backwards", "d": "Bring a future cash flow to today, then flex the rate and watch the value move."}, {"t": "Value a stream", "d": "Price an annuity and a perpetuity from first principles."}, {"t": "Connect it", "d": "Discount a three-year forecast by hand \u2014 this is a DCF in miniature."}]'::jsonb, '{}')
on conflict (id) do update set phase_id=excluded.phase_id, order_index=excluded.order_index,
  title=excluded.title, description=excluded.description, steps=excluded.steps;

-- Topic placement, titles, descriptions and steps
update public.topics set phase_id='fin-p1', order_index=1,
  title='Reading the Three Statements', description='Learn what each of the three statements reports and how they lock together: net income flows to retained earnings, and the cash flow statement reconciles accrual profit back to cash. The literacy everything later assumes.', steps='[{"t": "Name the three", "d": "Say what each statement measures and over what period."}, {"t": "Trace one dollar", "d": "Follow a sale from revenue through receivables to cash collected."}, {"t": "Link them", "d": "Start from net income and rebuild the cash flow statement''s operating section."}]'::jsonb
where id = 'fin-p1-t1';
update public.topics set phase_id='fin-p1', order_index=2,
  title='Accounting Fundamentals', description='Understand the accrual mechanics behind the numbers — revenue recognition, matching, depreciation, deferred taxes, working capital — and where management judgement enters. This is what separates reading a statement from trusting it.', steps='[{"t": "Split cash from profit", "d": "Work an example where the two diverge and explain why."}, {"t": "Work the accruals", "d": "Book revenue recognition, prepaid expenses and depreciation by hand."}, {"t": "Find the judgement", "d": "Pick a filing and list three policy choices management could have made differently."}]'::jsonb
where id = 'fin-p1-t2';
update public.topics set phase_id='fin-p10', order_index=1,
  title='DCF Deep Dive', description='Go beyond a basic DCF — build a rigorous WACC from scratch, stress-test terminal value assumptions with sensitivity tables, and understand why terminal value typically drives 60–80% of valuation output.', steps='[{"t": "Forecast free cash flow", "d": "Build unlevered FCF off the operating model."}, {"t": "Set the discount rate", "d": "Rebuild WACC for this company, not a textbook one."}, {"t": "Test terminal value", "d": "Compute it both ways and show what share of value it carries."}, {"t": "Sensitise", "d": "Run a WACC-versus-growth grid and state the range you would defend."}]'::jsonb
where id = 'fin-p10-t1';
update public.topics set phase_id='fin-p10', order_index=2,
  title='Comparable Company Analysis (Comps)', description='Screen and select a peer group, calculate EV/EBITDA, P/E, and EV/Revenue multiples consistently across companies, and build a football-field valuation range.', steps='[{"t": "Screen the peers", "d": "Pick a comp set and write the criteria that admitted each one."}, {"t": "Calendarise", "d": "Put everyone on the same fiscal basis and use LTM or NTM consistently."}, {"t": "Spread the multiples", "d": "Compute EV/EBITDA, P/E and EV/Revenue, then benchmark on median not mean."}]'::jsonb
where id = 'fin-p10-t2';
update public.topics set phase_id='fin-p10', order_index=3,
  title='Precedent Transactions & Control Premiums', description='Distinguish trading comps (current market prices) from deal comps (acquisition premiums baked in), and use precedent transactions to anchor the control premium in a negotiated sale.', steps='[{"t": "Screen the deals", "d": "Build a precedent set filtered on sector, size and vintage."}, {"t": "Strip the premium", "d": "Back out the control premium implied by each transaction."}, {"t": "Reconcile", "d": "Explain why deal comps sit above trading comps and when they shouldn''t."}]'::jsonb
where id = 'fin-p10-t3';
update public.topics set phase_id='fin-p11', order_index=1,
  title='Options & Greeks Fundamentals', description='How call and put options are priced, how payoff diagrams work, and how the Greeks — delta, gamma, theta, vega — measure each dimension of an option position''s risk.', steps='[{"t": "Draw the payoffs", "d": "Diagram long and short calls and puts at expiry."}, {"t": "Decompose the price", "d": "Separate intrinsic from time value and see what moves each."}, {"t": "Work the Greeks", "d": "Show how delta, gamma, theta and vega each change a position''s P&L."}, {"t": "Hedge one", "d": "Delta-hedge a position and explain why it needs re-hedging."}]'::jsonb
where id = 'fin-p11-t2';
update public.topics set phase_id='fin-p11', order_index=2,
  title='Interest Rate & Credit Derivatives', description='How interest rate swaps transfer rate risk between counterparties, and how credit default swaps transfer credit risk — the instruments at the heart of fixed-income and credit risk management.', steps='[{"t": "Swap the rate", "d": "Build a fixed-for-floating swap and identify each leg''s exposure."}, {"t": "Find the motive", "d": "Explain why a corporate borrower would enter one."}, {"t": "Buy protection", "d": "Price a CDS as insurance and define exactly what triggers a credit event."}]'::jsonb
where id = 'fin-p11-t3';
update public.topics set phase_id='fin-p11', order_index=3,
  title='Securitization & ABS/MBS Basics', description='How loans are pooled and tranched into asset-backed securities — the mechanics of cash-flow waterfalls, credit enhancement, and the key differences between ABS and MBS.', steps='[{"t": "Pool and tranche", "d": "Take a loan pool and cut it into senior, mezzanine and equity."}, {"t": "Run the waterfall", "d": "Allocate cash and losses through the stack in order."}, {"t": "Add enhancement", "d": "Apply overcollateralisation and excess spread, then compare ABS to MBS."}]'::jsonb
where id = 'fin-p11-t1';
update public.topics set phase_id='fin-p12', order_index=1,
  title='Earnings Quality & Accruals Analysis', description='Assess whether reported earnings reflect real cash generation or aggressive accrual-accounting choices — the foundation of any forensic analysis.', steps='[{"t": "Compare the two", "d": "Put net income next to cash from operations over five years."}, {"t": "Test the accruals", "d": "Compute the accrual ratio and flag the years it spikes."}, {"t": "Chase the driver", "d": "Tie a spike to a specific policy or one-off and judge whether earnings are real."}]'::jsonb
where id = 'fin-p12-t1';
update public.topics set phase_id='fin-p12', order_index=2,
  title='Off-Balance-Sheet Items & SPVs', description='Identify leverage and commitments that do not appear on the balance sheet — operating leases, SPVs, synthetic securitizations — and understand when accounting standards require consolidation.', steps='[{"t": "Hunt the footnotes", "d": "Find commitments, guarantees and leases disclosed but not on the face."}, {"t": "Trace an SPV", "d": "Work out what it holds, who bears the risk, and whether it consolidates."}, {"t": "Restate the leverage", "d": "Add the off-balance-sheet items back and recompute the ratios."}]'::jsonb
where id = 'fin-p12-t2';
update public.topics set phase_id='fin-p12', order_index=3,
  title='Red Flags in Financial Statements', description='The warning signs that preceded Enron, WorldCom, and the 2008 crisis — rapidly growing receivables, channel stuffing, related-party transactions, and the Beneish M-Score manipulation detector.', steps='[{"t": "Build a flag list", "d": "Receivables and inventory growing ahead of revenue, margin outliers, related parties."}, {"t": "Score it", "d": "Run a Beneish M-Score on one company and interpret the output."}, {"t": "Autopsy a scandal", "d": "Take Enron or WorldCom and mark which flags were visible in the last clean filing."}]'::jsonb
where id = 'fin-p12-t3';
update public.topics set phase_id='fin-p13', order_index=1,
  title='Leveraged Loans & High Yield', description='The leveraged product set: term loan B versus senior notes, pricing and call protection, and the CLO and high-yield-fund buyer base that decides what can actually get financed.', steps='[{"t": "Separate the instruments", "d": "Term loan B vs senior notes: security, seniority, floating vs fixed, call protection."}, {"t": "Follow the money", "d": "Work out who buys each \u2014 CLOs, HY funds, direct lenders \u2014 and how that shapes terms."}, {"t": "Price a deal", "d": "Take a recent LBO and reason through why its capital structure was built the way it was."}]'::jsonb
where id = 'fin-p13-t1';
update public.topics set phase_id='fin-p13', order_index=2,
  title='Restructuring & Chapter 11', description='In-court versus out-of-court, creditor hierarchy and the absolute priority rule, DIP financing, liquidation analysis and the plan of reorganisation — plus how restructuring interviews differ from standard IB.', steps='[{"t": "Learn the waterfall", "d": "Absolute priority rule: who gets paid, in what order, and where the fulcrum security sits."}, {"t": "Compare the routes", "d": "Out-of-court exchange vs Chapter 11 \u2014 the trade-offs on speed, cost and holdouts."}, {"t": "Build a liquidation analysis", "d": "Recovery by class, and what it implies for where value breaks."}, {"t": "Drill the technicals", "d": "Work the RX interview question set until the answers are yours."}]'::jsonb
where id = 'fin-p13-t2';
update public.topics set phase_id='fin-p2', order_index=1,
  title='Cost of Capital & WACC', description='Build a discount rate from its parts: cost of equity via CAPM, after-tax cost of debt, and the market-value weights between them. You learn the formula here; the valuation phase stress-tests it inside a live DCF.', steps='[{"t": "Build cost of equity", "d": "Assemble CAPM from risk-free rate, beta and equity risk premium."}, {"t": "Price the debt", "d": "Get to an after-tax cost of debt and justify the tax shield."}, {"t": "Weight it", "d": "Combine at market values, then flex beta and see WACC move."}]'::jsonb
where id = 'fin-p2-t1';
update public.topics set phase_id='fin-p2', order_index=2,
  title='Capital Structure & Capital Budgeting', description='How a firm decides what to fund and how to fund it: NPV and IRR project selection, the debt-versus-equity trade-off, and working capital policy.', steps='[{"t": "Rank projects", "d": "Compute NPV and IRR on the same cash flows and explain where they disagree."}, {"t": "Trade off structure", "d": "Argue debt versus equity for one firm on cost, flexibility and risk."}, {"t": "Size working capital", "d": "Build a cash conversion cycle and say what shortening it is worth."}]'::jsonb
where id = 'fin-p2-t2';
update public.topics set phase_id='fin-p3', order_index=1,
  title='Instruments: Equities, Debt & Derivatives', description='Work through the three instrument families — equity, debt, derivatives — and what each one is a claim on, how it is issued, and what drives its price.', steps='[{"t": "Sort the claims", "d": "Place equity, debt and derivatives on a seniority and payoff map."}, {"t": "Follow an issuance", "d": "Track a share and a bond from issuer to investor."}, {"t": "Price-check one", "d": "Name the two or three variables that move each instrument most."}]'::jsonb
where id = 'fin-p3-t1';
update public.topics set phase_id='fin-p3', order_index=2,
  title='The Industry Map: Buy-Side vs Sell-Side', description='Map the industry: who manages capital and who intermediates it, how banks, asset managers, hedge funds and research desks make money, and which seat does which work.', steps='[{"t": "Split the sides", "d": "List who raises capital, who allocates it, and who advises."}, {"t": "Follow a trade", "d": "Trace one order from a buy-side PM through a sell-side desk."}, {"t": "Pick a seat", "d": "Write what a day looks like in two roles you might actually want."}]'::jsonb
where id = 'fin-p3-t2';
update public.topics set phase_id='fin-p3', order_index=3,
  title='Risk, Return & Portfolio Construction', description='Risk and return as a pair: diversification, correlation, beta and the risk-free rate, then how asset allocation turns them into a portfolio. These primitives feed the cost of equity in the next phase.', steps='[{"t": "Measure risk", "d": "Compute volatility and correlation for two assets and combine them."}, {"t": "Diversify", "d": "Build a two- and then five-asset portfolio and watch risk fall faster than return."}, {"t": "Set an allocation", "d": "Write a policy mix for one stated objective and defend the weights."}]'::jsonb
where id = 'fin-p6-t2';
update public.topics set phase_id='fin-p5', order_index=1,
  title='The M&A Deal Process & Due Diligence', description='The deal from mandate to close: buyer outreach, LOI, confirmatory diligence and signing, plus what diligence actually interrogates across financial, legal and commercial workstreams.', steps='[{"t": "Chart the timeline", "d": "Lay out mandate, marketing, LOI, diligence, signing and close with who drives each."}, {"t": "Work a diligence list", "d": "Pull a checklist and mark the ten items that would kill a deal."}, {"t": "Find the break", "d": "Pick a collapsed deal and identify where in the process it failed."}]'::jsonb
where id = 'fin-p5-t1';
update public.topics set phase_id='fin-p5', order_index=2,
  title='Sell-Side Process: Teaser, NDA & CIM', description='What bankers actually produce between mandate and close, and how a buyer reads it: the anonymous teaser, the NDA, the CIM, the process letter and the buyer list.', steps='[{"t": "Work the sequence", "d": "Teaser to NDA to CIM to bids \u2014 what each document is for and who sees it."}, {"t": "Dissect a CIM", "d": "Read a real one and note what it asserts, what it omits, and why it never states a price."}, {"t": "Build a buyer list", "d": "Segment strategics vs sponsors for a target and justify the cut."}]'::jsonb
where id = 'fin-p5-t5';
update public.topics set phase_id='fin-p5', order_index=3,
  title='Pitch Books', description='What a pitch book is for and how it is assembled — situation overview, market update, valuation football field, and the recommendation the whole deck exists to support.', steps='[{"t": "Read a real deck", "d": "Dissect a published pitch book and name what each section is doing."}, {"t": "Build the football field", "d": "Assemble a valuation range from DCF, comps and precedents."}, {"t": "Write the ask", "d": "Draft the recommendation page and make every prior slide support it."}]'::jsonb
where id = 'fin-p4-t1';
update public.topics set phase_id='fin-p5', order_index=4,
  title='Merger Models & Accretion/Dilution', description='Build a pro-forma EPS bridge: consideration mix, synergies, foregone interest and the break-even premium. The most-tested technical in an IB interview.', steps='[{"t": "Build the pro-forma", "d": "Combine the two P&Ls, layer in the financing, and get to pro-forma EPS."}, {"t": "Find the break-even", "d": "Solve for the premium at which the deal stops being accretive."}, {"t": "Flex the consideration", "d": "Rerun it as all-cash, all-stock and mixed; explain why the answer moves."}]'::jsonb
where id = 'fin-p5-t3';
update public.topics set phase_id='fin-p5', order_index=5,
  title='Synergies & Post-Merger Integration', description='Where the premium is supposed to come back from: cost and revenue synergies, how each is quantified and phased, and why integration is where most of the value is lost.', steps='[{"t": "Split the synergies", "d": "Separate cost from revenue and say which one underwriters believe."}, {"t": "Quantify and phase", "d": "Put a number and a realisation timeline on three specific synergies."}, {"t": "Net the costs", "d": "Subtract integration costs and restate the premium the deal can bear."}]'::jsonb
where id = 'fin-p5-t2';
update public.topics set phase_id='fin-p5', order_index=6,
  title='Equity & Debt Capital Markets', description='How companies actually raise money: the IPO process end to end, follow-ons and convertibles on the equity side, investment-grade issuance on the debt side, and how ECM and DCM desks differ from M&A.', steps='[{"t": "Walk an IPO", "d": "Underwriter selection, S-1, roadshow, bookbuilding, pricing and the first day."}, {"t": "Read a real S-1", "d": "Pull one from EDGAR and find the risk factors, use of proceeds and dilution."}, {"t": "Contrast the desks", "d": "ECM vs DCM vs LevFin \u2014 who does what, and what the work looks like day to day."}]'::jsonb
where id = 'fin-p5-t4';
update public.topics set phase_id='fin-p7', order_index=1,
  title='Reading 10-Ks & 10-Qs', description='Navigate a real 10-K and 10-Q section by section — MD&A, risk factors, the footnotes and the segment data — and pull the numbers a model actually needs out of a filing.', steps='[{"t": "Walk the sections", "d": "Items 1, 1A, 7 and 8 \u2014 what each is for and what it hides."}, {"t": "Mine the footnotes", "d": "Extract debt terms, leases, segments and share count."}, {"t": "Feed the model", "d": "Pull a filing into a driver sheet and reconcile every input to a page number."}]'::jsonb
where id = 'fin-p7-t1';
update public.topics set phase_id='fin-p7', order_index=2,
  title='Deal Practice & Interview Prep', description='Rehearse under deal conditions: paper LBOs, timed modelling tests, and the technical question set, until the reasoning is fast enough to survive an interview.', steps='[{"t": "Do a paper LBO", "d": "Approximate IRR and MOIC with no spreadsheet, under time."}, {"t": "Sit a modelling test", "d": "Run the timed LBO test, then diff your build against the solution."}, {"t": "Drill technicals", "d": "Work the DCF, comps and accretion/dilution question sets until answers are yours."}, {"t": "Mock it", "d": "Run one full interview out loud with someone else scoring."}]'::jsonb
where id = 'fin-p7-t2';
update public.topics set phase_id='fin-p8', order_index=1,
  title='3-Statement Modeling', description='Build a fully linked income statement, balance sheet, and cash flow statement in Excel from scratch — the foundational build behind every advanced model, versus just reading one.', steps='[{"t": "Lay the drivers", "d": "Build an assumptions block and forecast the income statement off it."}, {"t": "Close the loop", "d": "Link the cash flow statement so the balance sheet balances with no plug."}, {"t": "Break it on purpose", "d": "Change one driver and find every cell that should have moved."}]'::jsonb
where id = 'fin-p8-t1';
update public.topics set phase_id='fin-p8', order_index=2,
  title='Credit Analysis & Debt Schedules', description='Analyze a borrower the way a lender does — leverage and coverage ratios, covenant headroom — and build a debt schedule with interest, amortization, and cash sweep mechanics.', steps='[{"t": "Run the ratios", "d": "Compute leverage, interest coverage and fixed-charge coverage on a real borrower."}, {"t": "Test the covenants", "d": "Find headroom and the EBITDA decline that breaches."}, {"t": "Build the schedule", "d": "Model each tranche with interest, amortisation and sweep, circularity handled."}]'::jsonb
where id = 'fin-p8-t3';
update public.topics set phase_id='fin-p8', order_index=3,
  title='LBO Modeling', description='Model a leveraged buyout end to end: sources & uses, acquisition debt tranches, cash sweeps, and the return math (IRR/MOIC) private equity firms underwrite deals on.', steps='[{"t": "Build sources & uses", "d": "Fund a purchase price and reconcile to the entry equity cheque."}, {"t": "Layer the debt", "d": "Tranche the capital structure and run interest and mandatory amortisation."}, {"t": "Sweep the cash", "d": "Pay down with free cash flow, then exit and solve IRR and MOIC."}, {"t": "Sensitise", "d": "Flex entry multiple, leverage and exit multiple in a returns grid."}]'::jsonb
where id = 'fin-p8-t2';
update public.topics set phase_id='fin-p9', order_index=1,
  title='Private Equity Fundamentals', description='How PE funds are structured (GP/LP, fees, carry), how they source and screen deals, and how a buyout thesis turns into an investment.', steps='[{"t": "Map the fund", "d": "GP versus LP, management fee, carry and the fund lifecycle."}, {"t": "Screen a target", "d": "Apply a buyout screen to a real company and pass or kill it."}, {"t": "Write the thesis", "d": "State the entry case, the value-creation plan and the exit in one page."}]'::jsonb
where id = 'fin-p9-t1';
update public.topics set phase_id='fin-p9', order_index=2,
  title='Fund Economics & Value Creation', description='How a fund actually makes money and how returns get attributed: hurdle, catch-up, European vs American waterfall, and splitting an outcome into deleveraging, EBITDA growth and multiple expansion.', steps='[{"t": "Split a waterfall", "d": "Run an exit through European and American structures and compare GP take."}, {"t": "Attribute a return", "d": "Decompose an IRR into deleveraging, earnings growth and multiple arbitrage."}, {"t": "Judge the levers", "d": "Decide which lever did the work \u2014 and whether it was skill or the market."}]'::jsonb
where id = 'fin-p9-t4';
update public.topics set phase_id='fin-p9', order_index=3,
  title='Hedge Fund Strategies', description='Survey the core hedge fund strategies — long/short equity, global macro, quant, event-driven, arbitrage — and how each generates returns.', steps='[{"t": "Survey the strategies", "d": "Define long/short, macro, quant, event-driven and arbitrage by return source."}, {"t": "Match risk to strategy", "d": "Name what each one is really exposed to."}, {"t": "Pitch one trade", "d": "Write a thesis, the catalyst and how you would size it."}]'::jsonb
where id = 'fin-p9-t2';
update public.topics set phase_id='fin-p9', order_index=4,
  title='Venture Capital Basics', description='How VC funds are structured and how they evaluate, price, and structure early-stage investments — from thesis to term sheet.', steps='[{"t": "Follow the rounds", "d": "Seed through Series C \u2014 who invests, what changes each time."}, {"t": "Price a round", "d": "Work pre- and post-money, option pool and the founder dilution."}, {"t": "Read a term sheet", "d": "Find liquidation preference, participation and anti-dilution and say who they protect."}]'::jsonb
where id = 'fin-p9-t3';

-- Resource re-homing
update public.resources set topic_id = 'fin-p1-t3' where id = 'fin-p3-r1';
update public.resources set topic_id = 'fin-p1-t2' where id = 'fin-p1-r10';
update public.resources set topic_id = 'fin-p7-t1' where id = 'fin-p6-r1';

-- Per-topic skill for the new topic, matching the pattern every other one follows
insert into public.skills (id, name, domain, description, tier, icon_key, xp_reward, threshold)
values ('skill-topic-fin-p1-t3', 'Time Value of Money', 'finance', 'Present and future value, compounding, annuities and perpetuities — the arithmetic every valuation in the track rests on.', 'foundational', 'finance', 90, 0)
on conflict (id) do update set name=excluded.name, description=excluded.description;
insert into public.skill_resources (skill_id, resource_id) values ('skill-topic-fin-p1-t3', 'fin-p3-r1') on conflict do nothing;

do $$
declare v_nodesc int; v_nosteps int;
begin
  select count(*) into v_nodesc from public.topics t join public.phases p on p.id=t.phase_id
    where p.track_id='finance' and coalesce(trim(t.description),'')='';
  select count(*) into v_nosteps from public.topics t join public.phases p on p.id=t.phase_id
    where p.track_id='finance' and coalesce(jsonb_array_length(t.steps),0)=0;
  raise notice 'Finance topics lacking a description: %, lacking steps: % (both should be 0).', v_nodesc, v_nosteps;
end;
$$;
