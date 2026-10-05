"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { PROJECT_STATUS_LABEL } from "@/lib/projects";
import { addProjectToResume, deleteProject, updateProject } from "@/app/actions/projects";
import type { UserProjectStatus } from "@/lib/database.types";

const STATUSES: UserProjectStatus[] = ["planning", "in_progress", "done", "shelved"];

/**
 * What the project is, where it lives, and what it achieved — the three
 * things a CV line is made of — plus the hand-off onto an actual resume.
 */
export function ProjectDetails({
  projectId,
  cvLine,
  initial,
}: {
  projectId: string;
  /** The playbook's CV template, shown as guidance for the outcome field. */
  cvLine: string;
  initial: {
    title: string;
    summary: string;
    link: string;
    outcome: string;
    status: UserProjectStatus;
  };
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [fields, setFields] = useState(initial);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function save(key: keyof typeof initial, value: string) {
    if (value === initial[key]) return;
    startTransition(async () => {
      const result = await updateProject(projectId, { [key]: value });
      if (result?.error) {
        showToast(result.error);
        return;
      }
      router.refresh();
    });
  }

  function setStatus(status: UserProjectStatus) {
    const previous = fields.status;
    setFields((f) => ({ ...f, status }));
    startTransition(async () => {
      const result = await updateProject(projectId, { status });
      if (result?.error) {
        setFields((f) => ({ ...f, status: previous }));
        showToast(result.error);
        return;
      }
      if (status === "done") showToast("Finished — worth 250 XP. Add it to your resume below.");
      router.refresh();
    });
  }

  function pushToResume() {
    startTransition(async () => {
      const result = await addProjectToResume(projectId);
      if (result?.error) {
        showToast(result.error);
        return;
      }
      showToast(`Added to your resume with ${result.bullets} bullet${result.bullets === 1 ? "" : "s"}`);
      router.push(`/resume/${result.resumeId}`);
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await deleteProject(projectId);
      if (result?.error) {
        showToast(result.error);
        return;
      }
      showToast("Project deleted");
      router.push("/projects");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4">
        <div>
          <h2 className="font-display text-lg font-extrabold tracking-tight text-ink">The project</h2>
          <p className="mt-0.5 text-sm text-ink-2">
            Fill these in as you go. They become the CV entry, so write them the way you&apos;d want them read.
          </p>
        </div>

        <Field
          id="project-title"
          label="Title"
          value={fields.title}
          placeholder="What you'd call this on a CV"
          onChange={(v) => setFields((f) => ({ ...f, title: v }))}
          onCommit={(v) => save("title", v)}
        />
        <Field
          id="project-summary"
          label="What it is"
          value={fields.summary}
          placeholder="One or two lines: the question or the problem, and what you built or found."
          multiline
          onChange={(v) => setFields((f) => ({ ...f, summary: v }))}
          onCommit={(v) => save("summary", v)}
        />
        <Field
          id="project-link"
          label="Link"
          value={fields.link}
          placeholder="Repo, published PDF, live demo or dashboard"
          onChange={(v) => setFields((f) => ({ ...f, link: v }))}
          onCommit={(v) => save("link", v)}
        />
        <Field
          id="project-outcome"
          label="Outcome"
          value={fields.outcome}
          placeholder="The result, with a number in it where you have one."
          multiline
          help={cvLine ? `On a CV this reads as: ${cvLine}` : undefined}
          onChange={(v) => setFields((f) => ({ ...f, outcome: v }))}
          onCommit={(v) => save("outcome", v)}
        />
      </Card>

      <Card className="flex flex-col gap-3">
        <div>
          <div className="font-display text-sm font-bold text-ink">Status</div>
          <p className="mt-0.5 text-xs text-ink-2">
            Marking it finished is worth 250 XP, and unlocks the resume hand-off.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              disabled={pending}
              aria-pressed={fields.status === s}
              className={`press-sm rounded-sm border-2 border-ink px-3 py-1.5 text-xs font-bold disabled:opacity-60 ${
                fields.status === s
                  ? "bg-accent text-accent-ink shadow-[2px_2px_0_0_var(--brutal-shadow)]"
                  : "bg-paper text-ink-2 hover:text-ink"
              }`}
            >
              {PROJECT_STATUS_LABEL[s]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t-2 border-ink pt-3">
          <button
            type="button"
            onClick={pushToResume}
            disabled={pending || fields.status !== "done"}
            className="press-sm inline-flex items-center gap-2 rounded-md border-2 border-ink bg-accent px-3 py-2 text-sm font-bold text-accent-ink shadow-[3px_3px_0_0_var(--brutal-shadow)] disabled:opacity-40"
          >
            Add to my resume <ArrowRight size={14} />
          </button>
          <Link
            href="/resume"
            className="text-xs font-bold text-ink-3 underline decoration-2 underline-offset-4 hover:text-ink"
          >
            Resumes
          </Link>

          <div className="ml-auto">
            {confirmingDelete ? (
              <span className="flex items-center gap-2">
                <span className="text-xs font-medium text-ink-2">Delete this project and its notes?</span>
                <button
                  type="button"
                  onClick={remove}
                  disabled={pending}
                  className="press-sm rounded-sm border-2 border-ink bg-danger px-2.5 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                >
                  {pending ? "Deleting…" : "Confirm"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="press-sm rounded-sm border-2 border-ink bg-paper-3 px-2.5 py-1.5 text-xs font-bold text-ink-2"
                >
                  Cancel
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="text-xs font-bold text-ink-3 underline decoration-2 underline-offset-4 hover:text-danger"
              >
                Delete project
              </button>
            )}
          </div>
        </div>
        {fields.status !== "done" && (
          <p className="text-xs text-ink-3">
            The resume hand-off unlocks once the project is finished — a half-done project is a weak CV line.
          </p>
        )}
      </Card>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  placeholder,
  help,
  multiline,
  onChange,
  onCommit,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  help?: string;
  multiline?: boolean;
  onChange: (v: string) => void;
  onCommit: (v: string) => void;
}) {
  const className =
    "w-full rounded-sm border-2 border-ink bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-accent";
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-widest text-ink-3">{label}</span>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          rows={3}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => onCommit(e.target.value)}
          className={className}
        />
      ) : (
        <input
          id={id}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => onCommit(e.target.value)}
          className={className}
        />
      )}
      {help && <span className="text-[11px] leading-relaxed text-ink-3">{help}</span>}
    </label>
  );
}
