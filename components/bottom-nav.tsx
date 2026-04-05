"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Sun, TreePine } from "lucide-react";

const navItems = [
  { href: "/", label: "People", icon: Users },
  { href: "/dashboard", label: "Today", icon: Sun },
  { href: "/garden", label: "Garden", icon: TreePine },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 md:hidden flex h-16 items-center justify-around mx-auto max-w-7xl pb-safe"
      style={{
        backgroundColor: "var(--rm-nav-bg)",
        borderTop: "0.5px solid var(--rm-border)",
      }}
    >
      <div className="flex h-16 min-touch-h w-full items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-1 flex-col items-center justify-center gap-1 min-touch-h transition-colors active:opacity-80"
              style={{
                color: isActive ? "var(--rm-accent)" : "var(--rm-text-muted)",
              }}
            >
              <Icon className="size-5" />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
