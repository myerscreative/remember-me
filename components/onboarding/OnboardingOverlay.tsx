'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, HeartPulse, BookOpenText } from 'lucide-react';

interface OnboardingOverlayProps {
  contactName: string;
  onStepChange: (tab: 'Overview' | 'Story' | 'Family' | 'Brain Dump') => void;
  onClose: () => void;
}

const steps = [
  {
    targetId: 'tour-health-score',
    title: 'Relationship Pulse',
    icon: <HeartPulse className="w-5 h-5 text-indigo-300" />,
    body: () => `This is the Relationship Pulse. It’s not a grade; it’s a reminder. When life gets busy, we’ll let you know who is drifting so you can reach out with intention.`,
    buttonText: 'Got it.',
    tab: 'Overview',
  },
  {
    targetId: 'tour-story-cards',
    title: 'The Story',
    icon: <BookOpenText className="w-5 h-5 text-indigo-300" />,
    body: () => `We believe the Story matters more than the stats. Capture the 'Deep Lore' and the 'Why' here to keep the soul of your connection alive.`,
    buttonText: 'Next',
    tab: 'Story',
  },
  {
    targetId: 'tour-brain-dump-button',
    title: 'The Engine',
    icon: <Sparkles className="w-5 h-5 text-indigo-300" />,
    body: (name: string) => `Don't just take notes. Use the Brain Dump after a hangout. Our AI will synthesize your thoughts and automatically update ${name}'s Story for you.`,
    buttonText: 'Start Nurturing',
    tab: 'Brain Dump',
  },
] as const;

export function OnboardingOverlay({ contactName, onStepChange, onClose }: OnboardingOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<{ left: number, top: number, width: number, height: number } | null>(null);
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('remember-me-tour-seen');
    }
    return false;
  });

  const updateTargetRect = useCallback(() => {
    const element = document.getElementById(steps[currentStep].targetId);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      });
    }
  }, [currentStep]);

  useEffect(() => {
    if (isVisible) {
      // Allow for tab transitions and layout shifts
      const timer = setTimeout(updateTargetRect, 200);
      window.addEventListener('resize', updateTargetRect);
      window.addEventListener('scroll', updateTargetRect, true);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updateTargetRect);
        window.removeEventListener('scroll', updateTargetRect, true);
      };
    }
  }, [isVisible, currentStep, updateTargetRect]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      const targetTab = steps[nextStep].tab;
      onStepChange(targetTab);
      setCurrentStep(nextStep);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    localStorage.setItem('remember-me-tour-seen', 'true');
    setIsVisible(false);
    onClose();
  };

  if (!isVisible) return null;

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-100 pointer-events-none overflow-hidden">
      {/* Background SVG with Spotlight hole using Mask */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <motion.rect 
              animate={{
                x: (targetRect?.left ?? 0) - 8,
                y: (targetRect?.top ?? 0) - 8,
                width: (targetRect?.width ?? 0) + 16,
                height: (targetRect?.height ?? 0) + 16,
              }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              rx="16"
              fill="black" 
            />
          </mask>
        </defs>
        <rect 
          x="0" 
          y="0" 
          width="100%" 
          height="100%" 
          fill="rgba(0,0,0,0.7)" 
          mask="url(#spotlight-mask)" 
          className="pointer-events-auto cursor-default" 
        />
      </svg>

      {/* Skip button */}
      <button 
        onClick={handleClose}
        className="absolute top-8 right-8 text-slate-400 hover:text-white transition-colors flex items-center gap-2 font-bold text-sm pointer-events-auto group"
      >
        Skip Tour 
        <div className="p-1.5 rounded-full bg-slate-800/50 group-hover:bg-slate-700 transition-colors">
          <X size={16} />
        </div>
      </button>

      {/* Tooltip Card */}
      <AnimatePresence mode="wait">
        {targetRect && (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="absolute p-6 bg-slate-900 border border-slate-700/50 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-[320px] pointer-events-auto"
            style={{
              left: Math.min(window.innerWidth - 340, Math.max(20, targetRect.left + targetRect.width / 2 - 160)),
              top: targetRect.top + targetRect.height + 30 > window.innerHeight - 250 
                ? targetRect.top - 240 // Show above if too low
                : targetRect.top + targetRect.height + 30, // Show below normally
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                {step.icon}
              </div>
              <h3 className="text-indigo-300 font-bold text-lg tracking-tight">{step.title}</h3>
            </div>
            
            <p className="text-white text-[15px] leading-relaxed mb-6 opacity-90">
              {step.body(contactName)}
            </p>
            
            <button
              onClick={handleNext}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              {step.buttonText}
            </button>
            
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
              <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <motion.div 
                    key={i} 
                    animate={{ 
                      width: i === currentStep ? 24 : 6,
                      backgroundColor: i === currentStep ? '#818cf8' : '#334155'
                    }}
                    className="h-1.5 rounded-full" 
                  />
                ))}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
