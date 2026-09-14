import { createClient } from "@/lib/supabase/server";
import { getEnrolledTracks, getLibraryResources, getWatchStats } from "@/lib/queries";
import { LibraryBrowser } from "@/components/library/library-browser";
import { ClockMark, CheckCircleMark } from "@/components/icons";

function formatHours(seconds: number) {
  const hours = seconds / 3600;
  return hours >= 10 ? Math.round(hours).toString() : hours.toFixed(1);
}

export default async function LibraryPage() {
  const supabase = await createClient();
  const enrolled = await getEnrolledTracks(supabase);
  const trackIds = enrolled.map((t) => t.trackId);
  const [resources, watchStats] = await Promise.all([
    getLibraryResources(supabase, trackIds),
    getWatchStats(supabase),
  ]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink md:text-4xl">Library</h1>
        <p className="mt-2 text-ink-2">Every resource across your enrolled courses, in one place.</p>

        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-2">
          <span className="flex items-center gap-1.5">
            <ClockMark size={15} /> {formatHours(watchStats.secondsWatched)} hours watched
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircleMark size={15} /> {watchStats.resourcesCompleted} resources completed
          </span>
          <span>{resources.length} total resources</span>
        </div>
      </div>

      {resources.length === 0 ? (
        <div className="rounded-2xl border border-border bg-paper-2 p-10 text-center">
          <div className="font-semibold text-ink">No enrolled courses yet</div>
          <p className="mt-1 text-sm text-ink-2">
            Enroll in a course from the marketplace to start building your library.
          </p>
        </div>
      ) : (
        <LibraryBrowser resources={resources} />
      )}
    </div>
  );
}
