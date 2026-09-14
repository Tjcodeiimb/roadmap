import Link from "next/link";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/server";
import { getMarketplaceCourses, getMarketplaceCohorts } from "@/lib/queries";
import { CourseCard } from "@/components/marketplace/course-card";
import { CohortCard } from "@/components/marketplace/cohort-card";

const TIER_ORDER = ["foundational", "intermediate", "advanced"] as const;
const TIER_TITLE: Record<(typeof TIER_ORDER)[number], string> = {
  foundational: "Foundational",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = tab === "cohorts" ? "cohorts" : "courses";
  const supabase = await createClient();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
          Marketplace
        </h1>
        <p className="mt-2 text-ink-2">
          Browse every course, or enroll in a curated bundle that strings a few together.
        </p>
      </div>

      <div className="flex gap-1 rounded-xl border border-border bg-paper-2 p-1 w-fit">
        <Link
          href="/marketplace?tab=courses"
          className={clsx(
            "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "courses" ? "bg-paper text-ink card-shadow" : "text-ink-2 hover:text-ink"
          )}
        >
          Courses
        </Link>
        <Link
          href="/marketplace?tab=cohorts"
          className={clsx(
            "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "cohorts" ? "bg-paper text-ink card-shadow" : "text-ink-2 hover:text-ink"
          )}
        >
          Cohorts
        </Link>
      </div>

      {activeTab === "courses" ? <CoursesTab supabase={supabase} /> : <CohortsTab supabase={supabase} />}
    </div>
  );
}

async function CoursesTab({ supabase }: { supabase: Awaited<ReturnType<typeof createClient>> }) {
  const courses = await getMarketplaceCourses(supabase);

  return (
    <div className="flex flex-col gap-10">
      {TIER_ORDER.map((tier) => {
        const inTier = courses.filter((c) => c.tier === tier);
        if (!inTier.length) return null;
        return (
          <section key={tier}>
            <h2 className="mb-4 font-display text-lg font-bold text-ink">{TIER_TITLE[tier]}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {inTier.map((course, i) => (
                <CourseCard key={course.id} course={course} index={i} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

async function CohortsTab({ supabase }: { supabase: Awaited<ReturnType<typeof createClient>> }) {
  const cohorts = await getMarketplaceCohorts(supabase);

  if (!cohorts.length) {
    return (
      <div className="rounded-2xl border border-border bg-paper-2 p-10 text-center">
        <div className="font-semibold text-ink">No cohorts yet</div>
        <p className="mt-1 text-sm text-ink-2">
          Curated multi-course bundles are on the way — check back soon.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {cohorts.map((cohort, i) => (
        <CohortCard key={cohort.id} cohort={cohort} index={i} />
      ))}
    </div>
  );
}
