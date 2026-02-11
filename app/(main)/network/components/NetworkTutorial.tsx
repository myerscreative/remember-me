'use client';

import { useState } from 'react';
import { 
  X, 
  Search, 
  LayoutGrid, 
  Tag, 
  Heart,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Step {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const steps: Step[] = [
  {
    title: "Find your Seeds",
    description: "Search by interests, skills, or even where you first met.",
    icon: Search,
    color: "text-blue-500 bg-blue-500/10"
  },
  {
    title: "Map your Garden",
    description: "Browse wide categories like Family, Work, or Travel.",
    icon: LayoutGrid,
    color: "text-purple-500 bg-purple-500/10"
  },
  {
    title: "Inspect the Roots",
    description: "Select a domain to reveal sub-tags and see your collective.",
    icon: Tag,
    color: "text-pink-500 bg-pink-500/10"
  },
  {
    title: "Nurture Connections",
    description: "Log interactions to keep your important relationships flourishing.",
    icon: Heart,
    color: "text-red-500 bg-red-500/10"
  }
];

interface NetworkTutorialProps {
  isOpen: boolean;
  onClose: (dontShowAgain: boolean) => void;
}

export function NetworkTutorial({ isOpen, onClose }: NetworkTutorialProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Close Button */}
        <button 
          onClick={() => onClose(dontShowAgain)}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 md:p-8 pb-32 space-y-6 md:space-y-8 overflow-y-auto">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-2">
                <div className="p-2 bg-indigo-500/10 rounded-full">
                    <Sparkles className="w-6 h-6 text-indigo-500" />
                </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight tracking-tight">
              Tools for a Flourishing Garden
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-normal">
              Four ways to tend to your connections and help your relationships grow.
            </p>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isNurture = step.title === "Nurture Connections";
              return (
                <div 
                  key={i} 
                  className={`flex gap-4 px-4 py-2.5 rounded-xl border transition-all hover:shadow-md group ${
                    isNurture 
                      ? "border-red-500/30 bg-red-500/5 dark:bg-red-500/10 scale-[1.02] shadow-sm" 
                      : "border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800"
                  }`}
                >
                  <div className={`shrink-0 p-2 h-10 w-10 rounded-lg flex items-center justify-center ${step.color} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-gray-900 dark:text-gray-100">{step.title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                Don&apos;t show this again
              </span>
            </label>

            <Button
              onClick={() => onClose(dontShowAgain)}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 h-12 rounded-xl font-bold transition-all hover:scale-105 shadow-lg shadow-indigo-500/20"
            >
              Got it, let&apos;s go!
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TutorialButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-500/20"
      title="How to use Tribe Search"
    >
      <HelpCircle className="w-4 h-4" />
      How to use
    </button>
  );
}
