"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Bell, Network, Activity, Settings, Download, Sparkles, Calendar, Brain, Flame, TreePine } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGameStats } from "@/hooks/useGameStats";

const navItems = [
  {
    href: "/",
    label: "Contacts",
    icon: Users,
    activeColor: "text-blue-600",
    inactiveColor: "text-gray-600",
  },
  {
    href: "/import",
    label: "Import",
    icon: Download,
    activeColor: "text-purple-600",
    inactiveColor: "text-gray-600",
  },
  {
    href: "/ai-batch",
    label: "AI Batch",
    icon: Sparkles,
    activeColor: "text-purple-600",
    inactiveColor: "text-gray-600",
  },
  {
    href: "/reminders",
    label: "Reminders",
    icon: Bell,
    activeColor: "text-yellow-600",
    inactiveColor: "text-gray-600",
  },
  {
    href: "/practice",
    label: "Practice",
    icon: Brain,
    activeColor: "text-indigo-600",
    inactiveColor: "text-gray-600",
    isGame: true,
  },
  {
    href: "/network",
    label: "Network",
    icon: Network,
    activeColor: "text-gray-600",
    inactiveColor: "text-gray-600",
  },
  {
    href: "/relationship-tree",
    label: "Tree",
    icon: TreePine,
    activeColor: "text-green-600",
    inactiveColor: "text-gray-600",
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: Activity,
    activeColor: "text-purple-600",
    inactiveColor: "text-gray-600",
  },
  {
    href: "/meeting-prep",
    label: "Meeting Prep",
    icon: Calendar,
    activeColor: "text-purple-600",
    inactiveColor: "text-gray-600",
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    activeColor: "text-gray-600",
    inactiveColor: "text-gray-600",
  },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { stats } = useGameStats();

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col z-40 shadow-sm">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">ReMember Me</h2>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            const showStreak = item.isGame && stats.currentStreak > 0;

            return (
            <Link
                key={item.href}
                href={item.href}
                className={cn(
                "flex items-center justify-between px-4 py-3 rounded-lg transition-colors group",
                isActive
                    ? `${item.activeColor} dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30`
                    : `${item.inactiveColor} dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700`
                )}
            >
                <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                </div>
                {showStreak && (
                    <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 group-hover:bg-white transition-colors">
                        <Flame size={12} className="fill-orange-500" /> {stats.currentStreak}
                    </span>
                )}
            </Link>
            );
        })}
      </nav>
    </aside>
  );
}
