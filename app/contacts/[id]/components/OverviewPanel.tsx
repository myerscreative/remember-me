'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { AISynopsisCard } from './tabs/overview/AISynopsisCard';

import { Button } from '@/components/ui/button';
import { MessageSquare, Plus, ExternalLink } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

interface OverviewPanelProps {
  contact: any;
  onNavigateToTab?: (tab: string) => void;
}

export function OverviewPanel({ contact, onNavigateToTab }: OverviewPanelProps) {
  const [activeTab, setActiveTab] = useState('Overview');

  // Placeholder functions for interactivity
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (onNavigateToTab) onNavigateToTab(tab);
    // In a real implementation this would likely switch routing or view state
  };

  return (
    <div className="flex-1 bg-[#0a0e1a] flex flex-col overflow-y-auto h-full min-w-0">
        {/* TABS - STICKY */}
        <div className="flex px-5 md:px-8 pt-5 md:pt-6 gap-6 md:gap-8 border-b border-[#2d3748] bg-[#0a0e1a] sticky top-0 z-10 shrink-0">
            {['Overview', 'Story', 'Family'].map((tab) => (
                <button
                    key={tab}
                    onClick={() => handleTabChange(tab)}
                    className={cn(
                        "pb-3 text-[15px] font-medium border-b-2 transition-all",
                        activeTab === tab 
                            ? "text-[#60a5fa] border-[#60a5fa]" 
                            : "text-[#94a3b8] border-transparent hover:text-gray-300"
                    )}
                >
                    {tab}
                </button>
            ))}
        </div>

        {/* CONTENT */}
        <div className="p-5 md:p-8 flex flex-col gap-5">
            
            {/* AI Synopsis */}
            <div className={cn(
                "bg-[#1a1f2e] border border-[#2d3748] rounded-2xl",
                contact.ai_summary ? "p-5 md:p-6" : "p-4 md:px-6 md:py-4"
            )}>
                 {contact.ai_summary ? (
                    <AISynopsisCard 
                        contactId={contact.id}
                        contactName={contact.name}
                        aiSummary={contact.ai_summary}
                        deepLore={contact.deep_lore}
                        whereMet={contact.where_met}
                        lastUpdated={contact.updated_at}
                        isInline={true} // New prop needed likely
                    />
                 ) : (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 md:w-11 md:h-11 rounded-[10px] bg-gradient-to-br from-[#7c3aed] to-[#5b21b6] flex items-center justify-center text-xl shrink-0">
                            ✨
                        </div>
                        <div className="flex-1">
                            <p className="text-[13px] md:text-sm text-[#64748b] leading-snug">
                                Add story details to generate an AI summary. <span className="text-[#7c3aed] font-medium cursor-pointer hover:underline">Go to Story →</span>
                            </p>
                        </div>
                    </div>
                 )}
            </div>

            {/* Reconnect Card */}
            <div className="bg-gradient-to-br from-[#7c3aed] to-[#5b21b6] rounded-2xl p-6 shadow-lg">
                <h3 className="text-[13px] font-bold uppercase tracking-[0.5px] text-white/90 mb-2">
                    Ready to Connect?
                </h3>
                <p className="text-[13px] text-white/80 mb-4 leading-relaxed">
                    Generate a personalized script based on your memories.
                </p>
                <button className="w-full bg-white text-[#7c3aed] border-none py-3.5 px-5 rounded-xl font-semibold text-sm cursor-pointer flex items-center justify-center gap-2 hover:-translate-y-px transition-transform shadow-sm">
                    <MessageSquare className="w-4 h-4" />
                    Draft Reconnection
                </button>
            </div>

            {/* Grid: Info & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Contact Info */}
                <div className="bg-[#1a1f2e] rounded-2xl p-5 md:px-6 md:py-5">
                    <div className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#94a3b8] mb-3.5">
                        Contact Information
                    </div>
                    {/* Reuse/inline for now */}
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 py-2.5 border-b border-[#2d3748]">
                             <div className="w-9 h-9 bg-[#2d3748] rounded-lg flex items-center justify-center text-base shrink-0">
                                ✉️
                             </div>
                             <div className="flex-1 min-w-0">
                                <div className="text-[10px] text-[#64748b] uppercase tracking-wide mb-0.5">Email</div>
                                <div className={cn("text-[13px] truncate", !contact.email && "text-[#64748b] italic")}>
                                    {contact.email || 'No email'}
                                </div>
                             </div>
                        </div>
                        <div className="flex items-center gap-3 pt-2.5">
                             <div className="w-9 h-9 bg-[#2d3748] rounded-lg flex items-center justify-center text-base shrink-0">
                                📞
                             </div>
                             <div className="flex-1 min-w-0">
                                <div className="text-[10px] text-[#64748b] uppercase tracking-wide mb-0.5">Phone</div>
                                <div className={cn("text-[13px] truncate", !contact.phone && "text-[#64748b] italic")}>
                                    {contact.phone || 'No phone'}
                                </div>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="bg-[#1a1f2e] rounded-2xl p-5 md:px-6 md:py-5">
                    <div className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#94a3b8] mb-3.5">
                        Quick Stats
                    </div>
                    <div className="grid grid-cols-3 gap-2.5">
                        <div className="bg-[#0f1419] rounded-lg p-3 text-center">
                             <div className="text-lg font-bold text-gray-200 mb-1">—</div>
                             <div className="text-[9px] text-[#64748b] uppercase tracking-wide">Last</div>
                        </div>
                        <div className="bg-[#0f1419] rounded-lg p-3 text-center">
                             <div className="text-lg font-bold text-gray-200 mb-1">0</div>
                             <div className="text-[9px] text-[#64748b] uppercase tracking-wide">Total</div>
                        </div>
                        <div className="bg-[#0f1419] rounded-lg p-3 text-center">
                             <div className="text-lg font-bold text-gray-200 mb-1">—</div>
                             <div className="text-[9px] text-[#64748b] uppercase tracking-wide">Next</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tags & Interests */}
             <div className="bg-[#1a1f2e] rounded-2xl p-5 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                         <span className="block text-[11px] font-bold uppercase tracking-[0.5px] text-[#94a3b8] mb-2.5">🏷️ Tags</span>
                         <div className="flex flex-wrap gap-1.5">
                            {(contact.tags || []).map((tag: string) => (
                                <Badge key={tag} className="bg-[#2d3748] hover:bg-[#3d4758] text-[#cbd5e1] border-none px-2.5 py-1.5 rounded-md text-[11px] font-normal">
                                    {tag}
                                </Badge>
                            ))}
                            <button className="bg-transparent border border-dashed border-[#3d4758] text-[#94a3b8] px-2.5 py-1.5 rounded-md text-[11px] hover:border-[#7c3aed] hover:text-[#a78bfa] transition-colors">
                                +
                            </button>
                         </div>
                    </div>
                    <div>
                         <span className="block text-[11px] font-bold uppercase tracking-[0.5px] text-[#94a3b8] mb-2.5">✨ Interests</span>
                         <div className="flex flex-wrap gap-1.5">
                            {(contact.interests || []).map((interest: string) => (
                                <Badge key={interest} className="bg-[#2d3748] hover:bg-[#3d4758] text-[#cbd5e1] border-none px-2.5 py-1.5 rounded-md text-[11px] font-normal">
                                    {interest}
                                </Badge>
                            ))}
                            <button className="bg-transparent border border-dashed border-[#3d4758] text-[#94a3b8] px-2.5 py-1.5 rounded-md text-[11px] hover:border-[#7c3aed] hover:text-[#a78bfa] transition-colors">
                                + Add interests
                            </button>
                         </div>
                    </div>
                </div>
             </div>

             {/* Connections */}
             <div className="bg-[#1a1f2e] rounded-2xl p-5 text-center">
                <p className="text-[13px] text-[#64748b] mb-3">No connections yet</p>
                <button className="bg-transparent border border-[#3d4758] text-[#94a3b8] py-2.5 px-4 rounded-[10px] text-[13px] font-medium inline-flex items-center gap-1.5 hover:border-[#7c3aed] hover:text-[#a78bfa] transition-colors">
                    <span>🔗</span>
                    Link a Connection
                </button>
             </div>

        </div>
    </div>
  );
}
