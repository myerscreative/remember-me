'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { AISynopsisCard } from './tabs/overview/AISynopsisCard';
import { MemoryCapture } from './MemoryCapture';

import { Button } from '@/components/ui/button';
import { MessageSquare, Plus, ExternalLink, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

interface OverviewPanelProps {
  contact: any;
  onNavigateToTab?: (tab: string) => void;
  onEdit?: () => void;
  onLinkConnection?: () => void;
  onUnlinkConnection?: (connectionId: string) => void;
}

export function OverviewPanel({ contact, onNavigateToTab, onEdit, onLinkConnection, onUnlinkConnection }: OverviewPanelProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Overview');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (onNavigateToTab) onNavigateToTab(tab);
  };

  const handleDraftReconnection = () => {
    // Placeholder for AI drafting feature
    alert("AI Reconnection Drafter coming soon! 🤖");
  };

  return (
    <div className="flex-1 bg-[#0a0e1a] flex flex-col md:overflow-y-auto h-auto md:h-full min-w-0">
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

        {/* CONTENT AREA */}
        <div className="p-5 md:p-8 flex flex-col gap-5">
            
            {/* OVERVIEW TAB */}
            {activeTab === 'Overview' && (
                <>
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
                                isInline={true}
                            />
                         ) : (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 md:w-11 md:h-11 rounded-[10px] bg-gradient-to-br from-[#7c3aed] to-[#5b21b6] flex items-center justify-center text-xl shrink-0">
                                    ✨
                                </div>
                                <div className="flex-1">
                                    <p className="text-[13px] md:text-sm text-[#64748b] leading-snug">
                                        Add story details to generate an AI summary. 
                                        <button 
                                            onClick={() => handleTabChange('Story')}
                                            className="ml-1 text-[#7c3aed] font-medium cursor-pointer hover:underline bg-transparent border-none p-0 inline"
                                        >
                                            Go to Story →
                                        </button>
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
                        <button 
                            onClick={handleDraftReconnection}
                            className="w-full bg-white text-[#7c3aed] border-none py-3.5 px-5 rounded-xl font-semibold text-sm cursor-pointer flex items-center justify-center gap-2 hover:-translate-y-px transition-transform shadow-sm"
                        >
                            <MessageSquare className="w-4 h-4" />
                            Draft Reconnection
                        </button>
                    </div>

                    {/* Grid: Info & Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Contact Info */}
                        <div className="bg-[#1a1f2e] rounded-2xl p-5 md:px-6 md:py-5">
                            <div className="flex items-center justify-between mb-3.5">
                                <div className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#94a3b8]">
                                    Contact Information
                                </div>
                                <button 
                                    onClick={onEdit}
                                    className="text-[10px] text-[#7c3aed] hover:text-[#9061f9] font-medium uppercase tracking-wide bg-transparent border-none p-0"
                                >
                                    Edit
                                </button>
                            </div>
                            
                            <div className="flex flex-col">
                                <div className="flex items-center gap-3 py-2.5 border-b border-[#2d3748]">
                                     <div className="w-9 h-9 bg-[#2d3748] rounded-lg flex items-center justify-center text-base shrink-0">
                                        ✉️
                                     </div>
                                     <div className="flex-1 min-w-0">
                                        <div className="text-[10px] text-[#64748b] uppercase tracking-wide mb-0.5">Email</div>
                                        <div className={cn("text-[13px] truncate cursor-pointer hover:text-white transition-colors", !contact.email && "text-[#64748b] italic")}>
                                            {contact.email ? (
                                                <a href={`mailto:${contact.email}`} className="block w-full h-full text-inherit no-underline">
                                                    {contact.email}
                                                </a>
                                            ) : 'No email'}
                                        </div>
                                     </div>
                                </div>
                                <div className="flex items-center gap-3 pt-2.5">
                                     <div className="w-9 h-9 bg-[#2d3748] rounded-lg flex items-center justify-center text-base shrink-0">
                                        📞
                                     </div>
                                     <div className="flex-1 min-w-0">
                                        <div className="text-[10px] text-[#64748b] uppercase tracking-wide mb-0.5">Phone</div>
                                        <div className={cn("text-[13px] truncate cursor-pointer hover:text-white transition-colors", !contact.phone && "text-[#64748b] italic")}>
                                            {contact.phone ? (
                                                <a href={`tel:${contact.phone}`} className="block w-full h-full text-inherit no-underline">
                                                    {contact.phone}
                                                </a>
                                            ) : 'No phone'}
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

                    {/* Notes / Voice Entry */}
                    {(contact.notes || contact.deep_lore) && (
                      <div className="bg-[#1a1f2e] rounded-2xl p-5 md:px-6 md:py-5">
                          <div className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#94a3b8] mb-3">
                              Voice Input & Notes
                          </div>
                          
                          {contact.notes && (
                            <div className="mb-4 last:mb-0">
                                {contact.deep_lore && <div className="text-[10px] uppercase text-[#64748b] mb-1">Notes</div>}
                                <p className="text-[13px] md:text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                                    {contact.notes}
                                </p>
                            </div>
                          )}

                          {contact.deep_lore && (
                            <div className="last:mb-0">
                                <div className="text-[10px] uppercase text-[#64748b] mb-1">Original Voice Context</div>
                                <p className="text-[13px] md:text-sm text-slate-300 whitespace-pre-wrap leading-relaxed opacity-90 border-l-2 border-[#2d3748] pl-3 italic">
                                    "{contact.deep_lore}"
                                </p>
                            </div>
                          )}
                      </div>
                    )}

                    {/* Tags & Interests */}
                     <div className="bg-[#1a1f2e] rounded-2xl p-5 md:p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                 <span className="block text-[11px] font-bold uppercase tracking-[0.5px] text-[#94a3b8] mb-2.5">🏷️ Tags</span>
                                 <div className="flex flex-wrap gap-1.5">
                                    {(contact.tags || []).map((tag: string) => (
                                        <Link key={tag} href={`/network?search=${encodeURIComponent(tag)}`}>
                                            <Badge className="bg-[#2d3748] hover:bg-[#3d4758] text-[#cbd5e1] border-none px-2.5 py-1.5 rounded-md text-[11px] font-normal cursor-pointer transition-colors">
                                                {tag}
                                            </Badge>
                                        </Link>
                                    ))}
                                    <button 
                                        onClick={onEdit}
                                        className="bg-transparent border border-dashed border-[#3d4758] text-[#94a3b8] px-2.5 py-1.5 rounded-md text-[11px] hover:border-[#7c3aed] hover:text-[#a78bfa] transition-colors"
                                    >
                                        +
                                    </button>
                                 </div>
                            </div>
                            <div>
                                 <span className="block text-[11px] font-bold uppercase tracking-[0.5px] text-[#94a3b8] mb-2.5">✨ Interests</span>
                                 <div className="flex flex-wrap gap-1.5">
                                    {(contact.interests || []).map((interest: string) => (
                                        <Link key={interest} href={`/network?search=${encodeURIComponent(interest)}`}>
                                            <Badge className="bg-[#2d3748] hover:bg-[#3d4758] text-[#cbd5e1] border-none px-2.5 py-1.5 rounded-md text-[11px] font-normal cursor-pointer transition-colors">
                                                {interest}
                                            </Badge>
                                        </Link>
                                    ))}
                                    <button 
                                        onClick={onEdit}
                                        className="bg-transparent border border-dashed border-[#3d4758] text-[#94a3b8] px-2.5 py-1.5 rounded-md text-[11px] hover:border-[#7c3aed] hover:text-[#a78bfa] transition-colors"
                                    >
                                        + Add interests
                                    </button>
                                 </div>
                            </div>
                        </div>
                     </div>

                     {/* Connections */}
                     <div className="bg-[#1a1f2e] rounded-2xl p-5">
                        {(!contact.connections || contact.connections.length === 0) ? (
                            <div className="text-center">
                                <p className="text-[13px] text-[#64748b] mb-3">No connections yet</p>
                                <button 
                                    onClick={onLinkConnection}
                                    className="bg-transparent border border-[#3d4758] text-[#94a3b8] py-2.5 px-4 rounded-[10px] text-[13px] font-medium inline-flex items-center gap-1.5 hover:border-[#7c3aed] hover:text-[#a78bfa] transition-colors"
                                >
                                    <span>🔗</span>
                                    Link a Connection
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between mb-2">
                                     <span className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#94a3b8]">🔗 Connections</span>
                                     <button onClick={onLinkConnection} className="text-[#a78bfa] hover:text-white transition-colors">
                                        <Plus className="h-4 w-4" />
                                     </button>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {contact.connections.map((conn: any) => (
                                        <div 
                                            key={conn.id} 
                                            onClick={() => router.push(`/contacts/${conn.person.id}`)}
                                            className="flex items-center gap-3 bg-[#0f1419] p-3 rounded-xl border border-[#2d3748]/50 group cursor-pointer hover:bg-[#1e293b] transition-colors"
                                        >
                                            <div className="h-10 w-10 rounded-full bg-[#2d3748] flex items-center justify-center overflow-hidden border border-[#3d4758]">
                                                {conn.person.photo_url ? (
                                                    <img src={conn.person.photo_url} alt={conn.person.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <span className="text-xs text-slate-400">
                                                        {conn.person.first_name?.[0]}{conn.person.last_name?.[0]}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[13px] font-medium text-slate-200 truncate group-hover:text-white transition-colors">{conn.person.name}</div>
                                                <div className="text-[11px] text-[#94a3b8]">{conn.relationship_type}</div>
                                            </div>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onUnlinkConnection?.(conn.id);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 transition-all hover:bg-slate-800 rounded-full"
                                                title="Unlink connection"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                     </div>
                </>
            )}

            {/* STORY TAB */}
            {activeTab === 'Story' && (
                <div className="flex flex-col items-center py-8 md:py-12">
                    <MemoryCapture
                        contactId={contact.id}
                        onSuccess={(field) => {
                            // Refresh the contact data when memory is added
                            router.refresh();
                        }}
                    />
                </div>
            )}

            {/* FAMILY TAB */}
            {activeTab === 'Family' && (
                <div className="text-center py-12 text-[#94a3b8]">
                    <div className="text-4xl mb-4">👨‍👩‍👧‍👦</div>
                    <h3 className="text-lg font-medium text-white mb-2">Family & Circle</h3>
                     <p className="max-w-md mx-auto">Map out the important people in their life.</p>
                </div>
            )}

        </div>
    </div>
  );
}
