"use client";

import { useRouter } from "next/navigation";

interface GardenPreviewProps {
  contacts: any[];
}

export function GardenPreview({ contacts }: GardenPreviewProps) {
  const router = useRouter();

  return (
    <div 
      className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => router.push('/garden')}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🌱</span>
        <h3 className="text-sm font-bold text-foreground/80 uppercase tracking-wide">Garden Map</h3>
        <span className="ml-auto text-xs text-muted-foreground">Click to view →</span>
      </div>
      
      {/* Simple visual representation */}
      <div className="h-[300px] relative bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-lg border border-border/50 flex items-center justify-center overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute w-32 h-32 rounded-full border-2 border-emerald-500/20"></div>
          <div className="absolute w-48 h-48 rounded-full border-2 border-lime-500/20"></div>
          <div className="absolute w-64 h-64 rounded-full border-2 border-amber-500/20"></div>
        </div>
        
        {/* Sample dots representing contacts */}
        <div className="absolute inset-0">
          {contacts.slice(0, 50).map((contact: any, i: number) => {
            const angle = (i / 50) * Math.PI * 2;
            const radius = 80 + (i % 3) * 30;
            const x = 50 + Math.cos(angle) * radius / 3;
            const y = 50 + Math.sin(angle) * radius / 3;
            
            // Calculate color based on target frequency
            const lastDate = contact.last_interaction_date ? new Date(contact.last_interaction_date) : null;
            const now = new Date();
            const days = lastDate ? Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)) : 999;
            const targetDays = contact.target_frequency_days || 30;
            
            let color = '#f97316'; // orange - fading
            if (days < targetDays) color = '#10b981'; // green - blooming
            else if (days < targetDays * 1.5) color = '#84cc16'; // lime - nourished
            else if (days < targetDays * 2.5) color = '#fbbf24'; // yellow - thirsty
            
            return (
              <div
                key={contact.id}
                className="absolute w-2 h-2 rounded-full transition-all hover:scale-150"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  backgroundColor: color,
                  opacity: 0.8,
                }}
                title={contact.name}
              />
            );
          })}
        </div>
        
        {/* Center text */}
        <div className="relative z-10 text-center">
          <div className="text-4xl font-black text-white mb-1">{contacts.length}</div>
          <div className="text-sm text-muted-foreground">Total Contacts</div>
        </div>
      </div>
    </div>
  );
}
