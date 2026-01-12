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

// Leaf sizes (pixels)
const SIZE_L = 48;
const SIZE_M = 36;
const SIZE_S = 28;

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
        const radius = RING_RADIUS_START + (ringIndex * RING_RADIUS_STEP);
        const count = ringContacts.length;
        
        if (count === 0) return;

        // Shuffle slightly for "organic" feel or sort? 
        // Sorting by health status or name helps consistency
        const sortedRing = [...ringContacts].sort((a, b) => a.name.localeCompare(b.name));

        const angleStep = (2 * Math.PI) / count;
        
        // Add a random start angle offset per ring for visual variety
        const angleOffset = ringIndex * 0.5; 

        sortedRing.forEach((contact, i) => {
            const angle = (i * angleStep) + angleOffset;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            // Determine Size
            let leafSize = SIZE_M;
            if (mode === 'frequency') {
                // Size = Relationship Tier
                const tier = contact.importance || 'medium';
                if (tier === 'high') leafSize = SIZE_L;
                else if (tier === 'medium') leafSize = SIZE_M;
                else leafSize = SIZE_S;
            } else {
                // Size = Contact Frequency
                const freq = contact.targetFrequencyDays || 365;
                if (freq <= 7) leafSize = 56; // XXL
                else if (freq <= 14) leafSize = 48; // XL
                else if (freq <= 30) leafSize = 40; // L
                else if (freq <= 90) leafSize = 32; // M
                else if (freq <= 180) leafSize = 28; // S
                else leafSize = 24; // XS
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
