
"use client";

import React from "react";
import { Person } from "@/types/database.types";
import { ContactRow } from "./ContactRow";

interface ContactListTableProps {
  contacts: Person[];
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

export function ContactListTable({ contacts, onToggleFavorite }: ContactListTableProps) {
  if (contacts.length === 0) {
    return null; // Empty state usually handled by parent, or could render here
  }

  return (
    <div className="w-full">
      {/* Sticky Header - Desktop Only */}
      <div className="hidden md:grid grid-cols-[auto_1fr_180px_150px_140px] gap-6 items-center px-6 py-4 bg-[#141824] border-b border-[#2d3748] sticky top-0 z-20">
        <div className="w-12">{/* Avatar Buffer */}</div>
        <div className="text-[13px] font-semibold text-[#94a3b8] uppercase tracking-[0.5px]">Name</div>
        <div className="text-[13px] font-semibold text-[#94a3b8] uppercase tracking-[0.5px]">Last Contact</div>
        <div className="text-[13px] font-semibold text-[#94a3b8] uppercase tracking-[0.5px]">Frequency</div>
        <div className="text-[13px] font-semibold text-[#94a3b8] uppercase tracking-[0.5px] text-right">Status</div>
      </div>

      {/* List Content */}
      <div className="flex flex-col md:block gap-3 md:gap-0">
        {contacts.map((contact) => (
          <ContactRow 
            key={contact.id} 
            contact={contact} 
            onToggleFavorite={onToggleFavorite} 
          />
        ))}
      </div>
    </div>
  );
}
