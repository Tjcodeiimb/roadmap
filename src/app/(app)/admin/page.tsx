import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAllTracks, getAdminTrackStats, getAdminRoster, getBrokenLinks } from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { InviteForm } from "@/components/admin/invite-form";
import { RosterTable } from "@/components/admin/roster-table";
import { BrokenLinksTable } from "@/components/admin/broken-links-table";
import { trackColor } from "@/lib/track-colors";
import { Reveal } from "@/components/ui/reveal";

export default async function AdminPage() {
  const supabase = await createClient();
  const [tracks, stats, roster, brokenLinks] = await Promise.all([
    getAllTracks(supabase),
    getAdminTrackStats(supabase),
    getAdminRoster(supabase),
    getBrokenLinks(supabase),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">Admin</h1>
        <p className="mt-2 text-ink-2">Content, people, and aggregate progress. No individual progress is shown.</p>
      </div>

      <div>
        <div className="mb-3 text-sm font-semibold text-ink">Manage content</div>
        <div className="grid gap-3 sm:grid-cols-3">
          {tracks.map((t, i) => (
            <Reveal key={t.id} index={i}>
              <Link href={`/admin/content/${t.id}`}>
                <Card className="press" style={{ borderTopWidth: "6px", borderTopColor: trackColor(t.id) }}>
                  <div className="font-display font-bold text-ink">{t.label}</div>
                  <div className="mt-1 text-sm text-ink-2">Edit phases, topics & resources</div>
                </Card>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>

      <Card>
        <div className="mb-3 text-sm font-semibold text-ink">Invite an employee</div>
        <InviteForm />
      </Card>

      <Card>
        <div className="mb-3 text-sm font-semibold text-ink">People</div>
        <RosterTable rows={roster} />
      </Card>

      <Card>
        <div className="mb-1 text-sm font-semibold text-ink">Needs attention</div>
        <p className="mb-3 text-xs text-ink-3">
          Flagged by the daily link check — many sites block automated requests, so this is a hint to confirm, not a verdict.
        </p>
        <BrokenLinksTable rows={brokenLinks} />
      </Card>

      <Card>
        <div className="mb-4 text-sm font-semibold text-ink">Aggregate completion</div>
        <div className="flex flex-col gap-2">
          {stats.map((row) => (
            <div key={row.phase_id} className="flex items-center justify-between text-sm">
              <span className="text-ink-2">
                {row.track_id} — {row.phase_title}
              </span>
              <span className="font-medium text-ink">
                {row.completions} completions · {row.topic_count} topics
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
