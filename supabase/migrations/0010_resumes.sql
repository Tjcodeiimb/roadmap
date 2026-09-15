-- ============================================================================
-- Resume builder: one row per resume, the whole document in a single jsonb
-- column.
--
-- Why one jsonb document instead of normalized section/entry/bullet tables:
-- the app never queries *inside* a resume. It always loads the whole thing to
-- render or export - there is no "find resumes mentioning X". That makes
-- jsonb the right storage, and it buys three things that matter here:
--   * duplicating a resume to tailor it for a different role is one
--     insert..select, not a recursive deep-copy across three tables with id
--     remapping;
--   * reordering sections/entries is an array move, not order_index churn;
--   * deletion is genuinely complete - one row, no orphaned children - which
--     is what makes "delete my resume" a promise we can actually keep.
-- The shape of `doc` is defined and normalized in src/lib/resume/types.ts.
--
-- PRIVACY - this table is the most sensitive in the schema. Resumes hold
-- phone numbers, dates of birth, addresses and full work history, none of
-- which existed in this database before. Two rules follow, and both are
-- deliberate departures from the patterns used elsewhere in this schema:
--
--   1. The policy is strictly auth.uid() = user_id, with NO `or
--      public.is_admin()` escape hatch. public.profiles DOES have one (see
--      "own profile select" in 0001, needed for the admin roster screen), so
--      copying the nearest existing policy is exactly how a leak would get
--      introduced here. Admins cannot read resumes. The admin panel must
--      never gain a resume view.
--   2. No share tokens, no public read path, no service-role read outside of
--      the owner's own session. If a "share my resume" link is ever added it
--      needs its own opaque, revocable, expiring token - not a relaxation of
--      this policy.
--
-- Deleting the auth user cascades the resumes away with it.
-- ============================================================================

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'My Resume',
  doc jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resumes_user_id_idx on public.resumes(user_id, updated_at desc);

alter table public.resumes enable row level security;

drop policy if exists "own rows" on public.resumes;
create policy "own rows" on public.resumes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
