"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import type { DashboardMapContact } from "@/types/dashboard";

interface SeedPosition {
  x: number;
  y: number;
  color: string;
  initials: string;
  name: string;
}

interface GardenPreviewProps {
  contacts: DashboardMapContact[];
}

const GOLDEN_ANGLE = 137.508 * (Math.PI / 180);

export function GardenPreview({ contacts }: GardenPreviewProps) {
  const router = useRouter();

  const seedPositions = useMemo((): SeedPosition[] => {
    const buckets = {
      nurtured: [] as DashboardMapContact[],
      drifting: [] as DashboardMapContact[],
      neglected: [] as DashboardMapContact[],
    };

    contacts.forEach((contact) => {
      const status = contact.status?.toLowerCase() ?? "nurtured";
      if (status === "drifting") buckets.drifting.push(contact);
      else if (status === "neglected") buckets.neglected.push(contact);
      else buckets.nurtured.push(contact);
    });

    const calculateRing = (
      items: DashboardMapContact[],
      minR: number,
      maxR: number,
      offset: number
    ): SeedPosition[] => {
      const now = new Date();
      const msPerDay = 1000 * 60 * 60 * 24;
      const sorted = [...items].sort((a, b) => {
        const lastA = a.last_interaction_date ? new Date(a.last_interaction_date) : null;
        const lastB = b.last_interaction_date ? new Date(b.last_interaction_date) : null;
        const daysA = lastA ? Math.floor((now.getTime() - lastA.getTime()) / msPerDay) : 999;
        const daysB = lastB ? Math.floor((now.getTime() - lastB.getTime()) / msPerDay) : 999;
        return daysA - daysB;
      });

      return sorted.map((contact, i) => {
        const norm = i / Math.max(1, items.length - 1);
        const radius = minR + (maxR - minR) * norm;
        const angle = i * GOLDEN_ANGLE + offset;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const status = contact.status ?? "Nurtured";
        const color =
          status === "Nurtured" ? "#10b981" : status === "Drifting" ? "#fbbf24" : "#f97316";
        const nameParts = (contact.name ?? "").split(" ");
        const initials =
          nameParts.length >= 2
            ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
            : (contact.name ?? "?").slice(0, 2).toUpperCase();
        return { x, y, color, initials, name: contact.name };
      });
    };

    // Scale for preview rings
    const p1 = calculateRing(buckets.nurtured, 20, 60, 0);
    const p2 = calculateRing(buckets.drifting, 80, 140, p1.length * GOLDEN_ANGLE);
    const p3 = calculateRing(buckets.neglected, 160, 230, (p1.length + p2.length) * GOLDEN_ANGLE);

    return [...p1, ...p2, ...p3];
  }, [contacts]);

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
      
      {/* Garden visualization */}
      <div className="h-[300px] relative bg-linear-to-br from-slate-900/50 to-slate-800/50 rounded-lg border border-border/50 overflow-hidden">
        <svg viewBox="-250 -250 500 500" className="w-full h-full">
          {seedPositions.map((seed, i) => (
            <g key={i}>
              <circle
                cx={seed.x}
                cy={seed.y}
                r="8"
                fill={seed.color}
                opacity="0.9"
              />
              <text
                x={seed.x}
                y={seed.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="pointer-events-none text-[6px] font-bold fill-white"
              >
                {seed.initials}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
