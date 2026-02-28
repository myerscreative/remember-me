'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Tag,
  Heart,
  Sparkles,
  Info,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ToolCard {
  title: string;
  description: string;
  detailedDescription: string;
  icon: React.ElementType;
  color: string;
  route: 'search' | 'inspect' | 'nurture';
}

const tools: ToolCard[] = [
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

// Stagger animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1
    }
  }
} as const;

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' as const }
  }
};

interface GardenHubProps {
  onNavigate: (view: 'search' | 'inspect' | 'nurture') => void;
}

export function GardenHub({ onNavigate }: GardenHubProps) {
  const [expandedInfo, setExpandedInfo] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center w-full max-w-2xl mx-auto py-8 md:py-16 px-4 space-y-8"
    >
      {/* Header */}
      <div className="text-center space-y-3">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="flex justify-center mb-1"
        >
          <div className="p-3 bg-indigo-500/10 rounded-full">
            <Sparkles className="w-7 h-7 text-indigo-500" />
          </div>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight tracking-tight"
        >
          Tools for a Flourishing Garden
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="text-sm md:text-base text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-normal"
        >
          Four ways to tend to your connections and help your relationships grow.
        </motion.p>
      </div>

      {/* Tool Cards — Staggered */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full space-y-4"
      >
        {tools.map((tool, i) => {
          const Icon = tool.icon;
          const isNurture = tool.route === 'nurture';

          return (
            <motion.button
              key={i}
              variants={cardVariants}
              onClick={() => onNavigate(tool.route)}
              className={`relative flex w-full text-left gap-4 px-5 py-4 rounded-xl border transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 group ${
                isNurture
                  ? "border-red-500/30 bg-red-500/5 dark:bg-red-500/10 shadow-sm"
                  : "border-gray-200 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800"
              }`}
            >
              <div className={`shrink-0 p-2.5 h-11 w-11 rounded-lg flex items-center justify-center ${tool.color} group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">
                    {tool.title}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setExpandedInfo(i);
                    }}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-colors"
                    title={`More info about ${tool.title}`}
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed pr-6">
                  {tool.description}
                </p>
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Info Overlay */}
      {expandedInfo !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setExpandedInfo(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors bg-gray-50 dark:bg-gray-800/50 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4 pr-8">
              <div className={`shrink-0 p-2 h-10 w-10 rounded-lg flex items-center justify-center ${tools[expandedInfo].color}`}>
                {(() => {
                  const Icon = tools[expandedInfo].icon;
                  return <Icon className="w-5 h-5" />;
                })()}
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                {tools[expandedInfo].title}
              </h3>
            </div>

            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-[15px]">
              {tools[expandedInfo].detailedDescription}
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
    </motion.div>
  );
}
