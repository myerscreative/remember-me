'use client';

import { useState } from 'react';
import { 
  X, 
  Search, 
  Tag, 
  Heart,
  HelpCircle,
  Sparkles,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Step {
  title: string;
  description: string;
  detailedDescription: string;
  icon: React.ElementType;
  color: string;
  route: 'search' | 'inspect' | 'nurture';
}

const steps: Step[] = [
  {
    title: "Search & Filter",
    description: "Search for specific people, or browse by broad life areas like Family or Work.",
    detailedDescription: "Use the search bar to find exactly who you're looking for by name, skill, or location. Alternatively, click the categories below the search bar to quickly filter your network into broad groups like Family, Work, or College.",
    icon: Search,
    color: "text-blue-500 bg-blue-500/10",
    route: 'search'
  },
  {
    title: "Inspect the Roots",
    description: "Select a domain to reveal sub-tags and see your collective.",
    detailedDescription: "Once you select a broad category, use the sub-tags to filter your view further. This reveals the specific overlapping communities you belong to within that broader area.",
    icon: Tag,
    color: "text-pink-500 bg-pink-500/10",
    route: 'inspect'
  },
  {
    title: "Nurture Connections",
    description: "Log interactions to keep your important relationships flourishing.",
    detailedDescription: "Use the Quick Capture feature to note when you last interacted with someone. This helps you keep track of who you are staying in touch with and which relationships might need a little tending to.",
    icon: Heart,
    color: "text-red-500 bg-red-500/10",
    route: 'nurture'
  }
];

interface NetworkTutorialProps {
  isOpen: boolean;
  onClose: (dontShowAgain: boolean) => void;
  onNavigate: (view: 'search' | 'inspect' | 'nurture') => void;
}

export function NetworkTutorial({ isOpen, onClose, onNavigate }: NetworkTutorialProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [expandedInfo, setExpandedInfo] = useState<number | null>(null);

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
                <button 
                  key={i} 
                  onClick={() => {
                    onClose(dontShowAgain);
                    onNavigate(step.route);
                  }}
                  className={`flex w-full text-left gap-4 px-4 py-2.5 rounded-xl border transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 overflow-hidden group ${
                    isNurture 
                      ? "border-red-500/30 bg-red-500/5 dark:bg-red-500/10 scale-[1.02] shadow-sm" 
                      : "border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800"
                  }`}
                >
                  <div className={`shrink-0 p-2 h-10 w-10 rounded-lg flex items-center justify-center ${step.color} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 w-full">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-gray-900 dark:text-gray-100">{step.title}</h4>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setExpandedInfo(i);
                        }}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-colors"
                        title={`More info about ${step.title}`}
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed pr-6">
                      {step.description}
                    </p>
                  </div>
                </button>
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

        {/* Info Modal */}
        {expandedInfo !== null && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 animate-in zoom-in-95 duration-200">
              <button 
                onClick={() => setExpandedInfo(null)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors bg-gray-50 dark:bg-gray-800/50 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3 mb-4 pr-8">
                <div className={`shrink-0 p-2 h-10 w-10 rounded-lg flex items-center justify-center ${steps[expandedInfo].color}`}>
                  {(() => {
                    const Icon = steps[expandedInfo].icon;
                    return <Icon className="w-5 h-5" />;
                  })()}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                  {steps[expandedInfo].title}
                </h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-[15px]">
                {steps[expandedInfo].detailedDescription}
              </p>
              
              <div className="mt-6">
                <Button 
                  onClick={() => setExpandedInfo(null)} 
                  className="w-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 shadow-none font-semibold"
                >
                  Got it
                </Button>
              </div>
            </div>
          </div>
        )}
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
