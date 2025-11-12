"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Bell, Activity, Search } from "lucide-react";
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
    href: "/search",
    label: "Search",
    icon: Search,
    activeColor: "text-purple-600",
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
    href: "/reminders",
    label: "Reminders",
    icon: Bell,
    activeColor: "text-yellow-600",
    inactiveColor: "text-gray-600",
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:hidden">
      <div className="flex items-center justify-around h-16 max-w-screen-xl mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                isActive ? `${item.activeColor} dark:text-blue-400` : `${item.inactiveColor} dark:text-gray-400`
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

