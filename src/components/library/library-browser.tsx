"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { motion } from "framer-motion";
import { ICONS, FALLBACK_ICON, CheckCircleMark, PlayMark } from "@/components/icons";
import { listReveal } from "@/lib/motion";
import type { LibraryResource } from "@/lib/queries";

type StatusFilter = "all" | "todo" | "in_progress" | "done";
type SortOption = "course" | "recent" | "title";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Completed" },
  { value: "todo", label: "Not started" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "course", label: "Course order" },
  { value: "recent", label: "Recently updated" },
  { value: "title", label: "Title A–Z" },
];

function formatMinutes(seconds: number) {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

export function LibraryBrowser({ resources }: { resources: LibraryResource[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [trackId, setTrackId] = useState<string>("all");
  const [format, setFormat] = useState<string>("all");
  const [sort, setSort] = useState<SortOption>("course");

  const tracks = useMemo(() => {
    const seen = new Map<string, { id: string; label: string; iconKey: string | null }>();
    for (const r of resources) {
      if (!seen.has(r.trackId)) seen.set(r.trackId, { id: r.trackId, label: r.trackLabel, iconKey: r.trackIconKey });
    }
    return [...seen.values()];
  }, [resources]);

  const formats = useMemo(() => {
    const seen = new Set<string>();
    for (const r of resources) if (r.format) seen.add(r.format);
    return [...seen];
  }, [resources]);

  const continueWatching = useMemo(
    () =>
      resources
        .filter((r) => r.status === "in_progress")
        .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""))
        .slice(0, 6),
    [resources]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (trackId !== "all" && r.trackId !== trackId) return false;
      if (format !== "all" && r.format !== format) return false;
      if (q && !`${r.title} ${r.note ?? ""} ${r.topicTitle}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [resources, query, status, trackId, format]);

  const flatSorted = useMemo(() => {
    if (sort === "recent") {
      return [...filtered].sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
    }
    if (sort === "title") {
      return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    }
    return filtered;
  }, [filtered, sort]);

  const grouped = useMemo(() => {
    const byTrack = new Map<string, { label: string; iconKey: string | null; topics: Map<string, { title: string; items: LibraryResource[] }> }>();
    for (const r of filtered) {
      if (!byTrack.has(r.trackId)) {
        byTrack.set(r.trackId, { label: r.trackLabel, iconKey: r.trackIconKey, topics: new Map() });
      }
      const track = byTrack.get(r.trackId)!;
      if (!track.topics.has(r.topicId)) track.topics.set(r.topicId, { title: r.topicTitle, items: [] });
      track.topics.get(r.topicId)!.items.push(r);
    }
    return [...byTrack.entries()];
  }, [filtered]);

  return (
    <div className="flex flex-col gap-8">
      {continueWatching.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-ink">Continue watching</h2>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {continueWatching.map((r) => (
              <Link
                key={r.id}
                href={`/library/resource/${r.id}`}
                className="press group flex w-56 shrink-0 flex-col gap-2 rounded-md border-2 border-ink bg-paper-2 p-4 shadow-[4px_4px_0_0_var(--brutal-shadow)]"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-ink-3">
                  <PlayMark size={13} className="text-accent" /> {r.trackLabel}
                </div>
                <div className="line-clamp-2 text-sm font-bold text-ink group-hover:underline">{r.title}</div>
                {r.durationSeconds != null && r.durationSeconds > 0 && (
                  <div className="h-2 w-full overflow-hidden rounded-sm border-2 border-ink bg-paper-3">
                    <div
                      className="h-full bg-accent"
                      style={{
                        width: `${Math.min(100, Math.round((r.lastPositionSeconds / r.durationSeconds) * 100))}%`,
                      }}
                    />
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search resources…"
          className="w-full rounded-md border-2 border-ink bg-paper-2 px-4 py-2.5 text-sm font-medium text-ink placeholder:text-ink-3 focus:outline-none"
        />

        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              className={clsx(
                "press-sm rounded-sm border-2 border-ink px-3 py-1.5 text-xs font-bold",
                status === f.value ? "bg-accent text-accent-ink" : "bg-paper-2 text-ink-2"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setTrackId("all")}
            className={clsx(
              "press-sm rounded-sm border-2 border-ink px-3 py-1.5 text-xs font-bold",
              trackId === "all" ? "bg-ink text-paper" : "bg-paper-2 text-ink-2"
            )}
          >
            All courses
          </button>
          {tracks.map((t) => (
            <button
              key={t.id}
              onClick={() => setTrackId(t.id)}
              className={clsx(
                "press-sm rounded-sm border-2 border-ink px-3 py-1.5 text-xs font-bold",
                trackId === t.id ? "bg-ink text-paper" : "bg-paper-2 text-ink-2"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {formats.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setFormat("all")}
              className={clsx(
                "press-sm rounded-sm border-2 border-ink px-3 py-1.5 text-xs font-bold",
                format === "all" ? "bg-paper-3 text-ink" : "bg-paper text-ink-3"
              )}
            >
              All formats
            </button>
            {formats.map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={clsx(
                  "press-sm rounded-sm border-2 border-ink px-3 py-1.5 text-xs font-bold",
                  format === f ? "bg-paper-3 text-ink" : "bg-paper text-ink-3"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-ink-3">Sort:</span>
          {SORT_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => setSort(s.value)}
              className={clsx(
                "press-sm rounded-sm border-2 border-ink px-3 py-1.5 text-xs font-bold",
                sort === s.value ? "bg-ink text-paper" : "bg-paper-2 text-ink-2"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-md border-2 border-ink bg-paper-2 p-10 text-center shadow-[4px_4px_0_0_var(--brutal-shadow)]">
          <div className="font-bold text-ink">No resources match</div>
          <p className="mt-1 text-sm text-ink-2">Try clearing a filter or searching for something else.</p>
          <button
            onClick={() => {
              setQuery("");
              setStatus("all");
              setTrackId("all");
              setFormat("all");
            }}
            className="press-sm mt-4 rounded-md border-2 border-ink bg-paper px-4 py-2 text-sm font-bold text-ink shadow-[3px_3px_0_0_var(--brutal-shadow)]"
          >
            Clear filters
          </button>
        </div>
      ) : sort !== "course" ? (
        <div className="flex flex-col gap-2">
          {flatSorted.map((r, i) => {
            const Icon = ICONS[r.iconKey ?? "web"] ?? FALLBACK_ICON;
            return (
              <motion.div key={r.id} {...listReveal(i)}>
                <Link
                  href={`/library/resource/${r.id}`}
                  className="press group flex items-center gap-3 rounded-md border-2 border-ink bg-paper-2 px-4 py-3 shadow-[3px_3px_0_0_var(--brutal-shadow)]"
                >
                  <Icon size={18} className="shrink-0 text-ink-2" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold text-ink group-hover:underline">{r.title}</div>
                    <div className="truncate text-xs text-ink-3">{r.trackLabel} · {r.topicTitle}</div>
                  </div>
                  {r.length && <span className="shrink-0 text-xs font-bold text-ink-3">{r.length}</span>}
                  {r.secondsWatched > 0 && (
                    <span className="shrink-0 text-xs font-bold text-ink-3">{formatMinutes(r.secondsWatched)} watched</span>
                  )}
                  {r.status === "done" ? (
                    <CheckCircleMark size={16} className="shrink-0 text-success" />
                  ) : (
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-ink bg-paper-3" />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {grouped.map(([tid, track], trackIndex) => {
            const TrackIcon = ICONS[track.iconKey ?? tid] ?? FALLBACK_ICON;
            return (
              <section key={tid}>
                <div className="mb-4 flex items-center gap-2">
                  <TrackIcon size={18} className="text-accent" />
                  <h2 className="font-display text-lg font-bold text-ink">{track.label}</h2>
                </div>
                <div className="flex flex-col gap-5">
                  {[...track.topics.entries()].map(([topicId, topic], topicIndex) => (
                    <div key={topicId}>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">
                        {topic.title}
                      </div>
                      <div className="flex flex-col gap-2">
                        {topic.items.map((r, i) => {
                          const Icon = ICONS[r.iconKey ?? "web"] ?? FALLBACK_ICON;
                          return (
                            <motion.div key={r.id} {...listReveal(trackIndex + topicIndex + i)}>
                              <Link
                                href={`/library/resource/${r.id}`}
                                className="press group flex items-center gap-3 rounded-md border-2 border-ink bg-paper-2 px-4 py-3 shadow-[3px_3px_0_0_var(--brutal-shadow)]"
                              >
                                <Icon size={18} className="shrink-0 text-ink-2" />
                                <span className="min-w-0 flex-1 truncate font-bold text-ink group-hover:underline">
                                  {r.title}
                                </span>
                                {r.length && <span className="shrink-0 text-xs font-bold text-ink-3">{r.length}</span>}
                                {r.secondsWatched > 0 && (
                                  <span className="shrink-0 text-xs font-bold text-ink-3">{formatMinutes(r.secondsWatched)} watched</span>
                                )}
                                {r.status === "done" ? (
                                  <CheckCircleMark size={16} className="shrink-0 text-success" />
                                ) : (
                                  <span className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-ink bg-paper-3" />
                                )}
                              </Link>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
