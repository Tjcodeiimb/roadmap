"use client";

import { useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { Menu, X, LogOut } from "lucide-react";
import { SidebarNav, type NavTrack } from "@/components/layout/sidebar-nav";
import { CourseSwitcherModal, useCourseSwitcherShortcut } from "@/components/layout/course-switcher";
import { XPWidget } from "@/components/layout/xp-widget";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { signOut } from "@/app/actions/auth";
import { SkillUnlockQueue } from "@/components/skills/skill-unlock-queue";
import type { PendingSkillUnlock } from "@/lib/queries";

export function AppShell({
  tracks,
  reviewCount,
  isAdmin,
  leaderboardEnabled,
  xp,
  streak,
  theme,
  fullName,
  username,
  pendingSkillUnlocks,
  children,
}: {
  tracks: NavTrack[];
  reviewCount: number;
  isAdmin: boolean;
  leaderboardEnabled: boolean;
  xp: number;
  streak: number;
  theme: "light" | "dark";
  fullName: string | null;
  username: string | null;
  pendingSkillUnlocks: PendingSkillUnlock[];
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  useCourseSwitcherShortcut(() => setSwitcherOpen((o) => !o));

  return (
    <MotionConfig reducedMotion="user">
      {/* app-canvas here so the fixed ::before grid pseudo-element is a sibling
          of both the aside and main — the > * rule gives both z-index 1 so
          they sit above the grid rather than having the grid bleed through. */}
      <div className="app-canvas flex min-h-screen bg-paper">
        <aside className="sticky top-0 z-[1] hidden h-screen w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r-2 border-ink bg-paper-2 p-5 md:flex">
          <Brand />
          <SidebarNav tracks={tracks} reviewCount={reviewCount} isAdmin={isAdmin} leaderboardEnabled={leaderboardEnabled} onOpenSwitcher={() => setSwitcherOpen(true)} />
          <div className="mt-auto flex flex-col gap-3">
            <XPWidget xp={xp} streak={streak} />
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-ink">{fullName ?? "You"}</div>
                {username && <div className="truncate font-mono text-[11px] text-ink-3">@{username}</div>}
              </div>
              <div className="flex items-center gap-1.5">
                <ThemeToggle initialTheme={theme} />
                <form action={signOut}>
                  <button
                    type="submit"
                    aria-label="Sign out"
                    className="press-sm flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-paper-2 text-ink-2 shadow-[3px_3px_0_0_var(--brutal-shadow)] hover:text-ink"
                  >
                    <LogOut size={16} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="flex items-center justify-between border-b-2 border-ink bg-paper px-4 py-3 md:hidden">
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="press-sm flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink shadow-[3px_3px_0_0_var(--brutal-shadow)]"
            >
              <Menu size={18} />
            </button>
            <Brand compact />
            <ThemeToggle initialTheme={theme} />
          </header>

          <main className="relative flex-1 px-4 py-6 md:px-10 md:py-10">{children}</main>
        </div>

        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDrawerOpen(false)}
                className="fixed inset-0 z-40 bg-black/30 md:hidden"
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 32 }}
                className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col gap-6 border-r-2 border-ink bg-paper-2 p-5 shadow-[8px_0_0_0_var(--brutal-shadow)] md:hidden"
              >
                <div className="flex items-center justify-between">
                  <Brand />
                  <button
                    onClick={() => setDrawerOpen(false)}
                    aria-label="Close menu"
                    className="press-sm flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink shadow-[3px_3px_0_0_var(--brutal-shadow)]"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div onClick={() => setDrawerOpen(false)}>
                  <SidebarNav tracks={tracks} reviewCount={reviewCount} isAdmin={isAdmin} leaderboardEnabled={leaderboardEnabled} onOpenSwitcher={() => setSwitcherOpen(true)} />
                </div>
                <div className="mt-auto flex flex-col gap-3">
                  <XPWidget xp={xp} streak={streak} />
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="press-sm flex w-full items-center justify-center gap-2 rounded-md border-2 border-ink bg-paper py-2.5 text-sm font-bold text-ink shadow-[3px_3px_0_0_var(--brutal-shadow)]"
                    >
                      <LogOut size={16} /> Sign out
                    </button>
                  </form>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <CourseSwitcherModal tracks={tracks} open={switcherOpen} onClose={() => setSwitcherOpen(false)} />
        <SkillUnlockQueue pending={pendingSkillUnlocks} />
      </div>
    </MotionConfig>
  );
}

function Brand({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-ink bg-accent text-xs font-extrabold text-accent-ink shadow-[2px_2px_0_0_var(--brutal-shadow)]">
        UF
      </div>
      {!compact && <span className="font-display text-sm font-bold text-ink">UpForge Learning</span>}
    </div>
  );
}
