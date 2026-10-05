import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPlaybookDetail } from "@/lib/queries";
import { TierBadge } from "@/components/marketplace/tier-badge";
import { ICONS, FALLBACK_ICON, ClockMark, TargetMark } from "@/components/icons";
import {
  DosAndDonts,
  ExportList,
  FormatTable,
  SectionHeading,
  ToolGrid,
} from "@/components/projects/reference-lists";
import { StageBody, StageTutorial } from "@/components/projects/stage-reference";
import { StartProjectButton } from "@/components/projects/start-project-button";

const PLACEHOLDER: Record<string, string> = {
  thesis: "e.g. Capital structure of Indian NBFCs, 2018–2024",
  mvp: "e.g. Shift-swap app for restaurant staff",
  research: "e.g. Why tier-2 retailers abandon loyalty programmes",
  report: "e.g. Should we exit the B segment?",
  analysis: "e.g. What drives churn in our first 90 days?",
  case: "e.g. ITC Hotels demerger — strategy case, 2026",
};

export default async function PlaybookPage({ params }: { params: Promise<{ playbook: string }> }) {
  const { playbook: playbookId } = await params;
  const supabase = await createClient();
  const playbook = await getPlaybookDetail(supabase, playbookId);
  if (!playbook) notFound();

  const Icon = ICONS[playbook.iconKey ?? ""] ?? FALLBACK_ICON;
  const toLearn = playbook.stages.filter((s) => s.skill && !s.skill.unlocked).length;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10">
      <Link href="/projects" className="flex w-fit items-center gap-1 text-sm text-ink-2 hover:text-ink">
        <ChevronLeft size={16} /> All playbooks
      </Link>

      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border-2 border-ink bg-accent-soft text-accent shadow-[4px_4px_0_0_var(--brutal-shadow)]">
            <Icon size={28} />
          </div>
          <div>
            <TierBadge tier={playbook.tier} />
            <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-ink">{playbook.label}</h1>
          </div>
        </div>

        <p className="text-base leading-relaxed text-ink-2">{playbook.summary}</p>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-2">
          <span className="font-bold text-ink">{playbook.outcomeLabel}</span>
          <span className="flex items-center gap-1.5">
            <ClockMark size={14} /> {playbook.estimatedWeeks ?? "—"} weeks
          </span>
          <span>{playbook.stages.length} stages</span>
          {toLearn > 0 && (
            <span className="flex items-center gap-1.5 font-bold text-accent">
              <TargetMark size={14} /> {toLearn} stage{toLearn === 1 ? "" : "s"} to learn first
            </span>
          )}
        </div>

        {playbook.cvLine && (
          <div className="rounded-md border-2 border-ink bg-paper-3 px-4 py-3 shadow-[3px_3px_0_0_var(--brutal-shadow)]">
            <div className="text-[11px] font-bold uppercase tracking-widest text-ink-3">How it reads on a CV</div>
            <p className="mt-1 font-mono text-sm leading-relaxed text-ink">{playbook.cvLine}</p>
          </div>
        )}

        <StartProjectButton
          playbookId={playbook.id}
          playbookLabel={playbook.label}
          placeholder={PLACEHOLDER[playbook.kind] ?? `e.g. my ${playbook.label.toLowerCase()}`}
        />
      </div>

      <section className="flex flex-col gap-3">
        <SectionHeading
          title="Formats"
          help="What the finished thing has to contain, and roughly how long each part runs."
        />
        <FormatTable formats={playbook.formats} />
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeading title="Dos and don'ts" help="The mistakes that cost people the most, collected up front." />
        <DosAndDonts dos={playbook.dos} donts={playbook.donts} />
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeading title="Tools" help="What to build it with. Free unless marked otherwise." />
        <ToolGrid tools={playbook.tools} />
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeading title="Export options" help="How to get the deliverable out in the form it is wanted in." />
        <ExportList exports={playbook.exports} />
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeading
          title="Stages"
          help="The order to work in. Start the project and these become a checklist you tick off, with your own notes against each one."
        />
        <div className="flex flex-col gap-3">
          {playbook.stages.map((stage) => (
            <div
              key={stage.id}
              className="flex flex-col gap-3 rounded-md border-2 border-ink bg-paper-2 p-4 shadow-[3px_3px_0_0_var(--brutal-shadow)]"
            >
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-mono text-[11px] font-bold text-ink-3">
                  {String(stage.orderIndex).padStart(2, "0")}
                </span>
                <h3 className="font-display font-bold text-ink">{stage.title}</h3>
                {stage.estimatedDays != null && (
                  <span className="font-mono text-[11px] text-ink-3">~{stage.estimatedDays} days</span>
                )}
              </div>
              <StageBody stage={stage} />
              <StageTutorial stage={stage} />
            </div>
          ))}
        </div>
      </section>

      <div className="border-t-2 border-ink pt-6">
        <StartProjectButton
          playbookId={playbook.id}
          playbookLabel={playbook.label}
          placeholder={PLACEHOLDER[playbook.kind] ?? `e.g. my ${playbook.label.toLowerCase()}`}
        />
      </div>
    </div>
  );
}
