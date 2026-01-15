'use client';

import React, { useState } from 'react';
import { Phone, Mail, MessageSquare, Plus, Info, X } from 'lucide-react';
import { getInitials } from '@/lib/utils/contact-helpers';
import { InteractionLogger } from './InteractionLogger';
import Link from 'next/link';

// 1. Define the Relationship Health Types
import { HealthStatus, healthColorMap } from '@/lib/relationship-health';

interface ProfileProps {
  contact: any;
  health: HealthStatus;
  lastContact: string;
  synopsis: string;
}

const ConnectionProfile = ({ contact, health, lastContact, synopsis }: ProfileProps) => {
  const [isLogOpen, setIsLogOpen] = useState(false);

  // Health Color Logic
  const healthStyles = healthColorMap[health];
  const healthColor = healthStyles.border;

  const name = contact.firstName || contact.first_name || contact.name;
  const photoUrl = contact.photo_url || contact.avatar_url;

  return (
    <div className="flex flex-col w-full max-w-md mx-auto bg-[#0f111a] text-slate-200 min-h-screen pb-10">
      
      {/* HEADER SECTION */}
      <section className="flex flex-col items-center pt-8 pb-4">
        <div className={`w-24 h-24 rounded-full border-4 ${healthColor} p-1 mb-4`}>
          {photoUrl ? (
             <img src={photoUrl} alt={name} className="rounded-full w-full h-full object-cover" />
          ) : (
             <div className="w-full h-full rounded-full bg-[#2d3748] flex items-center justify-center text-3xl font-semibold text-white">
                {getInitials(name)}
             </div>
          )}
        </div>
        <h1 className="text-2xl font-bold text-white">{name}</h1>
        <p className="text-slate-400 text-sm">Last Contact: {lastContact}</p>
      </section>

      {/* QUICK ACTIONS BAR */}
      <nav className="grid grid-cols-4 gap-2 px-4 mb-6">
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
      </nav>

      {/* AI SYNOPSIS HERO (The "Story") */}
      <section className="px-4 mb-6">
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
      </section>

      {/* TAGS & INTERESTS (Horizontal Scroll) */}
      <section className="px-4 mb-8">
        <h3 className="text-xs font-semibold text-slate-500 uppercase mb-3 px-1">Context</h3>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mask-linear">
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
                onSuccess={() => setIsLogOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const ActionButton = ({ icon, label, highlight = false, onClick, href, disabled }: any) => {
    const Component = href ? 'a' : 'button';
    return (
        <Component 
          href={href}
          onClick={onClick}
          disabled={disabled}
          className={`flex flex-col items-center justify-center py-3 rounded-2xl border transition-all ${
            highlight ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
        >
          {icon}
          <span className="text-[10px] mt-1 uppercase font-bold tracking-tighter">{label}</span>
        </Component>
      );
}

export default ConnectionProfile;
