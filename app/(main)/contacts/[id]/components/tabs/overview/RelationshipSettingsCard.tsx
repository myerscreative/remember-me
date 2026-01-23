'use client';

import { useState } from 'react';
import { Users, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ContactImportance } from '@/types/database.types';
import { FREQUENCY_PRESETS } from '@/lib/relationship-health';
import { ImportanceSelector } from '@/components/shared/ImportanceSelector';

interface RelationshipSettingsCardProps {
  importance: ContactImportance;
  targetFrequencyDays: number;
  onImportanceChange: (importance: ContactImportance) => void;
  onFrequencyChange: (days: number) => void;
}

export function RelationshipSettingsCard({
  importance,
  targetFrequencyDays,
  onImportanceChange,
  onFrequencyChange
}: RelationshipSettingsCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const importanceLabels = {
    high: '👥 Close Friends',
    medium: '👥 Steady Friends',
    low: '👥 Acquaintances'
  };

  const frequencyLabel = FREQUENCY_PRESETS.find(p => p.days === targetFrequencyDays)?.label || 'Custom';

  return (
    <section className="bg-card border border-border rounded-2xl p-5 shadow-sm">
      {/* Collapsed State */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Relationship
          </span>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={cn(
                "px-3 py-1 rounded-lg font-medium text-xs",
                importance === 'high' && "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
              )}
            >
              {importanceLabels[importance] || importanceLabels.medium}
            </Badge>
            <Badge 
              variant="outline" 
              className="px-3 py-1 rounded-lg font-medium text-xs bg-muted"
            >
              📅 {frequencyLabel}
            </Badge>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-medium border border-border hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 mr-1" />
              Close
            </>
          ) : (
            <>
              Edit
            </>
          )}
        </Button>
      </div>

      {/* Expanded State */}
      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-border space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Importance Selector */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Relationship Level
            </label>
            <ImportanceSelector 
              importance={importance} 
              onChange={onImportanceChange} 
            />
          </div>

          {/* Frequency Selector */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Contact Cadence
            </label>
            <select
              value={targetFrequencyDays}
              onChange={(e) => onFrequencyChange(parseInt(e.target.value))}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none cursor-pointer"
              style={{ 
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, 
                backgroundRepeat: 'no-repeat', 
                backgroundPosition: 'right 12px center', 
                backgroundSize: '16px' 
              }}
            >
              {FREQUENCY_PRESETS.map(preset => (
                <option key={preset.days} value={preset.days}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </section>
  );
}
