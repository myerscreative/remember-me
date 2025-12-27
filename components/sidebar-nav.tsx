"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Bell, Network, Activity, Settings, Sparkles, Calendar, Brain, Flame, TreePine } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGameStats } from "@/hooks/useGameStats";

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
      label: "Contacts",
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
      icon: Network,
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
  ],
];

export function SidebarNav() {
  const pathname = usePathname();
  const { stats } = useGameStats();

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-slate-950 border-r border-slate-800/50 flex-col z-40 shadow-xl">
      <div className="p-6 border-b border-slate-800/50">
        <h2 className="text-xl font-bold bg-linear-to-r from-white to-gray-400 bg-clip-text text-transparent">ReMember Me</h2>
      </div>
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
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden",
                      isActive
                        ? "text-white font-medium shadow-lg shadow-purple-900/20"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    )}
                  >
                     {isActive && (
                      <div className="absolute inset-0 bg-linear-to-r from-purple-600 to-indigo-600 opacity-100 z-0" />
                    )}
                    
                    <div className="flex items-center gap-3 relative z-10">
                      <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-slate-500 group-hover:text-white")} />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    
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
                <div className="h-px bg-slate-800/60" />
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
