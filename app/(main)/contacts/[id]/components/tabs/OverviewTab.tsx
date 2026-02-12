'use client';

import React, { useState } from 'react';
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  Calendar, 
  ChevronDown, 
  MapPin, 
  Tag, 
  Sparkles,
  X,
  Loader2,
  Edit2,
  AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AudioInputButton } from '@/components/audio-input-button';
import { toggleTag } from '@/app/actions/toggle-tag';
import { toggleInterest } from '@/app/actions/toggle-interest';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import toast from 'react-hot-toast';
import { auditDraftMessage } from '@/app/actions/audit-message';
import { addSharedMemory } from '@/app/actions/story-actions';
import { useDebounce } from '@/hooks/use-debounce';

// --- Components from Blueprint ---

const VitalSigns = ({ score, nextDue }: { score: number, nextDue: string }) => {
  const statusLabel = score > 80 ? 'Nurtured' : score > 40 ? 'Drifting' : 'Neglected';
  const statusColor = score > 80 ? 'text-emerald-400' : score > 40 ? 'text-orange-400' : 'text-red-400';
  
  return (
    <div className="w-full bg-slate-900 border border-slate-200/10 rounded-2xl p-5 flex items-center justify-between mb-4 shadow-sm">
      <div className="flex items-center gap-5">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
             <circle cx="28" cy="28" r="24" stroke="#1e293b" strokeWidth="4" fill="transparent" />
             <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" 
               strokeDasharray="150.8" strokeDashoffset={150.8 - (150.8 * score) / 100} 
               className={statusColor} 
             />
          </svg>
          <span className={`absolute text-xs font-black ${statusColor}`}>{score}</span>
        </div>
        <div>
          <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">Health Score</p>
          <p className="text-sm text-slate-200 font-bold">{statusLabel} State</p>
        </div>
      </div>
      <div className="text-right border-l border-slate-800 pl-6">
        <p className="text-[10px] uppercase text-slate-500 font-black tracking-widest mb-1">Next Due</p>
        <p className="text-sm text-indigo-400 font-black uppercase tracking-tight">{nextDue}</p>
      </div>
    </div>
  );
};
  
interface InteractionSuiteProps {
  contactId: string;
  onLog: (note: string, status: 'connected' | 'attempted', date: string, nextDate?: string) => Promise<void>;
  isLogging?: boolean;
  isThin?: boolean;
}
  
const InteractionSuite = ({ contactId, onLog, isLogging, isThin }: InteractionSuiteProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [status, setStatus] = useState<'connected' | 'attempted' | null>(null);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextDate, setNextDate] = useState('');
  
  // Success & Enrichment States
  const [showSuccessEnrichment, setShowSuccessEnrichment] = useState(false);
  const [enrichmentNote, setEnrichmentNote] = useState('');
  const [isEnriching, setIsEnriching] = useState(false);

  const [resonance, setResonance] = useState<{ score: number; point?: string; tweak?: string } | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const debouncedNote = useDebounce(note, 1000);

  React.useEffect(() => {
    async function runAudit() {
      if (!debouncedNote.trim() || debouncedNote.length < 10) {
        setResonance(null);
        return;
      }
      setIsAuditing(true);
      try {
        const result = await auditDraftMessage(contactId, debouncedNote);
        setResonance({
          score: result.resonance_score,
          point: result.primary_friction_point,
          tweak: result.suggested_tweak
        });
      } catch (err) {
        console.error("Audit failed:", err);
      } finally {
        setIsAuditing(false);
      }
    }
    runAudit();
  }, [debouncedNote, contactId]);

  const resonanceColor = !resonance ? 'border-slate-800' : 
    resonance.score < 60 ? 'border-orange-500 shadow-orange-900/20' : 
    resonance.score < 85 ? 'border-slate-200 shadow-slate-900/20' : 
    'border-indigo-400 shadow-indigo-900/40 ring-2 ring-indigo-500/20';

  const handleLogInteraction = async () => {
    if (!status) return; // Note is now optional
    try {
      const wasNoteEmpty = !note.trim();
      await onLog(note, status, date, nextDate);
      
      setNote('');
      setStatus(null);
      setIsExpanded(false);
      setDate(new Date().toISOString().split('T')[0]);
      setNextDate('');
      
      // If profile is thin and no note was provided, show enrichment invitation
      if (wasNoteEmpty) {
        setShowSuccessEnrichment(true);
      } else {
        setShowSuccessEnrichment(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEnrichmentSubmit = async () => {
    if (!enrichmentNote.trim()) return;
    setIsEnriching(true);
    try {
      const result = await addSharedMemory(contactId, enrichmentNote);
      if (result.success) {
        toast.success("Relationship nourished! 🌱", { icon: '✨' });
        setShowSuccessEnrichment(false);
        setEnrichmentNote('');
      } else {
        toast.error("Failed to save detail");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setIsEnriching(false);
    }
  };

  return (
    <div className={cn(
      "w-full bg-slate-900 rounded-2xl border transition-all duration-500 overflow-hidden shadow-lg",
      isExpanded ? resonanceColor : "border-slate-800"
    )}>
      {/* Optional Nudge (Replacing Friction Warning) */}
      {!note.trim() && isThin && isExpanded && (
        <div className="bg-indigo-600/5 border-b border-indigo-500/10 px-5 py-2 flex items-center gap-2 animate-in fade-in duration-500">
          <Sparkles size={12} className="text-indigo-400 opacity-60" />
          <span className="text-[9px] font-black text-indigo-400/80 uppercase tracking-widest">
            Invitation: Reference a specific memory to improve resonance.
          </span>
        </div>
      )}
      {resonance && resonance.score >= 85 && isExpanded && (
        <div className="bg-indigo-600/10 border-b border-indigo-500/20 px-5 py-2 flex items-center gap-2">
          <Sparkles size={12} className="text-indigo-400" />
          <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">High Resonance Active</span>
        </div>
      )}
      <div className={cn("p-5", isExpanded && "border-b border-slate-200/10")}>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">What did you discuss?</label>
          {isExpanded && (
            <div className="flex items-center gap-1">
              <Popover>
                <PopoverTrigger asChild>
                  <button 
                    className="p-1.5 text-indigo-400 hover:bg-slate-800 rounded-lg transition-all"
                    title="AI Sparkle"
                  >
                    <Sparkles size={14} />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2 bg-slate-900 border-slate-700 shadow-2xl z-50" align="end">
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => toast.success('Polite-ifying your note...', { icon: '✨' })}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 rounded-md transition-all text-left"
                    >
                      <MessageSquare size={12} className="text-indigo-400" />
                      Polite-ify Note
                    </button>
                    <button 
                      onClick={() => toast.success('Summarizing into Bio...', { icon: '✨' })}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 rounded-md transition-all text-left"
                    >
                      <Sparkles size={12} className="text-indigo-400" />
                      Summarize to Bio
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
        <div className="relative">
          <textarea
            onFocus={() => setIsExpanded(true)}
            placeholder="Capture thoughts here..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-transparent text-slate-100 placeholder-slate-600 resize-none focus:outline-none min-h-[100px] text-base leading-relaxed"
          />
          <div className="absolute right-0 bottom-0 p-1 flex items-center gap-2">
            {isAuditing && <Loader2 size={12} className="animate-spin text-slate-600" />}
            {resonance && (
              <div className={cn(
                "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter",
                resonance.score < 60 ? "bg-orange-500/20 text-orange-400" :
                resonance.score < 85 ? "bg-slate-800 text-slate-400" :
                "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
              )}>
                R:{resonance.score}
              </div>
            )}
            <AudioInputButton 
              onTranscript={(text) => {
                setNote(prev => prev ? `${prev} ${text}` : text);
                setIsExpanded(true);
              }}
              size="sm"
            />
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-5 pb-5 space-y-5 animate-in fade-in slide-in-from-top-4 duration-500 ease-out">
          <div className="flex gap-4">
            <button 
              onClick={() => setStatus('attempted')} 
              className={cn(
                "flex-1 h-10 rounded-xl border text-sm font-bold uppercase tracking-wide transition-all",
                status === 'attempted' 
                  ? "bg-slate-800 border-slate-200 text-white" 
                  : "border-slate-800 text-slate-500 hover:bg-slate-800/50 hover:border-slate-700 hover:text-slate-400"
              )}
            >
              Attempted
            </button>
            <button 
              onClick={() => setStatus('connected')} 
              className={cn(
                "flex-1 h-10 rounded-xl border text-sm font-bold uppercase tracking-wide transition-all",
                status === 'connected' 
                  ? "bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-900/40" 
                  : "border-slate-800 text-slate-500 hover:bg-slate-800/50 hover:border-slate-700 hover:text-slate-400"
              )}
            >
              ✓ Connected
            </button>
          </div>
          
          <div className="flex gap-3">
            <div className="flex-1 bg-slate-950/50 rounded-xl p-3 border border-slate-200/10 flex items-center gap-3">
              <Calendar size={14} className="text-slate-500" />
              <div className="flex-1 min-w-0">
                <p className="text-[9px] uppercase font-black text-slate-600 tracking-widest mb-0.5">Interaction Date</p>
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-transparent text-slate-200 text-xs font-bold focus:outline-none w-full scheme-dark cursor-pointer" 
                />
              </div>
            </div>

            <div className="flex-1 bg-slate-950/50 rounded-xl p-3 border border-slate-200/10 flex items-center gap-3">
              <Calendar size={14} className="text-slate-500" />
              <div className="flex-1 min-w-0">
                <p className="text-[9px] uppercase font-black text-slate-500 tracking-widest mb-0.5">Schedule Next</p>
                <input 
                  type="date" 
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  className="bg-transparent text-slate-200 text-xs font-bold focus:outline-none w-full scheme-dark cursor-pointer" 
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 sticky bottom-4 z-10 bg-slate-900 pt-2 pb-1">
            <button 
              onClick={handleLogInteraction}
              disabled={isLogging || !status}
              className={cn(
                "flex-1 py-4 font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-xl",
                resonance && resonance.score >= 85 
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/40 ring-2 ring-white/10" 
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300"
              )}
            >
              {isLogging ? 'Logging...' : 'Save Interaction'}
            </button>
            <button 
              onClick={() => {
                setIsExpanded(false);
                setNote('');
                setStatus(null);
              }}
              className="px-5 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl transition-all border border-slate-700"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Optional Success Enrichment */}
      {showSuccessEnrichment && (
        <div className="px-5 py-6 bg-indigo-600/5 border-t border-indigo-500/10 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-400">
              <Sparkles size={14} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-200">Interaction Saved!</p>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Optional Invitation</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <p className="text-xs text-slate-400 leading-relaxed italic">
              "Add a quick detail you want to remember from this chat?"
            </p>
            <textarea
              value={enrichmentNote}
              onChange={(e) => setEnrichmentNote(e.target.value)}
              placeholder="e.g. They just adopted a golden retriever named Rex..."
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all resize-none"
              rows={2}
            />
            <div className="flex gap-3">
              <button
                onClick={handleEnrichmentSubmit}
                disabled={isEnriching || !enrichmentNote.trim()}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg transition-all disabled:opacity-50"
              >
                {isEnriching ? 'Saving Memory...' : 'Save Detail'}
              </button>
              <button
                onClick={() => setShowSuccessEnrichment(false)}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MetadataFolder = ({ children, onEdit }: { children: React.ReactNode, onEdit?: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="mt-12 border-t border-slate-900 pt-2">
      <div className="flex items-center gap-2">
        <button onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-between flex-1 py-6 text-slate-500 hover:text-slate-300 transition-colors group">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] group-hover:tracking-[0.4em] transition-all">Contact Info & Metadata</span>
          <div className={cn("transition-transform duration-300", isOpen ? "rotate-180" : "")}>
            <ChevronDown size={18} />
          </div>
        </button>
        {onEdit && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-3 -mr-2 text-slate-500 hover:text-indigo-400 transition-all active:scale-95"
            title="Edit Contact Info"
          >
            <Edit2 size={16} />
          </button>
        )}
      </div>
      {isOpen && <div className="pb-12 space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">{children}</div>}
    </div>
  );
};

// --- Main Overview Tab ---

interface OverviewTabProps {
  contact: any;
  interactions?: any[];
  onLogInteraction: (note: string, type: 'connected' | 'attempted', date: string, nextDate?: string) => Promise<void>;
  onAvatarClick?: () => void;
  isLogging?: boolean;
  synopsis?: string | null;
  onRefreshAISummary?: () => Promise<void>;
  onEdit?: () => void;
}

export function OverviewTab({ 
  contact, 
  interactions = [], 
  onLogInteraction,
  isLogging,
  synopsis,
  onRefreshAISummary,
  onEdit
}: OverviewTabProps) {
  
  const [tags, setTags] = useState<string[]>(contact.tags || []);
  const [interests, setInterests] = useState<string[]>(contact.interests || []);
  const [tagInput, setTagInput] = useState('');
  const [interestInput, setInterestInput] = useState('');
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [isInterestsOpen, setIsInterestsOpen] = useState(false);
  const [submittingTag, setSubmittingTag] = useState(false);
  const [submittingInterest, setSubmittingInterest] = useState(false);

  // Health Score Logic 
  const daysSince = contact.days_since_last_interaction ?? 30;
  const targetDays = contact.target_frequency_days ?? 30;
  const baseHealthScore = Math.max(0, Math.min(100, Math.round(100 - (daysSince / (targetDays * 1.5)) * 100)));
  const healthScore = Math.min(100, baseHealthScore + (contact.health_boost || 0));
      
  const lastInteractionDate = contact.last_interaction_date ? new Date(contact.last_interaction_date) : null;
  const nextDueDate = lastInteractionDate 
    ? new Date(lastInteractionDate.getTime() + (targetDays * 24 * 60 * 60 * 1000))
    : new Date();
  const nextDueText = nextDueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  const latestInteraction = interactions.length > 0 ? interactions[0] : null;

  const handleAddTag = async () => {
    if (!tagInput.trim()) return;
    const newTag = tagInput.trim();
    setSubmittingTag(true);
    try {
      const result = await toggleTag(contact.id, newTag);
      if (result.success) {
        setTags(prev => [...prev, newTag]);
        setTagInput('');
        setIsTagsOpen(false);
      }
    } catch { toast.error('Failed to add tag'); }
    finally { setSubmittingTag(false); }
  };

  const handleRemoveTag = async (t: string) => {
    try {
      const result = await toggleTag(contact.id, t);
      if (result.success) {
        setTags(prev => prev.filter(tag => tag !== t));
      }
    } catch { toast.error('Failed to remove tag'); }
  };

  const handleAddInterest = async () => {
    if (!interestInput.trim()) return;
    const newInterest = interestInput.trim();
    setSubmittingInterest(true);
    try {
      const result = await toggleInterest(contact.id, newInterest);
      if (result.success) {
        setInterests(prev => [...prev, newInterest]);
        setInterestInput('');
        setIsInterestsOpen(false);
      }
    } catch { toast.error('Failed to add interest'); }
    finally { setSubmittingInterest(false); }
  };

  const handleRemoveInterest = async (i: string) => {
    try {
      const result = await toggleInterest(contact.id, i);
      if (result.success) {
        setInterests(prev => prev.filter(interest => interest !== i));
      }
    } catch { toast.error('Failed to remove interest'); }
  };

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto space-y-8 bg-slate-950 pb-36">
      
      {/* Quick Actions */}
      <section className="grid grid-cols-3 gap-4 px-4 pt-4">
        <QuickActionButton 
          icon={<Phone size={22} />} 
          label="Call" 
          href={contact.phone ? `tel:${contact.phone.replace(/\D/g, '')}` : undefined} 
        />
        <QuickActionButton 
          icon={<Mail size={22} />} 
          label="Email" 
          href={contact.email ? `mailto:${contact.email}` : undefined} 
        />
        <QuickActionButton 
          icon={<MessageSquare size={22} />} 
          label="Text" 
          href={contact.phone ? `sms:${contact.phone.replace(/\D/g, '')}` : undefined} 
        />
      </section>

      {/* AI Synopsis */}
      {synopsis && (
        <section className="px-4 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
          <div className="bg-indigo-600/5 border border-indigo-500/10 rounded-2xl p-6 relative overflow-hidden group shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Sparkles size={16} className="text-indigo-400" />
                <span className="text-[10px] font-black text-indigo-400/80 uppercase tracking-[0.2em]">Relationship Overview</span>
              </div>
              {onRefreshAISummary && (
                <button 
                  onClick={onRefreshAISummary}
                  className="text-slate-600 hover:text-indigo-400 p-2 hover:bg-white/5 rounded-xl transition-all"
                  title="Refresh AI Insight"
                >
                  <Loader2 size={14} className={cn("transition-all", false ? "animate-spin" : "")} />
                </button>
              )}
            </div>
            <p className="text-sm text-slate-400 leading-relaxed italic line-clamp-4 group-hover:line-clamp-none transition-all duration-500">
              &ldquo;{synopsis}&rdquo;
            </p>
          </div>
        </section>
      )}

      <div className="px-4 space-y-8">
        {/* Vital Signs */}
        <VitalSigns score={healthScore} nextDue={nextDueText} />

        {/* Interaction Suite */}
        <InteractionSuite contactId={contact.id} onLog={onLogInteraction} isLogging={isLogging} />

        {/* Recent Activity */}
        <section className="space-y-5">
          <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] px-1">Timeline</h3>
          {latestInteraction ? (
            <div className="bg-slate-900 border border-slate-200/10 rounded-2xl p-6 shadow-sm flex flex-col gap-4 group hover:border-slate-700 transition-all duration-300">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  {new Date(latestInteraction.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border",
                  latestInteraction.notes?.includes('[Attempt]') 
                    ? "border-orange-500/20 text-orange-400 bg-orange-500/5" 
                    : "border-emerald-500/20 text-emerald-400 bg-emerald-500/5"
                )}>
                  {latestInteraction.notes?.includes('[Attempt]') ? 'Follow Up Attempt' : 'Value Exchange'}
                </span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed font-medium">
                {latestInteraction.notes?.replace('[Attempt] ', '') || 'Memory shared.'}
              </p>
            </div>
          ) : (
            <div className="bg-slate-900/40 rounded-2xl p-10 border border-dashed border-slate-800/50 text-center">
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest opacity-60">Empty History</p>
            </div>
          )}
        </section>
        
        {/* Metadata Folder */}
        <MetadataFolder onEdit={onEdit}>
          <div className="space-y-10 animate-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 gap-4">
              <MetadataItem icon={<Mail size={18} />} label="Primary Email" value={contact.email || 'Not set'} />
              <MetadataItem icon={<Phone size={18} />} label="Phone Line" value={contact.phone || 'Not set'} />
              <MetadataItem icon={<MapPin size={18} />} label="Base Hub" value={[contact.city, contact.state].filter(Boolean).join(', ') || 'Not set'} />
            </div>

            {/* Tags Section */}
            <div className="space-y-5">
              <div className="flex items-center justify-between px-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-3">
                  <Tag size={13} className="text-indigo-500" /> Tags
                </label>
                <button 
                  onClick={() => setIsTagsOpen(!isTagsOpen)}
                  className="text-indigo-400 hover:text-indigo-300 text-[10px] font-black tracking-widest transition-colors"
                >
                  {isTagsOpen ? 'CANCEL' : '+ ADD'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {tags.map(tag => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="bg-slate-900 text-slate-300 border-slate-200/10 hover:border-slate-700 h-10 px-5 rounded-xl group transition-all"
                  >
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="ml-3 text-slate-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                      <X size={14} />
                    </button>
                  </Badge>
                ))}
              </div>
              {isTagsOpen && (
                <div className="flex gap-3 animate-in fade-in slide-in-from-top-1">
                  <input 
                    type="text" 
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="Identify with tag..."
                    className="flex-1 bg-slate-900 border border-slate-200/10 rounded-xl px-5 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all font-bold"
                    autoFocus
                  />
                  <Button onClick={handleAddTag} disabled={submittingTag} className="bg-indigo-600 hover:bg-indigo-500 h-[48px] px-6 rounded-xl shadow-lg shadow-indigo-900/30">
                    {submittingTag ? <Loader2 size={18} className="animate-spin" /> : 'Add'}
                  </Button>
                </div>
              )}
            </div>

            {/* Interests Section */}
            <div className="space-y-5">
              <div className="flex items-center justify-between px-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-3">
                  <Sparkles size={13} className="text-indigo-500" /> Interests
                </label>
                <button 
                  onClick={() => setIsInterestsOpen(!isInterestsOpen)}
                  className="text-indigo-400 hover:text-indigo-300 text-[10px] font-black tracking-widest transition-colors"
                >
                  {isInterestsOpen ? 'CANCEL' : '+ ADD'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {interests.map(interest => (
                  <Badge 
                    key={interest} 
                    variant="secondary" 
                    className="bg-slate-900 text-slate-300 border-slate-200/10 hover:border-slate-700 h-10 px-5 rounded-xl group transition-all"
                  >
                    {interest}
                    <button onClick={() => handleRemoveInterest(interest)} className="ml-3 text-slate-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                      <X size={14} />
                    </button>
                  </Badge>
                ))}
              </div>
              {isInterestsOpen && (
                <div className="flex gap-3 animate-in fade-in slide-in-from-top-1">
                  <input 
                    type="text" 
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddInterest()}
                    placeholder="Favorite interest..."
                    className="flex-1 bg-slate-900 border border-slate-200/10 rounded-xl px-5 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all font-bold"
                    autoFocus
                  />
                  <Button onClick={handleAddInterest} disabled={submittingInterest} className="bg-indigo-600 hover:bg-indigo-500 h-[48px] px-6 rounded-xl shadow-lg shadow-indigo-900/30">
                    {submittingInterest ? <Loader2 size={18} className="animate-spin" /> : 'Add'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </MetadataFolder>
      </div>
    </div>
  );
}

const QuickActionButton = ({ icon, label, href }: { icon: React.ReactNode, label: string, href?: string }) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900 border border-slate-200/10 rounded-2xl hover:bg-slate-800/50 transition-all active:scale-[0.98] group shadow-sm">
      <div className="text-indigo-400 group-hover:text-white mb-2 transition-all">{icon}</div>
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300">{label}</span>
    </div>
  );

  if (href) return <a href={href} className="flex-1 no-underline">{content}</a>;
  return (
    <button className="flex-1" onClick={() => toast.error(`No ${label.toLowerCase()} linked`)}>
      {content}
    </button>
  );
};

const MetadataItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
  <div className="flex items-center gap-5 bg-slate-900/40 p-5 rounded-2xl border border-slate-200/10 hover:border-slate-700 transition-all group">
    <div className="text-indigo-400/50 group-hover:text-indigo-400 transition-colors shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-[9px] uppercase font-black text-slate-600 tracking-widest mb-1">{label}</p>
      <p className="text-sm text-slate-300 font-bold truncate tracking-tight">{value}</p>
    </div>
  </div>
);
