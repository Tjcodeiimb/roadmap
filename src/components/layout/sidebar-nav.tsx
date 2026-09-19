"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import clsx from "clsx";
import { LayoutDashboard, UserRound, ShieldCheck } from "lucide-react";
import { ICONS, FALLBACK_ICON, RepeatMark, TrophyMark, CompassMark, StackMark, TargetMark, ArticleMark } from "@/components/icons";
import { uiTransition } from "@/lib/motion";
import { trackColor, trackInk } from "@/lib/track-colors";
import { CourseSwitcherTrigger } from "./course-switcher";

export interface NavTrack {
  id: string;
  label: string;
}

export function SidebarNav({
  tracks,
  reviewCount,
  isAdmin,
  leaderboardEnabled,
  onOpenSwitcher,
}: {
  tracks: NavTrack[];
  reviewCount: number;
  isAdmin: boolean;
  leaderboardEnabled: boolean;
  onOpenSwitcher: () => void;
}) {
  const pathname = usePathname();

  const mainItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/marketplace", label: "Marketplace", icon: CompassMark },
    { href: "/library", label: "Library", icon: StackMark },
  ];

  const courseItems = tracks.map((t) => ({
    href: `/track/${t.id}`,
    label: t.label,
    icon: ICONS[t.id] ?? FALLBACK_ICON,
    trackId: t.id,
  }));

  const toolItems = [
    { href: "/review", label: "Review", icon: RepeatMark, badge: reviewCount },
    { href: "/skills", label: "Skills", icon: TargetMark },
    { href: "/resume", label: "Resume", icon: ArticleMark },
    { href: "/profile", label: "Profile", icon: UserRound },
    ...(leaderboardEnabled ? [{ href: "/leaderboard", label: "Leaderboard", icon: TrophyMark }] : []),
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: ShieldCheck }] : []),
  ];

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

  return (
    <nav className="flex flex-col gap-1">
      <div className="mb-2 px-0.5">
        <CourseSwitcherTrigger onOpen={onOpenSwitcher} />
      </div>

      {mainItems.map(renderItem)}

      {courseItems.length > 0 && (
        <>
          <div className="mt-3 mb-1 flex items-center gap-2 px-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-ink-3">My Courses</span>
            <div className="flex-1 border-t-2 border-ink/10" />
          </div>
          {courseItems.map(renderItem)}
        </>
      )}

      <div className="mt-3 mb-1 flex items-center gap-2 px-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-ink-3">Tools</span>
        <div className="flex-1 border-t-2 border-ink/10" />
      </div>
      {toolItems.map(renderItem)}
    </nav>
  );
}
