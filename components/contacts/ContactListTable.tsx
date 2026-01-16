import React from 'react';
import { ContactRow } from './ContactRow';
import { ContactCard } from './ContactCard';
import { Contact } from '@/lib/contacts/contact-utils';
import { cn } from '@/lib/utils';

interface ContactListTableProps {
  contacts: Contact[];
  isLoading?: boolean;
}

export function ContactListTable({ contacts, isLoading = false }: ContactListTableProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col w-full">
        {/* Desktop Header Skeleton */}
        <div className="hidden md:grid grid-cols-[auto_1fr_200px_180px_160px] gap-6 px-6 py-4 bg-[#141824] border-b border-[#2d3748]">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-[#2d3748] rounded animate-pulse" />
          ))}
        </div>
        
        {/* Skeleton Rows/Cards */}
        <div className="flex flex-col gap-3 md:gap-0 mt-3 md:mt-0 px-4 md:px-0">
          {[...Array(5)].map((_, i) => (
            <div key={i}>
              {/* Mobile Card Skeleton */}
              <div className="md:hidden h-24 bg-[#1a1f2e] rounded-2xl animate-pulse" />
              {/* Desktop Row Skeleton */}
              <div className="hidden md:block h-[84px] bg-[#0a0e1a] border-b border-[#1a1f2e] animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="text-4xl mb-4">🪪</div>
        <h3 className="text-xl font-semibold text-[#e2e8f0] mb-2">No contacts found</h3>
        <p className="text-[#94a3b8] max-w-sm">
          You haven't added any contacts yet. Start building your network to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      {/* Desktop Sticky Header */}
      <div className="hidden md:grid grid-cols-[auto_1fr_200px_180px_160px] gap-6 px-6 py-[18px] bg-[#141824] border-b border-[#2d3748] sticky top-0 z-10">
        <div className="w-12"></div>
        <div className="text-[13px] font-semibold text-[#94a3b8] uppercase tracking-wider">Name</div>
        <div className="text-[13px] font-semibold text-[#94a3b8] uppercase tracking-wider">Last Contact</div>
        <div className="text-[13px] font-semibold text-[#94a3b8] uppercase tracking-wider">Frequency</div>
        <div className="text-[13px] font-semibold text-[#94a3b8] uppercase tracking-wider text-right">Status</div>
      </div>

      {/* Main List Container */}
      <div className="flex flex-col gap-3 md:gap-0 mt-3 md:mt-0 px-4 md:px-0 pb-20">
        {contacts.map((contact) => (
          <div key={contact.id}>
            {/* Desktop View */}
            <div className="hidden md:block">
              <ContactRow contact={contact} />
            </div>
            {/* Mobile View */}
            <div className="md:hidden">
              <ContactCard contact={contact} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
