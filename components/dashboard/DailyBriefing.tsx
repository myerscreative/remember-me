import React from 'react';

interface Contact {
  id: string;
  name: string;
}

export const DailyBriefing = ({ driftedContacts }: { driftedContacts: Contact[] }) => {
  if (!driftedContacts || driftedContacts.length === 0) return null;

  return (
    <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl mb-6 backdrop-blur-sm">
      <h4 className="text-orange-400 font-bold text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
        <span role="img" aria-label="alert">⚠️</span> Garden Alert: New Drifters
      </h4>
      <p className="text-slate-400 text-sm mb-3">
        The following seeds are starting to drift toward the outer rings:
      </p>
      <div className="flex -space-x-2">
        {driftedContacts.map(c => (
          <div 
            key={c.id} 
            title={c.name}
            className="h-8 w-8 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-200 hover:z-10 hover:scale-110 transition-transform cursor-help"
          >
            {c.name.split(' ').map(n => n[0]).join('')}
          </div>
        ))}
      </div>
    </div>
  );
};
