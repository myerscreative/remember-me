import { GardenMode } from '@/hooks/useGardenLayout';
import { Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GardenToggleProps {
  mode: GardenMode;
  onChange: (mode: GardenMode) => void;
}

export function GardenToggle({ mode, onChange }: GardenToggleProps) {
  return (
    <div className="flex bg-white/50 backdrop-blur-md rounded-full p-1 border border-white/60 shadow-xs">
      <button
        onClick={() => onChange('frequency')}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
          mode === 'frequency' 
            ? "bg-indigo-600 text-white shadow-sm" 
            : "text-slate-600 hover:bg-white/50"
        )}
      >
        <Clock size={14} />
        Frequency
      </button>
      <button
        onClick={() => onChange('tier')}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
          mode === 'tier' 
            ? "bg-indigo-600 text-white shadow-sm" 
            : "text-slate-600 hover:bg-white/50"
        )}
      >
        <Star size={14} />
        Tier
      </button>
    </div>
  );
}
