'use client';

import { useState, useEffect } from 'react';
import { extractEntities, extractMilestones, ExtractedEntity } from '@/lib/entity-extractor';
import { addSharedMemory, updateStoryFields } from '@/app/actions/story-actions'; 
import { addMilestone } from '@/app/actions/milestone-actions';
import { Loader2, X, Sparkles, Smile, Meh, Frown, Heart, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

interface PostCallPulseProps {
  contactId: string;
  name: string;
  onClose: () => void;
  onComplete: () => void;
}

export function PostCallPulse({ contactId, name, onClose, onComplete }: PostCallPulseProps) {
  const [step, setStep] = useState(1); // 1: Vibe, 2: Dump & Extract
  const [vibe, setVibe] = useState<number | null>(null);
  const [dumpText, setDumpText] = useState('');
  const [suggestions, setSuggestions] = useState<ExtractedEntity[]>([]);
  const [milestoneSuggestion, setMilestoneSuggestion] = useState<{title: string, detectedDate: string} | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mount Safety Check
  useEffect(() => {
    console.log("PostCallPulse Mounted for:", name);
  }, [name]);

  // Extract entities & milestones as user types
  useEffect(() => {
    try {
        if (dumpText.length > 10) {
            const foundEntities = extractEntities(dumpText);
            setSuggestions(foundEntities);

            const foundMilestone = extractMilestones(dumpText);
            if (foundMilestone) {
                setMilestoneSuggestion({ 
                    title: foundMilestone.title, 
                    detectedDate: foundMilestone.detectedDate 
                });
            } else {
                setMilestoneSuggestion(null);
            }
        }
    } catch (e: any) {
        console.error("Extraction error:", e);
        // Don't crash, just ignore extraction failure
    }
  }, [dumpText]);

  const handleSave = async () => {
    console.log('🔵 [PostCallPulse] Starting save for contact:', contactId);
    setIsSaving(true);
    try {
        const vibeText = vibe ? `[Vibe Check: ${vibe}/5] ` : '';
        const finalContent = `${vibeText}${dumpText}`;
        
        console.log('🔵 [PostCallPulse] Calling addSharedMemory with content:', finalContent.substring(0, 50));
        const result = await addSharedMemory(contactId, finalContent);
        console.log('🔵 [PostCallPulse] addSharedMemory result:', result);
        
        if (result.success) {
          console.log('✅ [PostCallPulse] Save successful, calling onComplete');
          toast.success("Lore captured!");
          onComplete();
        } else {
          console.error('❌ [PostCallPulse] Save failed:', result.error);
          toast.error(result.error || "Failed to save pulse");
          setIsSaving(false);
        }
    } catch (e: any) {
        console.error('❌ [PostCallPulse] Save error:', e);
        toast.error("Failed to save pulse");
        setError(e.message || "Failed to save");
        setIsSaving(false);
    }
  };

  const handleConfirmEntity = async (entity: ExtractedEntity) => {
      setSuggestions(prev => prev.filter(s => s !== entity));
      
      try {
          if (entity.type === 'Family') {
             toast.success(`Added ${entity.value} to Family`);
          } else if (entity.type === 'Interest') {
             toast.success(`Added interest: ${entity.value}`);
          }
      } catch (e) {
          toast.error("Failed to add entity");
      }
  };
  
  const handleConfirmMilestone = async () => {
      if (!milestoneSuggestion) return;
      
      // Simple prompt for now, could be a mini-modal
      // Default to "Event" type
      try {
        await addMilestone(contactId, {
            title: `Event: ${milestoneSuggestion.title} (${name})`, // better title generation needed?
            date: new Date().toISOString(), // In real app, parse `detectedDate` to IOSString. For prototype, current date + logic needed.
            // PROTOTYPE HACK: Just saving it as is, ideally we parse "next friday" to date object.
            type: 'Event'
        });
        toast.success("Milestone set!");
        setMilestoneSuggestion(null);
      } catch (e) {
        toast.error("Failed to set milestone");
      }
  };

  if (error) {
      return (
          <div className="fixed inset-0 bg-[#0f111a] z-100 flex items-center justify-center p-6">
              <div className="bg-slate-900 border border-red-500 rounded-xl p-6 text-center">
                  <h3 className="text-red-400 font-bold mb-2">Error in Pulse</h3>
                  <p className="text-slate-300 mb-4">{error}</p>
                  <button onClick={onClose} className="px-4 py-2 bg-slate-800 rounded-lg hover:bg-slate-700">Close</button>
              </div>
          </div>
      )
  }

  return (
    <div className="fixed inset-0 bg-[#0f111a] z-100 p-6 flex flex-col animate-in slide-in-from-bottom duration-300">
      
      {/* HEADER / NAV */}
      <div className="flex justify-between items-start mb-6">
          <div className="flex gap-1 flex-1 max-w-[200px]">
            <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-indigo-500' : 'bg-indigo-500/20'}`} />
            <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-indigo-500' : 'bg-indigo-500/20'}`} />
          </div>
          <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white">
              <X size={20} />
          </button>
      </div>

      <header className="mb-8">
        <h2 className="text-2xl font-bold text-white">How was the catch-up with {name}?</h2>
        <p className="text-slate-400 text-sm mt-1">Capture the lore while it's fresh.</p>
      </header>

      {/* STEP 1: VIBE CHECK */}
      {step === 1 && (
          <div className="flex-1 flex flex-col justify-center items-center space-y-8 animate-in fade-in slide-in-from-right-4">
              <h3 className="text-indigo-400 text-xs font-black uppercase tracking-widest">Vibe Check</h3>
              <div className="flex gap-4">
                  {[1, 2, 3, 4, 5].map((rating) => (
                      <button 
                        key={rating}
                        onClick={() => setVibe(rating)}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border-2 transition-all ${
                            vibe === rating 
                            ? 'bg-indigo-600 border-indigo-400 scale-110 shadow-[0_0_15px_rgba(99,102,241,0.5)]' 
                            : 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800 hover:scale-105'
                        }`}
                      >
                         {rating === 1 && '😤'}
                         {rating === 2 && '😕'}
                         {rating === 3 && '😐'}
                         {rating === 4 && '🙂'}
                         {rating === 5 && '🤩'}
                      </button>
                  ))}
              </div>
              
              {vibe !== null && (
                  <button 
                    onClick={() => setStep(2)}
                    className="w-full max-w-xs py-4 bg-white text-black rounded-2xl font-bold hover:scale-105 transition-transform"
                  >
                      Next: Brain Dump
                  </button>
              )}
          </div>
      )}

      {/* STEP 2: RAW BRAIN DUMP & EXTRACTION */}
      {step === 2 && (
        <div className="flex-1 flex flex-col space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex-1 flex flex-col">
            <label className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-2 block">
                The Interaction Dump
            </label>
            <textarea 
                autoFocus
                value={dumpText}
                onChange={(e) => setDumpText(e.target.value)}
                placeholder={`Ex: ${name} is moving to Austin in July. His daughter Chloe started violin. We joked about...`}
                className="w-full flex-1 bg-transparent text-slate-200 focus:outline-none leading-relaxed resize-none placeholder:text-slate-600"
            />
            </div>

            {/* SUGGESTION RAIL */}
            {suggestions.length > 0 && (
                <div className="bg-slate-900/50 border border-dashed border-slate-700/50 rounded-2xl p-4 animate-in slide-in-from-bottom-2">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                         <Sparkles size={12} className="text-indigo-400"/> Identifying entities...
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {suggestions.map((entity, i) => (
                        <button 
                            key={i}
                            onClick={() => handleConfirmEntity(entity)}
                            className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 px-3 py-2 rounded-xl whitespace-nowrap hover:bg-indigo-500/20 transition-colors text-left"
                        >
                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                            <div className="flex flex-col items-start">
                                <span className="text-indigo-300 text-xs font-bold">+ Add '{entity.value}'</span>
                                <span className="text-[10px] text-slate-500 uppercase">{entity.type}</span>
                            </div>
                        </button>
                        ))}
                    </div>
                </div>
            )}
            
            {/* MILESTONE SUGGESTION */}
            {milestoneSuggestion && (
                 <div className="bg-indigo-900/20 border border-indigo-500/50 rounded-2xl p-4 animate-in slide-in-from-bottom-3 mt-2">
                     <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/20 rounded-full">
                                <Calendar size={16} className="text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-indigo-300 uppercase tracking-wide">Milestone Detected</p>
                                <p className="text-sm text-white font-medium">"{milestoneSuggestion.detectedDate}"</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleConfirmMilestone}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                        >
                            Set Milestone
                        </button>
                     </div>
                 </div>
            )}

             {/* FOOTER ACTIONS */}
            <footer className="pt-2 flex gap-3">
                <button onClick={onClose} className="flex-1 py-4 bg-slate-800 text-slate-400 hover:text-white rounded-2xl font-bold transition-colors">
                    Discard
                </button>
                <button 
                    onClick={handleSave}
                    disabled={!dumpText.trim() || isSaving}
                    className="flex-2 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:scale-100"
                >
                    {isSaving ? <Loader2 className="animate-spin"/> : 'Save to Garden'}
                </button>
            </footer>
        </div>
      )}

    </div>
  );
}
