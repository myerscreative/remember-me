'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, MessageSquare, Clock, MapPin, Briefcase, Cake } from 'lucide-react';

interface ProfileSidebarProps {
  contact: {
    firstName: string;
    lastName?: string;
    photo_url?: string;
    email?: string;
    phone?: string;
    linkedin?: string;
    birthday?: string;
    last_contact_date?: string;
    next_contact_date?: string;
  };
}

export function ProfileSidebar({ contact }: ProfileSidebarProps) {
  const initials = ((contact.firstName?.[0] || "") + (contact.lastName?.[0] || "")).toUpperCase();
  const fullName = `${contact.firstName} ${contact.lastName || ""}`.trim();

  // Helper to format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <aside className="w-[350px] shrink-0 flex flex-col h-[calc(100vh-65px)] sticky top-[65px] bg-white dark:bg-[#252931] border-r border-gray-100 dark:border-[#3a3f4b] overflow-y-auto px-8 py-8">
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
        {contact.linkedin && (
             <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4 flex items-center gap-1.5 justify-center">
                <Briefcase className="w-3.5 h-3.5" />
                {contact.linkedin}
             </p>
        )}

        {/* 3. Status Badge */}
        <div className="mb-8 mt-2">
             <Badge className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 px-3 py-1.5 rounded-xl font-normal text-xs uppercase tracking-wide">
                Next: {formatDate(contact.next_contact_date) || "Not scheduled"}
             </Badge>
        </div>
      </div>

      {/* 4. Contact Details List */}
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
        {contact.birthday && (
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <Cake className="w-4 h-4 text-gray-400 shrink-0" />
            <span>{formatDate(contact.birthday)}</span>
          </div>
        )}
        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4 text-gray-400 shrink-0" />
            <span>Last seen: {formatDate(contact.last_contact_date) || "Never"}</span>
        </div>
      </div>

      {/* 5. Primary Actions */}
      <div className="space-y-3">
        <Button className="w-full bg-[#6366f1] hover:bg-[#5558dd] text-white shadow-sm h-auto py-3.5 text-sm font-medium rounded-xl transition-all hover:-translate-y-0.5 border-0">
          <Phone className="w-4 h-4 mr-2" />
          Call
        </Button>
        <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="w-full bg-[#f9fafb] dark:bg-[#2c3039] border-[#e5e7eb] dark:border-[#3a3f4b] text-[#4b5563] dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#343942] h-auto py-3.5 rounded-xl">
                <Mail className="w-4 h-4 mr-2" /> Email
            </Button>
            <Button variant="outline" className="w-full bg-[#f9fafb] dark:bg-[#2c3039] border-[#e5e7eb] dark:border-[#3a3f4b] text-[#4b5563] dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#343942] h-auto py-3.5 rounded-xl">
                <MessageSquare className="w-4 h-4 mr-2" /> Text
            </Button>
        </div>
      </div>

    </aside>
  );
}
