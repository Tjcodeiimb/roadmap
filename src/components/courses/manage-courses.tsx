"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ICONS, FALLBACK_ICON, StackMark } from "@/components/icons";
import { trackColor, trackInk } from "@/lib/track-colors";
import { enrollCohort, leaveCohort, unenrollTracks } from "@/app/actions/enrollment";

export interface ManageCourse {
  id: string;
  label: string;
}

export interface ManageCohort {
  id: string;
  label: string;
  summary: string;
  /** Every course in the bundle, flagged with whether the learner is still in it. */
  courses: { id: string; label: string; enrolled: boolean }[];
}

export function ManageCourses({ courses, cohorts }: { courses: ManageCourse[]; cohorts: ManageCohort[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [selected, setSelected] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [leavingCohort, setLeavingCohort] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    setConfirming(false);
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function leaveSelected() {
    startTransition(async () => {
      const result = await unenrollTracks(selected);
      if (result?.error) {
        showToast(result.error);
        return;
      }
      showToast(`Left ${result.left} course${result.left === 1 ? "" : "s"} — progress saved`);
      setSelected([]);
      setConfirming(false);
      router.refresh();
    });
  }

  function leaveBundle(id: string, label: string) {
    startTransition(async () => {
      const result = await leaveCohort(id);
      if (result?.error) {
        showToast(result.error);
        return;
      }
      showToast(`Left ${label} — progress saved`);
      setLeavingCohort(null);
      router.refresh();
    });
  }

  // enroll_cohort is idempotent and only re-activates what's missing, so
  // re-running it is the cleanest way to put a bundle back together.
  function refillBundle(id: string, missing: number) {
    startTransition(async () => {
      const result = await enrollCohort(id);
      if (result?.error) {
        showToast(result.error);
        return;
      }
      showToast(`Added ${missing} course${missing === 1 ? "" : "s"} back`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {cohorts.length > 0 && (
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-ink">Your bundles</h2>
            <p className="mt-0.5 text-sm text-ink-2">
              Leaving a bundle leaves the courses it added for you. Any course you enrolled in yourself stays.
            </p>
          </div>

          {cohorts.map((cohort) => {
            const missing = cohort.courses.filter((c) => !c.enrolled);
            return (
              <Card key={cohort.id} className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border-2 border-ink bg-accent-soft text-accent">
                    <StackMark size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-display font-bold text-ink">{cohort.label}</div>
                    <p className="mt-0.5 text-sm text-ink-2">{cohort.summary}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {cohort.courses.map((c) => (
                    <span
                      key={c.id}
                      className="rounded-sm border-2 border-ink px-2 py-0.5 text-[11px] font-bold"
                      style={
                        c.enrolled
                          ? { backgroundColor: trackColor(c.id), color: trackInk(c.id) }
                          : { backgroundColor: "var(--paper-3)", color: "var(--ink-3)" }
                      }
                    >
                      {c.label}
                      {!c.enrolled && " · left"}
                    </span>
                  ))}
                </div>

                {leavingCohort === cohort.id ? (
                  <div className="flex flex-wrap items-center gap-2 border-t-2 border-ink pt-3">
                    <span className="flex-1 text-xs font-medium text-ink-2">
                      Leave this bundle? The courses it added for you are archived — anything you enrolled in yourself
                      stays, and all your progress is kept.
                    </span>
                    <button
                      onClick={() => leaveBundle(cohort.id, cohort.label)}
                      disabled={pending}
                      className="press-sm rounded-sm border-2 border-ink bg-danger px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                    >
                      {pending ? "Leaving…" : "Confirm"}
                    </button>
                    <button
                      onClick={() => setLeavingCohort(null)}
                      className="press-sm rounded-sm border-2 border-ink bg-paper-3 px-3 py-1.5 text-xs font-bold text-ink-2"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2 border-t-2 border-ink pt-3">
                    <Link
                      href={`/marketplace/cohort/${cohort.id}`}
                      className="text-xs font-bold text-ink-3 underline decoration-2 underline-offset-4 hover:text-ink"
                    >
                      View bundle
                    </Link>
                    <div className="flex-1" />
                    {missing.length > 0 && (
                      <button
                        onClick={() => refillBundle(cohort.id, missing.length)}
                        disabled={pending}
                        className="press-sm rounded-sm border-2 border-ink bg-paper px-3 py-1.5 text-xs font-bold text-ink-2 disabled:opacity-60"
                      >
                        Add back {missing.length} left
                      </button>
                    )}
                    <button
                      onClick={() => setLeavingCohort(cohort.id)}
                      className="press-sm rounded-sm border-2 border-ink bg-paper px-3 py-1.5 text-xs font-bold text-danger"
                    >
                      Leave bundle
                    </button>
                  </div>
                )}
              </Card>
            );
          })}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-display text-lg font-extrabold tracking-tight text-ink">Your courses</h2>
          <p className="mt-0.5 text-sm text-ink-2">
            Tick any number of courses and leave them in one go. Progress, XP and skills are kept, and you can
            re-enroll any time.
          </p>
        </div>

        {courses.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="font-display font-bold text-ink">You&apos;re not in any course yet</div>
            <Link href="/marketplace">
              <Button size="md">
                Browse the marketplace <ArrowRight size={15} />
              </Button>
            </Link>
          </Card>
        ) : (
          <>
            <Card className="flex flex-col gap-1.5 p-3">
              {courses.map((c) => {
                const on = selected.includes(c.id);
                const Icon = ICONS[c.id] ?? FALLBACK_ICON;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggle(c.id)}
                    aria-pressed={on}
                    className={`flex items-center gap-3 rounded-md border-2 px-3 py-2.5 text-left text-sm font-bold ${
                      on ? "border-ink bg-paper-3 text-ink" : "border-transparent text-ink-2 hover:border-ink hover:text-ink"
                    }`}
                  >
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border-2 border-ink"
                      style={on ? { backgroundColor: trackColor(c.id), color: trackInk(c.id) } : { backgroundColor: "var(--paper)" }}
                    >
                      {on && <Check size={13} strokeWidth={3.5} />}
                    </span>
                    <Icon size={18} style={{ color: trackColor(c.id) }} />
                    <span className="flex-1 truncate">{c.label}</span>
                  </button>
                );
              })}
            </Card>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setSelected(selected.length === courses.length ? [] : courses.map((c) => c.id))}
                className="text-xs font-bold text-ink-3 underline decoration-2 underline-offset-4 hover:text-ink"
              >
                {selected.length === courses.length ? "Clear all" : "Select all"}
              </button>
              <span className="text-xs font-bold text-ink-3">{selected.length} selected</span>

              <div className="ml-auto flex items-center gap-2">
                {confirming ? (
                  <>
                    <span className="text-xs font-medium text-ink-2">
                      Leave {selected.length} course{selected.length === 1 ? "" : "s"}?
                    </span>
                    <button
                      onClick={leaveSelected}
                      disabled={pending}
                      className="press-sm rounded-sm border-2 border-ink bg-danger px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
                    >
                      {pending ? "Leaving…" : "Confirm"}
                    </button>
                    <button
                      onClick={() => setConfirming(false)}
                      className="press-sm rounded-sm border-2 border-ink bg-paper-3 px-3 py-2 text-xs font-bold text-ink-2"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirming(true)}
                    disabled={selected.length === 0}
                    className="press-sm rounded-sm border-2 border-ink bg-paper-2 px-3 py-2 text-xs font-bold text-danger disabled:opacity-40"
                  >
                    Leave selected
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
