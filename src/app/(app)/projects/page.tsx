import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPlaybooks, getMyProjects } from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/ui/reveal";
import { TierBadge } from "@/components/marketplace/tier-badge";
import { ICONS, FALLBACK_ICON, ClockMark } from "@/components/icons";
import { PROJECT_STATUS_LABEL } from "@/lib/projects";

/**
 * Projects: the half of the app that produces something, rather than
 * teaching something. A playbook is the admin-authored method for one kind
 * of deliverable; a project is a learner's run at it.
 */
export default async function ProjectsPage() {
  const supabase = await createClient();
  const [playbooks, mine] = await Promise.all([getPlaybooks(supabase), getMyProjects(supabase)]);

  const live = mine.filter((p) => p.status !== "done" && p.status !== "shelved");
  const finished = mine.filter((p) => p.status === "done");
  const shelved = mine.filter((p) => p.status === "shelved");

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink md:text-4xl">Projects</h1>
        <p className="mt-2 text-ink-2">
          Courses give you the skill; a finished project is what someone can actually check. Each playbook below is
          the method for one kind of deliverable — the formats it has to come in, the dos and donts, the tools, how to
          export it, and the stages to work through. Finish one and push it straight onto your resume.
        </p>
        <div className="rule-stripes mt-4 h-2 w-full border-2 border-ink" />
      </div>

      {mine.length > 0 && (
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-ink">Your projects</h2>
            <p className="mt-0.5 text-sm text-ink-2">
              {live.length} in flight
              {finished.length > 0 && ` · ${finished.length} finished`}
              {shelved.length > 0 && ` · ${shelved.length} shelved`}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[...live, ...finished, ...shelved].map((p, i) => {
              const Icon = ICONS[p.playbookIconKey ?? ""] ?? FALLBACK_ICON;
              const pct = p.totalStages ? Math.round((p.doneStages / p.totalStages) * 100) : 0;
              return (
                <Reveal key={p.id} index={i}>
                  <Link href={`/projects/p/${p.id}`} className="press-sm group block h-full">
                    <Card className="flex h-full flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border-2 border-ink bg-accent-soft text-accent">
                          <Icon size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-display font-bold text-ink group-hover:underline">{p.title}</div>
                          <div className="mt-0.5 text-xs text-ink-3">{p.playbookLabel}</div>
                        </div>
                        <span
                          className={`shrink-0 rounded-sm border-2 border-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            p.status === "done"
                              ? "bg-success text-white"
                              : p.status === "shelved"
                                ? "bg-paper-3 text-ink-3"
                                : "bg-accent text-accent-ink"
                          }`}
                        >
                          {PROJECT_STATUS_LABEL[p.status]}
                        </span>
                      </div>

                      <div className="mt-auto flex items-center gap-3">
                        <div className="h-2.5 flex-1 overflow-hidden rounded-sm border-2 border-ink bg-paper">
                          <div
                            className="h-full bg-accent"
                            style={{ width: `${pct}%` }}
                            role="progressbar"
                            aria-valuenow={pct}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          />
                        </div>
                        <span className="shrink-0 font-mono text-[11px] font-bold tabular-nums text-ink-2">
                          {p.doneStages}/{p.totalStages}
                        </span>
                      </div>
                    </Card>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-display text-lg font-extrabold tracking-tight text-ink">Playbooks</h2>
          <p className="mt-0.5 text-sm text-ink-2">
            Pick the kind of thing you want to produce. Each one is a method, not a course.
          </p>
        </div>

        {playbooks.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 py-10 text-center">
            <div className="font-display font-bold text-ink">No playbooks yet</div>
            <p className="max-w-sm text-sm text-ink-2">
              Playbooks are seeded content. If this is empty, migration{" "}
              <span className="font-mono">0033</span> has run but the seed has not.
            </p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {playbooks.map((p, i) => {
              const Icon = ICONS[p.iconKey ?? ""] ?? FALLBACK_ICON;
              return (
                <Reveal key={p.id} index={i}>
                  <Link href={`/projects/${p.id}`} className="press-sm group block h-full">
                    <Card className="flex h-full flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border-2 border-ink bg-accent-soft text-accent">
                          <Icon size={22} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <TierBadge tier={p.tier} />
                          <div className="mt-1 font-display font-bold text-ink group-hover:underline">{p.label}</div>
                        </div>
                        {p.yours > 0 && (
                          <span className="shrink-0 rounded-sm border-2 border-ink bg-paper-3 px-2 py-0.5 font-mono text-[11px] font-bold text-ink-2">
                            {p.yours} yours
                          </span>
                        )}
                      </div>

                      <p className="text-sm leading-relaxed text-ink-2">{p.summary}</p>

                      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t-2 border-ink pt-3 text-xs text-ink-2">
                        <span className="font-bold text-ink">{p.outcomeLabel}</span>
                        <span className="flex items-center gap-1.5">
                          <ClockMark size={13} /> {p.estimatedWeeks ?? "—"} weeks
                        </span>
                        <span>{p.stageCount} stages</span>
                        <ArrowRight
                          size={15}
                          className="ml-auto text-ink-3 transition-transform group-hover:translate-x-0.5"
                        />
                      </div>
                    </Card>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
