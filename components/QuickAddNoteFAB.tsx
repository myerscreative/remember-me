"use client";

import { useState } from "react";
import { Plus, BookOpen } from "lucide-react";
import { QuickAddNoteModal } from "./QuickAddNoteModal";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function QuickAddNoteFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Hide FAB if not on dashboard or garden (optional, but keep it for now)
  const isAllowedPath = pathname === "/dashboard" || pathname === "/garden" || pathname === "/contacts";
  
  // Also hide if deep in a contact profile (they can add notes there)
  const isProfile = pathname.startsWith("/contacts/") && pathname.split("/").length > 2;

  if (!isAllowedPath && !isProfile) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-24 left-5 md:bottom-8 md:right-28 z-50",
          "h-14 w-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-95 group",
          "border-4 border-white dark:border-slate-900"
        )}
        aria-label="Quick add story note"
      >
        <BookOpen className="h-6 w-6 group-hover:scale-110 transition-transform" />
        <div className="absolute -top-1 -right-1 h-5 w-5 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
          <Plus className="h-3 w-3 text-white stroke-[3px]" />
        </div>
      </button>

      <QuickAddNoteModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
}
