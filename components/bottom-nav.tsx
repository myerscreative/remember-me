"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Bell, Activity, Search, Calendar, Brain } from "lucide-react";
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
    href: "/practice",
    label: "Practice",
    icon: Brain,
    activeColor: "text-indigo-600",
    inactiveColor: "text-gray-600",
    isGame: true,
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: Activity,
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
    href: "/meeting-prep",
    label: "Meet Prep",
    icon: Calendar,
    activeColor: "text-purple-600",
    inactiveColor: "text-gray-600",
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const { stats } = useGameStats();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:hidden pb-safe">
      <div className="flex items-center justify-around h-16 max-w-7xl mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const showStreak = item.isGame && stats.currentStreak > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors relative",
                isActive ? `${item.activeColor} dark:text-blue-400` : `${item.inactiveColor} dark:text-gray-400`
              )}
            >
              <div className="relative">
                  <Icon className="h-5 w-5" />
                  {showStreak && (
                      <div className="absolute -top-1 -right-2 bg-orange-500 text-white text-[9px] font-bold px-1 rounded-full border border-white">
                          🔥{stats.currentStreak}
                      </div>
                  )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
