import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAllTracks, getAdminTrackStats, getAdminRoster } from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { InviteForm } from "@/components/admin/invite-form";
import { RosterTable } from "@/components/admin/roster-table";

export default async function AdminPage() {
  const supabase = await createClient();
  const [tracks, stats, roster] = await Promise.all([
    getAllTracks(supabase),
    getAdminTrackStats(supabase),
    getAdminRoster(supabase),
  ]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">Admin</h1>
        <p className="mt-2 text-ink-2">Content, people, and aggregate progress. No individual progress is shown.</p>
      </div>

      <div>
        <div className="mb-3 text-sm font-semibold text-ink">Manage content</div>
        <div className="grid gap-3 sm:grid-cols-3">
          {tracks.map((t) => (
            <Link key={t.id} href={`/admin/content/${t.id}`}>
              <Card className="transition-transform duration-150 hover:scale-[1.02]">
                <div className="font-display font-bold text-ink">{t.label}</div>
                <div className="mt-1 text-sm text-ink-2">Edit phases, topics & resources</div>
              </Card>
            </Link>
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
