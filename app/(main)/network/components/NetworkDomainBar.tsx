'use client';

import { TagDomain } from './NetworkDataService';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Users, Heart, Trophy, Briefcase, Plane } from 'lucide-react';

interface NetworkDomainBarProps {
  domains: TagDomain[];
  selectedDomainId: string | null;
  onSelectDomain: (domainId: string | null) => void;
}

const ICON_MAP: Record<string, any> = {
  'users': Users,
  'heart': Heart,
  'trophy': Trophy,
  'briefcase': Briefcase,
  'plane': Plane
};

export function NetworkDomainBar({ domains, selectedDomainId, onSelectDomain }: NetworkDomainBarProps) {
  // If no domains (migration failed or loading), show generic fallback or nothing?
  // Let's assume domains are passed.
  
  // Custom sort order to match design: Relationships, Interests, Travel, Work, Friends
  const sortOrder = ['Relationships', 'Interests', 'Travel', 'Work', 'Friends'];
  const sortedDomains = [...domains].sort((a, b) => {
    return sortOrder.indexOf(a.name) - sortOrder.indexOf(b.name);
  });

  return (
    <div className="flex flex-wrap justify-center gap-4 py-4 animate-in fade-in slide-in-from-top-4 duration-700">
      {sortedDomains.map(domain => {
        const Icon = ICON_MAP[domain.icon] || Users;
        const isSelected = selectedDomainId === domain.id;
        
        return (
          <Button
            key={domain.id}
            variant="ghost"
            onClick={() => onSelectDomain(isSelected ? null : domain.id)}
            className={cn(
              "flex items-center gap-2 h-10 px-6 rounded-full border transition-all duration-300",
              isSelected 
                ? "bg-white dark:bg-white/10 shadow-md border-indigo-200 dark:border-indigo-500/30 scale-105" 
                : "bg-transparent border-transparent hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400"
            )}
            style={{ 
               color: isSelected ? domain.color : undefined 
            }}
          >
            <Icon className="w-4 h-4" />
            <span className={cn("font-medium", isSelected ? "text-gray-900 dark:text-white" : "")}>{domain.name}</span>
          </Button>
        );
      })}
    </div>
  );
}
