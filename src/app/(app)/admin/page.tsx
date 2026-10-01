import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireAdminPage } from "@/lib/admin-guard";
import {
  getAllTracks,
  getAdminTrackStats,
  getAdminRoster,
  getBrokenLinks,
  getAdminContentCounts,
} from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { InviteForm } from "@/components/admin/invite-form";
import { RosterTable } from "@/components/admin/roster-table";
import { BrokenLinksTable } from "@/components/admin/broken-links-table";
import { CreateTrackForm } from "@/components/admin/create-track-form";
import { DeleteTrackButton } from "@/components/admin/delete-track-button";
import { trackColor } from "@/lib/track-colors";
import { Reveal } from "@/components/ui/reveal";

/** A section with a heading and a line saying what it's for. */
function Section({
  title,
  help,
  children,
}: {
  title: string;
  help: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="font-display text-lg font-extrabold tracking-tight text-ink">{title}</h2>
        <p className="mt-0.5 text-sm text-ink-2">{help}</p>
      </div>
      {children}
    </section>
  );
}

export default async function AdminPage() {
  const supabase = await requireAdminPage();
  const [tracks, stats, roster, brokenLinks, counts] = await Promise.all([
    getAllTracks(supabase),
    getAdminTrackStats(supabase),
    getAdminRoster(supabase),
    getBrokenLinks(supabase),
    getAdminContentCounts(supabase),
  ]);

  // The stats RPC returns one row per phase; the admin wants it per course.
  const byTrack = new Map<string, { completions: number; topics: number }>();
  for (const row of stats) {
    const acc = byTrack.get(row.track_id) ?? { completions: 0, topics: 0 };
    acc.completions += Number(row.completions);
    acc.topics += row.topic_count;
    byTrack.set(row.track_id, acc);
  }
  const trackLabel = new Map(tracks.map((t) => [t.id, t.label]));
  const completionRows = [...byTrack.entries()]
    .map(([id, v]) => ({ id, label: trackLabel.get(id) ?? id, ...v }))
    .sort((a, b) => b.completions - a.completions);

  const admins = roster.filter((r) => r.role === "admin").length;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">Admin</h1>
        <p className="mt-2 text-ink-2">
          Everything here is live the moment you change it — there is no publish step and no redeploy.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat value={tracks.length} label="Courses" />
          <Stat value={roster.length} label="People" />
          <Stat value={admins} label="Admins" />
          <Stat value={brokenLinks.length} label="Links to check" tone={brokenLinks.length > 0 ? "warn" : undefined} />
        </div>
      </div>

      <Section
        title="Courses"
        help="Click a course to edit its phases, topics and resources. Counts are live."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {tracks.map((t, i) => {
            const c = counts[t.id];
            return (
              <Reveal key={t.id} index={i}>
                <Card
                  className="flex h-full flex-col gap-3"
                  style={{ borderTopWidth: "6px", borderTopColor: trackColor(t.id) }}
                >
                  <Link href={`/admin/content/${t.id}`} className="press-sm group flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-display font-bold text-ink group-hover:underline">{t.label}</div>
                      <div className="mt-0.5 font-mono text-[11px] text-ink-3">{t.id}</div>
                    </div>
                    <ArrowRight size={16} className="mt-1 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5" />
                  </Link>

                  {c ? (
                    <div className="flex flex-wrap gap-1.5">
                      <Chip>{c.phases} phases</Chip>
                      <Chip>{c.topics} topics</Chip>
                      <Chip>{c.resources} resources</Chip>
                      <Chip>{c.learners} enrolled</Chip>
                    </div>
                  ) : (
                    <p className="text-xs text-ink-3">
                      Counts need migration <span className="font-mono">0031</span>.
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                    <Link
                      href={`/marketplace/course/${t.id}`}
                      className="text-xs font-bold text-ink-3 underline decoration-2 underline-offset-4 hover:text-ink"
                    >
                      View as learner
                    </Link>
                    <DeleteTrackButton trackId={t.id} label={t.label} />
                  </div>
                </Card>
              </Reveal>
            );
          })}
        </div>

        <Card>
          <div className="mb-1 text-sm font-semibold text-ink">Add a course</div>
          <p className="mb-3 text-xs text-ink-3">
            Creates an empty, published course and opens its editor. It shows up in the marketplace straight away, so
            add a phase or two before telling anyone about it.
          </p>
          <CreateTrackForm />
        </Card>
      </Section>

      <Section
        title="People"
        help="Everyone with an account. Click a name to see that person's real progress, skills and resumes."
      >
        <Card>
          <RosterTable rows={roster} />
        </Card>
        <Card>
          <div className="mb-1 text-sm font-semibold text-ink">Invite someone</div>
          <p className="mb-3 text-xs text-ink-3">
            Sends a real sign-in email. They join as an employee — use &ldquo;Make admin&rdquo; above to change that.
          </p>
          <InviteForm />
        </Card>
      </Section>

      <Section
        title="Links to check"
        help="Flagged by the daily link check. Many sites block automated requests, so treat this as a hint to confirm, not a verdict."
      >
        <Card>
          <BrokenLinksTable rows={brokenLinks} />
        </Card>
      </Section>

      <Section
        title="Completions by course"
        help="How many topics have been finished across everyone, per course. Individual progress is on each person's page."
      >
        <Card>
          {completionRows.length === 0 ? (
            <p className="text-sm text-ink-3">No topics completed yet.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {completionRows.map((row) => (
                <div key={row.id} className="flex items-center gap-3 text-sm">
                  <span
                    className="h-3 w-3 shrink-0 rounded-sm border-2 border-ink"
                    style={{ backgroundColor: trackColor(row.id) }}
                  />
                  <Link href={`/admin/content/${row.id}`} className="flex-1 truncate text-ink hover:underline">
                    {row.label}
                  </Link>
                  <span className="shrink-0 font-mono text-xs tabular-nums text-ink-2">
                    {row.completions} done · {row.topics} topics
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </Section>
    </div>
  );
}

function Stat({ value, label, tone }: { value: number; label: string; tone?: "warn" }) {
  return (
    <Card className="px-4 py-3 text-center">
      <div
        className={`font-display text-2xl font-extrabold tabular-nums ${tone === "warn" ? "text-danger" : "text-ink"}`}
      >
        {value}
      </div>
      <div className="text-[11px] font-bold uppercase tracking-wide text-ink-3">{label}</div>
    </Card>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-sm border-2 border-ink bg-paper-3 px-2 py-0.5 font-mono text-[11px] font-bold tabular-nums text-ink-2">
      {children}
    </span>
  );
}
