"use client";

import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { SidebarNavContent } from "./sidebar-nav-content";

export function SidebarNav() {
  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border flex-col z-40 shadow-xl">
      <div className="p-6 border-b border-sidebar-border flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold bg-linear-to-r from-sidebar-foreground to-sidebar-foreground/60 bg-clip-text text-transparent">ReMember Me</h2>
        <Link
          href="/field-guide"
          className="p-2 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-primary hover:bg-sidebar-accent transition-colors shrink-0"
          aria-label="Field Guide / Help"
        >
          <HelpCircle className="size-5" />
        </Link>
      </div>
      <SidebarNavContent />
    </aside>
  );
}
