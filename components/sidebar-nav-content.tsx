"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Bell, Activity, Settings, Sparkles, Calendar, Brain, Flame, TreePine, ShieldAlert } from "lucide-react";
import { NetworkIcon } from "./icons/NetworkIcon";
import { cn } from "@/lib/utils";
import { useGameStats } from "@/hooks/useGameStats";
import { useWeeklyBloom } from "@/hooks/useWeeklyBloom";

const navGroups = [
  // Group 1: Core
  [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: Activity,
      inactiveColor: "text-gray-600",
    },
    {
      href: "/",
      label: "People",
      icon: Users,
      inactiveColor: "text-gray-600",
    },
    {
      href: "/meeting-prep",
      label: "Meeting Prep",
      icon: Calendar,
      inactiveColor: "text-gray-600",
    },
  ],
  // Group 2: Network Intelligence
  [
    {
      href: "/garden",
      label: "Garden",
      icon: TreePine,
      inactiveColor: "text-gray-600",
    },
    {
      href: "/network",
      label: "Network",
      icon: NetworkIcon,
      inactiveColor: "text-gray-600",
    },
    {
      href: "/ai-batch",
      label: "AI Batch",
      icon: Sparkles,
      inactiveColor: "text-gray-600",
    },
  ],
  // Group 3: Utility & Personal
  [
    {
      href: "/practice",
      label: "Practice",
      icon: Brain,
      inactiveColor: "text-gray-600",
      isGame: true,
    },
    {
      href: "/reminders",
      label: "Reminders",
      icon: Bell,
      inactiveColor: "text-gray-600",
    },
    {
      href: "/settings",
      label: "Settings",
      icon: Settings,
      inactiveColor: "text-gray-600",
    },
    {
      href: "/admin/dashboard",
      label: "Command Center",
      icon: ShieldAlert,
      inactiveColor: "text-gray-600",
    },
  ],
];

interface SidebarNavContentProps {
  onNavItemClick?: () => void;
}

export function SidebarNavContent({ onNavItemClick }: SidebarNavContentProps) {
  const pathname = usePathname();
  const { stats } = useGameStats();
  const { bloom } = useWeeklyBloom();

  const showNetworkBadge = bloom && !bloom.is_viewed;

  return (
    <nav className="flex-1 p-4 overflow-y-auto scrollbar-hide">
      {navGroups.map((group, groupIndex) => (
        <div key={groupIndex} className="mb-2">
          <div className="space-y-1">
            {group.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              const showStreak = item.isGame && stats.currentStreak > 0;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavItemClick}
                  className={cn(
                    "group relative flex min-h-11 items-center justify-between overflow-hidden rounded-lg px-3 py-2.5 transition-all duration-200 active:opacity-80",
                    isActive
                      ? "text-sidebar-primary-foreground font-medium shadow-lg shadow-purple-900/10"
                      : "text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent"
                  )}
                >
                   {isActive && (
                    <div className="absolute inset-0 bg-sidebar-primary opacity-100 z-0" />
                  )}
                  
                  <div className="flex items-center gap-3 relative z-10">
                    <Icon className={cn("size-4 shrink-0", isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/60 group-hover:text-sidebar-primary")} />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  
                  {item.label === "Network" && showNetworkBadge && (
                    <span className="relative z-10 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                  
                  {showStreak && (
                    <span className="relative z-10 flex items-center gap-1 text-[10px] font-bold text-orange-500 bg-orange-950/30 px-1.5 py-0.5 rounded-full border border-orange-500/20 group-hover:border-orange-500/40 transition-colors">
                      <Flame size={10} className="fill-orange-500" /> {stats.currentStreak}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
          {/* Divider between groups, but not after the last one */}
          {groupIndex < navGroups.length - 1 && (
            <div className="my-2 py-1 mx-2">
              <div className="h-px bg-sidebar-border" />
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}
