'use client';

import { useState, useRef } from 'react';
import { X, Loader2 } from 'lucide-react';
import { INTERACTION_TYPES, type InteractionType } from '@/lib/relationship-health';
import { logInteraction } from '@/app/actions/logInteraction';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import { BloomEffect } from '@/components/bloom/BloomEffect';
import { getRandomAffirmation } from '@/lib/bloom/affirmations';

interface LogInteractionModalProps {
  contact: {
    id: string;
    name: string;
    initials: string;
    targetFrequencyDays?: number;
    importance?: 'high' | 'medium' | 'low';
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onUpdateImportance?: (newImportance: 'high' | 'medium' | 'low') => Promise<void>;
  onUpdateFrequency?: (newFrequency: number) => Promise<void>;
  initialNote?: string;
  initialMethod?: InteractionType; 
}

// Reordered for UI: Call, Email, Text (Row 1) - In Person, Social, Other (Row 2)
const ORDERED_TYPES: InteractionType[] = ['call', 'email', 'text', 'in-person', 'social', 'other'];

export default function LogInteractionModal({ 
  contact, 
  isOpen, 
  onClose,
  onSuccess, 
  onUpdateImportance,
  onUpdateFrequency,
  initialNote = ''
}: LogInteractionModalProps) {
  const [selectedType, setSelectedType] = useState<InteractionType>('in-person');
  const [note, setNote] = useState(initialNote);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBloom, setShowBloom] = useState(false);
  const [recentInteractions] = useState<any[]>([]);
  const [loadingInteractions] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const noteInputRef = useRef<HTMLTextAreaElement>(null);

  // ... (existing useEffect)

  const loadInteractions = async () => {
    // ... (existing loadInteractions)
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLastError(null); // Clear previous errors

    try {
      const result = await logInteraction({
        personId: contact.id,
        type: selectedType,
        note: note.trim() || undefined,
        date: date ? new Date(date).toISOString() : undefined,
      });

      if (result.success) {
        setShowBloom(true);
        // ... (existing success logic)
        const randomMessage = getRandomAffirmation();
        toast.success(randomMessage, { icon: '🌱', duration: 4000 });
        await loadInteractions();
        
        // Wait a bit for the bloom to show before calling onSuccess or closing
        setTimeout(() => {
          setNote('');
          setDate(new Date().toISOString().split('T')[0]); // Reset date to today
          onSuccess?.();
          setShowBloom(false);
          onClose();
        }, 1500);
      } else {
        const errorMsg = result.error || 'Failed to log interaction';
        toast.error(errorMsg);
        
        // Use details if available, otherwise fallback to the error message
        const debugInfo = result.details ? JSON.stringify(result.details, null, 2) : errorMsg;
        setLastError(debugInfo);
      }
    } catch (err: any) {
      console.error('Error submitting interaction:', err);
      toast.error('An error occurred');
      setLastError(err.message || String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      {/* Backdrop with Blur XL */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl transition-all duration-300"
        onClick={onClose}
      />
      
      {/* Modal Container - Matches Lore Card */}
      <div className="relative bg-[#0F172A]/95 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 h-[90vh] sm:h-auto overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold ring-2 ring-slate-700 shadow-inner">
              {contact.initials}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                {contact.name}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Row (Tier & Frequency) */}
        <div className="px-6 py-3 bg-slate-900/50 border-b border-slate-800 flex items-center gap-6">
            {/* Importance / Tier */}
            <div className="flex flex-col gap-1 w-1/2">
                <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Tier</span>
                {onUpdateImportance ? (
                  <select
                    value={contact.importance || 'medium'}
                    onChange={(e) => onUpdateImportance(e.target.value as 'high' | 'medium' | 'low')}
                    className="text-xs py-1 px-2 -ml-2 rounded-lg border border-transparent hover:border-slate-700 bg-transparent hover:bg-slate-800 text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium transition-colors w-full"
                  >
                    <option value="high">⭐ High (Favorites)</option>
                    <option value="medium">🔹 Medium (Friends)</option>
                    <option value="low">▫️ Low (Contacts)</option>
                  </select>
                ) : (
                    <span className="text-xs text-slate-300 font-medium capitalize flex items-center gap-1">
                        {contact.importance === 'high' ? '⭐ High' : contact.importance === 'low' ? '▫️ Low' : '🔹 Medium'}
                    </span>
                )}
            </div>

            {/* Separator */}
            <div className="h-8 w-px bg-slate-800 shrink-0" />

            {/* Frequency */}
            <div className="flex flex-col gap-1 w-1/2">
                <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Frequency</span>
                {onUpdateFrequency ? (
                  <select
                    value={contact.targetFrequencyDays || 30}
                    onChange={(e) => onUpdateFrequency(Number(e.target.value))}
                    className="text-xs py-1 px-2 -ml-2 rounded-lg border border-transparent hover:border-slate-700 bg-transparent hover:bg-slate-800 text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium transition-colors w-full"
                  >
                    <option value="7">Every 7 days (Weekly)</option>
                    <option value="14">Every 14 days (Bi-weekly)</option>
                    <option value="30">Every 30 days (Monthly)</option>
                    <option value="90">Every 90 days (Quarterly)</option>
                    <option value="180">Every 180 days (Bi-annual)</option>
                    <option value="365">Every 365 days (Yearly)</option>
                  </select>
                ) : (
                  <span className="text-xs text-slate-300 font-medium">
                      {contact.targetFrequencyDays ? `Every ${contact.targetFrequencyDays} days` : 'No target set'}
                  </span>
                )}
            </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Interaction Type Grid */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              How did you connect?
            </label>
            <div className="grid grid-cols-3 gap-3">
              {ORDERED_TYPES.map((typeValue) => {
                const typeInfo = INTERACTION_TYPES.find(t => t.value === typeValue) || { value: typeValue, label: typeValue, emoji: '✨' };
                const isActive = selectedType === typeValue;
                
                return (
                  <button
                    key={typeValue}
                    type="button"
                    onClick={() => setSelectedType(typeValue)}
                    className={cn(
                      "p-3 rounded-xl border transition-all duration-200 text-center flex flex-col items-center justify-center gap-2 h-20 relative group",
                      isActive 
                        ? "border-indigo-500 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.25)]" 
                        : "border-slate-800 bg-slate-900/50 hover:bg-slate-800 hover:border-slate-700"
                    )}
                  >
                    <span className="text-2xl drop-shadow-sm transition-transform group-hover:scale-110 duration-200">{typeInfo.emoji}</span>
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-tight",
                      isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
                    )}>
                      {typeInfo.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Picker */}
          <div>
             <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
               When did this happen?
             </label>
             <input 
                 type="date"
                 value={date}
                 onChange={(e) => setDate(e.target.value)}
                 className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900/50 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all scheme-dark"
             />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              Story / Notes <span className="text-slate-600 font-normal normal-case italic ml-1">(optional)</span>
            </label>
            <textarea
              ref={noteInputRef}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What did you talk about? Any memorable moments?"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900/50 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 resize-none transition-all"
            />
          </div>

          {/* Recent Interactions */}
          {recentInteractions.length > 0 && (
            <div className="border-t border-slate-800 pt-4">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                Recent Interactions
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {recentInteractions.map((interaction, index) => {
                  const typeInfo = INTERACTION_TYPES.find(t => t.value === interaction.type) || { value: interaction.type, label: interaction.type, emoji: '✨' };
                  const date = new Date(interaction.date || interaction.created_at);
                  const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                  return (
                    <div key={interaction.id || index} className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{typeInfo.emoji}</span>
                        <span className="text-xs font-bold text-slate-400 uppercase">{typeInfo.label}</span>
                        <span className="text-xs text-slate-500 ml-auto">{formattedDate}</span>
                      </div>
                      {interaction.notes && (
                        <p className="text-sm text-slate-300 mt-2">{interaction.notes}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {loadingInteractions && recentInteractions.length === 0 && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              <span className="ml-2 text-sm text-slate-400">Loading recent interactions...</span>
            </div>
          )}

          {/* Submit */}
          <div className="relative">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold tracking-wide rounded-xl shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 relative overflow-hidden group z-10"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white/80" />
                  <span className="text-white/90">Logging...</span>
                </>
              ) : (
                <>
                  <span className="relative z-10 flex items-center gap-2">
                    🌱 Log Connection
                  </span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                </>
              )}
            </button>
            <BloomEffect isActive={showBloom} onComplete={() => setShowBloom(false)} />
          </div>
          {/* Error Display */}
          {lastError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg animate-in fade-in slide-in-from-bottom-2">
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">
                      Server Error Details
                  </p>
                  <pre className="text-[9px] text-red-300 overflow-x-auto whitespace-pre-wrap font-mono max-h-32">
                      {lastError}
                  </pre>
              </div>
          )}
        </form>
      </div>
    </div>
  );
}
