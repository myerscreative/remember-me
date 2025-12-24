'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, MessageSquare, Clock, Briefcase, Cake, Repeat, Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ImportanceSelector } from '@/components/shared/ImportanceSelector';
import { ContactImportance } from '@/types/database.types';
import { FREQUENCY_PRESETS } from '@/lib/relationship-health';

interface ProfileSidebarProps {
  contact: {
    id: string;
    firstName: string;
    lastName?: string;
    photo_url?: string;
    email?: string;
    phone?: string;
    linkedin?: string;
    company?: string;
    job_title?: string;
    jobTitle?: string;
    birthday?: string;
    last_contact_date?: string;
    next_contact_date?: string;
    target_frequency_days?: number;
    importance?: ContactImportance;
  };
  onFrequencyChange?: (days: number) => void;
  onImportanceChange?: (importance: ContactImportance) => void;
}

export function ProfileSidebar({ contact, onFrequencyChange, onImportanceChange }: ProfileSidebarProps) {
  const initials = ((contact.firstName?.[0] || "") + (contact.lastName?.[0] || "")).toUpperCase();
  const fullName = `${contact.firstName} ${contact.lastName || ""}`.trim();

  // Helper to format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <aside className="w-[350px] shrink-0 flex flex-col h-screen sticky top-0 bg-sidebar border-r border-sidebar-border overflow-y-auto px-8 py-8">
      {/* 1. Profile Photo */}
      <div className="flex flex-col items-center">
        <div className="relative mb-6 group">
          <Avatar className="h-[160px] w-[160px] border-[3px] border-[#6366f1] shadow-[0_4px_12px_rgba(99,102,241,0.15)]">
            <AvatarImage src={contact.photo_url || ""} className="object-cover" />
            <AvatarFallback className="text-4xl bg-gray-100 dark:bg-gray-800 text-gray-400">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* 2. Name & Title */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-1">{fullName}</h1>
        
        {/* Job Title & Company */}
        {(contact.job_title || contact.company) && (
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center mb-2">
                {contact.job_title || contact.jobTitle}
                {contact.job_title && contact.company && " at "}
                {contact.company}
            </p>
        )}

        {contact.linkedin && (
             <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4 flex items-center gap-1.5 justify-center">
                <Briefcase className="w-3.5 h-3.5" />
                <a href={contact.linkedin.startsWith('http') ? contact.linkedin : `https://${contact.linkedin}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    LinkedIn
                </a>
             </p>
        )}

        {/* Birthday Display - Always visible */}
        <div className="flex items-center justify-center gap-2 mb-6">
            <Badge variant="outline" className="px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 rounded-full font-medium">
                <Cake className="w-3.5 h-3.5 mr-1.5 inline-block -mt-0.5" />
                {contact.birthday 
                  ? new Date(contact.birthday).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
                  : "Birthday: Not set"}
            </Badge>
        </div>

        {/* 3. Status Badge */}
        <div className="mb-4 mt-2 flex items-center justify-center gap-2">
             <Badge className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 px-3 py-1.5 rounded-xl font-normal text-xs uppercase tracking-wide">
                Next: {contact.next_contact_date ? formatDate(contact.next_contact_date) : "NO RHYTHM SET"}
             </Badge>
             {!contact.next_contact_date && (
                <Popover>
                    <PopoverTrigger asChild>
                        <Info className="w-3.5 h-3.5 text-rose-500/70 hover:text-rose-600 cursor-pointer focus:outline-none transition-colors" aria-label="Status info" role="button" />
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-4 bg-[#1E293B] border-[#334155] shadow-xl rounded-xl z-[9999]">
                        <p className="text-slate-400 text-[11px] leading-relaxed mb-3">
                            <span className="text-slate-200 font-bold">Automatic contact reminders are not set.</span> Current setting is <span className="text-slate-200 font-bold">Manual Mode</span>, which means you will not be prompted to contact this person.
                        </p>
                        <p className="text-slate-400 text-[11px] leading-relaxed">
                            To set intervals and receive automated reminders, use the <span className="text-slate-200 font-bold">Contact Cadence</span> selector below.
                        </p>
                    </PopoverContent>
                </Popover>
            )}
        </div>

      </div>

      {/* 5. Contact Details List */}
      <div className="space-y-4 py-8 border-t border-b border-gray-100 dark:border-[#3a3f4b] mb-8">
        {contact.phone && (
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <Phone className="w-4 h-4 text-gray-400 shrink-0" />
            <span>{contact.phone}</span>
          </div>
        )}
        {contact.email && (
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <Mail className="w-4 h-4 text-gray-400 shrink-0" />
            <a href={`mailto:${contact.email}`} className="hover:text-indigo-600 transition-colors truncate">
              {contact.email}
            </a>
          </div>
        )}
        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4 text-gray-400 shrink-0" />
            <span>Last seen: {formatDate(contact.last_contact_date) || "Never"}</span>
        </div>
      </div>

      {/* 5. Primary Actions */}
      <div className="space-y-3">
        <Button 
          className="w-full bg-[#6366f1] hover:bg-[#5558dd] text-white shadow-sm h-auto py-3.5 text-sm font-medium rounded-xl transition-all hover:-translate-y-0.5 border-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          onClick={() => contact.phone && window.open(`tel:${contact.phone}`)}
          disabled={!contact.phone}
        >
          <Phone className="w-4 h-4 mr-2" />
          Call
        </Button>
        <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="w-full bg-[#f9fafb] dark:bg-[#2c3039] border-[#e5e7eb] dark:border-[#3a3f4b] text-[#4b5563] dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#343942] h-auto py-3.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => contact.email && window.open(`mailto:${contact.email}`)}
              disabled={!contact.email}
            >
                <Mail className="w-4 h-4 mr-2" /> Email
            </Button>
            <Button 
              variant="outline" 
              className="w-full bg-[#f9fafb] dark:bg-[#2c3039] border-[#e5e7eb] dark:border-[#3a3f4b] text-[#4b5563] dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#343942] h-auto py-3.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => contact.phone && window.open(`sms:${contact.phone}`)}
              disabled={!contact.phone}
            >
                <MessageSquare className="w-4 h-4 mr-2" /> Text
            </Button>
        </div>
      </div>

      {/* 6. Importance & Frequency (Moved to Bottom) */}
      <div className="mt-8 pt-6 border-t border-gray-100 dark:border-[#3a3f4b] w-full space-y-4">
         {/* Importance Selector */}
         <div>
           <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span className="font-medium">Relationship Level</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-slate-400 hover:text-blue-500 transition-colors cursor-pointer focus:outline-none" aria-label="Priority info" role="button" />
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4 bg-[#1E293B] border-[#334155] shadow-xl rounded-xl z-[9999]">
                   <div className="space-y-3">
                      <h3 className="text-slate-200 font-bold text-xs uppercase tracking-wider border-b border-slate-700/50 pb-2">Relationship Level</h3>
                      <p className="text-slate-400 text-[11px] leading-relaxed mb-3">
                        <span className="text-white font-bold">Relationship Level</span> defines the depth of your connection.
                      </p>
                      <div>
                        <h4 className="text-[#38BDF8] font-bold text-xs uppercase tracking-wide mb-1">Inner Circle</h4>
                        <p className="text-slate-500 text-[11px] leading-relaxed">Foundational relationships needing frequent attention.</p>
                      </div>
                      <div className="w-full h-px bg-slate-700/50" />
                      <div>
                        <h4 className="text-blue-400 font-bold text-xs uppercase tracking-wide mb-1">Steady Friends</h4>
                         <p className="text-slate-500 text-[11px] leading-relaxed">Core peers needing consistent touchpoints.</p>
                      </div>
                      <div className="w-full h-px bg-slate-700/50" />
                      <div>
                        <h4 className="text-slate-400 font-bold text-xs uppercase tracking-wide mb-1">Distant Peers</h4>
                         <p className="text-slate-500 text-[11px] leading-relaxed">Acquaintances needing a light touch.</p>
                      </div>
                   </div>
                </PopoverContent>
              </Popover>
           </div>
           <ImportanceSelector 
              importance={contact.importance || 'medium'} 
              onChange={(val) => onImportanceChange?.(val)} 
           />
         </div>

         {/* Frequency Selector */}
         <div>
             <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-gray-400" />
                <span className="font-medium">Contact Cadence</span>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-slate-400 hover:text-blue-500 transition-colors cursor-pointer focus:outline-none" aria-label="Cadence info" role="button" />
                </PopoverTrigger>
                <PopoverContent className="w-72 p-4 bg-[#1E293B] border-[#334155] shadow-xl rounded-xl z-[9999]">
                   <div className="space-y-2">
                      <h3 className="text-slate-200 font-bold text-xs uppercase tracking-wider border-b border-slate-700/50 pb-2">Nurture Cadence</h3>
                      <p className="text-slate-400 text-[11px] leading-relaxed mb-2">
                        <span className="text-white font-bold">Set your Pace.</span> This interval determines how often you want to reach out. It drives the &apos;health decay&apos; in your Garden, moving leaves toward the Thirsty ring if too much time passes.
                      </p>
                   </div>
                </PopoverContent>
              </Popover>
            </div>
            <select
              value={contact.target_frequency_days || 30}
              onChange={(e) => onFrequencyChange?.(parseInt(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-[#3a3f4b] bg-gray-50 dark:bg-[#2c3039] text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
            >
              {FREQUENCY_PRESETS.map(preset => (
                <option key={preset.days} value={preset.days}>
                  {preset.label}
                </option>
              ))}
            </select>
         </div>
      </div>

    </aside>
  );
}
