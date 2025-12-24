"use client";

import { useState } from "react";
import { Plus, BookOpen, Info } from "lucide-react";
import { QuickAddNoteModal } from "./QuickAddNoteModal";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function QuickAddNoteFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const pathname = usePathname();

  // Hide FAB on individual contact profile pages (they have the integrated memory bar)
  // Handle both /contacts/[id] and /contacts/[id]/ (with trailing slash)
  const isContactProfilePage = /^\/contacts\/[^/]+\/?$/.test(pathname) && !pathname.startsWith('/contacts/new');
  
  // Only show on Dashboard, Garden, Contacts list
  const isAllowedPath = pathname === "/" || pathname === "/dashboard" || pathname === "/garden" || pathname === "/contacts";

  // Hide on profile pages or pages where it's not needed
  if (isContactProfilePage || !isAllowedPath) return null;

  return (
    <>
      <div className="fixed bottom-24 left-5 md:bottom-8 md:left-28 z-50 flex items-end gap-2">
        {/* Info Popover - appears on hover/tap of info icon */}
        <Popover open={showInfo} onOpenChange={setShowInfo}>
          <PopoverTrigger asChild>
            <button
              className="h-6 w-6 bg-[#1E293B] text-slate-400 hover:text-white rounded-full flex items-center justify-center shadow-lg border border-[#334155] transition-colors"
              aria-label="Quick Note info"
            >
              <Info className="h-3 w-3" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4 bg-[#1E293B] border-[#334155] shadow-xl rounded-xl z-[9999]" side="top" align="start">
            <h3 className="text-slate-200 font-bold text-xs uppercase tracking-wider border-b border-slate-700/50 pb-2 mb-2">Global Quick Capture</h3>
            <p className="text-slate-400 text-[11px] leading-relaxed mb-3">
              <span className="text-white font-bold">Use this to record a memory or note immediately.</span>
            </p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Our AI will identify the contact you&apos;re talking about and route the information to their <span className="text-white font-bold">Story</span> automatically.
            </p>
          </PopoverContent>
        </Popover>

        {/* Main FAB Button */}
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            "h-14 w-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-95 hover:scale-105 group",
            "border-4 border-white dark:border-slate-900"
          )}
          aria-label="Quick add story note"
        >
          <BookOpen className="h-6 w-6 group-hover:scale-110 transition-transform" />
          <div className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-md">
            <Plus className="h-3 w-3 text-white stroke-[3px]" />
          </div>
        </button>
      </div>

      <QuickAddNoteModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
}
