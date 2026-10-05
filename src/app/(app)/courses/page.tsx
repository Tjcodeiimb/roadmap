import { createClient } from "@/lib/supabase/server";
import { getAllTracks, getSelectedTracks, getMarketplaceCohorts } from "@/lib/queries";
import { ManageCourses, type ManageCohort, type ManageCourse } from "@/components/courses/manage-courses";

/**
 * One place to see and undo everything you're enrolled in.
 *
 * Leaving used to mean opening each course's own page and finding a small
 * "Leave course" link, and leaving a bundle wasn't possible at all — the
 * leave_cohort RPC existed with nothing calling it. This page is the single
 * surface for both.
 */
export default async function MyCoursesPage() {
  const supabase = await createClient();
  const [tracks, activeIds, cohorts] = await Promise.all([
    getAllTracks(supabase),
    getSelectedTracks(supabase),
    getMarketplaceCohorts(supabase),
  ]);

  const active = new Set(activeIds);

  // tracks comes back in order_index order, so the list matches the sidebar.
  const courses: ManageCourse[] = tracks
    .filter((t) => active.has(t.id))
    .map((t) => ({ id: t.id, label: t.label }));

  const bundles: ManageCohort[] = cohorts
    .filter((c) => c.enrolled)
    .map((c) => ({
      id: c.id,
      label: c.label,
      summary: c.summary,
      courses: c.courses.map((x) => ({ id: x.id, label: x.label, enrolled: active.has(x.id) })),
    }));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink md:text-4xl">My courses</h1>
        <p className="mt-2 text-ink-2">
          {courses.length} course{courses.length === 1 ? "" : "s"}
          {bundles.length > 0 && ` · ${bundles.length} bundle${bundles.length === 1 ? "" : "s"}`}. Leaving anything here
          keeps your progress, XP and skills — re-enroll and you pick up exactly where you stopped.
        </p>
        <div className="rule-stripes mt-4 h-2 w-full border-2 border-ink" />
      </div>

      <ManageCourses courses={courses} cohorts={bundles} />
    </div>
  );
}
