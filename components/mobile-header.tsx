"use client";

import { useState } from "react";
import { Menu, X, Activity } from "lucide-react";
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
    <header className="md:hidden sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-border px-4 h-14 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 bg-sidebar border-r border-sidebar-border">
            <SheetHeader className="p-6 border-b border-sidebar-border">
              <SheetTitle className="text-left">
                 <h2 className="text-xl font-bold bg-linear-to-r from-sidebar-foreground to-sidebar-foreground/60 bg-clip-text text-transparent">ReMember Me</h2>
              </SheetTitle>
            </SheetHeader>
            <div className="h-[calc(100vh-80px)] overflow-y-auto">
                <SidebarNavContent onNavItemClick={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
        
        <div className="flex items-center gap-2">
           <Activity className="h-5 w-5 text-purple-600" />
           <span className="font-bold text-sm">Dashboard</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {/* User profile or other quick actions could go here */}
      </div>
    </header>
  );
}
