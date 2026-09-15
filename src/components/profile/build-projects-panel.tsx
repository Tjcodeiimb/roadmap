"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { upsertBuildProject, deleteBuildProject } from "@/app/actions/progress";
import { useToast } from "@/components/ui/toast";
import type { Database, ProjectStatus } from "@/lib/database.types";

type BuildProject = Database["public"]["Tables"]["build_projects"]["Row"];

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "idea", label: "Idea" },
  { value: "in_progress", label: "Building" },
  { value: "done", label: "Shipped" },
];

export function BuildProjectsPanel({ projects }: { projects: BuildProject[] }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { showToast } = useToast();

  function submit() {
    if (!title.trim()) return;
    startTransition(async () => {
      await upsertBuildProject({ title: title.trim(), status: "idea", notes: notes.trim() || undefined });
      setTitle("");
      setNotes("");
      setOpen(false);
      router.refresh();
    });
  }

  function updateStatus(id: string, status: ProjectStatus, currentTitle: string, currentNotes: string | null) {
    startTransition(async () => {
      await upsertBuildProject({ id, title: currentTitle, status, notes: currentNotes ?? undefined });
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteBuildProject(id);
      showToast("Removed");
      router.refresh();
    });
  }

  return (
    <div className="rounded-md border-2 border-ink bg-paper-2 p-5 shadow-[4px_4px_0_0_var(--brutal-shadow)]">
      <div className="mb-4 flex items-center justify-between">
        <div className="font-bold text-ink">Build log</div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1 text-sm font-bold text-accent"
        >
          <Plus size={16} /> Add project
        </button>
      </div>

      {open && (
        <div className="mb-4 flex flex-col gap-2 rounded-md border-2 border-ink bg-paper p-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What are you building?"
            className="rounded-sm border-2 border-ink bg-paper px-3 py-2 text-sm font-medium outline-none"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            rows={2}
            className="rounded-sm border-2 border-ink bg-paper px-3 py-2 text-sm font-medium outline-none"
          />
          <Button size="sm" disabled={pending || !title.trim()} onClick={submit} className="self-end">
            Save
          </Button>
        </div>
      )}

      {projects.length === 0 ? (
        <p className="text-sm text-ink-3">Nothing logged yet. Add what you&apos;re building as you go.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {projects.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-md border-2 border-ink bg-paper px-3.5 py-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-ink">{p.title}</div>
                {p.notes && <div className="truncate text-xs text-ink-3">{p.notes}</div>}
              </div>
              <div className="flex gap-1">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    disabled={pending}
                    onClick={() => updateStatus(p.id, opt.value, p.title, p.notes)}
                    className={clsx(
                      "press-sm rounded-sm border-2 border-ink px-2.5 py-1 text-[11px] font-bold",
                      p.status === opt.value ? "bg-accent text-accent-ink" : "bg-paper-3 text-ink-2"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button onClick={() => remove(p.id)} className="text-ink-3 hover:text-danger">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
