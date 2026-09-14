"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import clsx from "clsx";
import { LayoutDashboard, UserRound, ShieldCheck } from "lucide-react";
import { ICONS, FALLBACK_ICON, RepeatMark, TrophyMark, CompassMark, StackMark, TargetMark } from "@/components/icons";
import { uiTransition } from "@/lib/motion";
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

  const items = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/marketplace", label: "Marketplace", icon: CompassMark },
    { href: "/library", label: "Library", icon: StackMark },
    ...tracks.map((t) => ({
      href: `/track/${t.id}`,
      label: t.label,
      icon: ICONS[t.id] ?? FALLBACK_ICON,
    })),
    { href: "/review", label: "Review", icon: RepeatMark, badge: reviewCount },
    { href: "/skills", label: "Skills", icon: TargetMark },
    { href: "/profile", label: "Profile", icon: UserRound },
    ...(leaderboardEnabled ? [{ href: "/leaderboard", label: "Leaderboard", icon: TrophyMark }] : []),
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: ShieldCheck }] : []),
  ];

  return (
    <nav className="flex flex-col gap-1">
      <div className="mb-1 px-0.5">
        <CourseSwitcherTrigger onOpen={onOpenSwitcher} />
      </div>
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150",
              active ? "text-accent" : "text-ink-2 hover:bg-paper-2 hover:text-ink"
            )}
          >
            {active && (
              <motion.div
                layoutId="sidebar-active-pill"
                className="absolute inset-0 rounded-xl bg-accent-soft"
                transition={uiTransition}
              />
            )}
            <Icon size={18} className="relative z-10" />
            <span className="relative z-10 flex-1">{item.label}</span>
            {"badge" in item && item.badge ? (
              <span className="relative z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-accent-ink">
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
