'use client';

import { useState, useOptimistic, useEffect } from 'react';
import Link from 'next/link';
import { Person } from '@/types/database.types';
import { getRelationshipHealth, FREQUENCY_PRESETS } from '@/lib/relationship-health';
import { formatBirthday, getInitials } from '@/lib/utils/contact-helpers';
import { logHeaderInteraction } from '@/app/actions/log-header-interaction';
import { getRecentInteractions } from '@/app/actions/get-recent-interactions';
import { toast } from 'sonner';
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

  // Interaction Logger State
  const [quickNote, setQuickNote] = useState("");
  const [isLogging, setIsLogging] = useState(false);
  const [recentInteractions, setRecentInteractions] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch recent interactions on mount and after logging
  useEffect(() => {
    const fetchInteractions = async () => {
      console.log('Fetching interactions for contact:', contact.id);
      const result = await getRecentInteractions(contact.id, 3);
      console.log('Interactions result:', result);
      if (result.success) {
        setRecentInteractions(result.interactions);
      }
    };
    fetchInteractions();
  }, [contact.id, refreshTrigger]);

  const handleLogInteraction = async (type: 'connection' | 'attempt') => {
      setIsLogging(true);
      try {
          const result = await logHeaderInteraction(contact.id, type, quickNote);
          if (result.success) {
              // Show appropriate feedback based on action type
              if (type === 'connection') {
                  showNurtureToast(contact.first_name);
              } else {
                  toast.success('Attempt logged');
              }
              setQuickNote(""); // Clear note
              // Trigger re-fetch of interactions
              setRefreshTrigger(prev => prev + 1);
          } else {
              toast.error('Failed to log interaction');
          }
      } catch (err) {
          console.error(err);
          toast.error('Error logging interaction');
      } finally {
          setIsLogging(false);
      }
  };

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
        <div className="w-full max-w-sm space-y-3">
            {/* Note Input */}
            <input 
                type="text" 
                placeholder="Add a quick note..." 
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                className="w-full bg-[#242642] border border-white/5 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
            />
            
            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={() => handleLogInteraction('attempt')}
                    disabled={isLogging}
                    className="flex items-center justify-center py-2.5 rounded-lg border border-orange-500/20 bg-orange-500/10 hover:bg-orange-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                    <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">
                        {isLogging ? 'Saving...' : 'Log Attempt'}
                    </span>
                </button>

                <button 
                    onClick={() => handleLogInteraction('connection')}
                    disabled={isLogging}
                    className="flex items-center justify-center py-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                     <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                        {isLogging ? 'Saving...' : 'Log Connection'}
                    </span>
                </button>
            </div>

            {/* Recent Interactions */}
            <div className="mt-4 space-y-2">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Recent Activity ({recentInteractions.length})
              </h4>
              {recentInteractions.length === 0 ? (
                <p className="text-xs text-gray-500 italic">No interactions yet. Log one above!</p>
              ) : (
                recentInteractions.map((interaction: any) => {
                  const date = new Date(interaction.date);
                  const timeAgo = getTimeAgo(date);
                  const isAttempt = interaction.notes?.includes('[Attempted Contact]');
                  
                  return (
                    <div 
                      key={interaction.id} 
                      className="flex items-start gap-2 p-2 rounded-lg bg-[#1a1b2e] border border-white/5"
                    >
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
                        isAttempt ? "bg-orange-400" : "bg-emerald-400"
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-300 line-clamp-2">
                          {interaction.notes || 'No note'}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{timeAgo}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
        </div>

      </div>
    </div>
  );
}
