import { createClient } from "@/lib/supabase/server";
import { getSkillProgress } from "@/lib/queries";
import { ICONS, FALLBACK_ICON, LockMark, CheckCircleMark, SparkMark } from "@/components/icons";
import { TierBadge } from "@/components/marketplace/tier-badge";

export default async function SkillsPage() {
  const supabase = await createClient();
  const skills = await getSkillProgress(supabase);

  const unlockedCount = skills.filter((s) => s.unlocked).length;
  const domains = [...new Set(skills.map((s) => s.domain))];

  const byDomain = new Map<string, typeof skills>();
  for (const s of skills) {
    if (!byDomain.has(s.domain)) byDomain.set(s.domain, []);
    byDomain.get(s.domain)!.push(s);
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink md:text-4xl">Skills</h1>
        <p className="mt-2 text-ink-2">
          {unlockedCount} of {skills.length} skills unlocked across {domains.length} domains.
        </p>
      </div>

      {skills.length === 0 ? (
        <div className="rounded-2xl border border-border bg-paper-2 p-10 text-center">
          <div className="font-semibold text-ink">No skills yet</div>
          <p className="mt-1 text-sm text-ink-2">Enroll in a course and start working through resources to unlock some.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {[...byDomain.entries()].map(([domain, domainSkills]) => (
            <section key={domain}>
              <div className="mb-3 flex items-baseline gap-2">
                <h2 className="font-display text-lg font-bold text-ink">{domain}</h2>
                <span className="text-xs text-ink-3">
                  {domainSkills.filter((s) => s.unlocked).length}/{domainSkills.length}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {domainSkills.map((skill) => {
                  const Icon = ICONS[skill.iconKey ?? ""] ?? FALLBACK_ICON;
                  return (
                    <div
                      key={skill.id}
                      className={
                        skill.unlocked
                          ? "flex items-start gap-3 rounded-xl border border-border bg-paper-2 p-4"
                          : "flex items-start gap-3 rounded-xl border border-dashed border-border bg-paper p-4 opacity-70"
                      }
                    >
                      <div
                        className={
                          skill.unlocked
                            ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent"
                            : "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper-3 text-ink-3"
                        }
                      >
                        {skill.unlocked ? <Icon size={20} /> : <LockMark size={18} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-ink">{skill.name}</span>
                          <TierBadge tier={skill.tier} />
                        </div>
                        <p className="mt-0.5 text-xs text-ink-3">{skill.description}</p>
                        <div className="mt-2 flex items-center gap-3 text-xs">
                          {skill.unlocked ? (
                            <span className="flex items-center gap-1 font-medium text-success">
                              <CheckCircleMark size={13} /> Unlocked
                            </span>
                          ) : (
                            <span className="text-ink-3">
                              {skill.doneCount} of {skill.totalCount} resources
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-ink-3">
                            <SparkMark size={12} /> {skill.xpReward} XP
                          </span>
                        </div>
                        {!skill.unlocked && skill.totalCount > 0 && (
                          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-paper-3">
                            <div
                              className="h-full rounded-full bg-accent"
                              style={{ width: `${Math.min(100, Math.round((skill.doneCount / skill.totalCount) * 100))}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
