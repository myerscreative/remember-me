"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWeeklyBloom } from "@/hooks/useWeeklyBloom";
import { Users, Activity, Search, TreePine, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";

// Bottom navigation component - Updated 2026-01-20
const navItems: { href: string; label: string; icon: React.ElementType; activeColor: string; inactiveColor: string; isSearch?: boolean }[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: Activity,
    activeColor: "text-primary",
    inactiveColor: "text-muted-foreground",
  },
  {
    href: "/garden",
    label: "Garden",
    icon: TreePine,
    activeColor: "text-primary",
    inactiveColor: "text-muted-foreground",
  },
  {
    href: "/",
    label: "Network",
    icon: Users,
    activeColor: "text-primary",
    inactiveColor: "text-muted-foreground",
  },
  {
    href: "/greenhouse",
    label: "Feedback",
    icon: Sprout,
    activeColor: "text-primary",
    inactiveColor: "text-muted-foreground",
  },
  {
    href: "#search",
    label: "Search",
    icon: Search,
    activeColor: "text-foreground",
    inactiveColor: "text-muted-foreground",
    isSearch: true,
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const { bloom } = useWeeklyBloom();
  const showNetworkBadge = bloom && !bloom.is_viewed;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 md:hidden flex h-16 items-center justify-around mx-auto max-w-7xl border-t border-sidebar-border bg-sidebar pb-safe">
      <div className="flex h-16 min-touch-h w-full items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isSearch) {
              return (
                  <button
                      key="search-trigger"
                      onClick={() => {
                          const searchInput = document.querySelector('input[placeholder*="search"]') as HTMLInputElement;
                          if (searchInput) {
                              searchInput.focus();
                              searchInput.scrollIntoView({ behavior: 'smooth' });
                          } else {
                              window.location.href = "/";
                          }
                      }}
                      className={cn(
                          "relative flex flex-1 flex-col items-center justify-center gap-1 min-touch-h text-muted-foreground transition-colors active:opacity-80"
                      )}
                  >
                      <Search className="size-5" />
                      <span className="text-xs font-medium">{item.label}</span>
                  </button>
              );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-1 min-touch-h transition-colors active:opacity-80",
                isActive ? item.activeColor : item.inactiveColor
              )}
            >
              <div className="relative">
                  <Icon className="size-5" />
                  {item.label === "Network" && showNetworkBadge && (
                    <span className="absolute -right-1 -top-1 flex size-2">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
                    </span>
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
