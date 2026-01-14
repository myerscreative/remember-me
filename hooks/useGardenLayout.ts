import { useMemo } from 'react';

export type GardenMode = 'frequency' | 'tier';

export interface GardenContact {
  id: string;
  name: string;
  initials: string;
  photoUrl?: string | null;
  targetFrequencyDays?: number | null;
  importance?: 'high' | 'medium' | 'low' | string | null;
  lastContactDate?: string | null;
  daysSinceLastContact: number;
}

export interface GardenPosition {
  x: number;
  y: number;
  ringIndex: number;
  leafSize: number;
}

export interface PositionedContact extends GardenContact, GardenPosition {}

const RING_RADIUS_START = 80;
const RING_RADIUS_STEP = 60;

// Leaf sizes (pixels) - reduced for lighter, more delicate appearance
const SIZE_L = 32; // Reduced from 48
const SIZE_M = 24; // Reduced from 36
const SIZE_S = 20; // Reduced from 28


export function useGardenLayout(contacts: GardenContact[], mode: GardenMode) {
  const positionedContacts = useMemo(() => {
    // 1. Group contacts into rings
    const rings: GardenContact[][] = [];

    // Initialize rings array based on mode
    const ringCount = mode === 'frequency' ? 6 : 3;
    for (let i = 0; i < ringCount; i++) rings[i] = [];

    const uncategorized: GardenContact[] = [];

    contacts.forEach(contact => {
       if (mode === 'frequency') {
         const freq = contact.targetFrequencyDays || 365; // Default to yearly if missing
         if (freq <= 7) rings[0].push(contact);       // Weekly
         else if (freq <= 14) rings[1].push(contact); // Bi-weekly
         else if (freq <= 30) rings[2].push(contact); // Monthly
         else if (freq <= 90) rings[3].push(contact); // Quarterly
         else if (freq <= 180) rings[4].push(contact);// Bi-annual
         else rings[5].push(contact);                 // Yearly
       } else {
         const tier = contact.importance || 'medium'; // Default to medium
         if (tier === 'high') rings[0].push(contact);      // Favorites
         else if (tier === 'medium') rings[1].push(contact); // Friends
         else rings[2].push(contact);                      // Contacts
       }
    });

    // 2. Position contacts within rings
    const positioned: PositionedContact[] = [];

    rings.forEach((ringContacts, ringIndex) => {
        const baseRadius = RING_RADIUS_START + (ringIndex * RING_RADIUS_STEP);
        const count = ringContacts.length;
        
        if (count === 0) return;

        // Shuffle contacts to randomize color/size placement
        const shuffled = [...ringContacts].sort(() => Math.random() - 0.5);

        const angleStep = (2 * Math.PI) / count;
        // Random start angle per ring
        const angleOffset = Math.random() * Math.PI * 2; 

        shuffled.forEach((contact, i) => {
            const angle = (i * angleStep) + angleOffset + ((Math.random() - 0.5) * 0.1); // Slight angle jitter
            
            // Scatter sporadically: Add +/- jitter to radius
            // Ring 0 (center) less jitter, outer rings more jitter
            const jitterRange = RING_RADIUS_STEP * 0.7; // 70% of gap
            const radiusJitter = (Math.random() - 0.5) * jitterRange;
            
            const radius = baseRadius + radiusJitter;

            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            // Determine Size
            let leafSize = SIZE_M;
            if (mode === 'frequency') {
                const tier = contact.importance || 'medium';
                if (tier === 'high') leafSize = SIZE_L;
                else if (tier === 'medium') leafSize = SIZE_M;
                else leafSize = SIZE_S;
            } else {
                const freq = contact.targetFrequencyDays || 365;
                if (freq <= 7) leafSize = 36; // XXL (reduced from 56)
                else if (freq <= 14) leafSize = 32; // XL (reduced from 48)
                else if (freq <= 30) leafSize = 28; // L (reduced from 40)
                else if (freq <= 90) leafSize = 24; // M (reduced from 32)
                else if (freq <= 180) leafSize = 20; // S (reduced from 28)
                else leafSize = 18; // XS (reduced from 24)
            }

            positioned.push({
                ...contact,
                x,
                y,
                ringIndex,
                leafSize
            });
        });
    });

    return positioned;
  }, [contacts, mode]);

  return positionedContacts;
}
