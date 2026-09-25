// The one list of seeded track files, shared by seed.mjs, validate-seed.mjs and
// generate-topic-skills.mjs.
//
// Each of those scripts used to keep its own copy. They drifted: the skill
// generator's copy stopped at 13 tracks, so the 11 tracks added after it —
// Negotiation, SQL Analytics, Prompt Engineering and the rest — never got a
// single topic skill. A new track added here now reaches all three at once.
//
// Order matters: seed.mjs derives each track's order_index from its position.
//
// sustainability.json is intentionally absent — soft-hidden, not seeded.

export const TRACK_FILES = [
  'ai.json',
  'finance_prep.json',
  'finance.json',
  'consulting.json',
  'excel.json',
  'excel_data.json',
  'excel_finance.json',
  'psychology.json',
  'marketing.json',
  'data.json',
  'product.json',
  'sales.json',
  'ux.json',
  'operations.json',
  'cybersecurity.json',
  'people.json',
  'market_research.json',
  'prompt_engineering.json',
  'ai_nocode.json',
  'langchain_rag.json',
  'sql_analytics.json',
  'fpa_reporting.json',
  'startup_finance.json',
  'negotiation.json',
  'exec_communication.json',
  'tech_writing.json',
  'personal_branding.json',
  'restructuring.json',
  'bankruptcy_law.json',
];
