import { createClient } from "@/lib/supabase/server";
import { getSkillProgress } from "@/lib/queries";
import { ICONS, FALLBACK_ICON, LockMark, CheckCircleMark, SparkMark } from "@/components/icons";
import { TierBadge } from "@/components/marketplace/tier-badge";
import { trackColor, trackInk } from "@/lib/track-colors";
import { Reveal } from "@/components/ui/reveal";

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
        <div className="rounded-md border-2 border-ink bg-paper-2 p-10 text-center shadow-[4px_4px_0_0_var(--brutal-shadow)]">
          <div className="font-bold text-ink">No skills yet</div>
          <p className="mt-1 text-sm text-ink-2">Enroll in a course and start working through resources to unlock some.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {(() => {
            let globalIndex = 0;
            return [...byDomain.entries()].map(([domain, domainSkills]) => (
            <section key={domain}>
              <div className="mb-3 flex items-baseline gap-2">
                <span className="h-3 w-3 rounded-sm border-2 border-ink" style={{ backgroundColor: trackColor(domain) }} />
                <h2 className="font-display text-lg font-bold text-ink">{domain}</h2>
                <span className="text-xs text-ink-3">
                  {domainSkills.filter((s) => s.unlocked).length}/{domainSkills.length}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {domainSkills.map((skill) => {
                  const Icon = ICONS[skill.iconKey ?? ""] ?? FALLBACK_ICON;
                  const index = globalIndex++;
                  return (
                    <Reveal key={skill.id} index={index}>
                    <div
                      className={
                        skill.unlocked
                          ? "flex items-start gap-3 rounded-md border-2 border-ink bg-paper-2 p-4 shadow-[3px_3px_0_0_var(--brutal-shadow)]"
                          : "flex items-start gap-3 rounded-md border-2 border-dashed border-ink bg-paper p-4 opacity-70"
                      }
                    >
                      <div
                        className={
                          skill.unlocked
                            ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border-2 border-ink"
                            : "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border-2 border-ink bg-paper-3 text-ink-3"
                        }
                        style={skill.unlocked ? { backgroundColor: trackColor(skill.domain), color: trackInk(skill.domain) } : undefined}
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
                          <div className="mt-2 h-2 w-full overflow-hidden rounded-sm border-2 border-ink bg-paper-3">
                            <div
                              className="h-full bg-accent"
                              style={{ width: `${Math.min(100, Math.round((skill.doneCount / skill.totalCount) * 100))}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    </Reveal>
                  );
                })}
              </div>
            </section>
            ));
          })()}
        </div>
      )}
    </div>
  );
}
