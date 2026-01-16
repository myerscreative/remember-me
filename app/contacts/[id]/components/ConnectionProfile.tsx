import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { getInitials } from '@/lib/utils/contact-helpers';
import { InteractionLogger } from './InteractionLogger';
import toast from 'react-hot-toast';
import Image from 'next/image';

// 1. Define the Relationship Health Types
import { HealthStatus, healthColorMap } from '@/lib/relationship-health';
import { MemoryCapture } from './MemoryCapture';
import { AISynopsisCard } from './tabs/overview/AISynopsisCard';
import { StoryTab } from './tabs/StoryTab';
import { FamilyTab } from './tabs/FamilyTab';
import { PostCallPulse } from './PostCallPulse';

export interface Contact {
  id: string;
  name: string;
  first_name?: string;
  firstName?: string;
  photo_url?: string;
  avatar_url?: string;
  birthday?: string;
  phone?: string;
  email?: string;
  deep_lore?: string;
  where_met?: string;
  updated_at?: string;
  tags?: string[];
  interests?: string[];
  interactions?: any[];
  connections?: any[];
  tier_label?: string;
  target_frequency_days?: number;
  last_interaction_date?: string;
}

interface ProfileProps {
  contact: Contact;
  health: HealthStatus;
  lastContact: string;
  synopsis: string;
  sharedMemory?: string;
}

const ConnectionProfile = ({ contact, health, lastContact, synopsis }: ProfileProps) => {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Story' | 'Family'>('Overview');
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [isPulseOpen, setIsPulseOpen] = useState(false);

  // Health Color Logic
  const healthStyles = healthColorMap[health];

  const name = contact.firstName || contact.first_name || contact.name;
  const photoUrl = contact.photo_url || contact.avatar_url;

  // Use a stable reference for current time to fix purity warning
  const [renderTime] = useState(() => Date.now());

  const daysSince = useMemo(() => {
    if (lastContact === 'Never') return 999;
    const lastInteraction = contact.last_interaction_date ? new Date(contact.last_interaction_date).getTime() : renderTime;
    return Math.floor((renderTime - lastInteraction) / (1000 * 60 * 60 * 24));
  }, [lastContact, contact.last_interaction_date, renderTime]);

  return (
    <div className="container mx-auto grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 max-w-[1200px]">
      
      {/* TABS - Left Column Top */}
      <div className="lg:col-span-1 sticky top-0 z-100 bg-[#0f1419] border-b border-[#2d3748] lg:static lg:bg-transparent lg:border-none lg:mb-2">
        <div className="flex w-full lg:w-auto overflow-x-auto justify-start px-4 lg:px-0">
          {(['Overview', 'Story', 'Family'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 lg:flex-none py-4 lg:pb-3 text-[15px] font-medium border-b-2 transition-all whitespace-nowrap text-center ${
                activeTab === tab 
                  ? 'border-[#60a5fa] text-[#60a5fa]' 
                  : 'border-transparent text-[#94a3b8] hover:text-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      <div className="hidden lg:block"></div> {/* Spacer for grid */}

      {/* LEFT COLUMN */}
      <div className="flex flex-col gap-5 px-4 lg:px-0">
        {activeTab === 'Overview' ? (
          <>
            {/* Header Card */}
            <div className="bg-[#1a1f2e] rounded-2xl p-6 md:p-8 text-center border border-slate-800/50">
                <div className="inline-block relative mb-4">
                  <div className={`w-[90px] h-[90px] rounded-full bg-[#2d3748] flex items-center justify-center text-4xl font-semibold text-white border-3 ${healthStyles.border}`}>
                     {photoUrl ? (
                       <div className="relative w-full h-full">
                         <Image 
                            src={photoUrl} 
                            alt={name} 
                            fill 
                            className="rounded-full object-cover"
                         />
                       </div>
                     ) : (
                       getInitials(name)
                     )}
                  </div>
                  <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-3 border-[#1a1f2e] ${healthStyles.bg}`} />
                </div>
                
                <h1 className="text-2xl font-bold text-white mb-1.5">{name}</h1>
                <div className="text-[#64748b] text-[13px] mb-5">
                   🎂 Birthday: {contact.birthday ? new Date(contact.birthday).toLocaleDateString(undefined, { month: 'long', day: 'numeric' }) : 'Not set'}
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                    <ActionButton icon={<span>📞</span>} label="Call" href={contact.phone ? `tel:${contact.phone}` : undefined} disabled={!contact.phone} />
                    <ActionButton icon={<span>✉️</span>} label="Email" href={contact.email ? `mailto:${contact.email}` : undefined} disabled={!contact.email} />
                    <ActionButton icon={<span>💬</span>} label="Text" href={contact.phone ? `sms:${contact.phone}` : undefined} disabled={!contact.phone} />
                </div>
            </div>

                {/* AI Synopsis */}
                <AISynopsisCard 
                    contactId={contact.id}
                    contactName={name}
                    aiSummary={synopsis}
                    deepLore={contact.deep_lore}
                    whereMet={contact.where_met}
                    lastUpdated={contact.updated_at}
                    isInline={true}
                    onNavigateToStory={() => setActiveTab('Story')}
                />

                {/* Contact Info Inline */}
                <div className="bg-[#1a1f2e] rounded-2xl p-5 border border-slate-800/50">
                    <div className="text-[#94a3b8] text-[11px] font-semibold uppercase tracking-wider mb-2">Contact Information</div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 py-3 border-b border-[#2d3748]">
                            <div className="w-10 h-10 bg-[#2d3748] rounded-xl flex items-center justify-center text-lg shrink-0">✉️</div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[10px] text-[#64748b] uppercase tracking-[0.3px] mb-0.5 font-semibold">Email</div>
                                <div className={`text-[14px] truncate ${!contact.email ? 'text-[#64748b] italic' : 'text-[#e2e8f0]'}`}>
                                    {contact.email || 'No email'}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 py-3">
                            <div className="w-10 h-10 bg-[#2d3748] rounded-xl flex items-center justify-center text-lg shrink-0">📞</div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[10px] text-[#64748b] uppercase tracking-[0.3px] mb-0.5 font-semibold">Phone</div>
                                <div className={`text-[14px] truncate ${!contact.phone ? 'text-[#64748b] italic' : 'text-[#e2e8f0]'}`}>
                                    {contact.phone || 'No phone'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tags & Interests Card */}
                <div className="bg-[#1a1f2e] rounded-2xl p-5 border border-slate-800/50">
                    <div className="flex flex-col gap-4">
                        <div className="pb-4 border-b border-[#2d3748] last:border-0 last:pb-0">
                            <span className="text-[#94a3b8] text-[11px] font-semibold uppercase tracking-wider mb-3 block">🏷️ Tags</span>
                            <div className="flex flex-wrap gap-2">
                                {contact.tags?.map((tag: string) => (
                                    <span key={tag} className="bg-[#2d3748] px-3 py-1.5 rounded-lg text-[12px] text-[#cbd5e1]">{tag}</span>
                                ))}
                                <button className="text-[#94a3b8] hover:text-[#a78bfa] border border-dashed border-[#3d4758] hover:border-[#7c3aed] px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors">+ Add</button>
                            </div>
                        </div>
                        <div className="pb-0 last:border-0 last:pb-0">
                            <span className="text-[#94a3b8] text-[11px] font-semibold uppercase tracking-wider mb-3 block">✨ Interests</span>
                            <div className="flex flex-wrap gap-2">
                                {contact.interests?.map((interest: string) => (
                                    <span key={interest} className="bg-[#2d3748] px-3 py-1.5 rounded-lg text-[12px] text-[#cbd5e1]">{interest}</span>
                                ))}
                                <button className="text-[#94a3b8] hover:text-[#a78bfa] border border-dashed border-[#3d4758] hover:border-[#7c3aed] px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors">+ Add</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Log Interaction Card */}
                <div className="bg-[#1a1f2e] rounded-2xl p-5 border border-slate-800/50">
                    <div className="text-[#94a3b8] text-[11px] font-semibold uppercase tracking-wider mb-3">Log Interaction</div>
                    
                    <textarea 
                        className="w-full bg-[#0f1419] border border-[#2d3748] focus:border-[#7c3aed] rounded-xl p-3.5 text-white text-[15px] outline-none resize-none min-h-[80px] mb-3 placeholder:text-[#64748b]" 
                        placeholder="What did you discuss?"
                        onClick={() => setIsLogOpen(true)}
                        readOnly
                    />
                    
                    <div className="grid grid-cols-2 gap-2.5">
                        <button onClick={() => setIsLogOpen(true)} className="bg-[#2d3748] hover:bg-[#3d4758] text-[#fbbf24] py-3.5 rounded-xl text-[14px] font-bold transition-all">📝 Attempt</button>
                        <button onClick={() => setIsLogOpen(true)} className="bg-[#10b981] hover:bg-[#059669] text-white py-3.5 rounded-xl text-[14px] font-bold transition-all">✅ Connected</button>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[#2d3748]">
                        <div className="text-[#94a3b8] text-[11px] font-semibold uppercase tracking-wider mb-2.5">Recent Activity ({contact.interactions?.length || 0})</div>
                        {(contact.interactions?.length || 0) > 0 ? (
                            <p className="text-[#cbd5e1] text-[13px] leading-snug">Last connected {lastContact.toLowerCase()} via phone call</p>
                        ) : (
                            <div className="text-[#64748b] text-[13px] italic">No interactions logged yet</div>
                        )}
                    </div>
                </div>

                {/* Relationship Settings - Collapsed */}
                <div className="bg-[#1a1f2e] rounded-2xl p-5 border border-slate-800/50">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="text-[#94a3b8] text-[11px] font-semibold uppercase tracking-wider mb-2">Relationship</div>
                            <div className="flex flex-wrap gap-2">
                                <span className="bg-[#3b4a6b] px-3.5 py-1.5 rounded-lg text-[12px] text-[#93c5fd] flex items-center gap-1.5 font-medium whitespace-nowrap">
                                    <span>👥</span> {contact.tier_label || 'Steady Friends'}
                                </span>
                                <span className="bg-[#2d3748] px-3.5 py-1.5 rounded-lg text-[12px] text-[#cbd5e1] flex items-center gap-1.5 font-medium whitespace-nowrap">
                                    <span>📅</span> {contact.target_frequency_days === 7 ? 'Weekly' : contact.target_frequency_days === 30 ? 'Monthly' : `${contact.target_frequency_days} Days`}
                                </span>
                            </div>
                        </div>
                        <button className="text-[#94a3b8] border border-[#3d4758] hover:border-[#7c3aed] px-4 py-2 rounded-lg text-[13px] font-medium transition-colors shrink-0">Edit</button>
                    </div>
                </div>
          </>
        ) : activeTab === 'Story' ? (
            <StoryTab contact={contact} />
        ) : (
            <FamilyTab contact={contact} />
        )}
      </div>

      {/* RIGHT COLUMN - SIDEBAR */}
      <div className="flex flex-col gap-5 px-4 lg:px-0 pb-10 lg:pb-0">
         
          <div className="bg-linear-to-br from-[#7c3aed] to-[#5b21b6] rounded-2xl p-5 shadow-xl shadow-indigo-900/10 text-white">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-2 opacity-90">Ready to Connect?</h3>
              <p className="text-[13px] opacity-80 mb-3.5 leading-normal">Generate a personalized script based on your memories.</p>
              <button className="w-full py-3.5 bg-white text-[#7c3aed] rounded-xl font-bold text-[15px] hover:-translate-y-px transition-transform flex items-center justify-center gap-2">
                 <span>💬</span> Draft Reconnection
              </button>
          </div>

          {/* QUICK STATS */}
          <div className="bg-[#1a1f2e] rounded-2xl p-5 border border-slate-800/50">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8] mb-4">Quick Stats</h3>
              <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#0f1419] rounded-xl p-3 text-center">
                      <div className="text-[18px] text-[#e2e8f0] font-bold mb-1">{lastContact === 'Never' ? '—' : lastContact}</div>
                      <div className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold">Last Contact</div>
                  </div>
                  <div className="bg-[#0f1419] rounded-xl p-3 text-center">
                      <div className="text-[18px] text-[#e2e8f0] font-bold mb-1">{contact.interactions?.length || 0}</div>
                      <div className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold">Interactions</div>
                  </div>
                  <div className="bg-[#0f1419] rounded-xl p-3 text-center">
                      <div className="text-[18px] font-bold mb-1 text-[#e2e8f0]">
                        {daysSince === 999 ? '—' : `${daysSince}d`}
                      </div>
                      <div className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold">Days Since</div>
                  </div>
              </div>
          </div>

          {/* CONNECTIONS NOTICE */}
          <div className="bg-[#1a1f2e] rounded-2xl p-6 border border-slate-800/50 text-center">
              <p className="text-[#64748b] text-[12px] mb-3">
                {(contact.connections?.length || 0) > 0 
                  ? `Connected to ${contact.connections?.length} people` 
                  : 'No connections yet'}
              </p>
              <button className="inline-flex items-center gap-1.5 text-[#94a3b8] hover:text-[#a78bfa] border border-[#3d4758] hover:border-[#7c3aed] px-4 py-2 rounded-lg text-xs font-semibold transition-all">
                  <span>🔗</span> {(contact.connections?.length || 0) > 0 ? 'View Connections' : 'Link a Connection'}
              </button>
          </div>

      </div>

      {/* MODALS */}
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

      {isLogOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-end md:items-center justify-center z-50 backdrop-blur-sm" onClick={() => setIsLogOpen(false)}>
          <div 
            className="bg-[#161b22] w-full md:max-w-lg max-h-[90vh] lg:max-h-[85vh] overflow-y-auto p-6 rounded-t-3xl md:rounded-3xl border border-slate-700 animate-in slide-in-from-bottom md:zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()} 
          >
            <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-6 md:hidden" />
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Log Interaction</h2>
                <button onClick={() => setIsLogOpen(false)} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white">
                    <X size={16} />
                </button>
            </div>
            
            <InteractionLogger 
                contactId={contact.id} 
                contactName={name}
                photoUrl={contact.photo_url || contact.avatar_url}
                healthStatus={health || 'drifting'}
                onSuccess={() => {
                   setIsLogOpen(false);
                   setIsPulseOpen(true);
                }}
            />
          </div>
        </div>
      )}

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


interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
}

const ActionButton = ({ icon, label, onClick, href, disabled }: ActionButtonProps) => {
    const Component = href ? 'a' : 'button';
    const componentProps = href ? { href, onClick } : { onClick, disabled };

    return (
        <Component 
          {...componentProps}
          className={`flex flex-col items-center gap-1.5 px-4 py-3.5 rounded-xl bg-[#2d3748] hover:bg-[#3d4758] text-[#e2e8f0] font-medium transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
        >
          <span className="text-xl leading-none">{icon}</span>
          <span className="text-[13px]">{label}</span>
        </Component>
      );
}

export default ConnectionProfile;
