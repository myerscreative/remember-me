import { useState } from 'react';
import { Seedling } from './Seedling';
import { ContactStatus } from '@/hooks/useGardenPhysics';

export interface Contact {
  id: string;
  name: string;
  status: ContactStatus;
  daysSinceLastContact?: number; // Optional for backward compatibility if not hooked up yet
  lastInteractionType?: string;
}

export const GardenMap = ({ contacts }: { contacts: Contact[] }) => {
  const [activeSeedId, setActiveSeedId] = useState<string | null>(null);

  return (
    <div 
      className="relative w-full aspect-square md:aspect-video max-h-[70vh] bg-slate-950 overflow-hidden flex items-center justify-center rounded-3xl border border-slate-900 shadow-2xl"
      onClick={() => setActiveSeedId(null)}
    >
      {/* Dynamic Background Rings */}
      <div className="absolute h-[25%] aspect-square border border-slate-900/40 rounded-full pointer-events-none" />
      <div className="absolute h-[55%] aspect-square border border-slate-900/40 rounded-full pointer-events-none" />
      <div className="absolute h-[85%] aspect-square border border-slate-900/40 rounded-full pointer-events-none" />
      
      {/* The People */}
      {contacts.map((contact, i) => (
        <Seedling 
          key={contact.id} 
          id={contact.id}
          index={i} 
          name={contact.name} 
          status={contact.status}
          daysSinceLastContact={contact.daysSinceLastContact || 0}
          lastInteractionType={contact.lastInteractionType || 'unknown'}
          isActive={activeSeedId === contact.id}
          onClick={(e) => {
            e.stopPropagation();
            if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
              window.navigator.vibrate(50); // Light haptic tap
            }
            setActiveSeedId(activeSeedId === contact.id ? null : contact.id);
          }}
        />
      ))}
    </div>
  );
};
