"use client";

import { SidebarNavContent } from "./sidebar-nav-content";

export function SidebarNav() {
  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border flex-col z-40 shadow-xl">
      <div className="p-6 border-b border-sidebar-border">
        <h2 className="text-xl font-bold bg-linear-to-r from-sidebar-foreground to-sidebar-foreground/60 bg-clip-text text-transparent">ReMember Me</h2>
      </div>
      <SidebarNavContent />
    </aside>
  );
}
