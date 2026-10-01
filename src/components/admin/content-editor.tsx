"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, ChevronUp, ExternalLink, Trash2, Plus, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  createPhase,
  updatePhase,
  deletePhase,
  movePhase,
  createTopic,
  updateTopic,
  deleteTopic,
  moveTopic,
  createResource,
  updateResource,
  deleteResource,
} from "@/app/actions/admin";
import type { Database } from "@/lib/database.types";

type Resource = Database["public"]["Tables"]["resources"]["Row"];
type Topic = Database["public"]["Tables"]["topics"]["Row"] & { resources: Resource[] };
type Phase = Database["public"]["Tables"]["phases"]["Row"] & { topics: Topic[] };

/** Every mutation goes through this: it reports failures and refreshes on success. */
type Run = <T extends { error?: string | null }>(p: Promise<T>) => Promise<boolean>;

/**
 * An inline field that saves when you click away. It reports that it saved,
 * because silently writing to the live site gives no way to tell an applied
 * edit from a lost one.
 */
function Field({
  value,
  onSave,
  label,
  placeholder,
  multiline,
}: {
  value: string;
  onSave: (v: string) => Promise<boolean>;
  label?: string;
  placeholder?: string;
  multiline?: boolean;
}) {
  const [v, setV] = useState(value);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const Comp = multiline ? "textarea" : "input";

  useEffect(() => {
    if (state !== "saved") return;
    const t = setTimeout(() => setState("idle"), 1600);
    return () => clearTimeout(t);
  }, [state]);

  async function blur() {
    if (v === value) return;
    setState("saving");
    setState((await onSave(v)) ? "saved" : "idle");
  }

  return (
    <label className="block">
      {label && (
        <span className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-ink-3">
          {label}
          {state === "saving" && <span className="text-ink-3">saving…</span>}
          {state === "saved" && (
            <span className="flex items-center gap-0.5 text-success">
              <Check size={11} strokeWidth={3} /> saved
            </span>
          )}
        </span>
      )}
      <div className="relative">
        <Comp
          value={v}
          placeholder={placeholder}
          rows={multiline ? 2 : undefined}
          onChange={(e) => setV(e.target.value)}
          onBlur={blur}
          className="w-full rounded-sm border-2 border-ink bg-paper px-2.5 py-1.5 text-sm font-medium outline-none focus:bg-paper-2"
        />
        {!label && state !== "idle" && (
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wide">
            {state === "saving" ? (
              <span className="text-ink-3">saving…</span>
            ) : (
              <span className="flex items-center gap-0.5 text-success">
                <Check size={11} strokeWidth={3} /> saved
              </span>
            )}
          </span>
        )}
      </div>
    </label>
  );
}

/**
 * Deletes cascade through the content tree and take real learner progress with
 * them, so every delete here says what else goes before it happens.
 */
function DeleteButton({ what, detail, onConfirm, size = 16 }: { what: string; detail: string; onConfirm: () => void; size?: number }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        aria-label={`Delete ${what}`}
        onClick={() => setConfirming(true)}
        className="rounded p-1 text-ink-3 hover:text-danger"
      >
        <Trash2 size={size} />
      </button>
    );
  }

  return (
    <span className="flex items-center gap-1.5 rounded-sm border-2 border-danger bg-danger-soft px-2 py-1">
      <span className="text-[11px] font-bold text-danger">{detail}</span>
      <button
        type="button"
        onClick={onConfirm}
        className="press-sm rounded-sm border-2 border-ink bg-danger px-2 py-0.5 text-[11px] font-bold text-white"
      >
        Delete
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-[11px] font-bold text-ink-2 underline decoration-2 underline-offset-2"
      >
        Cancel
      </button>
    </span>
  );
}

/** The expand/collapse control, which also reports how much is inside. */
function Disclosure({ open, onToggle, count, noun }: { open: boolean; onToggle: () => void; count: number; noun: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="press-sm flex shrink-0 items-center gap-1 rounded-sm border-2 border-ink bg-paper-3 px-2.5 py-1 text-xs font-bold text-ink-2"
    >
      {count} {noun}
      {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
    </button>
  );
}

export function ContentEditor({ trackId, initialPhases }: { trackId: string; initialPhases: Phase[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [, startTransition] = useTransition();
  const [newPhaseTitle, setNewPhaseTitle] = useState("");

  const run: Run = async (promise) => {
    const result = await promise;
    if (result.error) {
      showToast(result.error);
      return false;
    }
    startTransition(() => router.refresh());
    return true;
  };

  const totalTopics = initialPhases.reduce((n, p) => n + p.topics.length, 0);
  const totalResources = initialPhases.reduce(
    (n, p) => n + p.topics.reduce((m, t) => m + t.resources.length, 0),
    0
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 rounded-md border-2 border-ink bg-paper-3 px-3 py-2 text-xs font-bold text-ink-2">
        <span>{initialPhases.length} phases</span>
        <span className="text-ink-3">·</span>
        <span>{totalTopics} topics</span>
        <span className="text-ink-3">·</span>
        <span>{totalResources} resources</span>
        <span className="ml-auto font-medium text-ink-3">Edits save when you click out of a box.</span>
      </div>

      {initialPhases.map((phase, pi) => (
        <PhaseBlock
          key={phase.id}
          phase={phase}
          trackId={trackId}
          index={pi}
          isFirst={pi === 0}
          isLast={pi === initialPhases.length - 1}
          run={run}
        />
      ))}

      <div className="flex gap-2 rounded-md border-2 border-dashed border-ink p-3">
        <input
          value={newPhaseTitle}
          onChange={(e) => setNewPhaseTitle(e.target.value)}
          placeholder="New phase title"
          className="flex-1 rounded-sm border-2 border-ink bg-paper px-3 py-2 text-sm font-medium outline-none"
        />
        <Button
          size="sm"
          disabled={!newPhaseTitle.trim()}
          onClick={() => {
            const title = newPhaseTitle.trim();
            setNewPhaseTitle("");
            run(createPhase(trackId, title));
          }}
        >
          <Plus size={14} /> Add phase
        </Button>
      </div>
    </div>
  );
}

function PhaseBlock({
  phase,
  trackId,
  index,
  isFirst,
  isLast,
  run,
}: {
  phase: Phase;
  trackId: string;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  run: Run;
}) {
  const [open, setOpen] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const resourceCount = phase.topics.reduce((n, t) => n + t.resources.length, 0);

  return (
    <div className="rounded-md border-2 border-ink bg-paper-2 shadow-[4px_4px_0_0_var(--brutal-shadow)]">
      <div className="flex items-center gap-2 p-4">
        <GripVertical size={16} className="shrink-0 text-ink-3" />
        <span className="shrink-0 rounded-sm border-2 border-ink bg-paper px-2 py-0.5 font-mono text-xs font-bold text-ink-2">
          {index + 1}
        </span>
        <div className="flex-1">
          <Field value={phase.title} onSave={(v) => run(updatePhase(phase.id, trackId, { title: v }))} />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            aria-label="Move phase up"
            disabled={isFirst}
            onClick={() => run(movePhase(phase.id, trackId, "up"))}
            className="rounded p-1 text-ink-3 hover:text-ink disabled:opacity-30"
          >
            <ChevronUp size={16} />
          </button>
          <button
            aria-label="Move phase down"
            disabled={isLast}
            onClick={() => run(movePhase(phase.id, trackId, "down"))}
            className="rounded p-1 text-ink-3 hover:text-ink disabled:opacity-30"
          >
            <ChevronDown size={16} />
          </button>
          <DeleteButton
            what="phase"
            detail={`Deletes ${phase.topics.length} topics and ${resourceCount} resources`}
            onConfirm={() => run(deletePhase(phase.id, trackId))}
          />
          <Disclosure open={open} onToggle={() => setOpen((o) => !o)} count={phase.topics.length} noun="topics" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 px-4 pb-4 sm:grid-cols-[2fr_1fr]">
        <Field
          label="Description"
          value={phase.description}
          multiline
          placeholder="What this phase covers"
          onSave={(v) => run(updatePhase(phase.id, trackId, { description: v }))}
        />
        <Field
          label="Estimated weeks"
          value={phase.estimated_weeks ?? ""}
          placeholder="e.g. 1-2"
          onSave={(v) => run(updatePhase(phase.id, trackId, { estimated_weeks: v || null }))}
        />
      </div>

      {open && (
        <div className="flex flex-col gap-2 border-t-2 border-ink p-4">
          {phase.topics.map((topic, ti) => (
            <TopicBlock
              key={topic.id}
              topic={topic}
              phaseId={phase.id}
              trackId={trackId}
              isFirst={ti === 0}
              isLast={ti === phase.topics.length - 1}
              run={run}
            />
          ))}
          <div className="flex gap-2 rounded-md border-2 border-dashed border-ink p-2.5">
            <input
              value={newTopicTitle}
              onChange={(e) => setNewTopicTitle(e.target.value)}
              placeholder="New topic title"
              className="flex-1 rounded-sm border-2 border-ink bg-paper px-3 py-1.5 text-sm font-medium outline-none"
            />
            <Button
              size="sm"
              variant="secondary"
              disabled={!newTopicTitle.trim()}
              onClick={() => {
                const title = newTopicTitle.trim();
                setNewTopicTitle("");
                run(createTopic(phase.id, trackId, title));
              }}
            >
              <Plus size={14} /> Add topic
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function TopicBlock({
  topic,
  phaseId,
  trackId,
  isFirst,
  isLast,
  run,
}: {
  topic: Topic;
  phaseId: string;
  trackId: string;
  isFirst: boolean;
  isLast: boolean;
  run: Run;
}) {
  const [open, setOpen] = useState(false);
  const [newResourceTitle, setNewResourceTitle] = useState("");
  const [newResourceUrl, setNewResourceUrl] = useState("");

  return (
    <div className="rounded-md border-2 border-ink bg-paper p-3">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Field value={topic.title} onSave={(v) => run(updateTopic(topic.id, trackId, { title: v }))} />
        </div>
        <button
          aria-label="Move topic up"
          disabled={isFirst}
          onClick={() => run(moveTopic(topic.id, phaseId, trackId, "up"))}
          className="rounded p-1 text-ink-3 hover:text-ink disabled:opacity-30"
        >
          <ChevronUp size={15} />
        </button>
        <button
          aria-label="Move topic down"
          disabled={isLast}
          onClick={() => run(moveTopic(topic.id, phaseId, trackId, "down"))}
          className="rounded p-1 text-ink-3 hover:text-ink disabled:opacity-30"
        >
          <ChevronDown size={15} />
        </button>
        <DeleteButton
          what="topic"
          detail={`Deletes ${topic.resources.length} resources`}
          onConfirm={() => run(deleteTopic(topic.id, trackId))}
          size={15}
        />
        <Disclosure open={open} onToggle={() => setOpen((o) => !o)} count={topic.resources.length} noun="resources" />
      </div>

      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Field
          label="Description"
          value={topic.description}
          multiline
          placeholder="What this topic covers"
          onSave={(v) => run(updateTopic(topic.id, trackId, { description: v }))}
        />
        <Field
          label="Section label"
          value={topic.section ?? ""}
          placeholder="Optional grouping"
          onSave={(v) => run(updateTopic(topic.id, trackId, { section: v || null }))}
        />
        <Field
          label="Est. time"
          value={topic.estimated_time ?? ""}
          placeholder="e.g. 2 hrs"
          onSave={(v) => run(updateTopic(topic.id, trackId, { estimated_time: v || null }))}
        />
      </div>

      {open && (
        <div className="mt-3 flex flex-col gap-2 border-t-2 border-ink pt-3">
          {topic.resources.map((resource) => (
            <ResourceRow key={resource.id} resource={resource} trackId={trackId} run={run} />
          ))}
          <div className="flex flex-col gap-2 rounded-md border-2 border-dashed border-ink p-2.5 sm:flex-row">
            <input
              value={newResourceTitle}
              onChange={(e) => setNewResourceTitle(e.target.value)}
              placeholder="Resource title"
              className="flex-1 rounded-sm border-2 border-ink bg-paper-2 px-3 py-1.5 text-sm font-medium outline-none"
            />
            <input
              value={newResourceUrl}
              onChange={(e) => setNewResourceUrl(e.target.value)}
              placeholder="https://…"
              className="flex-1 rounded-sm border-2 border-ink bg-paper-2 px-3 py-1.5 text-sm font-medium outline-none"
            />
            <Button
              size="sm"
              variant="secondary"
              disabled={!newResourceTitle.trim() || !newResourceUrl.trim()}
              onClick={() => {
                const title = newResourceTitle.trim();
                const url = newResourceUrl.trim();
                setNewResourceTitle("");
                setNewResourceUrl("");
                run(createResource(topic.id, trackId, title, url));
              }}
            >
              <Plus size={14} /> Add
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ResourceRow({ resource, trackId, run }: { resource: Resource; trackId: string; run: Run }) {
  return (
    <div className="rounded-sm border-2 border-ink bg-paper-2 p-2.5">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Field value={resource.title} onSave={(v) => run(updateResource(resource.id, trackId, { title: v }))} />
        </div>
        <a
          href={resource.url}
          target="_blank"
          rel="noreferrer"
          aria-label="Open this link in a new tab"
          className="rounded p-1 text-ink-3 hover:text-ink"
        >
          <ExternalLink size={14} />
        </a>
        <DeleteButton
          what="resource"
          detail="Removes it for everyone"
          onConfirm={() => run(deleteResource(resource.id, trackId))}
          size={14}
        />
      </div>
      <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-5">
        <Field
          label="URL"
          value={resource.url}
          onSave={(v) => run(updateResource(resource.id, trackId, { url: v }))}
          placeholder="https://…"
        />
        <Field
          label="Source"
          value={resource.source ?? ""}
          onSave={(v) => run(updateResource(resource.id, trackId, { source: v || null }))}
          placeholder="e.g. Microsoft"
        />
        <Field
          label="Format"
          value={resource.format ?? ""}
          onSave={(v) => run(updateResource(resource.id, trackId, { format: v || null }))}
          placeholder="article"
        />
        <Field
          label="Length"
          value={resource.length ?? ""}
          onSave={(v) => run(updateResource(resource.id, trackId, { length: v || null }))}
          placeholder="10 min"
        />
        <Field
          label="Note"
          value={resource.note ?? ""}
          onSave={(v) => run(updateResource(resource.id, trackId, { note: v || null }))}
          placeholder="Why this one"
        />
      </div>
    </div>
  );
}
