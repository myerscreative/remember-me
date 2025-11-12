"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Bell, Network, Lightbulb, Settings, Download } from "lucide-react";
import { cn } from "@/lib/utils";

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
    href: "/reminders",
    label: "Reminders",
    icon: Bell,
    activeColor: "text-yellow-600",
    inactiveColor: "text-gray-600",
  },
  {
    href: "/network",
    label: "Network",
    icon: Network,
    activeColor: "text-gray-600",
    inactiveColor: "text-gray-600",
  },
  {
    href: "/insights",
    label: "Insights",
    icon: Lightbulb,
    activeColor: "text-yellow-500",
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

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col z-40 shadow-sm">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">ReMember Me</h2>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive
                  ? `${item.activeColor} dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30`
                  : `${item.inactiveColor} dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700`
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

