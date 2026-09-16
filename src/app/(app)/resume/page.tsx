import { createClient } from "@/lib/supabase/server";
import { getResumes } from "@/lib/queries";
import { ResumeList } from "@/components/resume/resume-list";

export default async function ResumePage() {
  const supabase = await createClient();
  const resumes = await getResumes(supabase);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink md:text-4xl">Resumes</h1>
        <p className="mt-2 text-ink-2">
          Build a resume once, keep as many tailored versions as you need, and export any of them to Word.
        </p>
        <p className="mt-2 text-sm text-ink-3">
          Private to you. Not visible to admins, not shown on the leaderboard, never shared.
        </p>
        <div className="rule-stripes mt-4 h-2 w-full border-2 border-ink" />
      </div>

      <ResumeList resumes={resumes} />
    </div>
  );
}
