-- ============================================================================
-- Leaderboard: let the client highlight the signed-in user's own row.
--
-- get_leaderboard() previously returned only full_name/total_xp/current_streak
-- - no user id at all - so the client couldn't reliably tell which row was
-- "you" (full_name can be null or shared between two people). Adding
-- `is_you` (computed server-side from auth.uid(), never the raw id) keeps
-- the "only 3 fields, no PII beyond opt-in name" contract intact while
-- fixing that gap. Additive/safe to re-run like every other migration here.
-- ============================================================================

create or replace function public.get_leaderboard()
returns table (full_name text, total_xp int, current_streak int, is_you boolean)
language sql
security definer set search_path = public
stable
as $$
  select p.full_name, coalesce(x.total_xp, 0), coalesce(s.current_streak, 0), p.id = auth.uid()
  from public.profiles p
  left join public.user_xp x on x.user_id = p.id
  left join public.user_streak s on s.user_id = p.id
  where p.leaderboard_opt_in = true
  order by coalesce(x.total_xp, 0) desc
  limit 100;
$$;
