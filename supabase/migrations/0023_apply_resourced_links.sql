-- Carry the 99 re-sourced resource links across to the database.
--
-- Five commits repaired rotted URLs in the seed files — Negotiation, Executive
-- Communication, Personal Branding, Tech Writing + SQL Analytics, and a scatter
-- of relocated links across eight more tracks. Every one of those edits landed
-- in JSON only. The seed script is the sole thing that reads those files, it is
-- run by hand, and this project maintains its content through migrations
-- instead. So the fixes sat in git while learners carried on clicking the dead
-- links in production.
--
-- This is the same failure mode as the `duration`/`length` mix-up that 0022
-- cleaned up: the seed file was right and the database never heard about it.
-- scripts/check-orphans.mjs now reports this class of drift directly, so it
-- should not need finding by hand a third time.
--
-- Non-destructive by construction. Each row is matched on BOTH its id and the
-- exact dead URL it is replacing, so:
--   * a database already carrying the new URL (someone re-seeded) is untouched;
--   * a row edited to some third URL through the admin panel is left alone
--     rather than silently overwritten, and is reported at the end.
-- Re-running this migration therefore updates nothing the second time.
--
-- title/source/format/note travel with the URL only where the re-sourcing
-- changed them — a link that moved to a different publisher would otherwise
-- keep a title naming the old one. A null column below means "leave as is".

-- Deliberately NOT `on commit drop`. The Supabase SQL editor runs a pasted
-- script as a sequence of statements rather than one wrapped transaction, so
-- `on commit drop` disposes of the table the instant the CREATE commits and the
-- INSERT below then fails with "relation does not exist". The table is dropped
-- explicitly at the end instead, and `if exists` clears any leftover from a run
-- that failed partway.
drop table if exists repaired_links;

create temporary table repaired_links (
  id          text primary key,
  old_url     text not null,
  new_url     text not null,
  new_title   text,
  new_source  text,
  new_format  text,
  new_note    text
);

insert into repaired_links (id, old_url, new_url, new_title, new_source, new_format, new_note)
values
  -- ai.json (2)
  ('ai-model-landscape-r3', 'https://platform.openai.com/docs/models/overview', 'https://developers.openai.com/api/docs/models', null, null, null, null),
  ('research-methodology-r2', 'https://support.google.com/notebooklm/?hl=en', 'https://support.google.com/gemininotebook/answer/16164461?hl=en', 'Google — Learn about Gemini Notebook (NotebookLM)', null, null, null),
  -- ai_nocode.json (1)
  ('ainc-p5-r3', 'https://www.notion.so/help/automate-notion', 'https://www.notion.com/help/database-automations', 'Database automations in Notion: Notion Help', null, null, 'Official Notion documentation on built-in database automations — the triggers and actions that create and update pages automatically when upstream events occur.'),
  -- excel.json (1)
  ('exc-p1-r3', 'https://gcfglobal.org/en/excelformulas/', 'https://edu.gcfglobal.org/en/excelformulas/', null, null, null, null),
  -- exec_communication.json (22)
  ('xcomm-p1-r1', 'https://hbr.org/2012/08/what-does-it-take-to-develop-your-executive-presence', 'https://hbr.org/2024/01/the-new-rules-of-executive-presence', 'The New Rules of Executive Presence', null, null, null),
  ('xcomm-p1-r2', 'https://hbr.org/2022/09/executive-presence-is-not-one-size-fits-all', 'https://www.duarte.com/resources/communication-skills/what-is-executive-presence/', 'What Is Executive Presence? Building Influence for Action', 'Duarte', null, null),
  ('xcomm-p1-r4', 'https://hbr.org/2018/09/speak-like-a-leader', 'https://www.ted.com/talks/julian_treasure_how_to_speak_so_that_people_want_to_listen', 'How to Speak So That People Want to Listen — Julian Treasure TED Talk', 'TED', 'video', null),
  ('xcomm-p1-r6', 'https://hbr.org/2017/08/how-to-hold-your-own-in-a-meeting', 'https://hbr.org/2019/04/how-to-speak-up-in-a-meeting-and-when-to-hold-back', 'How to Speak Up in a Meeting, and When to Hold Back', null, null, null),
  ('xcomm-p2-r2', 'https://www.mckinsey.com/capabilities/people-and-organizational-performance/our-insights/communicate-with-impact', 'https://untools.co/minto-pyramid/', 'The Minto Pyramid — Answer-First Thinking Tool', 'Untools', null, null),
  ('xcomm-p2-r3', 'https://hbr.org/2022/03/use-situation-complication-resolution-to-structure-your-communication', 'https://managementconsulted.com/scqa-framework/', 'The SCQA Framework: Situation, Complication, Question, Answer', 'Management Consulted', null, null),
  ('xcomm-p2-r5', 'https://hbr.org/2020/02/to-write-better-think-like-a-journalist', 'https://www.gsb.stanford.edu/insights/writing-win-how-quickly-capture-readers-keep-them-engaged', 'Writing to Win: How to Quickly Capture Readers and Keep Them Engaged', 'Stanford GSB', null, null),
  ('xcomm-p3-r1', 'https://www.duarte.com/presentation-skills-resources/how-to-structure-a-presentation/', 'https://www.duarte.com/blog/business-communication-demands-3-act-story-structure/', 'The 3-Act Structure for Business Communication — Duarte', null, null, null),
  ('xcomm-p3-r3', 'https://www.presentationzen.com/presentationzen/2011/03/what-is-good-slide-design.html', 'https://www.garrreynolds.com/design-tips', 'How to Design a Great Presentation — Garr Reynolds', 'Garr Reynolds', null, null),
  ('xcomm-p3-r5', 'https://hbr.org/2012/06/the-real-leadership-lessons-of', 'https://www.garrreynolds.com/slide-makeovers', 'Slide Makeovers: Before-and-After Slide Design Samples', 'Garr Reynolds', null, null),
  ('xcomm-p4-r5', 'https://www.storytellingwithdata.com/exercises', 'https://www.duarte.com/blog/transforming-numbers-into-narrative-will-build-your-career/', 'Transforming Numbers into Narrative — Duarte', 'Duarte', 'article', null),
  ('xcomm-p5-r1', 'https://hbr.org/2018/01/how-to-create-an-executive-presentation', 'https://hbr.org/2012/10/how-to-present-to-senior-execu', 'How to Present to Senior Executives', null, null, null),
  ('xcomm-p5-r2', 'https://www.mckinsey.com/capabilities/people-and-organizational-performance/our-insights/presenting-to-senior-leaders', 'https://www.mckinsey.com/locations/mckinsey-client-capabilities-network/our-work/strategic-and-change-communications/the-communications-exchange/ready-to-board-communicating-for-long-term-impact', 'Ready to Board: Communicating for Long-Term Impact', null, null, null),
  ('xcomm-p5-r3', 'https://hbr.org/2014/04/how-to-handle-tough-questions-from-your-audience', 'https://www.gsb.stanford.edu/insights/how-handle-question-you-dont-want-answer', 'How to Handle a Question You Don''t Want to Answer', 'Stanford GSB', null, null),
  ('xcomm-p5-r4', 'https://hbr.org/2019/07/how-to-answer-questions-in-a-way-that-actually-convinces-people', 'https://hbr.org/2022/12/when-a-tough-question-puts-you-on-the-spot', 'When a Tough Question Puts You on the Spot', null, null, null),
  ('xcomm-p5-r5', 'https://hbr.org/2020/07/how-to-communicate-in-times-of-crisis', 'https://hbr.org/2020/07/5-tips-for-communicating-with-employees-during-a-crisis', '5 Tips for Communicating with Employees During a Crisis', null, null, null),
  ('xcomm-p5-r6', 'https://hbr.org/2020/08/how-to-communicate-during-a-crisis', 'https://www.cdc.gov/cerc/php/cerc-manual/index.html', 'Crisis & Emergency Risk Communication (CERC) Manual — CDC', 'CDC', null, null),
  ('xcomm-p6-r1', 'https://hbr.org/2022/03/the-art-of-the-powerful-memo', 'https://writingcenter.gmu.edu/writing-resources/different-genres/writing-business-memos', 'Writing Business Memos — George Mason University Writing Center', 'George Mason University Writing Center', null, null),
  ('xcomm-p6-r2', 'https://www.mckinsey.com/capabilities/people-and-organizational-performance/our-insights/writing-for-impact', 'https://libguides.usc.edu/writingguide/assignments/policymemo', 'Writing a Policy Memo — USC Research Guides', 'USC Libraries', null, null),
  ('xcomm-p6-r3', 'https://hbr.org/2017/04/how-to-write-email-with-military-precision', 'https://hbr.org/2016/11/how-to-write-email-with-military-precision', 'How to Write Email with Military Precision', null, null, null),
  ('xcomm-p6-r4', 'https://hbr.org/2019/02/stop-sending-so-many-emails', 'https://hbr.org/2021/08/how-to-write-better-emails-at-work', 'How to Write Better Emails at Work', null, null, null),
  ('xcomm-p6-r5', 'https://hbr.org/2016/01/how-to-trim-your-writing', 'https://owl.purdue.edu/owl/general_writing/academic_writing/conciseness/index.html', 'Conciseness — Purdue OWL Writing Lab', 'Purdue OWL', null, null),
  -- finance.json (2)
  ('fin-p12-r10', 'https://zerodha.com/varsity/module/financial-modelling-and-valuation/', 'https://zerodha.com/varsity/module/financial-modelling/', 'Financial Modelling & Valuation – Zerodha Varsity', null, null, null),
  ('fin-p5-r5', 'https://www.wallstreetprep.com/knowledge/accretion-dilution/', 'https://www.wallstreetprep.com/knowledge/financial-modeling-quick-lesson-accretion-dilution-model/', null, null, null, null),
  -- langchain_rag.json (1)
  ('rag-p6-r6', 'https://openai.com/pricing', 'https://developers.openai.com/api/docs/pricing', null, null, null, null),
  -- marketing.json (1)
  ('mkt-p6-r2', 'https://support.google.com/analytics/answer/15440208?hl=en', 'https://support.google.com/analytics/answer/11828307?hl=en', '[GA4] Google Analytics 4 training guide and support', null, null, 'Official index of Google''s free GA4 learning options — Analytics Academy courses, video series and help resources — useful as a map before diving in.'),
  -- negotiation.json (27)
  ('neg-p1-r2', 'https://hbr.org/2004/04/six-habits-of-merely-effective-negotiators', 'https://www.pon.harvard.edu/daily/business-negotiations/how-to-find-the-zopa-in-business-negotiations/', 'How to Find the ZOPA in Business Negotiations', 'Harvard PON', null, null),
  ('neg-p1-r4', 'https://www.pon.harvard.edu/daily/negotiation-skills-daily/what-is-integrative-negotiation/', 'https://www.pon.harvard.edu/daily/negotiation-skills-daily/negotiation-skills-expanding-the-pie-integrative-bargaining-versus-distributive-bargaining/', 'Expanding the Pie: Integrative versus Distributive Bargaining', null, null, null),
  ('neg-p1-r6', 'https://hbr.org/2014/04/dont-let-anxiety-sabotage-your-next-negotiation', 'https://www.pon.harvard.edu/daily/negotiation-skills-daily/dear-negotiation-coach-defusing-negotiation-anxiety-nb/', 'Dear Negotiation Coach: Making a Deal When You Have Anxiety', 'Harvard PON', null, null),
  ('neg-p2-r1', 'https://www.pon.harvard.edu/daily/batna/batna-basics-boost-your-power-at-the-bargaining-table/', 'https://www.pon.harvard.edu/daily/batna/translate-your-batna-to-the-current-deal/', 'What Is BATNA? How to Find Your Best Alternative to a Negotiated Agreement', null, null, null),
  ('neg-p2-r3', 'https://www.pon.harvard.edu/daily/negotiation-skills-daily/the-anchoring-effect-and-what-you-can-do-to-avoid-being-anchored/', 'https://www.pon.harvard.edu/daily/negotiation-skills-daily/what-is-anchoring-in-negotiation/', 'What Is Anchoring in Negotiation?', null, null, null),
  ('neg-p2-r4', 'https://www.pon.harvard.edu/daily/negotiation-skills-daily/should-you-make-the-first-offer-in-negotiation/', 'https://www.pon.harvard.edu/daily/negotiation-skills-daily/when-to-make-the-first-offer-in-negotiation/', 'Negotiation Advice: When to Make the First Offer in Negotiation', null, null, null),
  ('neg-p2-r5', 'https://www.pon.harvard.edu/daily/negotiation-skills-daily/interest-based-negotiation-2/', 'https://www.pon.harvard.edu/daily/negotiation-skills-daily/principled-negotiation-focus-interests-create-value/', 'Principled Negotiation: Focus on Interests to Create Value', null, null, null),
  ('neg-p3-r1', 'https://www.blackswanltd.com/the-edge/tactical-empathy', 'https://www.pon.harvard.edu/daily/crisis-negotiations/hostage-negotiation-techniques-for-business-negotiators/', 'Hostage Negotiation Techniques for Business Negotiators', 'Harvard PON', null, null),
  ('neg-p3-r3', 'https://www.pon.harvard.edu/daily/negotiation-skills-daily/top-negotiation-tactics-and-strategies/', 'https://www.pon.harvard.edu/daily/batna/10-hardball-tactics-in-negotiation/', '10 Hard-Bargaining Tactics to Watch Out for in a Negotiation', null, null, null),
  ('neg-p3-r4', 'https://hbr.org/2019/12/how-powerful-is-your-negotiating-position', 'https://www.pon.harvard.edu/daily/dealing-with-difficult-people-daily/beyond-walking-away-facing-difficult-negotiation-tactics-head-on-nb/', 'Dealing with Hardball Tactics in Negotiation', 'Harvard PON', null, null),
  ('neg-p3-r5', 'https://www.pon.harvard.edu/daily/negotiation-skills-daily/common-negotiation-mistakes/', 'https://www.pon.harvard.edu/daily/conflict-resolution/how-ideology-leads-to-misjudging/', 'Cognitive Biases in Negotiation and Conflict Resolution', null, null, null),
  ('neg-p3-r6', 'https://hbr.org/1993/01/negotiating-rationally-the-power-and-impact-of-the-negotiator-s-frame', 'https://www.pon.harvard.edu/daily/conflict-resolution/beware-your-counterparts-biases/', 'Beware Your Counterpart''s Biases', 'Harvard PON', null, null),
  ('neg-p4-r2', 'https://www.pon.harvard.edu/daily/salary-negotiations/salary-negotiation-tips-for-job-seekers/', 'https://www.pon.harvard.edu/daily/salary-negotiations/negotiating-for-a-higher-salary/', 'Salary Negotiation: How to Ask for a Higher Salary', null, null, null),
  ('neg-p4-r3', 'https://www.pon.harvard.edu/daily/salary-negotiations/salary-negotiation-scripts/', 'https://www.pon.harvard.edu/daily/salary-negotiations/how-to-counter-a-job-offer-avoid-common-mistakes/', 'How to Counter a Job Offer: Avoid Common Mistakes', null, null, null),
  ('neg-p4-r4', 'https://hbr.org/2018/05/you-can-do-this-negotiate-your-salary', 'https://www.youtube.com/watch?v=km2Hd_xgo9Q', 'How to Negotiate Your Job Offer — Prof. Deepak Malhotra (HBS)', 'YouTube', 'video', null),
  ('neg-p4-r5', 'https://www.pon.harvard.edu/daily/salary-negotiations/negotiating-your-compensation-package/', 'https://www.pon.harvard.edu/daily/business-negotiations/signing-bonus-negotiation-101/', 'Signing Bonus Negotiation 101', null, null, null),
  ('neg-p5-r1', 'https://www.pon.harvard.edu/daily/business-negotiations/contract-negotiation-strategies/', 'https://www.pon.harvard.edu/daily/business-negotiations/negotiating-an-iron-clad-contract/', 'Contract Negotiations: How to Write an Iron-Clad Contract', null, null, null),
  ('neg-p5-r2', 'https://hbr.org/1994/11/getting-past-yes-negotiating-as-if-implementation-mattered', 'https://www.pon.harvard.edu/daily/dispute-resolution/in-contract-negotiations-agree-on-how-youll-disagree/', 'In Contract Negotiations, Agree on How You''ll Disagree', 'Harvard PON', null, null),
  ('neg-p5-r4', 'https://hbr.org/2001/07/deal-making-and-the-search-for-trust', 'https://www.pon.harvard.edu/daily/negotiation-skills-daily/negotiation-techniques-to-get-new-business-partnerships-off-on-the-right-foot/', 'Negotiation Techniques to Get New Business Partnerships Off on the Right Foot', 'Harvard PON', null, null),
  ('neg-p5-r5', 'https://www.pon.harvard.edu/daily/conflict-resolution/to-overcome-stalled-negotiations-try-these-8-strategies/', 'https://www.pon.harvard.edu/daily/negotiation-skills-daily/what-to-do-when-negotiations-hit-a-wall-nb/', 'Move Beyond Impasse in Negotiation', null, null, null),
  ('neg-p5-r6', 'https://www.pon.harvard.edu/daily/negotiation-skills-daily/using-objective-criteria-in-negotiation/', 'https://www.pon.harvard.edu/daily/dealmaking-daily/7-tips-for-closing-the-deal-in-negotiations/', '7 Tips for Closing the Deal in Negotiations', null, null, null),
  ('neg-p6-r1', 'https://www.pon.harvard.edu/daily/international-negotiation-daily/cross-cultural-negotiations/', 'https://www.pon.harvard.edu/daily/international-negotiation-daily/culture-in-negotiation-preparing-for-international-negotiation/', 'Culture in Negotiation: Preparing for International Negotiation', null, null, null),
  ('neg-p6-r2', 'https://hbr.org/2019/05/how-to-navigate-a-cross-cultural-negotiation', 'https://www.pon.harvard.edu/daily/international-negotiation-daily/cross-cultural-communication-business-negotiations/', 'Cross-Cultural Communication in Business Negotiations', 'Harvard PON', null, null),
  ('neg-p6-r3', 'https://www.pon.harvard.edu/daily/business-negotiations/multiparty-negotiations-what-are-they/', 'https://www.pon.harvard.edu/daily/dealmaking-daily/managing-a-multiparty-negotiation/', 'What Is Multiparty Negotiation? Definition, Challenges, and Strategies', null, null, null),
  ('neg-p6-r4', 'https://hbr.org/1999/03/managing-multiparty-negotiations', 'https://www.pon.harvard.edu/daily/conflict-resolution/preparing-for-multiparty-negotiation/', 'Preparing for Multiparty Negotiation', 'Harvard PON', null, null),
  ('neg-p6-r5', 'https://www.pon.harvard.edu/daily/business-negotiations/ethics-in-negotiation-how-to-avoid-ethical-pitfalls/', 'https://www.pon.harvard.edu/daily/business-negotiations/negotiation-ethics-may-be-a-slippery-slope/', 'Negotiation Ethics May Be a Slippery Slope', null, null, null),
  ('neg-p6-r6', 'https://www.pon.harvard.edu/daily/negotiation-skills-daily/negotiation-and-relationship-building/', 'https://www.pon.harvard.edu/daily/negotiation-training-daily/negotiate-relationships/', 'Relationships in Negotiation: The Advantages of Rapport Building', null, null, null),
  -- personal_branding.json (18)
  ('pb-p1-r1', 'https://blog.hubspot.com/marketing/personal-branding', 'https://hbr.org/2023/05/a-new-approach-to-building-your-personal-brand', 'A New Approach to Building Your Personal Brand — HBR', 'Harvard Business Review', null, null),
  ('pb-p1-r2', 'https://buffer.com/resources/personal-branding/', 'https://www.fastcompany.com/28905/brand-called-you', 'The Brand Called You — Tom Peters, Fast Company', 'Fast Company', null, null),
  ('pb-p1-r4', 'https://www.justinwelsh.me/articles/how-to-build-a-personal-brand-on-linkedin', 'https://online.hbs.edu/blog/post/personal-value-proposition', 'How to Create a Unique Personal Value Proposition — HBS Online', 'Harvard Business School Online', null, null),
  ('pb-p2-r2', 'https://buffer.com/resources/linkedin-profile/', 'https://careerhub.ufl.edu/resources/linkedin-guide/', 'LinkedIn Guide: Headline, About and Every Profile Section — UF Career Center', 'University of Florida Career Connections Center', null, null),
  ('pb-p2-r3', 'https://www.linkedin.com/help/linkedin/answer/a567805/', 'https://www.linkedin.com/help/linkedin/answer/a550399', 'Manage Featured Samples of Your Work on Your Profile — LinkedIn Help', null, null, null),
  ('pb-p3-r1', 'https://buffer.com/resources/linkedin-content-strategy/', 'https://www.socialinsider.io/social-media-benchmarks/linkedin', 'LinkedIn Organic Benchmarks: Which Post Formats Perform — Socialinsider', 'Socialinsider', null, null),
  ('pb-p3-r2', 'https://www.justinwelsh.me/articles/the-linkedin-operating-system', 'https://buffer.com/resources/linkedin-carousels/', 'How to Create LinkedIn Carousel (Document) Posts — Buffer', 'Buffer', null, null),
  ('pb-p3-r4', 'https://buffer.com/resources/content-calendar/', 'https://sproutsocial.com/insights/social-media-content-batching/', 'Social Media Content Batching Guide — Sprout Social', 'Sprout Social', null, null),
  ('pb-p3-r5', 'https://buffer.com/resources/linkedin-hooks/', 'https://copyblogger.com/magnetic-headlines/', 'How to Write a Headline That Drives More Clicks — Copyblogger', 'Copyblogger', null, null),
  ('pb-p4-r1', 'https://blog.hubspot.com/marketing/linkedin-networking', 'https://careerdesign.dartmouth.edu/resources/networking-outreach-templates-sample-questions/', 'Networking Outreach Templates and Sample Questions — Dartmouth', 'Dartmouth Center for Career Design', null, null),
  ('pb-p4-r2', 'https://buffer.com/resources/linkedin-connection-request/', 'https://www.linkedin.com/help/linkedin/answer/a563153', 'Personalize Invitations to Connect — LinkedIn Help', 'LinkedIn Help', null, null),
  ('pb-p4-r4', 'https://buffer.com/resources/linkedin-engagement/', 'https://buffer.com/resources/linkedin-engagement-data/', 'Replying to Comments on LinkedIn Boosts Engagement by 30% — Buffer', null, null, null),
  ('pb-p4-r5', 'https://www.justinwelsh.me/articles/linkedin-dm-strategy', 'https://www.scu.edu/careercenter/toolkit/networking/samplemessages/', 'Sample Outreach and Follow-Up Messages — SCU Career Center', 'Santa Clara University Career Center', null, null),
  ('pb-p5-r1', 'https://www.linkedin.com/help/linkedin/answer/a519988/', 'https://www.linkedin.com/help/linkedin/answer/a517914', 'Newsletters on LinkedIn: FAQ — LinkedIn Help', null, null, null),
  ('pb-p5-r4', 'https://www.justinwelsh.me/articles/creator-economy', 'https://hbr.org/2017/10/how-to-gain-credibility-when-you-have-little-experience', 'How to Gain Credibility When You Have Little Experience — HBR', 'Harvard Business Review', null, null),
  ('pb-p5-r6', 'https://buffer.com/resources/guest-posting/', 'https://www.marketingprofs.com/chirp/2019/40878/how-to-write-a-perfect-guest-post-pitch-infographic', 'How to Write a Guest Post Pitch Editors Will Accept — MarketingProfs', 'MarketingProfs', null, null),
  ('pb-p6-r1', 'https://blog.hubspot.com/website/how-to-build-a-website', 'https://libguides.nova.edu/c.php?g=1269242', 'Personal Website for the Job Search — NSU Library Guides', 'Nova Southeastern University', null, null),
  ('pb-p6-r3', 'https://blog.hubspot.com/marketing/portfolio', 'https://www.nngroup.com/articles/ux-design-portfolios/', '5 Steps to Creating a UX-Design Portfolio — Nielsen Norman Group', 'Nielsen Norman Group', null, null),
  -- product.json (1)
  ('prd-p1-r4', 'https://productplan.com/product-manager-vs-product-owner', 'https://www.productplan.com/learn/product-manager-vs-project-manager', 'Product Manager vs. Project Manager', null, null, 'A side-by-side comparison that places the project manager title in context next to the PM role.'),
  -- prompt_engineering.json (3)
  ('pe-p6-r2', 'https://www.promptingguide.ai/guides', 'https://www.promptingguide.ai/prompts/evaluation', 'LLM Evaluation — Prompt Evaluation Techniques', null, null, 'Evaluation strategies using an LLM as a judge, with worked evaluation prompts you can reuse to score outputs across varied inputs.'),
  ('pe-p6-r3', 'https://www.promptingguide.ai/risks/hallucinations', 'https://www.promptingguide.ai/risks/factuality', 'Factuality — Hallucination Risks in LLMs', null, null, null),
  ('pe-p6-r5', 'https://www.anthropic.com/responsible-development-policy', 'https://www.anthropic.com/responsible-scaling-policy', 'Anthropic''s Responsible Scaling Policy', null, null, 'Anthropic''s published policy on safe deployment — the AI Safety Level standards, capability thresholds and safeguards an AI provider commits to, and a model for organisational AI-use policy.'),
  -- sql_analytics.json (9)
  ('sql-p1-r6', 'https://www.kaggle.com/learn/intro-to-sql', 'https://sqlbolt.com/', 'SQLBolt — Introduction to SQL', 'SQLBolt', null, 'Free interactive lessons that run queries in the browser — each lesson introduces one concept (SELECT, constraints, joins, aggregates) and ends with an exercise.'),
  ('sql-p3-r2', 'https://www.w3schools.com/sql/sql_window_functions.asp', 'https://www.postgresql.org/docs/current/tutorial-window.html', 'Window Functions — PostgreSQL Documentation', 'PostgreSQL', null, 'Official tutorial on OVER and PARTITION BY — shows how a window function calculates across related rows without collapsing them into a single output row.'),
  ('sql-p3-r6', 'https://www.kaggle.com/learn/advanced-sql', 'https://neon.com/postgresql/postgresql-window-function', 'PostgreSQL Window Functions: The Ultimate Guide', 'PostgreSQL Tutorial', 'guide', 'Worked examples of LAG, LEAD, and the frame clause — the exact syntax behind period-over-period comparisons, running totals, and moving averages.'),
  ('sql-p4-r1', 'https://www.w3schools.com/sql/sql_cte.asp', 'https://www.postgresql.org/docs/current/queries-with.html', 'WITH Queries (Common Table Expressions) — PostgreSQL Documentation', 'PostgreSQL', null, 'The canonical WITH reference: auxiliary statements that act as temporary tables for one query, used to break complicated queries into simpler parts.'),
  ('sql-p4-r2', 'https://mode.com/sql-tutorial/sql-with-as/', 'https://www.metabase.com/learn/sql/working-with-sql/sql-cte', 'Simplify Complex Queries with CTEs — Metabase Learn', 'Metabase', null, 'Shows how to chain WITH clauses for multi-stage aggregations (an average of a count) and why named steps are easier to debug than nested subqueries.'),
  ('sql-p4-r3', 'https://mode.com/sql-tutorial/sql-subqueries/', 'https://mode.com/sql-tutorial/sql-sub-queries', 'Writing Subqueries in SQL — Mode Advanced SQL', null, null, 'Subqueries as a tool for multi-step operations — where they can sit in a query, starting with the FROM statement, and when to reach for one instead of a CTE.'),
  ('sql-p5-r1', 'https://mode.com/sql-tutorial/cohort-analysis/', 'https://mode.com/help/articles/cohort-analysis-for-customer-retention-and-churn-rate/', 'Cohort Analysis for Retention and Churn — The Mode Playbook', null, null, 'A retention report that cohorts users by the period they first appeared and tracks each cohort across later periods — the SQL uses CTEs over a users and events schema you can swap for your own.'),
  ('sql-p5-r2', 'https://www.kaggle.com/learn/advanced-sql', 'https://www.metabase.com/learn/grow-your-data-skills/business-analysis-methods/how-to-do-funnel-analysis', 'How to Do Funnel Analysis — Metabase Learn', 'Metabase', 'guide', 'Counts how many users reach each funnel step, then computes overall and step-to-step conversion with a CTE and LAG so you can see where the drop-off actually is.'),
  ('sql-p6-r3', 'https://www.kaggle.com/learn/advanced-sql', 'https://docs.snowflake.com/en/user-guide/tutorials/snowflake-in-20minutes', 'Snowflake in 20 Minutes — Snowflake Documentation', 'Snowflake', 'guide', 'Official trial-account tutorial: create a database, table, and virtual warehouse, load sample data, and query it with SnowSQL — free credits cover the whole exercise.'),
  -- tech_writing.json (11)
  ('tw-p2-r2', 'https://www.writethedocs.org/guide/api-documentation/', 'https://learning.postman.com/docs/publishing-your-api/api-documentation-overview/', 'Document Your APIs — Postman Docs', 'Postman', null, null),
  ('tw-p2-r4', 'https://idratherbewriting.com/learnapidoc/docapis_api_getting_started_section.html', 'https://idratherbewriting.com/learnapidoc/docapis_doc_getting_started_section.html', 'API Getting Started Tutorials — Tom Johnson', null, null, null),
  ('tw-p3-r4', 'https://www.freecodecamp.org/news/how-to-write-technical-documentation/', 'https://www.freecodecamp.org/news/how-to-write-good-documentation/', 'How to Write Good Documentation — freeCodeCamp', null, null, null),
  ('tw-p4-r1', 'https://www.atlassian.com/work-management/documentation/sop', 'https://asana.com/resources/sop-template', 'How to Write a Standard Operating Procedure (SOP) — Asana', 'Asana', null, null),
  ('tw-p4-r2', 'https://www.freecodecamp.org/news/how-to-write-process-documentation/', 'https://www.atlassian.com/work-management/knowledge-sharing/documentation/process-documentation', 'The Ultimate Guide to Process Documentation — Atlassian', 'Atlassian', null, null),
  ('tw-p4-r3', 'https://www.writethedocs.org/guide/ops-docs/', 'https://sre.google/workbook/on-call/', 'Being On-Call and Writing Playbooks — Google SRE Workbook', 'Google SRE', null, null),
  ('tw-p4-r4', 'https://www.atlassian.com/incident-management/runbook', 'https://response.pagerduty.com/', 'PagerDuty Incident Response Documentation', 'PagerDuty', null, null),
  ('tw-p4-r5', 'https://idratherbewriting.com/2014/08/13/information-architecture/', 'https://www.nngroup.com/articles/ia-study-guide/', 'Information Architecture: Study Guide — Nielsen Norman Group', 'Nielsen Norman Group', null, null),
  ('tw-p5-r4', 'https://www.notion.so/help/getting-started-with-notion', 'https://www.notion.com/help/guides/how-to-build-a-help-center-in-notion', 'How to Build a Help Center in Notion — Notion Help', null, null, null),
  ('tw-p6-r3', 'https://www.writethedocs.org/guide/writing/reviewing-docs/', 'https://docs.gitlab.com/development/documentation/workflow/', 'Documentation Review Workflow — GitLab Docs', 'GitLab', null, null),
  ('tw-p6-r6', 'https://www.writethedocs.org/guide/versioning/', 'https://docs.readthedocs.com/platform/latest/versions.html', 'Versioned Documentation — Read the Docs', 'Read the Docs', null, null);

update public.resources r
set url    = x.new_url,
    title  = coalesce(x.new_title,  r.title),
    source = coalesce(x.new_source, r.source),
    format = coalesce(x.new_format, r.format),
    note   = coalesce(x.new_note,   r.note)
from repaired_links x
where r.id = x.id
  and r.url = x.old_url;

do $$
declare
  v_listed int; v_current int; v_stale int; v_missing int; v_other int;
begin
  select count(*) into v_listed from repaired_links;

  select count(*) into v_current
  from repaired_links x join public.resources r on r.id = x.id
  where r.url = x.new_url;

  select count(*) into v_stale
  from repaired_links x join public.resources r on r.id = x.id
  where r.url = x.old_url;

  select count(*) into v_missing
  from repaired_links x
  where not exists (select 1 from public.resources r where r.id = x.id);

  v_other := v_listed - v_current - v_stale - v_missing;

  raise notice 'Re-sourced links: % listed, % now current.', v_listed, v_current;

  if v_missing > 0 then
    raise notice '% listed id(s) are not in this database at all — seed the track first.', v_missing;
  end if;

  if v_other > 0 then
    raise notice '% row(s) hold neither the old nor the new URL and were deliberately left alone (edited elsewhere, most likely the admin panel). Review them by hand.', v_other;
  end if;

  if v_stale > 0 then
    raise warning '% row(s) still hold the dead URL after this ran. That should be impossible; investigate before trusting this migration.', v_stale;
  end if;
end;
$$;

drop table repaired_links;
