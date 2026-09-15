-- ============================================================================
-- Leaderboard is now a always-on, everyone-included surface showing name and
-- XP only.
--
-- Two changes to get_leaderboard():
--   1. Drops the `where p.leaderboard_opt_in = true` filter, so every profile
--      appears rather than only those who toggled in. The opt-in toggle is
--      removed from the profile page in the same change; the profile page now
--      carries a plain disclosure line instead, so people are still told their
--      name and XP are visible to teammates.
--   2. Drops current_streak from the return. The exposed field set is now
--      name + XP only - one field fewer than before, which keeps this the
--      minimum needed to render the page.
--
-- `drop function if exists` first is mandatory here, not stylistic: changing
-- the OUT-parameter row type on an existing function raises 42P13, which is
-- exactly what bit 0005 and 0006.
--
-- profiles.leaderboard_opt_in is deliberately left in place rather than
-- dropped - nothing reads it after this migration, but dropping a column is
-- irreversible and this stays cheap to reverse if the call changes.
-- ============================================================================

drop function if exists public.get_leaderboard();

create or replace function public.get_leaderboard()
returns table (full_name text, total_xp int, is_you boolean)
language sql
security definer set search_path = public
stable
as $$
  select p.full_name, coalesce(x.total_xp, 0), p.id = auth.uid()
  from public.profiles p
  left join public.user_xp x on x.user_id = p.id
  order by coalesce(x.total_xp, 0) desc, p.full_name asc
  limit 100;
$$;
