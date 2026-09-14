"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  Sparkles,
  LineChart,
  Users,
  RefreshCcw,
  UserRound,
  Trophy,
  ShieldCheck,
} from "lucide-react";

const TRACK_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  ai: Sparkles,
  finance: LineChart,
  consulting: Users,
};

export interface NavTrack {
  id: string;
  label: string;
}

export function SidebarNav({
  tracks,
  reviewCount,
  isAdmin,
  leaderboardEnabled,
}: {
  tracks: NavTrack[];
  reviewCount: number;
  isAdmin: boolean;
  leaderboardEnabled: boolean;
}) {
  const pathname = usePathname();

  const items = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ...tracks.map((t) => ({
      href: `/track/${t.id}`,
      label: t.label,
      icon: TRACK_ICONS[t.id] ?? Sparkles,
    })),
    { href: "/review", label: "Review", icon: RefreshCcw, badge: reviewCount },
    { href: "/profile", label: "Profile", icon: UserRound },
    ...(leaderboardEnabled ? [{ href: "/leaderboard", label: "Leaderboard", icon: Trophy }] : []),
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: ShieldCheck }] : []),
  ];

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150",
              active ? "bg-accent-soft text-accent" : "text-ink-2 hover:bg-paper-2 hover:text-ink"
            )}
          >
            <Icon size={18} />
            <span className="flex-1">{item.label}</span>
            {"badge" in item && item.badge ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-accent-ink">
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
