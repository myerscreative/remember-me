'use client';

import { useState, useOptimistic, useEffect } from 'react';
import Link from 'next/link';
import { Person } from '@/types/database.types';
import { getDetailedRelationshipHealth as getRelationshipHealth, FREQUENCY_PRESETS } from '@/lib/relationship-health';
import { formatBirthday, getInitials } from '@/lib/utils/contact-helpers';
import { logHeaderInteraction } from '@/app/actions/log-header-interaction';
import { getRecentInteractions } from '@/app/actions/get-recent-interactions';
import { toast } from 'sonner';
import { InteractionLogger } from './InteractionLogger';
import { showNurtureToast } from '@/components/ui/nurture-toast';
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  Camera, 
  Star, 
  Calendar,
  ChevronLeft,
  Edit2,
  Cake
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface PersonHeaderProps {
  contact: Person;
  onEdit: () => void;
  onToggleFavorite: () => void;
  onAvatarClick: () => void;
}

// Helper function to format time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function PersonHeader({ contact, onEdit, onToggleFavorite, onAvatarClick }: PersonHeaderProps) {
  // Optimistic UI for photo
  const [optimisticPhotoUrl] = useOptimistic(
    contact.photo_url,
    (state: string | null, newUrl: string) => newUrl
  );

  // Health Calculation
  const health = getRelationshipHealth(contact.last_interaction_date, contact.target_frequency_days || 30);
  
  // Frequency Label (e.g. "Monthly Cadence")
  const frequencyLabel = FREQUENCY_PRESETS.find(p => p.days === contact.target_frequency_days)?.label || "Monthly";



  return (
    <div className="relative w-full bg-gradient-to-b from-[#111322] to-[#1a1b2e] pb-8 pt-4 rounded-b-[32px] shadow-2xl">
      
      {/* Top Navigation Bar */}
      <div className="flex justify-between items-center px-6 mb-6">
         <Link href="/" className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors">
            <ChevronLeft size={28} />
         </Link>
         <div className="flex gap-4">
            <button onClick={onToggleFavorite} className="text-gray-400 hover:text-yellow-400 transition-colors">
                <Star size={24} className={cn(contact.is_favorite && "fill-yellow-400 text-yellow-400")} />
            </button>
            <button onClick={onEdit} className="text-gray-400 hover:text-white transition-colors">
                <Edit2 size={24} />
            </button>
         </div>
      </div>

      <div className="flex flex-col items-center w-full px-6">
        
        {/* Avatar Section with Ring & Status Dot */}
        <div className="relative group mb-6 cursor-pointer" onClick={onAvatarClick}>
           {/* Glow Effect */}
           <div className="absolute inset-0 rounded-full blur-xl opacity-20" style={{ backgroundColor: health.color }} />
           
           {/* Ring Container */}
           <div 
                className="relative w-[140px] h-[140px] rounded-full flex items-center justify-center bg-[#1a1b2e]"
                style={{ border: `4px solid ${health.color}40` }}
           >
               {/* Active Ring Segment */}
               <div className="absolute inset-0 rounded-full" style={{ border: `4px solid ${health.color}` }} />

               <Avatar className="w-[124px] h-[124px] border-[4px] border-[#1a1b2e]">
                 <AvatarImage src={optimisticPhotoUrl || contact.photo_url || ''} className="object-cover" />
                 <AvatarFallback className="text-4xl font-bold bg-[#242642] text-white">
                   {getInitials(contact.first_name, contact.last_name)}
                 </AvatarFallback>
               </Avatar>

               {/* Status Dot */}
               <div 
                    className="absolute bottom-2 right-2 w-6 h-6 rounded-full border-[4px] border-[#1a1b2e]" 
                    style={{ backgroundColor: health.color }} 
               />
               
               {/* Hover Upload Icon */}
               <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <Camera className="w-8 h-8 text-white drop-shadow-lg" />
               </div>
           </div>
        </div>

        {/* Identity Section */}
        <div className="text-center space-y-2 mb-8">
           <h1 className="text-3xl font-bold text-white tracking-tight">
             {contact.first_name} {contact.last_name}
           </h1>
           
           {contact.birthday && (
             <div className="flex items-center justify-center gap-2 text-[#818cf8] font-medium">
               <Cake size={18} className="mb-0.5" />
               <span>{formatBirthday(contact.birthday)}</span>
             </div>
           )}

           <div className="pt-2">
             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#242642] border border-white/5 text-gray-300 text-sm font-medium">
                <Calendar size={14} className="text-gray-400" />
                <span>{frequencyLabel} Cadence</span>
             </div>
           </div>
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-sm mb-6">
            {/* Call */}
            <a href={contact.phone ? `tel:${contact.phone}` : undefined} 
               className={cn(
                 "flex flex-col items-center justify-center gap-2 py-5 rounded-2xl transition-all duration-200",
                 contact.phone 
                   ? "bg-[#242642] hover:bg-[#2e3152] active:scale-95 text-indigo-300" 
                   : "bg-[#242642]/50 cursor-not-allowed opacity-50 text-gray-500"
               )}
            >
                <Phone size={24} />
                <span className="text-sm font-medium text-gray-300">Call</span>
            </a>

            {/* Email */}
            <a href={contact.email ? `mailto:${contact.email}` : undefined} 
               className={cn(
                 "flex flex-col items-center justify-center gap-2 py-5 rounded-2xl transition-all duration-200",
                 contact.email 
                   ? "bg-[#242642] hover:bg-[#2e3152] active:scale-95 text-indigo-300"
                   : "bg-[#242642]/50 cursor-not-allowed opacity-50 text-gray-500"
               )}
            >
                <Mail size={24} className="text-indigo-300" /> 
                <span className="text-sm font-medium text-gray-300">Email</span>
            </a>

            {/* Text */}
            <a href={contact.phone ? `sms:${contact.phone}` : undefined} 
               className={cn(
                 "flex flex-col items-center justify-center gap-2 py-5 rounded-2xl transition-all duration-200",
                 contact.phone 
                   ? "bg-[#242642] hover:bg-[#2e3152] active:scale-95 text-indigo-300" 
                   : "bg-[#242642]/50 cursor-not-allowed opacity-50 text-gray-500"
               )}
            >
                <MessageSquare size={24} />
                <span className="text-sm font-medium text-gray-300">Text</span>
            </a>
        </div>

        {/* Separator */}
        <div className="w-full max-w-sm border-t border-white/5 mb-6" />

        {/* Interaction Logger */}
        <div className="w-full max-w-sm">
            <InteractionLogger 
                contactId={contact.id} 
                contactName={contact.first_name} 
            />
        </div>

      </div>
    </div>
  );
}
