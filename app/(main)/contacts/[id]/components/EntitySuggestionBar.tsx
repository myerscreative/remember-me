'use client';

import { User, Sparkles, Flag, Briefcase } from 'lucide-react';
import { EntityType } from '@/lib/entity-extractor';

export interface Suggestion {
  id: string;
  type: EntityType;
  label: string;
  context?: string;
}

interface EntitySuggestionBarProps {
  suggestions: Suggestion[];
  onConfirm: (s: Suggestion) => void;
}

export const EntitySuggestionBar = ({ suggestions, onConfirm }: EntitySuggestionBarProps) => {
  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 py-3 border-t border-slate-800 mt-2 animate-in slide-in-from-bottom-2 fade-in duration-300">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">
        Found in your notes:
      </span>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {suggestions.map((s) => (
          <button
            key={s.id}
            onClick={() => onConfirm(s)}
            className="flex items-center gap-2 bg-slate-900 border border-dashed border-slate-700 hover:border-indigo-500 hover:bg-indigo-500/10 px-3 py-2 rounded-xl transition-all shrink-0 group"
          >
            {s.type === 'Family' && <User size={14} className="text-indigo-400 group-hover:text-indigo-300" />}
            {s.type === 'Interest' && <Sparkles size={14} className="text-pink-400 group-hover:text-pink-300" />}
            {s.type === 'Milestone' && <Flag size={14} className="text-amber-400 group-hover:text-amber-300" />}
            {s.type === 'Career' && <Briefcase size={14} className="text-blue-400 group-hover:text-blue-300" />}
            <span className="text-xs text-slate-200 group-hover:text-white">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
