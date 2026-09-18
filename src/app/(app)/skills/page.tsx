import { createClient } from "@/lib/supabase/server";
import { getEnrolledSkillProgress } from "@/lib/queries";
import { SkillsView } from "@/components/skills/skills-view";

export default async function SkillsPage() {
  const supabase = await createClient();
  const groups = await getEnrolledSkillProgress(supabase);

  const totalSkills = groups.reduce((n, g) => n + g.skills.length, 0);
  const unlockedCount = groups.reduce((n, g) => n + g.skills.filter((s) => s.unlocked).length, 0);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink md:text-4xl">Skills</h1>
        <p className="mt-2 text-ink-2">
          {unlockedCount} of {totalSkills} skills unlocked across your enrolled courses.
        </p>
        <div className="rule-stripes mt-4 h-2 w-full border-2 border-ink" />
      </div>

      {groups.length === 0 ? (
        <div className="bg-dots rounded-md border-2 border-ink bg-paper-2 p-10 text-center shadow-[4px_4px_0_0_var(--brutal-shadow)]">
          <div className="font-bold text-ink">No skills yet</div>
          <p className="mt-1 text-sm text-ink-2">Enroll in a course and start working through resources to unlock some.</p>
        </div>
      ) : (
        <SkillsView groups={groups} />
      )}
    </div>
  );
}
