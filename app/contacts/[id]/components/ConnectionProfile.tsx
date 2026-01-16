
import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useMemo } from 'react';
import { AISynopsisCard } from './tabs/overview/AISynopsisCard';
import { StoryTab } from './tabs/StoryTab';
import { FamilyTab } from './tabs/FamilyTab';
import { updateContact } from '@/app/actions/update-contact';
import { logHeaderInteraction } from '@/app/actions/log-header-interaction';
import { getEffectiveSummaryLevel, SummaryLevel } from '@/lib/utils/summary-levels';
import { UserSettings } from '@/lib/utils/summary-levels';

interface ConnectionProfileProps {
  contact: any;
  synopsis: string | null;
  userSettings?: UserSettings; // Pass user settings for default preference
  health?: any;
  lastContact?: string;
  summaryLevel?: any;
  sharedMemory?: any;
  onRefreshAISummary?: () => Promise<void>;
}

export default function ConnectionProfile({ contact, synopsis, userSettings }: ConnectionProfileProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Overview' | 'Story' | 'Family'>('Overview');
  const [isLogging, setIsLogging] = useState(false);
  const [logNote, setLogNote] = useState('');
  const [logType, setLogType] = useState<'connection' | 'attempt'>('connection');
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [headerForm, setHeaderForm] = useState({
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      company: contact.company || '',
      job_title: contact.job_title || '',
      birthday: contact.birthday ? new Date(contact.birthday).toISOString().split('T')[0] : ''
  });
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editForm, setEditForm] = useState({
      email: contact.email || '',
      phone: contact.phone || '',
      birthday: contact.birthday ? new Date(contact.birthday).toISOString().split('T')[0] : ''
  });

  // Calculate the effective summary level
  const summaryLevel: SummaryLevel = useMemo(() => {
    return getEffectiveSummaryLevel(contact, userSettings);
  }, [contact, userSettings]);

  const handleRefreshAISummary = async () => {
    try {
        const response = await fetch('/api/refresh-ai-summary', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                contactId: contact.id,
                force: true 
            }),
        });

        if (!response.ok) throw new Error('Failed to refresh summary');
        
        // Refresh the page data
        router.refresh();
        
    } catch (error) {
        console.error('Error refreshing summary:', error);
    }
  };

  const name = `${contact.first_name} ${contact.last_name || ''}`.trim();
  const photoUrl = contact.avatar_url;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getHealthColor = (days: number) => {
    if (days <= 7) return { border: 'border-green-500', bg: 'bg-green-500' };
    if (days <= 14) return { border: 'border-yellow-500', bg: 'bg-yellow-500' };
    return { border: 'border-red-500', bg: 'bg-red-500' };
  };

  // Safe fallback for days_since_last_interaction
  const daysSince = contact.days_since_last_interaction || 0;
  const healthStyles = getHealthColor(daysSince);

  const handleLogInteraction = async () => {
    if (!logNote.trim()) return;
    
    setIsLogging(true);
    try {
        await logHeaderInteraction(
            contact.id,
            logType,
            logNote
        );
        
        setLogNote('');
        setLogType('connection');
        // Ideally use optimistic update, for now refresh
        window.location.reload();
    } catch (error) {
        console.error('Error logging interaction:', error);
        console.error('Error logging interaction:', error);
        alert(`Failed to log interaction: ${(error as Error).message}`);
    } finally {
        setIsLogging(false);
    }
  };


  const handleSaveHeader = async () => {
    try {
        const result = await updateContact(contact.id, headerForm);
        if (result.success) {
            setIsEditingHeader(false);
            window.location.reload();
        } else {
            alert('Failed to update profile header');
        }
    } catch (error) {
        console.error('Error saving header:', error);
        alert('An error occurred while saving');
    }
  };

  const handleSaveContactInfo = async () => {
      try {
          // Use editForm which contains email/phone
          const result = await updateContact(contact.id, editForm);

          if (result.success) {
              setIsEditingInfo(false);
              window.location.reload();
          } else {
              alert('Failed to update contact info');
          }
      } catch (error) {
          console.error('Error saving contact info:', error);
          alert('An error occurred while saving');
      }
  };

  // Health Score Dates
  const lastContactDate = contact.last_interaction_date ? new Date(contact.last_interaction_date) : null;
  const nextDueDate = lastContactDate && contact.target_frequency_days 
    ? new Date(lastContactDate.getTime() + (contact.target_frequency_days * 24 * 60 * 60 * 1000)) 
    : null;


  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 max-w-7xl mx-auto items-start">

      {/* LEFT COLUMN */}
      <div className="flex flex-col gap-8 px-4 lg:px-0">
        
        {/* Navigation Tabs - Moved to Top of Main Column */}
        <div className="bg-[#1a1f2e] rounded-2xl p-1 border border-slate-800/50 flex transition-all shadow-lg shadow-black/20 backdrop-blur-xl gap-2">
            <button 
              onClick={() => setActiveTab('Overview')}
              className={`flex-1 py-3 rounded-xl text-[14px] font-medium transition-all ${
                activeTab === 'Overview' 
                  ? 'bg-[#2d3748] text-white shadow-sm' 
                  : 'text-[#94a3b8] hover:text-[#cbd5e1] hover:bg-[#2d3748]/50'
              }`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('Story')}
              className={`flex-1 py-3 rounded-xl text-[14px] font-medium transition-all ${
                activeTab === 'Story' 
                  ? 'bg-[#2d3748] text-white shadow-sm' 
                  : 'text-[#94a3b8] hover:text-[#cbd5e1] hover:bg-[#2d3748]/50'
              }`}
            >
              Story
            </button>
            <button 
              onClick={() => setActiveTab('Family')}
              className={`flex-1 py-3 rounded-xl text-[14px] font-medium transition-all ${
                activeTab === 'Family' 
                  ? 'bg-[#2d3748] text-white shadow-sm' 
                  : 'text-[#94a3b8] hover:text-[#cbd5e1] hover:bg-[#2d3748]/50'
              }`}
            >
              Family
            </button>
        </div>

        {activeTab === 'Overview' && (
          <div className="flex flex-col gap-6">
            {/* Header Card */}
            <div className="bg-[#1a1f2e] rounded-2xl p-6 md:p-8 text-center border border-slate-800/50 relative group">
                <button 
                    onClick={() => {
                        if (isEditingHeader) {
                            setIsEditingHeader(false);
                            // Reset form on cancel
                            setHeaderForm({
                                first_name: contact.first_name || '',
                                last_name: contact.last_name || '',
                                company: contact.company || '',
                                job_title: contact.job_title || '',
                                birthday: contact.birthday ? new Date(contact.birthday).toISOString().split('T')[0] : ''
                            });
                        } else {
                            setIsEditingHeader(true);
                        }
                    }}
                    className="absolute top-4 right-4 text-[#64748b] hover:text-[#60a5fa] p-2 rounded-lg hover:bg-[#2d3748]/50 transition-all opacity-0 group-hover:opacity-100"
                    title="Edit Header"
                >
                    {isEditingHeader ? <span className="text-[12px] font-semibold text-[#ef4444]">Cancel</span> : '✏️'}
                </button>

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
                
                {isEditingHeader ? (
                    <div className="flex flex-col gap-3 max-w-sm mx-auto mb-4">
                        <div className="flex gap-2">
                             <input 
                                className="flex-1 bg-[#0f1419] border border-[#3d4758] rounded-lg px-2 py-1.5 text-[14px] text-white text-center"
                                value={headerForm.first_name}
                                onChange={(e) => setHeaderForm({...headerForm, first_name: e.target.value})}
                                placeholder="First Name"
                            />
                             <input 
                                className="flex-1 bg-[#0f1419] border border-[#3d4758] rounded-lg px-2 py-1.5 text-[14px] text-white text-center"
                                value={headerForm.last_name}
                                onChange={(e) => setHeaderForm({...headerForm, last_name: e.target.value})}
                                placeholder="Last Name"
                            />
                        </div>
                        <div className="flex gap-2">
                             <input 
                                className="flex-1 bg-[#0f1419] border border-[#3d4758] rounded-lg px-2 py-1.5 text-[13px] text-[#60a5fa] text-center font-medium"
                                value={headerForm.job_title}
                                onChange={(e) => setHeaderForm({...headerForm, job_title: e.target.value})}
                                placeholder="Job Title"
                            />
                             <input 
                                className="flex-1 bg-[#0f1419] border border-[#3d4758] rounded-lg px-2 py-1.5 text-[13px] text-[#60a5fa] text-center font-medium"
                                value={headerForm.company}
                                onChange={(e) => setHeaderForm({...headerForm, company: e.target.value})}
                                placeholder="Company"
                            />
                        </div>
                         <div className="flex items-center justify-center gap-2">
                            <span className="text-[13px] text-[#64748b]">🎂 Birthday:</span>
                            <input 
                                type="date"
                                className="bg-[#0f1419] border border-[#3d4758] rounded-lg px-2 py-1 text-[13px] text-white [color-scheme:dark]"
                                value={headerForm.birthday}
                                onChange={(e) => setHeaderForm({...headerForm, birthday: e.target.value})}
                            />
                        </div>
                        <button 
                            onClick={handleSaveHeader}
                            className="bg-[#60a5fa] hover:bg-[#3b82f6] text-white px-4 py-1.5 rounded-lg text-sm font-medium mt-1"
                        >
                            Save Changes
                        </button>
                    </div>
                ) : (
                    <>
                        <h1 className="text-2xl font-bold text-white mb-1.5">{name}</h1>
                        
                        {(contact.job_title || contact.company) && (
                        <div className="text-[14px] text-[#60a5fa] font-medium mb-1">
                            {contact.job_title} {contact.job_title && contact.company && 'at'} {contact.company}
                        </div>
                        )}

                        <div className="text-[#64748b] text-[13px] mb-5">
                        🎂 Birthday: {contact.birthday ? new Date(contact.birthday).toLocaleDateString(undefined, { month: 'long', day: 'numeric' }) : 'Not set'}
                        </div>
                    </>
                )}

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
                    aiSummary={synopsis || (contact as any).relationship_summary}
                    summaryLevel={summaryLevel}
                    deepLore={contact.deep_lore}
                    whereMet={contact.where_met}
                    lastUpdated={contact.updated_at}
                    isInline={true}
                    onNavigateToStory={() => setActiveTab('Story')}
                    onRefresh={handleRefreshAISummary}
                />

                {/* Contact Info Inline */}
                <div className="bg-[#1a1f2e] rounded-2xl p-5 border border-slate-800/50">
                    <div className="flex justify-between items-center mb-2">
                        <div className="text-[#94a3b8] text-[11px] font-semibold uppercase tracking-wider">Contact Information</div>
                        <button 
                            onClick={() => {
                                if (isEditingInfo) {
                                    // Cancel
                                    setIsEditingInfo(false);
                                    setEditForm({ 
                                        email: contact.email || '', 
                                        phone: contact.phone || '',
                                        birthday: contact.birthday ? new Date(contact.birthday).toISOString().split('T')[0] : ''
                                    });
                                } else {
                                    setIsEditingInfo(true);
                                }
                            }}
                            className="text-[11px] text-[#60a5fa] hover:text-[#93c5fd] font-medium transition-colors"
                        >
                            {isEditingInfo ? 'Cancel' : 'Edit'}
                        </button>
                    </div>
                    
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 py-3 border-b border-[#2d3748]">
                            <div className="w-10 h-10 bg-[#2d3748] rounded-xl flex items-center justify-center text-lg shrink-0">✉️</div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[10px] text-[#64748b] uppercase tracking-[0.3px] mb-0.5 font-semibold">Email</div>
                                {isEditingInfo ? (
                                    <input 
                                        type="email"
                                        className="w-full bg-[#0f1419] border border-[#3d4758] rounded-lg px-2 py-1 text-[13px] text-white focus:border-[#60a5fa] outline-none"
                                        value={editForm.email}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                        placeholder="email@example.com"
                                    />
                                ) : (
                                    <div className={`text-[14px] truncate ${!contact.email ? 'text-[#64748b] italic' : 'text-[#e2e8f0]'}`}>
                                        {contact.email || 'No email'}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 py-3">
                            <div className="w-10 h-10 bg-[#2d3748] rounded-xl flex items-center justify-center text-lg shrink-0">📞</div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[10px] text-[#64748b] uppercase tracking-[0.3px] mb-0.5 font-semibold">Phone</div>
                                {isEditingInfo ? (
                                    <input 
                                        type="tel"
                                        className="w-full bg-[#0f1419] border border-[#3d4758] rounded-lg px-2 py-1 text-[13px] text-white focus:border-[#60a5fa] outline-none"
                                        value={editForm.phone}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                        placeholder="+1 234 567 8900"
                                    />
                                ) : (
                                    <div className={`text-[14px] truncate ${!contact.phone ? 'text-[#64748b] italic' : 'text-[#e2e8f0]'}`}>
                                        {contact.phone || 'No phone'}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 py-3">
                            <div className="w-10 h-10 bg-[#2d3748] rounded-xl flex items-center justify-center text-lg shrink-0">🎂</div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[10px] text-[#64748b] uppercase tracking-[0.3px] mb-0.5 font-semibold">Birthday</div>
                                {isEditingInfo ? (
                                    <input 
                                        type="date"
                                        className="w-full bg-[#0f1419] border border-[#3d4758] rounded-lg px-2 py-1 text-[13px] text-white focus:border-[#60a5fa] outline-none [color-scheme:dark]"
                                        value={editForm.birthday}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, birthday: e.target.value }))}
                                    />
                                ) : (
                                    <div className={`text-[14px] truncate ${!contact.birthday ? 'text-[#64748b] italic' : 'text-[#e2e8f0]'}`}>
                                        {contact.birthday ? new Date(contact.birthday).toLocaleDateString(undefined, { month: 'long', day: 'numeric' }) : 'Not set'}
                                    </div>
                                )}
                            </div>
                        </div>

                        {isEditingInfo && (
                            <button 
                                onClick={handleSaveContactInfo}
                                className="mt-3 w-full py-2 bg-[#60a5fa] hover:bg-[#3b82f6] text-white rounded-lg text-[13px] font-bold transition-all shadow-lg shadow-blue-900/20"
                            >
                                Save Changes
                            </button>
                        )}
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
                        className="w-full bg-[#0f1419] border border-[#2d3748] focus:border-[#7c3aed] rounded-xl p-3.5 text-white text-[15px] outline-none resize-none min-h-[80px] mb-3 placeholder:text-[#64748b] transition-colors" 
                        placeholder="What did you discuss?"
                        value={logNote}
                        onChange={(e) => setLogNote(e.target.value)}
                    />
                    
                    <div className="grid grid-cols-2 gap-2.5 mb-4">
                        <button 
                            onClick={() => setLogType('attempt')}
                            className={`py-2.5 rounded-xl text-[13px] font-bold transition-all border ${
                                logType === 'attempt' 
                                ? 'bg-[#2d3748]/50 border-[#fbbf24] text-[#fbbf24]' 
                                : 'bg-[#0f1419] border-transparent text-[#64748b] hover:bg-[#2d3748]'
                            }`}
                        >
                            📝 Attempt
                        </button>
                        <button 
                            onClick={() => setLogType('connection')}
                            className={`py-2.5 rounded-xl text-[13px] font-bold transition-all border ${
                                logType === 'connection' 
                                ? 'bg-[#10b981]/10 border-[#10b981] text-[#10b981]' 
                                : 'bg-[#0f1419] border-transparent text-[#64748b] hover:bg-[#2d3748]'
                            }`}
                        >
                            ✅ Connected
                        </button>
                    </div>

                    <button 
                        onClick={handleLogInteraction}
                        disabled={isLogging || !logNote.trim()}
                        className="w-full py-3 bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-[14px] font-bold transition-all shadow-lg shadow-purple-900/20 active:translate-y-0.5"
                    >
                        {isLogging ? 'Saving...' : 'Log Interaction'}
                    </button>

                    <div className="mt-4 pt-4 border-t border-[#2d3748]">
                        <div className="text-[#94a3b8] text-[11px] font-semibold uppercase tracking-wider mb-2.5">Recent Activity ({contact.interactions?.length || 0})</div>
                        {(contact.interactions?.length || 0) > 0 ? (
                            <p className="text-[#cbd5e1] text-[13px] leading-snug">
                                {new Date(contact.interactions![0].date).toLocaleDateString()} - {contact.interactions![0].notes || 'No notes'}
                            </p>
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
                                    <span>👥</span> {contact.importance ? (contact.importance === 'high' ? 'Core Circle' : contact.importance === 'medium' ? 'Steady Friends' : 'Acquaintance') : 'Steady Friends'}
                                </span>
                                <span className="bg-[#2d3748] px-3.5 py-1.5 rounded-lg text-[12px] text-[#cbd5e1] flex items-center gap-1.5 font-medium whitespace-nowrap">
                                    <span>📅</span> {contact.target_frequency_days === 7 ? 'Weekly' : contact.target_frequency_days === 30 ? 'Monthly' : `${contact.target_frequency_days} Days`}
                                </span>
                            </div>
                        </div>
                        <button className="text-[#94a3b8] border border-[#3d4758] hover:border-[#7c3aed] px-4 py-2 rounded-lg text-[13px] font-medium transition-colors shrink-0">Edit</button>
                    </div>
                </div>
          </div>
        )}
        {activeTab === 'Story' && <StoryTab contact={contact} />}
        {activeTab === 'Family' && <FamilyTab contact={contact} />}
      </div>

      {/* RIGHT COLUMN - SIDEBAR */}
      <div className="flex flex-col gap-5 px-4 lg:px-0 pb-10 lg:pb-0">
         
           <div className="bg-linear-to-br from-[#7c3aed] to-[#5b21b6] rounded-2xl p-5 shadow-xl shadow-indigo-900/10 text-white">
             <div className="flex justify-between items-center mb-3">
                 <h3 className="text-[15px] font-bold">Health Score</h3>
                 <span className="bg-white/20 px-2 py-0.5 rounded text-[11px] font-medium backdrop-blur-sm">Beta</span>
             </div>
             
             <div className="text-4xl font-bold mb-4">85<span className="text-[16px] font-medium opacity-80">/100</span></div>
             
             <div className="flex flex-col gap-2 pt-3 border-t border-white/10">
                <div className="flex justify-between items-center text-[13px]">
                   <span className="opacity-70">Last Contact</span>
                   <span className="font-medium">{lastContactDate ? lastContactDate.toLocaleDateString() : 'None'}</span>
                </div>
                <div className="flex justify-between items-center text-[13px]">
                   <span className="opacity-70">Next Due</span>
                   <span className={`font-medium ${nextDueDate && nextDueDate < new Date() ? 'text-red-200' : 'text-green-200'}`}>
                       {nextDueDate ? nextDueDate.toLocaleDateString() : 'Not set'}
                   </span>
                </div>
             </div>
          </div>
      </div>
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
  if (href) {
    if (disabled) {
        return (
            <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#2d3748]/30 border border-[#2d3748] opacity-50 cursor-not-allowed">
                <div className="text-xl grayscale">{icon}</div>
                <span className="text-[11px] text-[#64748b] font-medium">{label}</span>
            </div>
        );
    }
    return (
      <a 
        href={href}
        className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#2d3748]/50 border border-[#3d4758] hover:border-[#60a5fa] hover:bg-[#2d3748] transition-all group"
      >
        <div className="text-xl group-hover:scale-110 transition-transform">{icon}</div>
        <span className="text-[11px] text-[#94a3b8] group-hover:text-white font-medium transition-colors">{label}</span>
      </a>
    );
  }

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#2d3748]/50 border border-[#3d4758] hover:border-[#60a5fa] hover:bg-[#2d3748] transition-all group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[#3d4758]"
    >
      <div className="text-xl group-hover:scale-110 transition-transform">{icon}</div>
      <span className="text-[11px] text-[#94a3b8] group-hover:text-white font-medium transition-colors">{label}</span>
    </button>
  );
};
