import { GardenMode } from '@/hooks/useGardenLayout';

interface GardenLegendProps {
  mode: GardenMode;
}

export function GardenLegend({ mode }: GardenLegendProps) {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/50 shadow-sm text-[10px] md:text-xs text-text-secondary font-medium whitespace-nowrap z-50 pointer-events-none">
      {mode === 'frequency' ? (
        <span className="flex items-center gap-2">
          <span>🎯 Center = Weekly</span>
          <span className="text-text-tertiary">|</span>
          <span>🕸 Outer = Yearly</span>
          <span className="text-text-tertiary">|</span>
          <span>📐 Size = Importance</span>
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <span>❤️ Center = Favorites</span>
          <span className="text-text-tertiary">|</span>
          <span>👤 Outer = Contacts</span>
          <span className="text-text-tertiary">|</span>
          <span>📐 Size = Frequency</span>
        </span>
      )}
    </div>
  );
}
