import { motion } from 'framer-motion';
import { PositionedContact } from '@/hooks/useGardenLayout';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface GardenLeafProps {
  contact: PositionedContact;
  onClick: (contact: PositionedContact) => void;
}

// Health colors
const getColorForHealth = (days: number, target: number = 30) => {
    // Assuming target is the max acceptable gap.
    // Logic from RelationshipGarden.tsx was hardcoded.
    // Better logic: if days > target * 1.5 -> Thirsty. If days > target * 3 -> Fading.
    
    // For now, simple fixed mapping similar to previous system, 
    // but we can try to be smarter if target is available.
    
    // Fallback if target is huge or missing
    const safeTarget = target || 30; 
    
    if (days <= safeTarget * 0.5) return 'bg-emerald-500 shadow-emerald-500/50'; // Very healthy
    if (days <= safeTarget) return 'bg-lime-500 shadow-lime-500/50'; // Good
    if (days <= safeTarget * 2) return 'bg-yellow-400 shadow-yellow-400/50'; // Warning
    return 'bg-orange-500 shadow-orange-500/50'; // Danger
};

export function GardenLeaf({ contact, onClick }: GardenLeafProps) {
  const colorClass = getColorForHealth(contact.daysSinceLastContact, contact.targetFrequencyDays || 30);
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
          x: contact.x, 
          y: contact.y, 
          width: contact.leafSize, 
          height: contact.leafSize,
          opacity: 1, 
          scale: 1 
      }}
      transition={{ 
        type: 'spring', 
        stiffness: 45, // Softer spring for organic feel
        damping: 15,
        mass: 1.2
      }}
      className={cn(
        "absolute rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:shadow-xl hover:z-20 transition-shadow",
        colorClass
      )}
      style={{
          marginLeft: -contact.leafSize / 2, // Center on coordinate
          marginTop: -contact.leafSize / 2
      }}
      onClick={() => onClick(contact)}
      whileHover={{ scale: 1.2, zIndex: 100 }}
      title={`${contact.name} (${contact.daysSinceLastContact} days ago)`}
    >
      {contact.photoUrl ? (
          <img 
            src={contact.photoUrl} 
            alt={contact.name}
            className="w-full h-full rounded-full object-cover border-2 border-white/30"
          />
      ) : (
          <span className="text-white font-bold text-[10px] md:text-xs drop-shadow-md">
             {contact.leafSize > 28 ? contact.initials : ''}
          </span>
      )}
      
      {/* Mini stem decoration */}
      <div className="absolute -bottom-1 left-1/2 w-0.5 h-2 bg-green-800/30 -z-10 origin-top rotate-12" />
    </motion.div>
  );
}
