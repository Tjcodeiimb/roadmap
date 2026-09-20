-- Adds the "Founder" cohort: the finance a founder actually runs on, plus the
-- go-to-market and influence tracks that go with it.
--
-- Mirrors scripts/seed-data/cohorts.json, so a fresh `npm run seed` produces
-- the same rows. Kept as a migration too, because adding one cohort shouldn't
-- require re-seeding 25 tracks and 335 skills.
--
-- Idempotent; safe to re-run.

insert into public.cohorts (id, name, label, summary, tier, order_index, icon_key, estimated_hours, published)
values (
  'founder',
  'founder',
  'Founder',
  'What it takes to start and run the thing yourself: unit economics, runway and cap tables, reporting that holds up to a board, how to sell it, what moves people, and how to be known for it.',
  'intermediate',
  9,
  'compass',
  150,
  true
)
on conflict (id) do update
  set name = excluded.name,
      label = excluded.label,
      summary = excluded.summary,
      tier = excluded.tier,
      order_index = excluded.order_index,
      icon_key = excluded.icon_key,
      estimated_hours = excluded.estimated_hours,
      published = excluded.published;

-- Joined against tracks rather than inserted blind: a track id that isn't
-- seeded yet would otherwise fail the whole migration on its foreign key.
-- Missing ones are reported below instead.
insert into public.cohort_courses (cohort_id, track_id, order_index)
select 'founder', v.track_id, v.order_index
from (values
  ('startup-finance', 1),
  ('fpa-reporting', 2),
  ('sales', 3),
  ('psychology', 4),
  ('personal-branding', 5)
) as v(track_id, order_index)
join public.tracks t on t.id = v.track_id
on conflict (cohort_id, track_id) do update
  set order_index = excluded.order_index;

-- The first cut of this migration also bundled the 130-hour `finance` track.
-- That course is the investment-banking/PE specialist path — LBOs, hedge funds,
-- structured products, forensic analysis — and almost none of it is what a
-- founder needs; startup-finance already covers fundraising, term sheets and
-- cap tables. An upsert alone would leave the old row behind, so remove it
-- explicitly for anyone who ran the earlier version.
delete from public.cohort_courses
where cohort_id = 'founder' and track_id = 'finance';

do $$
declare
  v_missing text;
  v_count int;
begin
  select string_agg(v.track_id, ', ')
    into v_missing
  from (values
    ('startup-finance'), ('fpa-reporting'),
    ('sales'), ('psychology'), ('personal-branding')
  ) as v(track_id)
  left join public.tracks t on t.id = v.track_id
  where t.id is null;

  select count(*) into v_count
  from public.cohort_courses where cohort_id = 'founder';

  if v_missing is not null then
    raise notice 'Founder cohort created with % of 5 courses. Not yet seeded: %. Re-run this migration after seeding them.', v_count, v_missing;
  else
    raise notice 'Founder cohort created with all 5 courses.';
  end if;
end;
$$;
