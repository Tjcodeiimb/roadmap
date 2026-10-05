"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProjectDetail, getResume, getResumes } from "@/lib/queries";
import { projectToResumeEntry } from "@/lib/projects";
import { newId } from "@/lib/resume/types";
import type { StageStatus, UserProjectStatus } from "@/lib/database.types";

function revalidateProjects(projectId?: string) {
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  if (projectId) revalidatePath(`/projects/p/${projectId}`);
}

export async function startProject(playbookId: string, title: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("start_project", {
    p_playbook_id: playbookId,
    p_title: title,
  });
  if (error) return { error: error.message };
  revalidateProjects();
  return { success: true, projectId: data as string };
}

export async function setProjectStage(
  projectId: string,
  stageId: string,
  status: StageStatus,
  notes?: string
) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_project_stage", {
    p_project_id: projectId,
    p_stage_id: stageId,
    p_status: status,
    // Left out of the payload entirely when there are no notes to write, so
    // the RPC's default null applies and it coalesces to "keep what is there".
    // A status-only toggle must not blank the notes the learner typed.
    p_notes: notes ?? undefined,
  });
  if (error) return { error: error.message };
  revalidateProjects(projectId);
  return { success: true };
}

export async function updateProject(
  projectId: string,
  fields: { title?: string; summary?: string; link?: string; outcome?: string; status?: UserProjectStatus }
) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_project", {
    p_project_id: projectId,
    p_title: fields.title,
    p_summary: fields.summary,
    p_link: fields.link,
    p_outcome: fields.outcome,
    p_status: fields.status,
  });
  if (error) return { error: error.message };
  revalidateProjects(projectId);
  return { success: true };
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_project", { p_project_id: projectId });
  if (error) return { error: error.message };
  revalidateProjects();
  return { success: true };
}

/**
 * Push a finished project onto a resume's PROJECTS section.
 *
 * This is the whole point of the feature — "CV points" has to mean an actual
 * line on an actual document — so it writes a real entry rather than copying
 * text to the clipboard. The resume is the source of truth afterwards: editing
 * the entry there never writes back to the project, and pushing twice adds a
 * second entry rather than silently overwriting an edited one.
 */
export async function addProjectToResume(projectId: string, resumeId?: string) {
  const supabase = await createClient();

  const project = await getProjectDetail(supabase, projectId);
  if (!project) return { error: "Project not found" };
  if (project.status !== "done") {
    return { error: "Finish the project first — a half-done project is a weak CV line" };
  }

  let targetId = resumeId;
  if (!targetId) {
    const resumes = await getResumes(supabase);
    if (resumes.length === 0) {
      return { error: "Create a resume first, then add this to it" };
    }
    targetId = resumes[0].id;
  }

  const resume = await getResume(supabase, targetId);
  if (!resume) return { error: "Resume not found" };

  const entry = projectToResumeEntry({
    title: project.title,
    summary: project.summary,
    outcome: project.outcome,
    link: project.link,
    playbookLabel: project.playbook.label,
  });

  const doc = resume.doc;
  const section = doc.sections.find((s) => s.type === "projects");
  if (!section) return { error: "This resume has no Projects section" };

  section.entries = [...section.entries, { id: newId(), ...entry }];

  const { error } = await supabase
    .from("resumes")
    .update({ doc, updated_at: new Date().toISOString() })
    .eq("id", targetId);
  if (error) return { error: error.message };

  revalidatePath(`/resume/${targetId}`);
  revalidatePath("/resume");
  revalidateProjects(projectId);
  return { success: true, resumeId: targetId, bullets: entry.bullets.length };
}
