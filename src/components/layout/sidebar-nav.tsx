"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import clsx from "clsx";
import { LayoutDashboard, UserRound, ShieldCheck, Check } from "lucide-react";
import { ICONS, FALLBACK_ICON, TrophyMark, CompassMark, TargetMark, ArticleMark, StackMark } from "@/components/icons";
import { uiTransition } from "@/lib/motion";
import { trackColor, trackInk } from "@/lib/track-colors";
import { unenrollTracks } from "@/app/actions/enrollment";
import { useToast } from "@/components/ui/toast";
import { CourseSwitcherTrigger } from "./course-switcher";

export interface NavTrack {
  id: string;
  label: string;
}

export function SidebarNav({
  tracks,
  isAdmin,
  leaderboardEnabled,
  onOpenSwitcher,
}: {
  tracks: NavTrack[];
  isAdmin: boolean;
  leaderboardEnabled: boolean;
  onOpenSwitcher: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();
  const [managing, setManaging] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  const mainItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/marketplace", label: "Marketplace", icon: CompassMark },
  ];

  const courseItems = tracks.map((t) => ({
    href: `/track/${t.id}`,
    label: t.label,
    icon: ICONS[t.id] ?? FALLBACK_ICON,
    trackId: t.id,
  }));

  const toolItems = [
    { href: "/courses", label: "Manage courses", icon: StackMark },
    { href: "/skills", label: "Skills", icon: TargetMark },
    { href: "/resume", label: "Resume", icon: ArticleMark },
    { href: "/profile", label: "Profile", icon: UserRound },
    ...(leaderboardEnabled ? [{ href: "/leaderboard", label: "Leaderboard", icon: TrophyMark }] : []),
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: ShieldCheck }] : []),
  ];

  function stopManaging() {
    setManaging(false);
    setSelected([]);
    setConfirming(false);
  }

  function toggle(trackId: string) {
    setConfirming(false);
    setSelected((s) => (s.includes(trackId) ? s.filter((id) => id !== trackId) : [...s, trackId]));
  }

  function leaveSelected() {
    const leaving = selected;
    startTransition(async () => {
      const result = await unenrollTracks(leaving);
      if (result?.error) {
        showToast(result.error);
        return;
      }
      showToast(`Left ${result.left} course${result.left === 1 ? "" : "s"} — progress saved`);
      stopManaging();
      // Don't strand the reader on a course they just left.
      if (leaving.some((id) => pathname.startsWith(`/track/${id}`))) router.push("/dashboard");
      router.refresh();
    });
  }

  type NavItem = { href: string; label: string; icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>; trackId?: string; badge?: number };
  const renderItem = (item: NavItem) => {
    const active = pathname === item.href || pathname.startsWith(item.href + "/");
    const Icon = item.icon;
    const trackId = item.trackId;
    const color = trackId ? trackColor(trackId) : "var(--accent)";
    const ink = trackId ? trackInk(trackId) : "var(--accent-ink)";
    return (
      <Link
        key={item.href}
        href={item.href}
        className={clsx(
          "group relative flex items-center gap-3 rounded-md border-2 px-3 py-2.5 text-sm font-bold transition-colors duration-150",
          active ? "border-ink" : "border-transparent text-ink-2 hover:border-ink hover:text-ink"
        )}
        style={active ? { color: ink } : undefined}
      >
        {active && (
          <motion.div
            layoutId="sidebar-active-pill"
            className="absolute inset-0 rounded-md"
            style={{ backgroundColor: color }}
            transition={uiTransition}
          />
        )}
        <Icon
          size={18}
          className="relative z-10 transition-transform duration-150 group-hover:scale-110 group-hover:rotate-3"
          style={!active && trackId ? { color } : undefined}
        />
        <span className="relative z-10 flex-1 truncate">{item.label}</span>
        {item.badge ? (
          <span className="relative z-10 flex h-5 min-w-5 items-center justify-center rounded-sm border-2 border-ink bg-accent px-1.5 text-[11px] font-bold text-accent-ink">
            {item.badge}
          </span>
        ) : null}
      </Link>
    );
  };

  /** Same row, but it selects instead of navigating. */
  const renderSelectableItem = (item: NavItem & { trackId: string }) => {
    const Icon = item.icon;
    const color = trackColor(item.trackId);
    const on = selected.includes(item.trackId);
    return (
      <button
        key={item.href}
        type="button"
        onClick={() => toggle(item.trackId)}
        aria-pressed={on}
        className={clsx(
          "flex w-full items-center gap-3 rounded-md border-2 px-3 py-2.5 text-left text-sm font-bold transition-colors duration-150",
          on ? "border-ink bg-paper-3 text-ink" : "border-transparent text-ink-2 hover:border-ink hover:text-ink"
        )}
      >
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border-2 border-ink"
          style={on ? { backgroundColor: color, color: trackInk(item.trackId) } : { backgroundColor: "var(--paper)" }}
        >
          {on && <Check size={13} strokeWidth={3.5} />}
        </span>
        <Icon size={18} style={{ color }} />
        <span className="flex-1 truncate">{item.label}</span>
      </button>
    );
  };

  return (
    <nav className="flex flex-col gap-1">
      <div className="mb-2 px-0.5">
        <CourseSwitcherTrigger onOpen={onOpenSwitcher} />
      </div>

      {mainItems.map(renderItem)}

      {courseItems.length > 0 && (
        // In the mobile drawer this whole nav sits inside an onClick that closes
        // the drawer; managing courses must not close it mid-selection.
        <div onClick={(e) => managing && e.stopPropagation()} className="flex flex-col gap-1">
          <div className="mt-3 mb-1 flex items-center gap-2 px-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-ink-3">My Courses</span>
            <div className="flex-1 border-t-2 border-ink/10" />
            {/* A bordered chip, not a word in the label row: this is the only
                entry point to leaving several courses at once, and as plain
                underlined text it read as part of the "My Courses" heading. */}
            <button
              type="button"
              onClick={() => (managing ? stopManaging() : setManaging(true))}
              className={clsx(
                "press-sm rounded-sm border-2 border-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest shadow-[2px_2px_0_0_var(--brutal-shadow)]",
                managing ? "bg-accent text-accent-ink" : "bg-paper text-ink-2 hover:text-ink"
              )}
            >
              {managing ? "Done" : "Manage"}
            </button>
          </div>

          {managing ? courseItems.map(renderSelectableItem) : courseItems.map(renderItem)}

          {managing && (
            <div className="mt-2 flex flex-col gap-2 rounded-md border-2 border-ink bg-paper p-2.5 shadow-[3px_3px_0_0_var(--brutal-shadow)]">
              {confirming ? (
                <>
                  <p className="text-xs font-medium text-ink-2">
                    Leave {selected.length} course{selected.length === 1 ? "" : "s"}? Your progress, XP and skills are kept —
                    you can re-enroll any time.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={leaveSelected}
                      disabled={pending}
                      className="press-sm flex-1 rounded-sm border-2 border-ink bg-danger px-2.5 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                    >
                      {pending ? "Leaving…" : "Confirm"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirming(false)}
                      className="press-sm rounded-sm border-2 border-ink bg-paper-3 px-2.5 py-1.5 text-xs font-bold text-ink-2"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-ink-3">
                      {selected.length} selected
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelected(selected.length === courseItems.length ? [] : courseItems.map((c) => c.trackId))}
                      className="text-[11px] font-bold text-ink-3 underline decoration-2 underline-offset-2 hover:text-ink"
                    >
                      {selected.length === courseItems.length ? "Clear all" : "Select all"}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirming(true)}
                    disabled={selected.length === 0}
                    className="press-sm rounded-sm border-2 border-ink bg-paper-2 px-2.5 py-1.5 text-xs font-bold text-danger disabled:opacity-40"
                  >
                    Leave selected
                  </button>
                  <Link
                    href="/courses"
                    onClick={stopManaging}
                    className="text-[11px] font-bold text-ink-3 underline decoration-2 underline-offset-2 hover:text-ink"
                  >
                    Bundles &amp; more options
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-3 mb-1 flex items-center gap-2 px-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-ink-3">Tools</span>
        <div className="flex-1 border-t-2 border-ink/10" />
      </div>
      {toolItems.map(renderItem)}
    </nav>
  );
}
