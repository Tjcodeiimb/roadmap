"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, BookOpen, FileText, Link2, Sparkles, Layers } from "lucide-react";
import { ICONS, FALLBACK_ICON } from "@/components/icons";
import { overlayVariants, uiTransition } from "@/lib/motion";
import { searchCatalog, type SearchResult } from "@/app/actions/search";
import type { NavTrack } from "./sidebar-nav";

/** Trigger button — safe to render more than once (desktop aside + mobile drawer); all instances share one modal via `onOpen`. */
export function CourseSwitcherTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="press-sm flex w-full items-center gap-2.5 rounded-md border-2 border-ink bg-paper px-3 py-2.5 text-left text-sm font-bold text-ink-2 shadow-[3px_3px_0_0_var(--brutal-shadow)] hover:text-ink"
    >
      <Search size={15} />
      <span className="flex-1">Search</span>
      <span className="hidden rounded-sm border-2 border-ink bg-paper-2 px-1.5 py-0.5 text-[10px] font-bold text-ink-3 sm:inline">
        ⌘K
      </span>
    </button>
  );
}

interface ListItem {
  key: string;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  snippet?: string | null;
  go: () => void;
}

const TYPE_ICON: Record<SearchResult["type"], React.ComponentType<{ size?: number }>> = {
  track: BookOpen,
  cohort: Layers,
  topic: FileText,
  resource: Link2,
  skill: Sparkles,
};

const TYPE_LABEL: Record<SearchResult["type"], string> = {
  track: "Courses",
  cohort: "Cohorts",
  topic: "Topics",
  resource: "Resources",
  skill: "Skills",
};

/** The modal itself — mount exactly once (e.g. in AppShell), state owned by the parent. */
export function CourseSwitcherModal({
  tracks,
  open,
  onClose,
}: {
  tracks: NavTrack[];
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const trackFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tracks;
    return tracks.filter((t) => t.label.toLowerCase().includes(q));
  }, [tracks, query]);

  const searching = query.trim().length >= 2;

  // Dropping back below the search threshold clears stale results — a
  // derived reset done during render (matching the prevOpen/prevQuery
  // pattern below), not in the effect, which should only ever set state
  // from inside its async callback.
  const [prevSearching, setPrevSearching] = useState(searching);
  if (searching !== prevSearching) {
    setPrevSearching(searching);
    if (!searching) setResults([]);
  }

  // Debounced server search once the query is long enough to be worth a
  // round-trip; below that, the instant local track filter above covers it.
  useEffect(() => {
    if (!searching) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchCatalog(query).then(setResults);
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, searching]);

  function go(item: ListItem) {
    onClose();
    item.go();
  }

  const items: ListItem[] = searching
    ? results.map((r) => ({
        key: `${r.type}-${r.id}`,
        icon: TYPE_ICON[r.type],
        label: r.title,
        snippet: r.snippet,
        go: () => {
          if (r.type === "track") router.push(`/track/${r.id}`);
          else if (r.type === "topic" && r.parentTrackId) router.push(`/track/${r.parentTrackId}/topic/${r.id}`);
          else if (r.type === "resource" && r.parentTrackId) router.push(`/track/${r.parentTrackId}/resource/${r.id}`);
          else if (r.type === "cohort") router.push(`/marketplace/cohort/${r.id}`);
          else router.push("/skills");
        },
      }))
    : trackFiltered.map((t) => ({
        key: t.id,
        icon: ICONS[t.id] ?? FALLBACK_ICON,
        label: t.label,
        go: () => router.push(`/track/${t.id}`),
      }));

  // Reset search + selection when the modal transitions closed -> open, and
  // whenever the query changes. Done during render (not in an effect) per
  // React's "adjusting state when a prop changes" pattern, since these are
  // derived resets rather than a sync with an external system.
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevQuery, setPrevQuery] = useState(query);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setQuery("");
      setPrevQuery("");
      setActiveIndex(0);
    }
  } else if (query !== prevQuery) {
    setPrevQuery(query);
    setActiveIndex(0);
  }

  // Focusing the input is a real side effect on the DOM, so this one stays
  // an effect — it just never calls setState itself.
  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  function onListKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[activeIndex];
      if (item) go(item);
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  // Group by type only in search mode — the empty-query track list stays a
  // flat list, matching the original "jump to a course" behavior.
  const grouped = searching
    ? results.reduce<Record<string, number[]>>((acc, r, i) => {
        (acc[r.type] ??= []).push(i);
        return acc;
      }, {})
    : null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/40"
          />
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={uiTransition}
            className="fixed inset-x-0 top-24 z-[70] mx-auto w-full max-w-md px-4"
          >
            <div className="card-shadow overflow-hidden rounded-md border-2 border-ink bg-paper-2">
              <div className="flex items-center gap-2.5 border-b-2 border-ink px-4 py-3">
                <Search size={16} className="text-ink-3" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onListKeyDown}
                  placeholder="Search courses, topics, resources…"
                  className="flex-1 bg-transparent text-sm font-medium text-ink outline-none placeholder:text-ink-3"
                />
                <button onClick={onClose} aria-label="Close" className="text-ink-3 hover:text-ink">
                  <X size={16} />
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto scrollbar-thin p-2">
                {items.length === 0 && (
                  <div className="px-3 py-6 text-center text-sm text-ink-3">
                    {searching ? "No matches." : "No courses match."}
                  </div>
                )}
                {grouped
                  ? (Object.keys(TYPE_LABEL) as SearchResult["type"][])
                      .filter((type) => grouped[type]?.length)
                      .map((type) => (
                        <div key={type} className="mb-1">
                          <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink-3">
                            {TYPE_LABEL[type]}
                          </div>
                          {grouped[type].map((i) => (
                            <ResultRow
                              key={items[i].key}
                              item={items[i]}
                              active={i === activeIndex}
                              onHover={() => setActiveIndex(i)}
                              onClick={() => go(items[i])}
                            />
                          ))}
                        </div>
                      ))
                  : items.map((item, i) => (
                      <ResultRow
                        key={item.key}
                        item={item}
                        active={i === activeIndex}
                        onHover={() => setActiveIndex(i)}
                        onClick={() => go(item)}
                      />
                    ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ResultRow({
  item,
  active,
  onHover,
  onClick,
}: {
  item: ListItem;
  active: boolean;
  onHover: () => void;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      className={`flex w-full items-center gap-3 rounded-md border-2 px-3 py-2.5 text-left text-sm font-bold transition-colors ${
        active ? "border-ink bg-accent text-accent-ink" : "border-transparent text-ink-2"
      }`}
    >
      <Icon size={17} />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
    </button>
  );
}

/** Global ⌘K listener — call once from the component that owns the open/close state. */
export function useCourseSwitcherShortcut(toggle: () => void) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);
}
