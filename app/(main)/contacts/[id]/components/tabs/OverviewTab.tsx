'use client';

import React, { useState } from 'react';
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  Calendar, 
  ChevronUp, 
  ChevronDown, 
  MapPin, 
  Cake, 
  Tag, 
  Sparkles,
  X,
  Plus,
  Loader2,
  Camera
} from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AudioInputButton } from '@/components/audio-input-button';
import { toggleTag } from '@/app/actions/toggle-tag';
import { toggleInterest } from '@/app/actions/toggle-interest';
import toast from 'react-hot-toast';

// --- Components from Blueprint ---

const VitalSigns = ({ score, nextDue }: { score: number, nextDue: string }) => {
  const statusColor = score > 80 ? 'text-emerald-400' : score > 40 ? 'text-orange-400' : 'text-red-400';
  
  return (
    <div className={cn(
      "w-full bg-slate-900/50 rounded-xl border p-4 flex items-center justify-between my-4 transition-all duration-300",
      "border-slate-200 shadow-xl shadow-black/20" 
    )}>
      <div className="flex items-center gap-4">
        <div className="relative flex items-center justify-center w-14 h-14">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-800" />
            <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" 
              strokeDasharray={150.8} 
              strokeDashoffset={150.8 - (150.8 * score) / 100} 
              className={statusColor} 
            />
          </svg>
          <span className={`absolute text-sm font-bold ${statusColor}`}>{score}</span>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Health Score</p>
          <p className="text-sm text-slate-300 font-medium">Nurtured State</p>
        </div>
      </div>
      <div className="text-right border-l border-slate-800 pl-4">
        <p className="text-[9px] uppercase text-slate-500">Next Due</p>
        <p className="text-xs text-indigo-400 font-bold">{nextDue}</p>
      </div>
    </div>
  );
};

interface InteractionSuiteProps {
  onLog: (note: string, status: 'connected' | 'attempted', date: string, nextDate?: string) => Promise<void>;
  isLogging?: boolean;
}

const InteractionSuite = ({ onLog, isLogging }: InteractionSuiteProps) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [status, setStatus] = React.useState<'connected' | 'attempted' | null>(null);
  const [note, setNote] = React.useState('');
  const [nextDate, setNextDate] = React.useState('');

  const handleLogInteraction = async () => {
    if (!note.trim() || !status) return;
    try {
      await onLog(note, status, new Date().toISOString(), nextDate);
      setNote('');
      setStatus(null);
      setIsExpanded(false);
      setNextDate('');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full bg-slate-900 rounded-xl border border-slate-200 overflow-hidden shadow-lg transition-all duration-300">
      <div className="p-4">
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">New Interaction</label>
        <div className="relative">
          <textarea
            onFocus={() => setIsExpanded(true)}
            placeholder="What did you discuss?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 resize-none focus:outline-none min-h-[80px] text-base"
          />
          <div className="absolute right-0 bottom-0 pb-2">
            <AudioInputButton 
              onTranscript={(text) => setNote(prev => prev ? `${prev} ${text}` : text)}
              size="sm"
            />
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex gap-2">
            <button 
              onClick={() => setStatus('attempted')} 
              className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-all ${status === 'attempted' ? 'bg-slate-700 border-slate-400 text-white' : 'border-slate-800 text-slate-500 hover:border-slate-600'}`}
            >
              Attempted
            </button>
            <button 
              onClick={() => setStatus('connected')} 
              className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-all ${status === 'connected' ? 'bg-indigo-600 border-indigo-400 text-white' : 'border-slate-800 text-slate-500 hover:border-slate-600'}`}
            >
              ✓ Connected
            </button>
          </div>
          <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800 flex items-center gap-3">
            <Calendar size={18} className="text-indigo-400" />
            <div className="flex-1">
              <p className="text-[10px] uppercase font-bold text-slate-500">Schedule Next Contact</p>
              <input 
                type="date" 
                value={nextDate}
                onChange={(e) => setNextDate(e.target.value)}
                className="bg-transparent text-slate-200 text-sm focus:outline-none w-full scheme-dark" 
              />
            </div>
          </div>
          <button 
            onClick={handleLogInteraction}
            disabled={isLogging || !note.trim() || !status}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors shadow-lg shadow-indigo-900/40"
          >
            {isLogging ? 'Logging...' : 'Log Interaction'}
          </button>
        </div>
      )}
    </div>
  );
};

const MetadataFolder = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <div className="mt-8 border-t border-slate-800">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-between w-full py-5 text-slate-500 hover:text-slate-300 transition-colors group">
        <span className="text-sm font-bold uppercase tracking-widest group-hover:tracking-wider transition-all">Contact Info & Metadata</span>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {isOpen && <div className="pb-10 space-y-6 animate-in fade-in zoom-in-95 duration-200">{children}</div>}
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
}

export function OverviewTab({ 
  contact, 
  interactions = [], 
  onLogInteraction,
  onAvatarClick,
  isLogging 
}: OverviewTabProps) {
  
  // Tag/Interest Management States
  const [tags, setTags] = useState<string[]>(contact.tags || []);
  const [interests, setInterests] = useState<string[]>(contact.interests || []);
  const [tagInput, setTagInput] = useState('');
  const [interestInput, setInterestInput] = useState('');
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [isInterestsOpen, setIsInterestsOpen] = useState(false);
  const [submittingTag, setSubmittingTag] = useState(false);
  const [submittingInterest, setSubmittingInterest] = useState(false);

  // Identity Hero Data
  const name = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.name;
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const birthdayText = contact.birthday 
    ? new Date(contact.birthday).toLocaleDateString(undefined, { month: 'long', day: 'numeric', timeZone: 'UTC' })
    : 'Not set';

  // Health Score Logic 
  const daysSince = contact.days_since_last_interaction ?? 30;
  const targetDays = contact.target_frequency_days ?? 30;
  // Calculate relative health
  const healthScore = Math.max(0, Math.min(100, Math.round(100 - (daysSince / (targetDays * 1.5)) * 100)));
  
    
  // Next Due calculation
  const lastInteractionDate = contact.last_interaction_date ? new Date(contact.last_interaction_date) : null;
  const nextDueDate = lastInteractionDate 
    ? new Date(lastInteractionDate.getTime() + (targetDays * 24 * 60 * 60 * 1000))
    : new Date();
  const nextDueText = nextDueDate.toLocaleDateString();

  // Recent Activity (Single most recent interaction)
  const latestInteraction = interactions.length > 0 ? interactions[0] : null;

  // Handlers
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
    <div className="flex flex-col w-full max-w-2xl mx-auto space-y-6 pb-20 bg-slate-950 min-h-screen animate-in fade-in duration-700">
      
      {/* 1. Identity Hero */}
      <section className="flex flex-col items-center pt-10 pb-4 text-center">
        <div className="relative group mb-6 cursor-pointer" onClick={onAvatarClick}>
          <div className={cn(
            "w-32 h-32 rounded-full bg-slate-900 flex items-center justify-center text-4xl font-black text-white border-4 transition-all duration-500 shadow-2xl group-hover:scale-105",
            healthScore > 80 ? "border-emerald-500" : healthScore > 40 ? "border-orange-500" : "border-red-500"
          )}>
            {contact.photo_url ? (
              <div className="relative w-full h-full rounded-full overflow-hidden">
                <Image src={contact.photo_url} alt={name} fill className="object-cover" />
              </div>
            ) : (
              initials
            )}
            
            {/* Camera Overlay */}
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <Camera size={32} className="text-white drop-shadow-lg" />
            </div>
          </div>
          <div className={cn(
            "absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-slate-950 shadow-md",
            healthScore > 80 ? "bg-emerald-500" : healthScore > 40 ? "bg-orange-500" : "bg-red-500"
          )} />
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight leading-none mb-2">{name}</h1>
        <p className="flex items-center justify-center gap-1.5 text-slate-500 text-sm font-bold uppercase tracking-widest">
          <Cake size={14} className="text-indigo-400" /> Birthday: {birthdayText}
        </p>
      </section>

      {/* 2. Quick Actions */}
      <section className="grid grid-cols-3 gap-4 px-4">
        <QuickActionButton 
          icon={<Phone size={24} />} 
          label="Call" 
          href={contact.phone ? `tel:${contact.phone.replace(/\D/g, '')}` : undefined} 
        />
        <QuickActionButton 
          icon={<Mail size={24} />} 
          label="Email" 
          href={contact.email ? `mailto:${contact.email}` : undefined} 
        />
        <QuickActionButton 
          icon={<MessageSquare size={24} />} 
          label="Text" 
          href={contact.phone ? `sms:${contact.phone.replace(/\D/g, '')}` : undefined} 
        />
      </section>

      <div className="px-4 space-y-6">
        {/* 3. Vital Signs Card */}
        <VitalSigns score={healthScore} nextDue={nextDueText} />

        {/* 4. Interaction Suite */}
        <InteractionSuite onLog={onLogInteraction} isLogging={isLogging} />

        {/* 5. Recent Activity */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Recent Activity</h3>
          {latestInteraction ? (
            <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800 shadow-sm flex flex-col gap-3 group hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-400">
                  {new Date(latestInteraction.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className={cn(
                  "text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border",
                  latestInteraction.notes?.includes('[Attempt]') 
                    ? "border-orange-500/30 text-orange-400 bg-orange-500/5" 
                    : "border-emerald-500/30 text-emerald-400 bg-emerald-500/5"
                )}>
                  {latestInteraction.notes?.includes('[Attempt]') ? 'Attempted' : '✓ Connected'}
                </span>
              </div>
              <p className="text-base text-slate-300 leading-relaxed font-medium line-clamp-3">
                {latestInteraction.notes?.replace('[Attempt] ', '') || 'No shared memory recorded.'}
              </p>
            </div>
          ) : (
            <div className="bg-slate-900/20 rounded-2xl p-8 border border-dashed border-slate-800 text-center">
              <p className="text-sm text-slate-500 italic opacity-60">No interaction history yet.</p>
            </div>
          )}
        </section>

        {/* 6. Metadata Folder */}
        <MetadataFolder>
          <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
            {/* Contact Details */}
            <div className="grid grid-cols-1 gap-4">
              <MetadataItem icon={<Mail size={18} className="text-indigo-400" />} label="Email" value={contact.email || 'Not set'} />
              <MetadataItem icon={<Phone size={18} className="text-indigo-400" />} label="Phone" value={contact.phone || 'Not set'} />
              <MetadataItem icon={<MapPin size={18} className="text-indigo-400" />} label="Location" value={[contact.city, contact.state].filter(Boolean).join(', ') || 'Not set'} />
            </div>

            {/* Tags Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Tag size={14} className="text-indigo-400" /> Tags
                </label>
                <button 
                  onClick={() => setIsTagsOpen(!isTagsOpen)}
                  className="text-indigo-400 hover:text-indigo-300 text-xs font-black transition-colors"
                >
                  {isTagsOpen ? 'CANCEL' : '+ ADD TAG'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {tags.map(tag => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="bg-slate-900 text-slate-100 border-slate-800 hover:border-slate-700 h-9 px-4 rounded-xl group transition-all"
                  >
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="ml-2 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                      <X size={14} />
                    </button>
                  </Badge>
                ))}
                {tags.length === 0 && !isTagsOpen && <span className="text-xs text-slate-600 italic">No tags associated</span>}
              </div>
              {isTagsOpen && (
                <div className="flex gap-2 animate-in fade-in slide-in-from-top-1">
                  <input 
                    type="text" 
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="New tag..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    autoFocus
                  />
                  <Button size="icon" onClick={handleAddTag} disabled={submittingTag} className="bg-indigo-600 hover:bg-indigo-500 h-[42px] w-[42px] rounded-xl">
                    {submittingTag ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  </Button>
                </div>
              )}
            </div>

            {/* Interests Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={14} className="text-indigo-400" /> Interests
                </label>
                <button 
                  onClick={() => setIsInterestsOpen(!isInterestsOpen)}
                  className="text-indigo-400 hover:text-indigo-300 text-xs font-black transition-colors"
                >
                  {isInterestsOpen ? 'CANCEL' : '+ ADD INTEREST'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {interests.map(interest => (
                  <Badge 
                    key={interest} 
                    variant="secondary" 
                    className="bg-slate-900 text-slate-100 border-slate-800 hover:border-slate-700 h-9 px-4 rounded-xl group transition-all"
                  >
                    {interest}
                    <button onClick={() => handleRemoveInterest(interest)} className="ml-2 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                      <X size={14} />
                    </button>
                  </Badge>
                ))}
                {interests.length === 0 && !isInterestsOpen && <span className="text-xs text-slate-600 italic">No interests recorded</span>}
              </div>
              {isInterestsOpen && (
                <div className="flex gap-2 animate-in fade-in slide-in-from-top-1">
                  <input 
                    type="text" 
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddInterest()}
                    placeholder="New interest..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    autoFocus
                  />
                  <Button size="icon" onClick={handleAddInterest} disabled={submittingInterest} className="bg-indigo-600 hover:bg-indigo-500 h-[42px] w-[42px] rounded-xl">
                    {submittingInterest ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
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
    <div className="flex flex-col items-center justify-center p-5 bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800/80 transition-all hover:scale-[1.05] active:scale-95 group shadow-sm">
      <div className="text-indigo-400 group-hover:text-indigo-300 mb-2.5 transition-transform group-hover:scale-110">{icon}</div>
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-200 transition-colors">{label}</span>
    </div>
  );

  if (href) return <a href={href} className="flex-1 no-underline">{content}</a>;
  return (
    <button 
      className="flex-1" 
      onClick={() => toast.error(`No ${label.toLowerCase()} information available`)}
    >
      {content}
    </button>
  );
};

const MetadataItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
  <div className="flex items-center gap-4 bg-slate-900/30 p-4 rounded-xl border border-slate-800/50 hover:border-slate-700 transition-colors group">
    <div className="text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-[9px] uppercase font-black text-slate-600 tracking-widest mb-0.5">{label}</p>
      <p className="text-sm text-slate-300 font-bold truncate">{value}</p>
    </div>
  </div>
);
