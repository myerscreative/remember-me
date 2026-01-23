'use client';

import { SubTribe } from './NetworkDataService';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface NetworkSubTribeDrawerProps {
  isOpen: boolean;
  subTribes: SubTribe[];
  selectedSubTribeId: string | null;
  onSelectSubTribe: (id: string | null) => void;
  color: string;
}

export function NetworkSubTribeDrawer({ 
  isOpen, 
  subTribes, 
  selectedSubTribeId, 
  onSelectSubTribe,
  color 
}: NetworkSubTribeDrawerProps) {
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
           initial={{ height: 0, opacity: 0 }}
           animate={{ height: 'auto', opacity: 1 }}
           exit={{ height: 0, opacity: 0 }}
           transition={{ duration: 0.3, ease: 'easeInOut' }}
           className="overflow-hidden"
        >
           <div className="bg-white/50 dark:bg-black/20 backdrop-blur-md border-y border-gray-200/50 dark:border-white/5 py-6">
              <div className="max-w-4xl mx-auto px-4">
                  {subTribes.length === 0 ? (
                      <p className="text-center text-gray-400 italic">No tags found in this domain yet.</p>
                  ) : (
                      <div className="flex flex-wrap justify-center gap-3">
                          {subTribes.map(st => (
                              <button
                                  key={st.id}
                                  onClick={() => onSelectSubTribe(selectedSubTribeId === st.id ? null : st.id)}
                                  className={cn(
                                      "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border",
                                      selectedSubTribeId === st.id
                                          ? "bg-white dark:bg-white/10 shadow-sm scale-105"
                                          : "bg-transparent border-transparent hover:bg-white/40 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400"
                                  )}
                                  style={{
                                      borderColor: selectedSubTribeId === st.id ? color : 'transparent',
                                      color: selectedSubTribeId === st.id ? color : undefined
                                  }}
                              >
                                  {st.name} <span className="opacity-50 ml-1 text-xs">{st.memberCount}</span>
                              </button>
                          ))}
                      </div>
                  )}
              </div>
           </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
