
"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Zap, Gamepad2, Database, Palette, Check } from "lucide-react";
import { Unlock } from "@/lib/game/levelingService";

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  level: number;
  title: string;
  unlocks: Unlock[];
}

/**
 * Petal/Leaf Confetti Component
 */
const PetalConfetti = () => {
  interface Petal {
    id: number;
    duration: number;
    delay: number;
    size: number;
    startX: number;
    rotate: number;
    drift: number;
    color: string;
  }
  const [petals, setPetals] = useState<Petal[]>([]);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setPetals(Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        duration: 3 + Math.random() * 4,
        delay: Math.random() * 5,
        size: 10 + Math.random() * 15,
        startX: Math.random() * 100,
        rotate: Math.random() * 360,
        drift: Math.random() * 20 - 10,
        color: ["#fbcfe8", "#f9a8d4", "#d1fae5", "#6ee7b7", "#ddd6fe"][Math.floor(Math.random() * 5)]
      })));
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {petals.map((p) => (
        <motion.div
          key={p.id}
          initial={{ 
            top: "-10%", 
            left: `${p.startX}%`, 
            rotate: 0, 
            opacity: 0,
            scale: 0.5
          }}
          animate={{ 
            top: "110%", 
            left: [`${p.startX}%`, `${p.startX + p.drift}%`],
            rotate: p.rotate + 720,
            opacity: [0, 1, 1, 0],
            scale: 1
          }}
          transition={{ 
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear"
          }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size * 1.5,
            backgroundColor: p.color,
            borderRadius: "50% 0 50% 50%",
            filter: "blur(0.5px)",
            zIndex: 1
          }}
        />
      ))}
    </div>
  );
};

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  isOpen,
  onClose,
  level,
  title,
  unlocks
}) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShowContent(true), 300);
      return () => clearTimeout(timer);
    } else {
      // Use requestAnimationFrame to avoid "cascading renders" error in some React versions
      const frame = requestAnimationFrame(() => setShowContent(false));
      return () => cancelAnimationFrame(frame);
    }
  }, [isOpen]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'GAME_MODE': return <Gamepad2 className="text-indigo-400" size={20} />;
      case 'SLOT': return <Database className="text-purple-400" size={20} />;
      case 'GARDEN_SKIN': return <Palette className="text-pink-400" size={20} />;
      default: return <Zap className="text-yellow-400" size={20} />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-100 flex items-center justify-center p-4 md:p-6"
        >
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" />
          
          {/* Confetti */}
          <PetalConfetti />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg z-10"
          >
            {/* The Gradient Border Card */}
            <div className="p-[2px] rounded-[3rem] bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_50px_rgba(99,102,241,0.3)]">
              <div className="bg-slate-900 rounded-[2.9rem] overflow-hidden p-8 md:p-10 text-center">
                
                {/* Level Badge */}
                <motion.div 
                  initial={{ rotate: -10, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-linear-to-br from-indigo-500 to-purple-600 mb-6 shadow-2xl relative"
                >
                  <Trophy size={48} className="text-white" />
                  <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center border-4 border-slate-900 font-black text-white text-sm">
                    {level}
                  </div>
                </motion.div>

                <motion.h2 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: showContent ? 1 : 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight"
                >
                  Level Up!
                </motion.h2>
                
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <span className="text-xl md:text-2xl font-bold bg-linear-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                    {title}
                  </span>
                </motion.div>

                <div className="mt-10 space-y-4 text-left">
                  <p className="text-sm font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Unlocks</p>
                  
                  {unlocks.map((unlock, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.6 + (idx * 0.1) }}
                      className="group flex items-center gap-4 p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 hover:border-indigo-500/50 transition-colors"
                    >
                      <div className="p-3 bg-slate-900 rounded-xl">
                        {getIcon(unlock.type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-white text-base leading-tight">{unlock.name}</h4>
                        <p className="text-xs text-slate-400 font-medium">{unlock.description}</p>
                      </div>
                      <div className="p-1 bg-indigo-500/10 rounded-full">
                        <Check size={14} className="text-indigo-400 stroke-[3px]" />
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1 }}
                  onClick={onClose}
                  className="w-full mt-10 px-8 py-5 bg-white text-slate-950 font-black rounded-3xl shadow-[0_10px_30px_rgba(255,255,255,0.1)] hover:shadow-[0_15px_40px_rgba(255,255,255,0.2)] hover:scale-[1.02] transform transition-all active:scale-95 text-lg flex items-center justify-center gap-2"
                >
                  Keep Nurturing
                  <Zap size={20} className="fill-slate-950" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
