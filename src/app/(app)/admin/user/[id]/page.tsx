import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireAdminPage } from "@/lib/admin-guard";
import { getAdminRoster, getAdminUserDetail, getAdminUserResume } from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { ResumePreview } from "@/components/resume/resume-preview";
import { trackColor } from "@/lib/track-colors";

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ resume?: string }>;
}) {
  const { id: userId } = await params;
  const { resume: resumeId } = await searchParams;
  const supabase = await requireAdminPage();

  const [roster, detail] = await Promise.all([getAdminRoster(supabase), getAdminUserDetail(supabase, userId)]);
  const person = roster.find((r) => r.id === userId);
  if (!person) notFound();

  const openResume = resumeId ? await getAdminUserResume(supabase, userId, resumeId) : null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link href="/admin" className="flex w-fit items-center gap-1 text-sm text-ink-2 hover:text-ink">
        <ChevronLeft size={16} /> Back to admin
      </Link>

      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
          {person.full_name ?? "—"}
        </h1>
        <p className="mt-1 text-ink-2">{person.email}</p>
        <p className="mt-3 text-xs text-ink-3">
          Full account visibility — this page shows this learner&apos;s real progress and resume, not just aggregate stats.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <div className="font-display text-2xl font-extrabold text-ink">{detail.xp}</div>
          <div className="text-xs text-ink-3">Total XP</div>
        </Card>
        <Card className="text-center">
          <div className="font-display text-2xl font-extrabold text-ink">{detail.currentStreak}</div>
          <div className="text-xs text-ink-3">Current streak</div>
        </Card>
        <Card className="text-center">
          <div className="font-display text-2xl font-extrabold text-ink">{detail.longestStreak}</div>
          <div className="text-xs text-ink-3">Longest streak</div>
        </Card>
      </div>

      <Card>
        <div className="mb-3 text-sm font-semibold text-ink">Enrolled courses & progress</div>
        {detail.tracks.length === 0 ? (
          <p className="text-sm text-ink-3">Not enrolled in anything yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {detail.tracks.map((t) => {
              const pct = t.totalTopics > 0 ? Math.round((t.doneTopics / t.totalTopics) * 100) : 0;
              const color = trackColor(t.track.id);
              return (
                <div key={t.track.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-ink">{t.track.label}</span>
                    <span className="text-ink-3">
                      {t.doneTopics}/{t.totalTopics} topics · {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full border border-ink/20 bg-paper-2">
                    <div className="h-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <div className="mb-3 text-sm font-semibold text-ink">Unlocked skills ({detail.skills.length})</div>
        {detail.skills.length === 0 ? (
          <p className="text-sm text-ink-3">No skills unlocked yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {detail.skills.map((s) => (
              <span
                key={s.id}
                className="rounded-sm border-2 border-ink bg-paper-3 px-2.5 py-1 text-xs font-bold text-ink-2"
              >
                {s.name}
              </span>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="mb-3 text-sm font-semibold text-ink">Resumes ({detail.resumes.length})</div>
        {detail.resumes.length === 0 ? (
          <p className="text-sm text-ink-3">No resumes yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {detail.resumes.map((r) => (
              <Link
                key={r.id}
                href={`/admin/user/${userId}?resume=${r.id}`}
                className={`press-sm flex items-center justify-between rounded-md border-2 border-ink px-3.5 py-2.5 ${
                  openResume?.id === r.id ? "bg-accent-soft" : "bg-paper-2"
                }`}
              >
                <span className="font-medium text-ink">{r.title}</span>
                <span className="text-xs text-ink-3">Updated {new Date(r.updatedAt).toLocaleDateString()}</span>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {openResume && (
        <div className="overflow-hidden rounded-md border-2 border-ink shadow-[4px_4px_0_0_var(--brutal-shadow)]">
          <ResumePreview doc={openResume.doc} />
        </div>
      )}
    </div>
  );
}
