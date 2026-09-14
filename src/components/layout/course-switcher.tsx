"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { ICONS, FALLBACK_ICON } from "@/components/icons";
import { overlayVariants, uiTransition } from "@/lib/motion";
import type { NavTrack } from "./sidebar-nav";

/** Trigger button — safe to render more than once (desktop aside + mobile drawer); all instances share one modal via `onOpen`. */
export function CourseSwitcherTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center gap-2.5 rounded-xl border border-border bg-paper px-3 py-2.5 text-left text-sm text-ink-2 transition-colors hover:bg-paper-3"
    >
      <Search size={15} />
      <span className="flex-1">Switch course</span>
      <span className="hidden rounded-md border border-border bg-paper-2 px-1.5 py-0.5 text-[10px] font-medium text-ink-3 sm:inline">
        ⌘K
      </span>
    </button>
  );
}

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
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tracks;
    return tracks.filter((t) => t.label.toLowerCase().includes(q));
  }, [tracks, query]);

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

  function go(trackId: string) {
    onClose();
    router.push(`/track/${trackId}`);
  }

  function onListKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const track = filtered[activeIndex];
      if (track) go(track.id);
    } else if (e.key === "Escape") {
      onClose();
    }
  }

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
            <div className="card-shadow overflow-hidden rounded-2xl border border-border bg-paper-2">
              <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
                <Search size={16} className="text-ink-3" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onListKeyDown}
                  placeholder="Jump to a course…"
                  className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-3"
                />
                <button onClick={onClose} aria-label="Close" className="text-ink-3 hover:text-ink">
                  <X size={16} />
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto scrollbar-thin p-2">
                {filtered.length === 0 && (
                  <div className="px-3 py-6 text-center text-sm text-ink-3">No courses match.</div>
                )}
                {filtered.map((t, i) => {
                  const Icon = ICONS[t.id] ?? FALLBACK_ICON;
                  return (
                    <button
                      key={t.id}
                      onClick={() => go(t.id)}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                        i === activeIndex ? "bg-accent-soft text-accent" : "text-ink-2"
                      }`}
                    >
                      <Icon size={17} />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
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
