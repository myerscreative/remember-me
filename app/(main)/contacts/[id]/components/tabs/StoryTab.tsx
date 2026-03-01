'use client';

import React from 'react';
import { 
  Map, 
  HeartHandshake, 
  BookOpen, 
  Star, 
  Plus 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NarrativeCard {
  title: string;
  icon: React.ReactNode;
  content: string;
  cardColor: string;
}

export interface SharedMemory {
  id: string;
  date: Date;
  text: string;
  isMilestone: boolean;
  imageUrl?: string;
}

interface StoryTabProps {
  contact: any;
  onEdit?: () => void;
}

export function StoryTab({ contact, onEdit }: StoryTabProps) {
  const memories: SharedMemory[] = contact.memories || [];

  const narrativeCards: NarrativeCard[] = [
    {
      title: "Where We Met",
      icon: <Map className="w-5 h-5" />,
      content: contact.where_met || "No story added yet.",
      cardColor: "bg-purple-950/40 text-purple-100 border-slate-200",
    },
    {
      title: "Why We Stay in Contact",
      icon: <HeartHandshake className="w-5 h-5 text-indigo-300" />,
      content: contact.why_stay_in_contact || "No story added yet.",
      cardColor: "bg-indigo-950/40 text-indigo-100 border-slate-200",
    },
    {
      title: "What Matters to Them",
      icon: <BookOpen className="w-5 h-5 text-teal-300" />,
      content: contact.most_important_to_them || "No story added yet.",
      cardColor: "bg-teal-950/40 text-teal-100 border-slate-200",
    }
  ];

  return (
    <div className="relative min-h-[60vh] pb-24 flex flex-col pt-2">
      {/* Narrative Foundation Cards (Fixed Context) */}
      <div className="flex flex-col gap-4 mb-10">
        {narrativeCards.map((card, idx) => (
          <div 
            key={idx} 
            className={cn(
              "rounded-xl p-4 border shadow-sm",
              card.cardColor
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              {card.icon}
              <h3 className="text-sm font-semibold tracking-wide uppercase opacity-90">{card.title}</h3>
            </div>
            <p className="text-sm leading-relaxed opacity-95 whitespace-pre-wrap">
              {card.content}
            </p>
          </div>
        ))}
      </div>

      {/* Shared Memories & Milestones Feed */}
      <div className="flex flex-col">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 ml-2">
          Shared Memories
        </h3>
        
        {memories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center border border-dashed border-slate-700 rounded-xl bg-slate-900/50">
            <p className="text-slate-400 text-sm leading-relaxed">
              The Story begins here.<br/>Add a shared memory to deepen the connection.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6 border-l-2 border-slate-800 ml-4 pl-4 relative">
            {memories.sort((a, b) => b.date.getTime() - a.date.getTime()).map((memory) => (
              <div key={memory.id} className="relative">
                {/* Timeline Dot */}
                <div className={cn(
                  "absolute -left-[23px] top-4 w-3 h-3 rounded-full border-2 border-slate-950 z-10",
                  memory.isMilestone ? "bg-indigo-500 scale-125" : "bg-slate-600"
                )} />
                
                {/* Milestone Star Indicator */}
                {memory.isMilestone && (
                  <div className="absolute -left-[45px] top-3">
                    <Star className="w-5 h-5 fill-indigo-400 text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                  </div>
                )}

                <div 
                  className={cn(
                    "rounded-xl p-4 border border-slate-200 bg-slate-900",
                    memory.isMilestone && "shadow-[0_0_20px_rgba(99,102,241,0.15)] bg-slate-900/90"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-400">
                      {memory.date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                    {memory.isMilestone && (
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                        Milestone
                      </span>
                    )}
                  </div>
                  
                  {memory.imageUrl && (
                    <div className="mb-4 rounded-lg overflow-hidden border border-slate-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={memory.imageUrl} alt="Memory" className="w-full h-auto object-cover max-h-48" />
                    </div>
                  )}
                  
                  <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                    {memory.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button (FAB) */}
      <button 
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-xl hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all z-50 border border-indigo-400/50 shadow-indigo-600/30"
        title="Add Memory"
        onClick={() => {
          // Placeholder for FAB interaction
          console.log('Open Add Memory modal');
        }}
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
