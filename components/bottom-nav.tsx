"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Activity, Search, TreePine } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems: { href: string; label: string; icon: React.ElementType; activeColor: string; inactiveColor: string; isSearch?: boolean }[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: Activity,
    activeColor: "text-purple-600",
    inactiveColor: "text-gray-600",
  },
  {
    href: "/garden",
    label: "Garden",
    icon: TreePine,
    activeColor: "text-green-600",
    inactiveColor: "text-gray-600",
  },
  {
    href: "/",
    label: "Contacts",
    icon: Users,
    activeColor: "text-blue-600",
    inactiveColor: "text-gray-600",
  },
  {
    href: "#search",
    label: "Search",
    icon: Search,
    activeColor: "text-gray-900",
    inactiveColor: "text-gray-600",
    isSearch: true,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-sidebar-border md:hidden pb-safe">
      <div className="flex items-center justify-around h-16 max-w-7xl mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isSearch) {
              return (
                  <button
                      key="search-trigger"
                      onClick={() => {
                          // Trigger search (e.g., focus search input or open modal)
                          const searchInput = document.querySelector('input[placeholder*="search"]') as HTMLInputElement;
                          if (searchInput) {
                              searchInput.focus();
                              searchInput.scrollIntoView({ behavior: 'smooth' });
                          } else {
                              // If no search input, maybe navigate to contacts page
                              window.location.href = "/";
                          }
                      }}
                      className={cn(
                          "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors relative",
                          "text-gray-600 dark:text-gray-400"
                      )}
                  >
                      <Search className="h-5 w-5" />
                      <span className="text-xs font-medium">{item.label}</span>
                  </button>
              );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors relative",
                isActive ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md" : `${item.inactiveColor} dark:text-gray-400 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`
              )}
            >
              <div className="relative">
                  <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
