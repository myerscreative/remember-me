'use client';

import { ContactImportance } from '@/types/database.types';
import { cn } from '@/lib/utils';
import { Crown, User, UserMinus } from 'lucide-react';

interface ImportanceSelectorProps {
  importance: ContactImportance;
  onChange: (importance: ContactImportance) => void;
  className?: string;
}

export function ImportanceSelector({ importance, onChange, className }: ImportanceSelectorProps) {
  const options: { value: ContactImportance; label: string; icon: React.FC<any>; color: string }[] = [
    { value: 'high', label: 'Inner Circle', icon: Crown, color: 'text-amber-500 bg-amber-50 border-amber-200' },
    { value: 'medium', label: 'Steady Friends', icon: User, color: 'text-blue-500 bg-blue-50 border-blue-200' },
    { value: 'low', label: 'Distant Peers', icon: UserMinus, color: 'text-slate-500 bg-slate-50 border-slate-200' },
  ];

  return (
    <div className={cn("flex gap-2", className)}>
      {options.map((opt) => {
        const isSelected = importance === opt.value;
        const Icon = opt.icon;
        
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`
              flex-1 flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200
              ${isSelected 
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20' 
                : 'bg-white dark:bg-[#2c3039] border-gray-200 dark:border-[#3a3f4b] text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-[#343942]'
              }
            `}
            title={opt.label}
          >
            <Icon className="w-5 h-5 mb-1" />
            <span className="text-[10px] uppercase font-bold tracking-wider">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
