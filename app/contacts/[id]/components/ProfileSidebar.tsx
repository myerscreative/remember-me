'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, MessageSquare, Clock, Briefcase, Cake, Repeat, Info, Edit2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ImportanceSelector } from '@/components/shared/ImportanceSelector';
import { ContactImportance } from '@/types/database.types';
import { FREQUENCY_PRESETS } from '@/lib/relationship-health';
import { getRelationshipStatus } from '@/app/network/utils/relationshipStatus';
import { cn } from '@/lib/utils';

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
    last_contact_method?: string;
    next_contact_date?: string;
    target_frequency_days?: number;
    importance?: ContactImportance;
  };
  onFrequencyChange?: (days: number) => void;
  onImportanceChange?: (importance: ContactImportance) => void;
  onContactAction?: (method: 'call' | 'email' | 'text') => void;
  onLastContactChange?: (date: string, method: string) => void;
}

export function ProfileSidebar({ contact, onFrequencyChange, onImportanceChange, onContactAction, onLastContactChange }: ProfileSidebarProps) {
  const initials = ((contact.firstName?.[0] || "") + (contact.lastName?.[0] || "")).toUpperCase();
  const fullName = `${contact.firstName} ${contact.lastName || ""}`.trim();

  // Helper to format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Helper to format contact method
  const formatMethod = (method?: string) => {
    if (!method) return null;
    const methods: Record<string, string> = { call: 'Call', email: 'Email', text: 'Text', meeting: 'Meeting' };
    return methods[method.toLowerCase()] || method;
  };

  // Build last contact display string
  const lastContactDisplay = () => {
    const date = formatDate(contact.last_contact_date);
    const method = formatMethod(contact.last_contact_method);
    if (!date) return 'Never';
    return method ? `${date} via ${method}` : date;
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
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center mb-4">
                {contact.job_title || contact.jobTitle}
                {contact.job_title && contact.company && " at "}
                {contact.company}
            </p>
        )}

        {/* Contact Info - Moved to top for easier access */}
        <div className="space-y-2 mb-6 w-full px-2">
          {contact.email && (
            <a href={`mailto:${contact.email}`} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <Mail className="w-4 h-4 shrink-0" />
              <span className="truncate">{contact.email}</span>
            </a>
          )}
          {contact.phone && (
            <a href={`tel:${contact.phone}`} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <Phone className="w-4 h-4 shrink-0" />
              <span>{contact.phone}</span>
            </a>
          )}
          {contact.linkedin && (
            <a href={contact.linkedin.startsWith('http') ? contact.linkedin : `https://${contact.linkedin}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <Briefcase className="w-4 h-4 shrink-0" />
              <span>LinkedIn Profile</span>
            </a>
          )}
        </div>

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
             {(() => {
                // Map local contact prop to expected Person shape for the utility
                const status = getRelationshipStatus({
                    ...contact,
                    last_interaction_date: contact.last_contact_date || null,
                    last_contact: contact.last_contact_date || null, // Fallback
                    birthday: contact.birthday || null,
                    // Cast as any since we are just passing partial data needed for status
                } as any);

                return (
                    <Badge className={cn(
                        "px-3 py-1.5 rounded-xl font-sans font-normal text-xs uppercase tracking-wide border",
                        status.colorClass.replace("text-", "bg-").replace("600", "50").replace("400", "900/20").replace("500", "100") + " " + status.colorClass.replace("dark:text-", "dark:bg-").replace("dark:text-slate-400", "dark:bg-slate-800") + " border-transparent"
                    )}>
                        {/* 
                           Note: The utility returns text classes (e.g. text-purple-600). 
                           We want to style the Badge background based on that, or just use the text color with a subtle BG.
                           Let's simplify: Use the text color class directly on the text, and a standard subtle background,
                           OR map the colors manually for the Badge style to match the requested look.
                           User asked for "Color States".
                           Let's do manual mapping for the Badge based on the label content or reuse the utility style if possible?
                           Actually, the utility returns "text-purple-600". I can just apply that to the text inside a standard badge,
                           or conditionally style the badge.
                           Let's attempt to use the returned class for text and a matching soft bg.
                        */}
                        <span className={status.colorClass}>{status.label}</span>
                    </Badge>
                );
             })()}
             
             {/* Info Popover for Context (Optional, keeping it simple or verifying if user wants it removed? User said "Replace metaphor...". I'll keep the popover if it explains the *new* status, but the old one explained "Manual Mode". The new status is self-explanatory ("Overdue: 12 Days"). I will remove the old specific popover to avoid confusion.) */}
        </div>

      </div>

      {/* Last Contact Editor */}
      <div className="mb-8 pb-8 border-b border-gray-100 dark:border-[#3a3f4b]">
        <LastContactEditor
          currentDate={contact.last_contact_date}
          currentMethod={contact.last_contact_method}
          displayText={lastContactDisplay()}
          onSave={(date, method) => onLastContactChange?.(date, method)}
        />
      </div>

      {/* Importance & Frequency */}
      <div className="space-y-4">
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

// Inline Last Contact Editor Component
function LastContactEditor({ 
  currentDate, 
  currentMethod, 
  displayText,
  onSave 
}: { 
  currentDate?: string;
  currentMethod?: string;
  displayText: string;
  onSave?: (date: string, method: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState(currentDate?.split('T')[0] || '');
  const [method, setMethod] = useState(currentMethod || '');

  const handleSave = () => {
    onSave?.(date, method);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group">
          <Clock className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 shrink-0 transition-colors" />
          <span>Last contact: {displayText}</span>
          <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-indigo-500 transition-opacity" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155] shadow-xl rounded-xl z-[9999]">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Log Contact</h4>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select method...</option>
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="text">Text</option>
              <option value="meeting">Meeting</option>
            </select>
          </div>
          <Button 
            onClick={handleSave}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 rounded-lg"
          >
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
