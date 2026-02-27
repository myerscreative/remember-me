'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronDown, ChevronRight, Tag } from 'lucide-react';
import { SubTribe, NetworkData } from './NetworkDataService';
import { TribeView } from './TribeView';
import { cn } from '@/lib/utils';

interface NetworkInspectViewProps {
  data: NetworkData;
  onBack: () => void;
  onNurtureTribe: (tribe: SubTribe) => void;
}

const ICON_MAP: Record<string, string> = {
  'users': '👥',
  'heart': '❤️',
  'trophy': '🏆',
  'briefcase': '💼',
  'plane': '✈️',
};

export function NetworkInspectView({ data, onBack, onNurtureTribe }: NetworkInspectViewProps) {
  const [expandedDomainId, setExpandedDomainId] = useState<string | null>(null);
  const [selectedSubTribeId, setSelectedSubTribeId] = useState<string | null>(null);

  // Filter domains that have members
  const activeDomains = useMemo(() => {
    return data.domains.filter(d => d.totalMembers > 0);
  }, [data.domains]);

  const expandedDomain = useMemo(() => {
    return activeDomains.find(d => d.domain.id === expandedDomainId) || null;
  }, [activeDomains, expandedDomainId]);

  const selectedSubTribe = useMemo(() => {
    if (!expandedDomain || !selectedSubTribeId) return null;
    return expandedDomain.subTribes.find(st => st.id === selectedSubTribeId) || null;
  }, [expandedDomain, selectedSubTribeId]);

  const handleDomainClick = (domainId: string) => {
    if (expandedDomainId === domainId) {
      setExpandedDomainId(null);
      setSelectedSubTribeId(null);
    } else {
      setExpandedDomainId(domainId);
      setSelectedSubTribeId(null);
    }
  };

  const handleSubTribeClick = (subTribeId: string) => {
    setSelectedSubTribeId(selectedSubTribeId === subTribeId ? null : subTribeId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-white">Inspect the Roots</h2>
          <p className="text-sm text-slate-400">Explore your network by domain and tag</p>
        </div>
      </div>

      {/* Domain List — Vertical Stack */}
      <div className="space-y-3 max-w-2xl mx-auto">
        {activeDomains.length === 0 && (
          <div className="text-center py-16">
            <Tag className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500">No domains found. Add tags and interests to your contacts to see them here.</p>
          </div>
        )}

        {activeDomains.map((group) => {
          const isExpanded = expandedDomainId === group.domain.id;
          const emoji = ICON_MAP[group.domain.icon] || '📁';

          return (
            <div key={group.domain.id} className="space-y-2">
              {/* Domain Card */}
              <button
                onClick={() => handleDomainClick(group.domain.id)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                  isExpanded
                    ? "bg-slate-800/80 border-slate-600 shadow-lg"
                    : "bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-600"
                )}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ backgroundColor: `${group.domain.color}15` }}
                >
                  {emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-base">{group.domain.name}</h3>
                  <p className="text-xs text-slate-400">
                    {group.totalMembers} {group.totalMembers === 1 ? 'person' : 'people'} · {group.subTribes.length} {group.subTribes.length === 1 ? 'tag' : 'tags'}
                  </p>
                </div>
                <div className="shrink-0 text-slate-400">
                  {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </div>
              </button>

              {/* Sub-Tags Accordion */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <div className="pl-4 space-y-1.5 pb-2">
                      {group.subTribes.map((subTribe) => {
                        const isSelected = selectedSubTribeId === subTribe.id;
                        return (
                          <button
                            key={subTribe.id}
                            onClick={() => handleSubTribeClick(subTribe.id)}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-all text-left text-sm",
                              isSelected
                                ? "bg-indigo-600/15 border-indigo-500/30 text-indigo-300"
                                : "bg-slate-800/20 border-transparent text-slate-300 hover:bg-slate-800/50 hover:border-slate-700"
                            )}
                          >
                            <Tag className="w-3.5 h-3.5 shrink-0 opacity-60" />
                            <span className="flex-1 truncate font-medium">{subTribe.name}</span>
                            <span className={cn(
                              "shrink-0 text-xs font-bold px-2 py-0.5 rounded-full",
                              isSelected ? "bg-indigo-500/20 text-indigo-300" : "bg-slate-700/50 text-slate-400"
                            )}>
                              {subTribe.memberCount}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Selected Sub-Tribe Results */}
      {selectedSubTribe && (
        <motion.div
          key={selectedSubTribe.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-4"
        >
          <TribeView
            tribes={[selectedSubTribe]}
            searchTerm={selectedSubTribe.name}
            onNurtureTribe={onNurtureTribe}
          />
        </motion.div>
      )}

      {/* Empty state when domain expanded but no subtribe selected */}
      {expandedDomainId && !selectedSubTribeId && (
        <div className="text-center py-12 animate-in fade-in duration-500">
          <p className="text-slate-500 text-sm">Select a tag above to see the people in that group.</p>
        </div>
      )}
    </motion.div>
  );
}
