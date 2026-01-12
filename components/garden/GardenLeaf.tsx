import { motion } from 'framer-motion';
import { PositionedContact } from '@/hooks/useGardenLayout';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

interface GardenLeafProps {
  contact: PositionedContact;
  onClick: (contact: PositionedContact) => void;
}

// Colors for SVG fill
const getFillColor = (days: number, target: number = 30) => {
    const safeTarget = target || 30;
    if (days <= safeTarget * 0.5) return '#10b981'; // Emerald
    if (days <= safeTarget) return '#84cc16'; // Lime
    if (days <= safeTarget * 2) return '#fbbf24'; // Yellow
    return '#f97316'; // Orange
};

export function GardenLeaf({ contact, onClick }: GardenLeafProps) {
  const fillColor = getFillColor(contact.daysSinceLastContact, contact.targetFrequencyDays || 30);
  const uniqueId = `leaf-${contact.id}`;
  
  // Angle for random rotation (seeded by ID)
  const rotation = useMemo(() => {
      // Simple hash from string
      let hash = 0;
      for (let i = 0; i < contact.id.length; i++) hash = ((hash << 5) - hash) + contact.id.charCodeAt(i);
      // Map to -20 to 20 degrees
      return (hash % 40) - 20;
  }, [contact.id]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
          x: contact.x, 
          y: contact.y, 
          width: contact.leafSize, 
          height: contact.leafSize * 1.1, // Slight aspect ratio stretch for leaf
          opacity: 1, 
          scale: 1,
          rotate: rotation + (Math.atan2(contact.y, contact.x) * 180 / Math.PI) + 90 // Rotate away from center? Or straight up?
          // If we want random scatter look, maybe just simple rotation + outward direction?
          // Original Leaf had "origin-center" and maybe manual rotation.
          // Let's align "bottom" (stem) to center.
          // At (x,y), pointing outwards means rotating by angle = atan2(y, x).
          // SVG path points UP. So rotate by (angle - 90deg) results in pointing OUT.
          // Wait, y goes down in DOM. 
          // At (100, 0) [Right], angle is 0. Leaf points UP. Rotate 90 -> points RIGHT.
          // Correct: angle + 90.
      }}
      transition={{ 
        type: 'spring', 
        stiffness: 45,
        damping: 15
      }}
      className="absolute cursor-pointer hover:z-50 drop-shadow-sm hover:drop-shadow-xl transition-all"
      style={{
          marginLeft: -contact.leafSize / 2,
          marginTop: -(contact.leafSize * 1.1) / 2
      }}
      onClick={() => onClick(contact)}
      whileHover={{ scale: 1.3, zIndex: 100 }}
      title={`${contact.name} (${contact.daysSinceLastContact} days ago)`}
    >
      <svg 
        viewBox="0 0 42 48" 
        className="w-full h-full overflow-visible"
      >
        <defs>
            <clipPath id={uniqueId}>
                <path d="M 21 46 C 14 42, 6 36, 4 24 C 4 14, 9 6, 21 2 C 33 6, 38 14, 38 24 C 36 36, 28 42, 21 46 Z" />
            </clipPath>
        </defs>

        {/* Leaf Shape Background/Border */}
        <path
          d="M 21 46 C 14 42, 6 36, 4 24 C 4 14, 9 6, 21 2 C 33 6, 38 14, 38 24 C 36 36, 28 42, 21 46 Z"
          fill={fillColor}
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1.5"
        />

        {/* Image / Content */}
        {contact.photoUrl ? (
            <image 
                href={contact.photoUrl} 
                x="0" y="0" width="42" height="48" 
                preserveAspectRatio="xMidYMid slice"
                clipPath={`url(#${uniqueId})`}
                opacity="0.9"
            />
        ) : (
            <g>
                <text 
                    x="50%" y="50%" 
                    className="fill-white text-[12px] font-bold"
                    textAnchor="middle" 
                    dy=".3em"
                    filter="drop-shadow(0 1px 1px rgba(0,0,0,0.3))"
                >
                    {contact.initials}
                </text>
            </g>
        )}
        
        {/* Vein texture overlay (optional) */}
        {!contact.photoUrl && (
             <path
              d="M 21 43 L 21 6"
              stroke="rgba(0,0,0,0.1)"
              strokeWidth="1"
              fill="none"
            />
        )}
      </svg>
    </motion.div>
  );
}

