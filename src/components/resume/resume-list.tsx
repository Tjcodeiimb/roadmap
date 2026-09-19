"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Copy, Trash2, Pencil, Download, Plus, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { ArticleMark } from "@/components/icons";
import { useToast } from "@/components/ui/toast";
import { createResume, duplicateResume, deleteResume, renameResume } from "@/app/actions/resume";
import type { ResumeSummary } from "@/lib/queries";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function ResumeList({ resumes }: { resumes: ResumeSummary[] }) {
  const [pending, startTransition] = useTransition();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const router = useRouter();
  const { showToast } = useToast();

  function run(action: () => Promise<{ error?: string; success?: true; id?: string }>, onDone?: (id?: string) => void, skipRefresh = false) {
    startTransition(async () => {
      const result = await action();
      if (result?.error) {
        showToast(result.error);
        return;
      }
      onDone?.(result?.id);
      if (!skipRefresh) router.refresh();
    });
  }

  if (resumes.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-4 py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink bg-accent-soft text-accent">
          <ArticleMark size={22} />
        </div>
        <div>
          <div className="font-display text-lg font-bold text-ink">No resumes yet</div>
          <p className="mt-1 max-w-sm text-sm text-ink-2">
            Answer a short set of questions and your resume builds itself as you go.
          </p>
        </div>
        <Button size="lg" disabled={pending} onClick={() => run(createResume, (id) => id && router.push(`/resume/${id}`), true)}>
          Build my first resume <ArrowRight size={16} />
        </Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button size="md" disabled={pending} onClick={() => run(createResume, (id) => id && router.push(`/resume/${id}`), true)}>
          <Plus size={15} /> New resume
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {resumes.map((resume, i) => (
          <Reveal key={resume.id} index={i}>
            <Card className="flex h-full flex-col gap-3">
              {renamingId === resume.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    run(() => renameResume(resume.id, draftTitle), () => setRenamingId(null));
                  }}
                  className="flex gap-2"
                >
                  <input
                    autoFocus
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    onBlur={() => setRenamingId(null)}
                    className="min-w-0 flex-1 rounded-md border-2 border-ink bg-paper px-2.5 py-1.5 text-sm font-bold text-ink focus:outline-none"
                  />
                  <Button size="sm" type="submit">
                    Save
                  </Button>
                </form>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/resume/${resume.id}`}
                    className="font-display text-lg font-bold text-ink hover:underline"
                  >
                    {resume.title}
                  </Link>
                  <button
                    aria-label={`Rename ${resume.title}`}
                    onClick={() => {
                      setRenamingId(resume.id);
                      setDraftTitle(resume.title);
                    }}
                    className="press-sm shrink-0 rounded-sm border-2 border-ink bg-paper p-1.5 text-ink-2 hover:text-ink"
                  >
                    <Pencil size={13} />
                  </button>
                </div>
              )}

              <div className="text-xs text-ink-3">
                {resume.fullName ? `${resume.fullName} · ` : ""}
                {resume.sectionCount} section{resume.sectionCount === 1 ? "" : "s"} · {resume.entryCount} entr
                {resume.entryCount === 1 ? "y" : "ies"}
              </div>
              <div className="text-xs text-ink-3">Updated {formatDate(resume.updatedAt)}</div>

              <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                <Link
                  href={`/resume/${resume.id}`}
                  className="press-sm rounded-md border-2 border-ink bg-paper px-3 py-1.5 text-xs font-bold text-ink shadow-[3px_3px_0_0_var(--brutal-shadow)]"
                >
                  Edit
                </Link>
                <a
                  href={`/api/resume/${resume.id}/export`}
                  className="press-sm flex items-center gap-1 rounded-md border-2 border-ink bg-paper px-3 py-1.5 text-xs font-bold text-ink shadow-[3px_3px_0_0_var(--brutal-shadow)]"
                >
                  <Download size={12} /> Word
                </a>
                <button
                  aria-label={`Duplicate ${resume.title}`}
                  disabled={pending}
                  onClick={() => run(() => duplicateResume(resume.id))}
                  className="press-sm rounded-md border-2 border-ink bg-paper p-1.5 text-ink-2 hover:text-ink"
                >
                  <Copy size={13} />
                </button>
                <button
                  aria-label={`Delete ${resume.title}`}
                  disabled={pending}
                  onClick={() => {
                    if (!confirm(`Delete “${resume.title}”? This can't be undone.`)) return;
                    run(() => deleteResume(resume.id));
                  }}
                  className="press-sm rounded-md border-2 border-ink bg-paper p-1.5 text-ink-2 hover:text-danger"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </Card>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
