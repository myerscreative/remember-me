import React from 'react';

export default function GardenLegend() {
  return (
    <div className="bg-elevated backdrop-blur rounded-xl p-5 border border-border-default shadow-sm">
      <div className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">
        📍 Garden Guide
      </div>

      <div className="space-y-4">
        {/* Rings - Based on Contact Frequency */}
        <div>
          <div className="text-[10px] text-text-secondary font-semibold mb-2">CONTACT FREQUENCY RINGS</div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-text-tertiary">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>High Priority (Center) - Weekly/Biweekly</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-tertiary">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Medium (Middle) - Monthly</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-tertiary">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span>Low (Outer) - Quarterly+</span>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-text-secondary italic">
            Within each ring, recently contacted people appear closer to the inner edge
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-subtle"></div>

        {/* Leaf Color - Health Status */}
        <div>
          <div className="text-[10px] text-text-secondary font-semibold mb-2">LEAF COLOR (Health Status)</div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-text-tertiary">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Blooming (0-7 days)</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-tertiary">
              <span className="w-2 h-2 rounded-full bg-lime-500"></span>
              <span>Nourished (8-21 days)</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-tertiary">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              <span>Thirsty (22-45 days)</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-tertiary">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              <span>Fading (45+ days)</span>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-subtle"></div>

        {/* Leaf Sizes - Relationship Type */}
        <div>
          <div className="text-[10px] text-text-secondary font-semibold mb-2">LEAF SIZE (Relationship Type)</div>
          <div className="flex items-end gap-3">
            <div className="flex flex-col items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-border-default"></div>
              <span className="text-[10px] text-text-secondary text-center">Contact</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-5 h-5 rounded-full bg-border-strong"></div>
              <span className="text-[10px] text-text-secondary text-center">Friend</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-7 h-7 rounded-full bg-border-strong"></div>
              <span className="text-[10px] text-text-secondary font-medium text-center">Favorite</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
