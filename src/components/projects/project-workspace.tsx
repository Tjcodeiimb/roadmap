"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { StageBody, StageTutorial } from "@/components/projects/stage-reference";
import { setProjectStage } from "@/app/actions/projects";
import { STAGE_STATUS_LABEL } from "@/lib/projects";
import type { StageStatus } from "@/lib/database.types";
import type { PlaybookStage } from "@/lib/queries";

const NEXT_STATUS: Record<StageStatus, StageStatus> = {
  todo: "doing",
  doing: "done",
  done: "todo",
};

const DOT: Record<StageStatus, string> = {
  todo: "bg-paper",
  doing: "bg-accent",
  done: "bg-success",
};

export function ProjectWorkspace({
  projectId,
  stages,
  initialState,
}: {
  projectId: string;
  stages: PlaybookStage[];
  initialState: Record<string, { status: StageStatus; notes: string }>;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();

  // Stage status and notes are held locally and written through, so ticking a
  // stage is instant: a round-trip per click on a seven-stage checklist is the
  // difference between a tool and a form.
  const [state, setState] = useState(initialState);
  const [open, setOpen] = useState<string | null>(() => {
    const firstUnfinished = stages.find((s) => (initialState[s.id]?.status ?? "todo") !== "done");
    return firstUnfinished?.id ?? stages[0]?.id ?? null;
  });
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});

  function statusOf(stageId: string): StageStatus {
    return state[stageId]?.status ?? "todo";
  }

  function cycle(stageId: string) {
    const next = NEXT_STATUS[statusOf(stageId)];
    const previous = state[stageId];
    setState((s) => ({ ...s, [stageId]: { status: next, notes: s[stageId]?.notes ?? "" } }));
    startTransition(async () => {
      const result = await setProjectStage(projectId, stageId, next);
      if (result?.error) {
        setState((s) => ({ ...s, [stageId]: previous ?? { status: "todo", notes: "" } }));
        showToast(result.error);
        return;
      }
      router.refresh();
    });
  }

  function saveNotes(stageId: string) {
    const notes = draftNotes[stageId];
    if (notes === undefined || notes === (state[stageId]?.notes ?? "")) return;
    setState((s) => ({ ...s, [stageId]: { status: statusOf(stageId), notes } }));
    startTransition(async () => {
      const result = await setProjectStage(projectId, stageId, statusOf(stageId), notes);
      if (result?.error) showToast(result.error);
      else router.refresh();
    });
  }

  const done = stages.filter((s) => statusOf(s.id) === "done").length;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-extrabold tracking-tight text-ink">Stages</h2>
          <p className="mt-0.5 text-sm text-ink-2">
            Click a stage&apos;s marker to move it on: not started → in progress → done.
          </p>
        </div>
        <span className="rounded-sm border-2 border-ink bg-paper-3 px-2.5 py-1 font-mono text-xs font-bold tabular-nums text-ink-2">
          {done} / {stages.length} done
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {stages.map((stage) => {
          const status = statusOf(stage.id);
          const isOpen = open === stage.id;
          const notes = draftNotes[stage.id] ?? state[stage.id]?.notes ?? "";
          return (
            <div
              key={stage.id}
              className="overflow-hidden rounded-md border-2 border-ink bg-paper-2 shadow-[3px_3px_0_0_var(--brutal-shadow)]"
            >
              <div className="flex items-start gap-3 px-3 py-3">
                <button
                  type="button"
                  onClick={() => cycle(stage.id)}
                  disabled={pending}
                  aria-label={`${stage.title}: ${STAGE_STATUS_LABEL[status]}. Click to advance.`}
                  className={`press-sm mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border-2 border-ink disabled:opacity-60 ${DOT[status]}`}
                >
                  {status === "done" && <Check size={14} strokeWidth={3.5} className="text-white" />}
                  {status === "doing" && <span className="h-2 w-2 rounded-sm bg-accent-ink" />}
                </button>

                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : stage.id)}
                  className="min-w-0 flex-1 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="flex flex-wrap items-baseline gap-2">
                    <span className="font-mono text-[11px] font-bold text-ink-3">
                      {String(stage.orderIndex).padStart(2, "0")}
                    </span>
                    <span
                      className={`font-display text-sm font-bold ${
                        status === "done" ? "text-ink-3 line-through" : "text-ink"
                      }`}
                    >
                      {stage.title}
                    </span>
                    {stage.estimatedDays != null && (
                      <span className="font-mono text-[11px] text-ink-3">~{stage.estimatedDays}d</span>
                    )}
                    {stage.skill && !stage.skill.unlocked && (
                      <span className="rounded-sm border-2 border-ink bg-accent-soft px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-accent">
                        Learn first
                      </span>
                    )}
                  </span>
                  {!isOpen && (
                    <span className="mt-0.5 block truncate text-xs text-ink-2">{stage.description}</span>
                  )}
                </button>

                <span className="shrink-0 font-mono text-[11px] font-bold uppercase tracking-wide text-ink-3">
                  {STAGE_STATUS_LABEL[status]}
                </span>
              </div>

              {isOpen && (
                <div className="flex flex-col gap-3 border-t-2 border-ink bg-paper px-4 py-4">
                  <StageBody stage={stage} />
                  <StageTutorial stage={stage} />

                  <label className="flex flex-col gap-1.5 border-t-2 border-ink/10 pt-3">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-ink-3">
                      Your notes on this stage
                    </span>
                    <textarea
                      id={`notes-${stage.id}`}
                      value={notes}
                      onChange={(e) => setDraftNotes((d) => ({ ...d, [stage.id]: e.target.value }))}
                      onBlur={() => saveNotes(stage.id)}
                      rows={3}
                      placeholder="What you decided, what you're stuck on, the number you landed on…"
                      className="w-full rounded-sm border-2 border-ink bg-paper-2 px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <span className="text-[11px] text-ink-3">Saves when you click out of the box.</span>
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
