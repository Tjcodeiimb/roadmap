import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProjectDetail } from "@/lib/queries";
import { ICONS, FALLBACK_ICON } from "@/components/icons";
import { ProjectWorkspace } from "@/components/projects/project-workspace";
import { ProjectDetails } from "@/components/projects/project-details";
import { PROJECT_STATUS_LABEL } from "@/lib/projects";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  // RLS scopes user_projects to the owner, so someone else's id comes back as
  // no rows and becomes a 404 — never a 403, which would confirm it exists.
  const project = await getProjectDetail(supabase, id);
  if (!project) notFound();

  const Icon = ICONS[project.playbook.iconKey ?? ""] ?? FALLBACK_ICON;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <Link href="/projects" className="flex w-fit items-center gap-1 text-sm text-ink-2 hover:text-ink">
        <ChevronLeft size={16} /> Your projects
      </Link>

      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border-2 border-ink bg-accent-soft text-accent shadow-[3px_3px_0_0_var(--brutal-shadow)]">
            <Icon size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink md:text-3xl">
              {project.title}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-2">
              <span>{project.playbook.label}</span>
              <span
                className={`rounded-sm border-2 border-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  project.status === "done"
                    ? "bg-success text-white"
                    : project.status === "shelved"
                      ? "bg-paper-3 text-ink-3"
                      : "bg-accent text-accent-ink"
                }`}
              >
                {PROJECT_STATUS_LABEL[project.status]}
              </span>
            </div>
          </div>
        </div>

        <Link
          href={`/projects/${project.playbook.id}`}
          className="press-sm flex w-fit items-center gap-2 rounded-sm border-2 border-ink bg-paper-2 px-3 py-1.5 text-xs font-bold text-ink shadow-[2px_2px_0_0_var(--brutal-shadow)]"
        >
          <BookOpen size={14} />
          Formats, dos and don&apos;ts, tools, exports
        </Link>

        <div className="rule-stripes h-2 w-full border-2 border-ink" />
      </div>

      <ProjectWorkspace
        projectId={project.id}
        stages={project.playbook.stages}
        initialState={project.stageState}
      />

      <ProjectDetails
        projectId={project.id}
        cvLine={project.playbook.cvLine}
        initial={{
          title: project.title,
          summary: project.summary,
          link: project.link,
          outcome: project.outcome,
          status: project.status,
        }}
      />
    </div>
  );
}
