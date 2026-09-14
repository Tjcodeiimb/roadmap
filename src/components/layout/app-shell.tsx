"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, LogOut } from "lucide-react";
import { SidebarNav, type NavTrack } from "@/components/layout/sidebar-nav";
import { XPWidget } from "@/components/layout/xp-widget";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { signOut } from "@/app/actions/auth";

export function AppShell({
  tracks,
  reviewCount,
  isAdmin,
  leaderboardEnabled,
  xp,
  streak,
  theme,
  fullName,
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
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="hidden w-64 shrink-0 flex-col gap-6 border-r border-border bg-paper-2/60 p-5 md:flex">
        <Brand />
        <SidebarNav tracks={tracks} reviewCount={reviewCount} isAdmin={isAdmin} leaderboardEnabled={leaderboardEnabled} />
        <div className="mt-auto flex flex-col gap-3">
          <XPWidget xp={xp} streak={streak} />
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="truncate text-sm text-ink-2">{fullName ?? "You"}</span>
            <div className="flex items-center gap-1.5">
              <ThemeToggle initialTheme={theme} />
              <form action={signOut}>
                <button
                  type="submit"
                  aria-label="Sign out"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-paper-2 text-ink-2 transition-colors hover:text-ink"
                >
                  <LogOut size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-paper/80 px-4 py-3 backdrop-blur md:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border"
          >
            <Menu size={18} />
          </button>
          <Brand compact />
          <ThemeToggle initialTheme={theme} />
        </header>

        <main className="flex-1 px-4 py-6 md:px-10 md:py-10">{children}</main>
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
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col gap-6 bg-paper-2 p-5 shadow-2xl md:hidden"
            >
              <div className="flex items-center justify-between">
                <Brand />
                <button
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border"
                >
                  <X size={18} />
                </button>
              </div>
              <div onClick={() => setDrawerOpen(false)}>
                <SidebarNav tracks={tracks} reviewCount={reviewCount} isAdmin={isAdmin} leaderboardEnabled={leaderboardEnabled} />
              </div>
              <div className="mt-auto flex flex-col gap-3">
                <XPWidget xp={xp} streak={streak} />
                <form action={signOut}>
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium text-ink-2"
                  >
                    <LogOut size={16} /> Sign out
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function Brand({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-xs font-bold text-accent-ink">
        UF
      </div>
      {!compact && <span className="font-display text-sm font-bold text-ink">UpForge Learning</span>}
    </div>
  );
}
