-- Adds the "Founder" cohort: the full finance stack plus the go-to-market and
-- influence tracks someone starting a company needs.
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
  'What it takes to start and run the thing yourself: unit economics and the full finance stack, how to sell it, what moves people, and how to be known for it.',
  'advanced',
  9,
  'compass',
  280,
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
  ('finance', 2),
  ('fpa-reporting', 3),
  ('sales', 4),
  ('psychology', 5),
  ('personal-branding', 6)
) as v(track_id, order_index)
join public.tracks t on t.id = v.track_id
on conflict (cohort_id, track_id) do update
  set order_index = excluded.order_index;

do $$
declare
  v_missing text;
  v_count int;
begin
  select string_agg(v.track_id, ', ')
    into v_missing
  from (values
    ('startup-finance'), ('finance'), ('fpa-reporting'),
    ('sales'), ('psychology'), ('personal-branding')
  ) as v(track_id)
  left join public.tracks t on t.id = v.track_id
  where t.id is null;

  select count(*) into v_count
  from public.cohort_courses where cohort_id = 'founder';

  if v_missing is not null then
    raise notice 'Founder cohort created with % of 6 courses. Not yet seeded: %. Re-run this migration after seeding them.', v_count, v_missing;
  else
    raise notice 'Founder cohort created with all 6 courses.';
  end if;
end;
$$;
