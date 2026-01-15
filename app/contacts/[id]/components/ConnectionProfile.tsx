'use client';

import React, { useState } from 'react';
import { Phone, Mail, MessageSquare, Plus, Info, X, Sparkles } from 'lucide-react';
import { getInitials } from '@/lib/utils/contact-helpers';
import { InteractionLogger } from './InteractionLogger';
import Link from 'next/link';
import toast from 'react-hot-toast';

// 1. Define the Relationship Health Types
import { HealthStatus, healthColorMap } from '@/lib/relationship-health';
import { MemoryCapture } from './MemoryCapture';
import { StoryTab } from './tabs/StoryTab';
import { FamilyTab } from './tabs/FamilyTab';

interface ProfileProps {
  contact: any;
  health: HealthStatus;
  lastContact: string;
  synopsis: string;
  sharedMemory?: string;
}

import { PostCallPulse } from './PostCallPulse';

const ConnectionProfile = ({ contact, health, lastContact, synopsis, sharedMemory }: ProfileProps) => {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Story' | 'Family'>('Overview');
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [isPulseOpen, setIsPulseOpen] = useState(false);

  // Health Color Logic
  const healthStyles = healthColorMap[health];
  const healthColor = healthStyles.border;

  const name = contact.firstName || contact.first_name || contact.name;
  const photoUrl = contact.photo_url || contact.avatar_url;

  // Handler for Intentionally Drifting
  const handleIntentionallyDrifting = () => {
    // In a real app, this would call an API to update status or pause cadence
    toast.success("Marked as Intentionally Drifting. Cadence paused for 14 days.");
  };

  const daysSince = lastContact === 'Never' ? 999 : 
    Math.floor((new Date().getTime() - new Date(contact.last_interaction_date || Date.now()).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="flex flex-col w-full max-w-md mx-auto bg-[#0f111a] text-slate-200 min-h-screen pb-10">
      
      {/* HEADER SECTION */}
      <section className="flex flex-col items-center pt-8 pb-4">
        {/* The Health Ring */}
        <div className={`w-28 h-28 rounded-full border-[3px] ${healthStyles.border} p-1 shadow-lg ${healthStyles.shadow}`}>
          {photoUrl ? (
             <img src={photoUrl} alt={name} className="rounded-full w-full h-full object-cover" />
          ) : (
             <div className="w-full h-full rounded-full bg-[#2d3748] flex items-center justify-center text-3xl font-semibold text-white">
                {getInitials(name)}
             </div>
          )}
        </div>

        {/* Status Badge */}
        <div className={`mt-3 mb-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${healthStyles.bg} ${healthStyles.text} border ${healthStyles.border}/20 flex items-center gap-1`}>
          {healthStyles.label}
          {/* Milestone Badge (Star) */}
          {(contact.milestones || []).some((m: any) => {
              const d = new Date(m.date);
              const now = new Date();
              const diffTime = d.getTime() - now.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
              return diffDays >= 0 && diffDays <= 7;
          }) && (
             <span className="ml-1 text-xs">⭐</span>
          )}
        </div>

        <h1 className="text-2xl font-bold text-white mb-0.5">{name}</h1>
        <p className="text-slate-400 text-sm">Last Contact: {lastContact}</p>
      </section>

      {/* QUICK ACTIONS BAR */}
      <nav className="grid grid-cols-5 gap-2 px-4 mb-4">
        <ActionButton 
            icon={<Phone size={20} />} 
            label="Call" 
            href={contact.phone ? `tel:${contact.phone}` : undefined}
            disabled={!contact.phone}
        />
        <ActionButton 
            icon={<Mail size={20} />} 
            label="Email" 
            href={contact.email ? `mailto:${contact.email}` : undefined}
            disabled={!contact.email}
        />
        <ActionButton 
            icon={<MessageSquare size={20} />} 
            label="Text" 
            href={contact.phone ? `sms:${contact.phone}` : undefined}
            disabled={!contact.phone}
        />
        <ActionButton 
          icon={<Plus size={20} />} 
          label="Log" 
          highlight 
          onClick={() => setIsLogOpen(true)} 
        />
        <ActionButton 
          icon={<Sparkles size={20} />} 
          label="Capture" 
          highlight 
          className="bg-gradient-to-br from-indigo-600 to-purple-600 border-none text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]"
          onClick={() => setIsCaptureOpen(true)}
        />
      </nav>

      {/* TAB NAVIGATION */}
      <div className="flex justify-center mb-6 border-b border-slate-800 mx-4">
        {['Overview', 'Story', 'Family'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-2 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === tab 
                ? 'border-indigo-500 text-indigo-400' 
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* CONTENT AREA */}
      <div className="min-h-[400px]">
        {activeTab === 'Overview' && (
          // Re-using the existing Overview Logic (Hero + Context + Details)
          <>
            {/* HERO SECTION: AI SYNOPSIS OR RESCUE CARD OR MILESTONE HERO */}
            <section className="px-4 mb-6">
              {(() => {
                  // Milestone Logic: Find closest upcoming
                   const upcomingMilestone = (contact.milestones || [])
                    .filter((m: any) => new Date(m.date) > new Date())
                    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
                   
                   const diffDays = upcomingMilestone 
                    ? Math.ceil((new Date(upcomingMilestone.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    : 999;

                 if (health === 'neglected') {
                    return (
                        <RescueCard 
                        name={contact.first_name || name} 
                        daysSince={daysSince} 
                        sharedMemory={sharedMemory || "your last conversation"} 
                        onDrift={handleIntentionallyDrifting}
                        />
                    );
                 } else if (upcomingMilestone && diffDays <= 2) {
                     // 48h Nudge Hero
                     return (
                         <div className="bg-indigo-900/40 border-2 border-indigo-500 rounded-2xl p-5 shadow-[0_0_20px_rgba(99,102,241,0.2)] animate-in fade-in zoom-in-95">
                             <div className="flex items-center gap-2 mb-3">
                                <Sparkles size={16} className="text-indigo-300 animate-pulse" />
                                <span className="text-indigo-300 text-xs font-black uppercase tracking-widest">Big Day Approaching</span>
                             </div>
                             <h3 className="text-white font-bold text-lg mb-2">
                                Today is the day {name} {upcomingMilestone.title.toLowerCase().replace('event: ','')}.
                             </h3>
                             <p className="text-indigo-100 text-sm leading-relaxed mb-4">
                                Send a quick "Good luck!" text to show you remembered. It goes a long way.
                             </p>
                             <button onClick={() => window.open(`sms:${contact.phone}`)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-transform active:scale-95 shadow-lg shadow-indigo-500/20">
                                Send Support Text
                             </button>
                         </div>
                     );
                 } else {
                     return (
                        <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-2xl p-4">
                            {synopsis ? (
                                <>
                                    <div className="flex items-center gap-2 mb-2 text-indigo-400">
                                        <Info size={16} />
                                        <span className="text-xs font-bold uppercase tracking-wider">AI Briefing</span>
                                    </div>
                                    <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-line">
                                        {synopsis}
                                    </p>
                                </>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-sm text-slate-400 mb-3">Add story details to generate an AI summary.</p>
                                </div>
                            )}
                            
                            {/* Draft Reconnection Button - Placeholder functionality or link to page */}
                            <button className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors">
                                Draft Reconnection
                            </button>
                        </div>
                     );
                 }
              })()}
              })()}
              
              {/* GIFT IDEA NUDGE */}
              {(() => {
                 const upcomingMilestone = (contact.milestones || [])
                    .filter((m: any) => new Date(m.date) > new Date())
                    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
                 const navCastedContact = contact as any;
                 const giftIdeas = (navCastedContact.gift_ideas || []).filter((g: any) => g.status === 'idea');
                 
                 if (upcomingMilestone && giftIdeas.length > 0) {
                     return (
                        <div className="mt-4 bg-pink-900/20 border border-pink-500/30 rounded-xl p-3 flex items-center justify-between animate-in slide-in-from-bottom-2">
                           <div className="flex items-center gap-3">
                              <div className="p-2 bg-pink-500/10 rounded-full">
                                <Sparkles className="text-pink-400" size={16} /> 
                              </div>
                              <div>
                                  <p className="text-[10px] font-bold text-pink-300 uppercase tracking-widest">Gift Idea: {upcomingMilestone.title}</p>
                                  <p className="text-sm text-white font-medium">{giftIdeas[0].item}</p>
                              </div>
                           </div>
                           <button className="text-xs bg-pink-600/20 hover:bg-pink-600/40 text-pink-300 px-3 py-1.5 rounded-lg border border-pink-600/30 transition-colors">
                              Use in Draft
                           </button>
                        </div>
                     );
                 }
                 return null;
              })()}

            </section>

      {/* TAGS & INTERESTS (Horizontal Scroll) */}
      <section className="px-4 mb-8">
        <div className="flex justify-between items-center mb-3 px-1">
             <h3 className="text-xs font-semibold text-slate-500 uppercase">Context</h3>
             {/* Simple Add Actions - Could open modal or just trigger edit mode */}
             <div className="flex gap-2">
                <button onClick={() => setIsLogOpen(true)} className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors">
                    + Tag
                </button>
             </div>
        </div>
        
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mask-linear">
          {/* Add Interest Button in-stream */}
           <button 
             onClick={() => setIsLogOpen(true)} // Ideally opens specific add modal, for now re-use log/edit entry point or just placeholder
             className="shrink-0 bg-slate-800/50 border border-slate-700 border-dashed px-3 py-1 rounded-full text-xs text-slate-400 hover:text-white hover:border-indigo-500 transition-colors"
           >
             + Interest
           </button>

          {[...(contact.tags || []), ...(contact.interests || [])].length > 0 ? (
             [...(contact.tags || []), ...(contact.interests || [])].map((tag: string, idx: number) => (
                <span key={`${tag}-${idx}`} className="bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-xs whitespace-nowrap">
                  {tag}
                </span>
              ))
          ) : (
              <span className="text-xs text-slate-500 italic px-2">No tags or interests yet</span>
          )}
        </div>
      </section>

            {/* DATA FOOTER (The Details) */}
            <section className="px-4 space-y-4">
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <h4 className="text-xs text-slate-500 mb-2">Contact Information</h4>
                <p className="text-sm">{contact.email || 'No email'}</p>
                <p className="text-sm mt-2">{contact.phone || 'No phone'}</p>
                
                  <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center bg-slate-900/50 p-2 rounded-lg">
                      <span className="text-xs text-slate-500">Frequency</span>
                      <span className="text-sm bg-slate-800 px-2 py-1 rounded text-slate-300">{contact.target_frequency_days} Days</span>
                  </div>
              </div>
            </section>
          </>
        )}

        {activeTab === 'Story' && <StoryTab contact={contact} />}
        {activeTab === 'Family' && <FamilyTab contact={contact} />}
      </div>

      {/* MEMORY CAPTURE MODAL */}
      {isCaptureOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4" onClick={() => setIsCaptureOpen(false)}>
           <div 
            className="bg-[#161b22] w-full max-w-lg p-6 rounded-3xl border border-slate-700 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()} 
           >
              <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-white">Brain Dump / Quick Capture</h2>
                  <button onClick={() => setIsCaptureOpen(false)} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white">
                      <X size={16} />
                  </button>
              </div>
              <MemoryCapture 
                  contactId={contact.id} 
                  onSuccess={(field) => {
                      setIsCaptureOpen(false);
                      toast.success(`Captured to ${field}!`);
                  }} 
              />
           </div>
        </div>
      )}

      {/* LOG INTERACTION MODAL */}
      {isLogOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-end z-50 backdrop-blur-sm" onClick={() => setIsLogOpen(false)}>
          <div 
            className="bg-[#161b22] w-full max-h-[85vh] overflow-y-auto p-6 rounded-t-3xl border-t border-slate-700 animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()} 
          >
            <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-6" />
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Log Interaction</h2>
                <button onClick={() => setIsLogOpen(false)} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white">
                    <X size={16} />
                </button>
            </div>
            
            {/* Reuse existing InteractionLogger for full functionality */}
            <InteractionLogger 
                contactId={contact.id} 
                contactName={name}
                onSuccess={() => {
                   setIsLogOpen(false);
                   setIsPulseOpen(true); // Trigger the Post-Call Pulse
                }}
            />
          </div>
        </div>
      )}

      {/* POST-CALL PULSE OVERLAY */}
      {isPulseOpen && (
        <PostCallPulse 
          contactId={contact.id}
          name={contact.first_name || name.split(' ')[0]} 
          onClose={() => setIsPulseOpen(false)}
          onComplete={() => setIsPulseOpen(false)}
        />
      )}
    </div>
  );
};

// --- Sub-Components ---

interface RescuePromptProps {
  name: string;
  daysSince: number;
  sharedMemory: string;
  onDrift: () => void;
}

const RescueCard = ({ name, daysSince, sharedMemory, onDrift }: RescuePromptProps) => {
  return (
    <div className="bg-red-950/30 border-2 border-red-500/50 rounded-2xl p-5 shadow-[0_0_20px_rgba(239,68,68,0.1)] animate-in fade-in duration-500">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <span className="text-red-400 text-xs font-black uppercase tracking-widest">Rescue Mission</span>
      </div>
      
      <h3 className="text-white font-bold text-lg mb-2">
        It’s been {daysSince} days since you spoke with {name}.
      </h3>
      
      <p className="text-slate-300 text-sm leading-relaxed mb-4">
        The "Garden" is drifting, but reconnection is easy. Try bringing up 
        <span className="text-red-300 font-semibold"> "{sharedMemory}"</span>—it's 
        one of your strongest shared memories.
      </p>

      <div className="space-y-2">
        <button className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-red-900/20">
          <span className="text-lg">⚡</span> Draft Rescue Message
        </button>
        <button 
            onClick={onDrift}
            className="w-full py-2 bg-transparent text-slate-500 text-xs font-medium hover:text-slate-300 transition-colors"
        >
          Mark as "Intentionally Drifting" (Pause Cadence)
        </button>
      </div>
    </div>
  );
};

const ActionButton = ({ icon, label, highlight = false, onClick, href, disabled, className }: any) => {
    const Component = href ? 'a' : 'button';
    return (
        <Component 
          href={href}
          onClick={onClick}
          disabled={disabled}
          className={`flex flex-col items-center justify-center py-3 rounded-2xl border transition-all ${
            highlight ? className || 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
        >
          {icon}
          <span className="text-[10px] mt-1 uppercase font-bold tracking-tighter">{label}</span>
        </Component>
      );
}

export default ConnectionProfile;
