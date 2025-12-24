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
    { value: 'high', label: 'Key', icon: Crown, color: 'text-amber-500 bg-amber-50 border-amber-200' },
    { value: 'medium', label: 'Regular', icon: User, color: 'text-blue-500 bg-blue-50 border-blue-200' },
    { value: 'low', label: 'Casual', icon: UserMinus, color: 'text-slate-500 bg-slate-50 border-slate-200' },
  ];

  return (
    <div className={cn("flex gap-2", className)}>
      {options.map((opt) => {
        const Icon = opt.icon;
        const isSelected = importance === opt.value;
        
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center p-2 rounded-xl transition-all border",
              isSelected 
                ? opt.color + " ring-1 ring-offset-1 ring-offset-transparent " + opt.color.split(' ')[2].replace('border-', 'ring-')
                : "bg-white border-gray-100 hover:bg-gray-50 text-gray-400 grayscale hover:grayscale-0"
            )}
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
