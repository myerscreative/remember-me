"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Activity, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarNavContent } from "@/components/sidebar-nav-content";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function MobileHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full md:hidden flex min-h-14 items-center justify-between px-4 pl-safe pr-safe pt-safe border-b border-border bg-background/80 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="min-touch md:hidden active:opacity-80">
              <Menu className="size-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col w-72 p-0 border-r border-sidebar-border bg-sidebar">
            <SheetHeader className="flex p-6 border-b border-sidebar-border">
              <SheetTitle className="text-left">
                 <h2 className="text-xl font-bold text-sidebar-foreground">ReMember Me</h2>
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto min-h-0">
                <SidebarNavContent onNavItemClick={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
        
        <div className="flex items-center gap-2">
           <Activity className="size-5 text-primary" />
           <span className="text-sm font-bold text-foreground">Dashboard</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Link
          href="/field-guide"
          className="min-touch p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          aria-label="Field Guide / Help"
        >
          <HelpCircle className="size-5" />
        </Link>
      </div>
    </header>
  );
}
