'use client';

import React, { useState, useEffect } from 'react';
import { X, Droplets, Loader2 } from 'lucide-react';
import { nurtureTribe } from '@/app/actions/nurture-tribe';
import toast from 'react-hot-toast';
import { useGameStats } from '@/hooks/useGameStats';
import { BloomEffect } from '@/components/bloom/BloomEffect';
import { getRandomAffirmation } from '@/lib/bloom/affirmations';

interface Contact {
  id: string;
  name: string;
}

interface LogGroupInteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  tribeName: string;
  contacts: Contact[];
}

const TRIBE_TEMPLATES: Record<string, string> = {
  NASA: "Hey [Name], saw some news about [Topic] and thought of our time on the mission. Hope you're well!",
  Basketball: "Yo [Name], been a minute since the court. How’s the jump shot? Let's get a run in soon!",
  Japan: "Hi [Name], was just thinking about that trip to [Location]. Hope life is treating you great!",
  Default: "Hey [Name], just checking in. You popped into my head today—hope all is well!"
};

export default function LogGroupInteractionModal({ isOpen, onClose, onSuccess, tribeName, contacts }: LogGroupInteractionModalProps) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [showBloom, setShowBloom] = useState(false);
  const { addXP } = useGameStats();

  useEffect(() => {
    if (isOpen) {
      const template = TRIBE_TEMPLATES[tribeName] || TRIBE_TEMPLATES.Default;
      const initialNotes = template.replace('[Name]', 'everyone');
      const timer = setTimeout(() => {
        setNotes(initialNotes);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, tribeName]);

  if (!isOpen) return null;

  const handleWaterTribe = async () => {
    setLoading(true);
    const contactIds = contacts.map(c => c.id);
    const res = await nurtureTribe(contactIds, 'other', notes);
    
    if (res.success) {
      setShowBloom(true);
      const xp = (res as any).xpAwarded || 0;
      const affirmation = getRandomAffirmation();
      if (xp > 0) {
        addXP(xp);
        toast.success(`${affirmation} (+${xp} XP)`, { icon: '🌿' });
      } else {
        toast.success(affirmation, { icon: '🌿' });
      }
      onSuccess?.();
      setTimeout(() => {
        setShowBloom(false);
        onClose();
      }, 1500);
    } else {
      toast.error(res.error || "Failed to water tribe");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#0F172A] border border-[#1E293B] flex flex-col overflow-hidden rounded-none shadow-none">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1E293B]">
          <div className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-[#38BDF8]" />
            <h3 className="text-lg font-bold text-white uppercase tracking-tight">Watering {contacts.length} Contacts</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-slate-400 text-sm">
            You are logging an interaction for <span className="text-white font-medium">{contacts.length} people</span> in the <span className="text-white font-medium">{tribeName}</span> tribe.
          </p>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#38BDF8] uppercase tracking-wider">Message / Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-32 bg-[#1E293B] border border-[#334155] text-white p-3 focus:outline-none focus:border-[#38BDF8] resize-none rounded-none shadow-none"
              placeholder="What did you say?"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {contacts.slice(0, 5).map(c => (
              <span key={c.id} className="text-[10px] bg-[#334155] text-slate-300 px-2 py-1 uppercase font-bold tracking-tighter">
                {c.name}
              </span>
            ))}
            {contacts.length > 5 && (
              <span className="text-[10px] bg-[#334155] text-slate-300 px-2 py-1 uppercase font-bold tracking-tighter">
                + {contacts.length - 5} More
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1E293B] flex justify-end">
          <div className="relative">
            <button
              onClick={handleWaterTribe}
              disabled={loading}
              className="flex items-center gap-2 bg-[#38BDF8] hover:bg-[#0EA5E9] text-[#0F172A] px-6 py-2 font-black uppercase tracking-widest text-sm disabled:opacity-50 transition-all rounded-none shadow-none relative z-10"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Droplets className="w-4 h-4" />}
              Water Tribe
            </button>
            <BloomEffect isActive={showBloom} onComplete={() => setShowBloom(false)} />
          </div>
        </div>
      </div>
    </div>
  );
}
