import React from 'react';
import Link from 'next/link';

interface Contact {
  id: string;
  name: string;
}

export const DailyBriefing = ({ driftedContacts }: { driftedContacts: Contact[] }) => {
  if (!driftedContacts || driftedContacts.length === 0) return null;

    <div className="relative group">
      <Link 
        href="/garden" 
        className="block bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl mb-6 backdrop-blur-sm hover:bg-orange-500/15 active:scale-[0.99] transition-all group-hover:border-orange-500/40"
      >
        <h4 className="text-orange-400 font-bold text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
          <span role="img" aria-label="alert">⚠️</span> Garden Alert: New Drifters
        </h4>
        <p className="text-text-tertiary text-sm mb-3">
          The following seeds are starting to drift toward the outer rings:
        </p>
        <div className="flex -space-x-2 relative z-10">
          {driftedContacts.map(c => (
            <Link 
              key={c.id} 
              href={`/contacts/${c.id}`}
              onClick={(e) => e.stopPropagation()}
              title={c.name}
              className="h-8 w-8 rounded-full border-2 border-canvas bg-elevated flex items-center justify-center text-[10px] font-bold text-text-primary hover:z-20 hover:scale-110 hover:border-orange-500/50 transition-all cursor-pointer shadow-lg"
            >
              {c.name.split(' ').map(n => n[0]).join('')}
            </Link>
          ))}
        </div>
      </Link>
    </div>
};
