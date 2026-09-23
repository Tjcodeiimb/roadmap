-- Defensive reassertion, not a schema change: every enrolled course was
-- reported 404ing right after running 0025-0028 by hand in the SQL editor.
-- A read-only cross-check (service-role, bypasses RLS) confirms tracks,
-- phases, topics and resources are all fully intact in the database — so
-- this isn't data loss. The leading hypothesis is the same one already
-- root-caused once before on this project (see the 42P13 incident on
-- set_topic_status): a paste into the SQL editor that didn't fully clear
-- the box first can execute a stray leftover statement alongside the
-- intended one. A stray "drop policy" with no following "create policy"
-- would leave a content table's RLS enabled with no read policy — which
-- denies ALL reads to the authenticated role (not an error, just zero rows),
-- exactly matching "every course 404s for the learner, but the service-role
-- read-only check sees everything fine."
--
-- Re-running the original 0001_init.sql policy definitions verbatim is safe
-- regardless of whether this is the actual cause: if they're already
-- correct, this changes nothing; if one was dropped, this restores it.

drop policy if exists "content read" on public.tracks;
create policy "content read" on public.tracks for select using (auth.role() = 'authenticated');
drop policy if exists "content write" on public.tracks;
create policy "content write" on public.tracks for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "content read" on public.phases;
create policy "content read" on public.phases for select using (auth.role() = 'authenticated');
drop policy if exists "content write" on public.phases;
create policy "content write" on public.phases for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "content read" on public.topics;
create policy "content read" on public.topics for select using (auth.role() = 'authenticated');
drop policy if exists "content write" on public.topics;
create policy "content write" on public.topics for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "content read" on public.resources;
create policy "content read" on public.resources for select using (auth.role() = 'authenticated');
drop policy if exists "content write" on public.resources;
create policy "content write" on public.resources for all using (public.is_admin()) with check (public.is_admin());
