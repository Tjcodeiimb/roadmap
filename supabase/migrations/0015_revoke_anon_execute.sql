-- Completes the grant hygiene 0013/0014 started.
--
-- Those migrations revoked EXECUTE from PUBLIC only. That is enough on stock
-- Postgres, but Supabase ships
--
--   alter default privileges in schema public
--     grant execute on functions to anon, authenticated, service_role;
--
-- so every `create or replace function` also hands `anon` a DIRECT grant.
-- Revoking from PUBLIC leaves that direct grant untouched, which is why
--   has_function_privilege('anon', 'public.get_leaderboard()', 'EXECUTE')
-- still came back true after 0013 ran. Both have to be revoked.
--
-- These functions all carry an `auth.uid() is null` guard of their own, so no
-- data was reachable anonymously either way — this is the second layer, so a
-- future edit that drops a guard doesn't silently reopen the endpoint.

revoke execute on function public.get_leaderboard() from public, anon;
grant execute on function public.get_leaderboard() to authenticated, service_role;

revoke execute on function public.search_catalog(text) from public, anon;
grant execute on function public.search_catalog(text) to authenticated, service_role;

revoke execute on function public.get_trending_tracks(int, int) from public, anon;
grant execute on function public.get_trending_tracks(int, int) to authenticated, service_role;

revoke execute on function public.get_skill_progress() from public, anon;
grant execute on function public.get_skill_progress() to authenticated, service_role;

-- sync_topic_progress is only ever called from inside set_resource_progress,
-- which runs as its definer. Nothing should reach it directly.
revoke execute on function public.sync_topic_progress(text) from public, anon;
grant execute on function public.sync_topic_progress(text) to authenticated, service_role;
