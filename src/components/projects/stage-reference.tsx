import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ICONS, FALLBACK_ICON, ExternalMark, LockMark, CheckCircleMark } from "@/components/icons";
import type { PlaybookStage } from "@/lib/queries";

/**
 * A stage's tutorial block — the mechanism described in migration 0033.
 *
 * Each stage names the skill it needs. If the learner has not unlocked that
 * skill, the block leads with "learn this first": the course that teaches it,
 * plus any stage-specific how-to. If they have unlocked it, the same block
 * collapses to a single confirming line, because showing somebody a tutorial
 * for something they have demonstrably done is how an app earns being
 * ignored.
 *
 * Stage resources stay visible either way when they exist: those are about
 * the artifact (what a README contains, how to export PDF/A), not the skill,
 * and nothing in the course catalogue covers them.
 */
export function StageTutorial({ stage }: { stage: PlaybookStage }) {
  const needsLearning = stage.skill != null && !stage.skill.unlocked;
  const TrackIcon = stage.track ? ICONS[stage.track.id] ?? FALLBACK_ICON : null;

  if (!needsLearning && stage.resources.length === 0) {
    if (!stage.skill) return null;
    return (
      <div className="flex items-center gap-2 border-t-2 border-ink/10 pt-3 text-xs font-bold text-success">
        <CheckCircleMark size={14} />
        You&apos;ve already unlocked {stage.skill.name} — nothing to learn first.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 border-t-2 border-ink/10 pt-3">
      {needsLearning && stage.skill && (
        <div className="rounded-md border-2 border-ink bg-accent-soft px-3 py-2.5">
          <div className="flex items-center gap-2">
            <LockMark size={14} className="shrink-0 text-accent" />
            <span className="text-xs font-bold uppercase tracking-wide text-accent">Learn this first</span>
          </div>
          <p className="mt-1 text-sm text-ink">
            This stage needs <span className="font-bold">{stage.skill.name}</span>, which you haven&apos;t unlocked
            yet.
          </p>
          {stage.track && TrackIcon && (
            <Link
              href={`/marketplace/course/${stage.track.id}`}
              className="press-sm mt-2 inline-flex items-center gap-2 rounded-sm border-2 border-ink bg-paper px-2.5 py-1.5 text-xs font-bold text-ink shadow-[2px_2px_0_0_var(--brutal-shadow)]"
            >
              <TrackIcon size={14} />
              {stage.track.label}
              <ArrowRight size={13} />
            </Link>
          )}
        </div>
      )}

      {!needsLearning && stage.skill && (
        <div className="flex items-center gap-2 text-xs font-bold text-success">
          <CheckCircleMark size={14} />
          {stage.skill.name} unlocked
        </div>
      )}

      {stage.resources.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {stage.resources.map((r) => (
            <a
              key={r.id}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="press-sm group flex items-start gap-2.5 rounded-sm border-2 border-ink bg-paper px-3 py-2"
            >
              <ExternalMark size={13} className="mt-1 shrink-0 text-ink-3" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-ink group-hover:underline">{r.title}</span>
                {r.note && <span className="mt-0.5 block text-xs text-ink-2">{r.note}</span>}
                <span className="mt-0.5 block font-mono text-[11px] text-ink-3">
                  {[r.source, r.format, r.length].filter(Boolean).join(" · ")}
                </span>
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/** The stage's own content: what it is and the checklist to work through. */
export function StageBody({ stage }: { stage: PlaybookStage }) {
  return (
    <>
      <p className="text-sm leading-relaxed text-ink-2">{stage.description}</p>
      {stage.checklist.length > 0 && (
        <ol className="flex flex-col gap-2">
          {stage.checklist.map((c, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border-2 border-ink bg-paper-3 font-mono text-[11px] font-bold text-ink-2">
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-ink">{c.t}</span>
                {c.d && <span className="mt-0.5 block text-sm text-ink-2">{c.d}</span>}
              </span>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
