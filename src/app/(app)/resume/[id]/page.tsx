import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getResume, getUnlockedSkills } from "@/lib/queries";
import { ResumeEditor } from "@/components/resume/resume-editor";

export default async function ResumeEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [resume, unlockedSkills] = await Promise.all([getResume(supabase, id), getUnlockedSkills(supabase)]);
  // RLS means someone else's resume reads as absent — a 404, not a 403, so
  // this never confirms that a resume with that id exists.
  if (!resume) notFound();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <Link
          href="/resume"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-2 underline decoration-2 underline-offset-4 hover:text-ink"
        >
          <ArrowLeft size={14} /> All resumes
        </Link>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink">{resume.title}</h1>
        <p className="mt-1 text-sm text-ink-2">
          Fill in each section — it saves as you type, and only you can see it.
        </p>
      </div>

      <ResumeEditor resumeId={resume.id} initialDoc={resume.doc} unlockedSkills={unlockedSkills} />
    </div>
  );
}
