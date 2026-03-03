import { useMemo } from 'react';

export type ContactStatus = 'Nurtured' | 'Drifting' | 'Neglected';

export const useGardenPhysics = (status: ContactStatus, index: number) => {
  return useMemo(() => {
    // Determine radius based on relationship health
    const radius = status === 'Nurtured' ? 80 : status === 'Drifting' ? 180 : 280;
    
    // Spread contacts out around the circle using their index
    const angle = (index * 0.5) % (2 * Math.PI); 
    
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  }, [status, index]);
};
