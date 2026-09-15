"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Trash2, Plus, GripVertical } from "lucide-react";
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

function Field({
  value,
  onSave,
  placeholder,
  multiline,
}: {
  value: string;
  onSave: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const [v, setV] = useState(value);
  const Comp = multiline ? "textarea" : "input";
  return (
    <Comp
      value={v}
      placeholder={placeholder}
      rows={multiline ? 2 : undefined}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => v !== value && onSave(v)}
      className="w-full rounded-sm border-2 border-ink bg-paper px-2.5 py-1.5 text-sm font-medium outline-none"
    />
  );
}

export function ContentEditor({ trackId, initialPhases }: { trackId: string; initialPhases: Phase[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [, startTransition] = useTransition();
  const [newPhaseTitle, setNewPhaseTitle] = useState("");

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function run<T extends { error?: string | null }>(promise: Promise<T>) {
    const result = await promise;
    if (result.error) showToast(result.error);
    else refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {initialPhases.map((phase, pi) => (
        <PhaseBlock
          key={phase.id}
          phase={phase}
          trackId={trackId}
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
  isFirst,
  isLast,
  run,
}: {
  phase: Phase;
  trackId: string;
  isFirst: boolean;
  isLast: boolean;
  run: <T extends { error?: string | null }>(p: Promise<T>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");

  return (
    <div className="rounded-md border-2 border-ink bg-paper-2 shadow-[4px_4px_0_0_var(--brutal-shadow)]">
      <div className="flex items-center gap-2 p-4">
        <GripVertical size={16} className="shrink-0 text-ink-3" />
        <div className="flex-1">
          <Field value={phase.title} onSave={(v) => run(updatePhase(phase.id, trackId, { title: v }))} />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button disabled={isFirst} onClick={() => run(movePhase(phase.id, trackId, "up"))} className="rounded p-1 text-ink-3 hover:text-ink disabled:opacity-30">
            <ChevronUp size={16} />
          </button>
          <button disabled={isLast} onClick={() => run(movePhase(phase.id, trackId, "down"))} className="rounded p-1 text-ink-3 hover:text-ink disabled:opacity-30">
            <ChevronDown size={16} />
          </button>
          <button onClick={() => run(deletePhase(phase.id, trackId))} className="rounded p-1 text-ink-3 hover:text-danger">
            <Trash2 size={16} />
          </button>
          <button
            onClick={() => setOpen((o) => !o)}
            className="ml-1 rounded-sm border-2 border-ink bg-paper-3 px-3 py-1 text-xs font-bold text-ink-2"
          >
            {phase.topics.length} topics
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 px-4 pb-4 sm:grid-cols-2">
        <Field
          value={phase.description}
          multiline
          placeholder="Description"
          onSave={(v) => run(updatePhase(phase.id, trackId, { description: v }))}
        />
        <Field
          value={phase.estimated_weeks ?? ""}
          placeholder="Estimated weeks"
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
  run: <T extends { error?: string | null }>(p: Promise<T>) => void;
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
        <button disabled={isFirst} onClick={() => run(moveTopic(topic.id, phaseId, trackId, "up"))} className="rounded p-1 text-ink-3 hover:text-ink disabled:opacity-30">
          <ChevronUp size={15} />
        </button>
        <button disabled={isLast} onClick={() => run(moveTopic(topic.id, phaseId, trackId, "down"))} className="rounded p-1 text-ink-3 hover:text-ink disabled:opacity-30">
          <ChevronDown size={15} />
        </button>
        <button onClick={() => run(deleteTopic(topic.id, trackId))} className="rounded p-1 text-ink-3 hover:text-danger">
          <Trash2 size={15} />
        </button>
        <button onClick={() => setOpen((o) => !o)} className="rounded-sm border-2 border-ink bg-paper-3 px-2.5 py-1 text-xs font-bold text-ink-2">
          {topic.resources.length} resources
        </button>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Field
          value={topic.description}
          multiline
          placeholder="Description"
          onSave={(v) => run(updateTopic(topic.id, trackId, { description: v }))}
        />
        <Field
          value={topic.section ?? ""}
          placeholder="Section label"
          onSave={(v) => run(updateTopic(topic.id, trackId, { section: v || null }))}
        />
        <Field
          value={topic.estimated_time ?? ""}
          placeholder="Est. time"
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

function ResourceRow({
  resource,
  trackId,
  run,
}: {
  resource: Resource;
  trackId: string;
  run: <T extends { error?: string | null }>(p: Promise<T>) => void;
}) {
  return (
    <div className="rounded-sm border-2 border-ink bg-paper-2 p-2.5">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Field value={resource.title} onSave={(v) => run(updateResource(resource.id, trackId, { title: v }))} />
        </div>
        <button onClick={() => run(deleteResource(resource.id, trackId))} className="rounded p-1 text-ink-3 hover:text-danger">
          <Trash2 size={14} />
        </button>
      </div>
      <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-5">
        <Field value={resource.url} onSave={(v) => run(updateResource(resource.id, trackId, { url: v }))} placeholder="URL" />
        <Field value={resource.source ?? ""} onSave={(v) => run(updateResource(resource.id, trackId, { source: v || null }))} placeholder="Source" />
        <Field value={resource.format ?? ""} onSave={(v) => run(updateResource(resource.id, trackId, { format: v || null }))} placeholder="Format" />
        <Field value={resource.length ?? ""} onSave={(v) => run(updateResource(resource.id, trackId, { length: v || null }))} placeholder="Length" />
        <Field value={resource.note ?? ""} onSave={(v) => run(updateResource(resource.id, trackId, { note: v || null }))} placeholder="Note" />
      </div>
    </div>
  );
}
