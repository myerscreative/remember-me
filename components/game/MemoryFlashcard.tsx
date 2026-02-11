"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";

interface Contact {
  id: string;
  first_name: string;
  name: string;
  story?: {
    whatMatters?: string;
  };
}

export const MemoryFlashcard = ({ 
  contact, 
  factType,
  onRememberedAction 
}: { 
  contact: Contact, 
  factType: string,
  onRememberedAction?: () => void
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="w-full h-80 perspective-1000 cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
        {/* Front: The Question */}
        <div className="absolute inset-0 backface-hidden bg-slate-900 border border-slate-800 rounded-4xl flex flex-col items-center justify-center p-8 text-center shadow-2xl">
          <p className="text-indigo-400 text-sm font-black uppercase tracking-[0.2em] mb-4">{factType}</p>
          <h3 className="text-2xl font-bold text-white mb-2">What is important to</h3>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-purple-400 mb-6">
            {contact.first_name || contact.name.split(' ')[0]}
          </h2>
          <p className="mt-8 text-slate-500 text-sm italic font-medium">Tap to reveal memory...</p>
          
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 w-1/3 animate-shimmer" />
          </div>
        </div>

        {/* Back: The Answer (The Story) */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-indigo-950 border border-indigo-500/50 rounded-4xl flex flex-col items-center justify-center p-8 text-center shadow-2xl overflow-hidden">
          {/* Decorative Glow */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />

          <h3 className="text-indigo-300 text-sm font-black uppercase tracking-[0.2em] mb-6 relative z-10">From your Story:</h3>
          <div className="relative z-10 max-w-sm">
             <span className="text-4xl text-indigo-400/30 absolute -top-4 -left-6 serif font-serif">&ldquo;</span>
             <p className="text-xl text-white italic font-medium leading-relaxed">
               {contact.story?.whatMatters || "You haven't added a 'What Matters' story for this contact yet. Focus on their current goals or passions."}
             </p>
             <span className="text-4xl text-indigo-400/30 absolute -bottom-8 -right-4 serif font-serif">&rdquo;</span>
          </div>
          
          <button 
            className="mt-12 group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-indigo-600 rounded-2xl hover:bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.4)] active:scale-95"
            onClick={(e) => {
              e.stopPropagation();
              onRememberedAction?.();
            }}
          >
            <span className="flex items-center gap-2">
              <Check size={20} className="stroke-[3px]" />
              I Remembered!
            </span>
          </button>
        </div>
      </div>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};
