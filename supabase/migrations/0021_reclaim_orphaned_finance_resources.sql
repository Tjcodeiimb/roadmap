-- Re-home seven Finance resources that the seed file had lost.
--
-- A reconciliation of the live database against scripts/seed-data/finance.json
-- turned up seven resources present in the database but absent from the seed
-- file. They are not junk — every one is legitimate, on-topic and well sourced
-- (CFI, Wall Street Prep). They were dropped from the JSON during an earlier
-- rewrite of the file and survived only because the seed script upserts and
-- never deletes.
--
-- They have now been adopted back into finance.json, so the file is the source
-- of truth again. Four already sit on the right topic and need nothing; three
-- are re-homed here to the topics added since they were written.
--
-- Their ids are deliberately NOT renamed to match their new phase.
-- user_resource_progress.resource_id is a foreign key, so changing an id would
-- strand any watch progress recorded against it. An id whose prefix no longer
-- matches its phase is cosmetic; lost progress is not.
--
-- Idempotent; safe to re-run. No inserts and no deletes — these rows exist.

-- The football field is how a pitch book draws its valuation range, and the
-- Pitch Books topic's steps call for building one.
update public.resources set topic_id = 'fin-p4-t1' where id = 'fin-p10-r7';

-- Accretion/dilution now has a topic of its own; it was filed under Synergies.
update public.resources set topic_id = 'fin-p5-t3' where id = 'fin-p5-r5';

-- Restructuring now has a topic of its own; it was filed under credit analysis.
update public.resources set topic_id = 'fin-p13-t2' where id = 'fin-p8-r8';

-- Capital structure belongs with the topic that is now named after it.
update public.resources set topic_id = 'fin-p2-t2' where id = 'fin-p2-r6';

-- The remaining three (fin-p3-r4 FX, fin-p8-r7 credit ratings, fin-p10-r8
-- sensitivity analysis) are already on the correct topic and are listed here
-- only so the reconciliation is complete and auditable.

-- Map each to its topic's skill, matching how every other resource is treated.
insert into public.skill_resources (skill_id, resource_id)
select 'skill-topic-' || r.topic_id, r.id
from public.resources r
where r.id in ('fin-p10-r7','fin-p5-r5','fin-p8-r8','fin-p2-r6','fin-p3-r4','fin-p8-r7','fin-p10-r8')
  and exists (select 1 from public.skills s where s.id = 'skill-topic-' || r.topic_id)
on conflict do nothing;

do $$
declare v_total int; v_orphans int;
begin
  select count(*) into v_total
  from public.resources r
  join public.topics t on t.id = r.topic_id
  join public.phases p on p.id = t.phase_id
  where p.track_id = 'finance';

  select count(*) into v_orphans
  from public.resources r
  join public.topics t on t.id = r.topic_id
  join public.phases p on p.id = t.phase_id
  where p.track_id = 'finance'
    and not exists (select 1 from public.skill_resources sr where sr.resource_id = r.id);

  raise notice 'Finance resources: % (expect 111). Not mapped to any skill: %.', v_total, v_orphans;
end;
$$;
