import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, MessageSquare, Briefcase, Cake, Repeat, Camera, Loader2 } from 'lucide-react';
import { ImportanceSelector } from '@/components/shared/ImportanceSelector';
import { ContactImportance } from '@/types/database.types';
import { FREQUENCY_PRESETS, getDetailedRelationshipHealth as getRelationshipHealth } from '@/lib/relationship-health';
import { cn } from '@/lib/utils';
import { InteractionLogger } from './InteractionLogger';
import { getInitials } from '@/lib/utils/contact-helpers';

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
    last_interaction_date?: string; // Additional check if passed different name
  };
  onFrequencyChange?: (days: number) => void;
  onImportanceChange?: (importance: ContactImportance) => void;
  onPhotoUpdate?: (url: string) => void;
}

export function ProfileSidebar({ contact, onFrequencyChange, onImportanceChange, onPhotoUpdate }: ProfileSidebarProps) {
  const initials = getInitials(contact.firstName, contact.lastName);
  const fullName = `${contact.firstName} ${contact.lastName || ""}`.trim();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine which date to use for health
  const healthDate = contact.last_contact_date || contact.last_interaction_date || null;
  // Calculate Health
  const health = getRelationshipHealth(healthDate, contact.target_frequency_days || 30);


  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
    }

    // Validate size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
        toast.error('Image must be less than 20MB');
        return;
    }

    setIsUploading(true);
    const supabase = createClient();

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${contact.id}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        // 1. Upload to Storage
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 2. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        // 3. Update Database
        const { error: dbError } = await (supabase as any)
            .from('persons')
            .update({ photo_url: publicUrl })
            .eq('id', contact.id);

        if (dbError) throw dbError;

        toast.success("Profile photo updated");
        onPhotoUpdate?.(publicUrl);
    } catch (error) {
        console.error('Error uploading avatar:', error);
        toast.error('Failed to update photo');
    } finally {
        setIsUploading(false);
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <aside className="w-[350px] shrink-0 flex flex-col h-screen sticky top-0 bg-[#0f111a] border-r border-white/10 overflow-y-auto">
      <div className="p-8 space-y-8">
        
        {/* 1. Profile Photo with Health Ring */}
        <div className="flex flex-col items-center">
            <div className="relative group mb-4 cursor-pointer" onClick={handleAvatarClick}>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                />
                
                {/* Glow Effect */}
                <div className="absolute inset-0 rounded-full blur-xl opacity-10" style={{ backgroundColor: health.color }} />
            
                {/* Ring Container */}
                <div 
                        className="relative w-[140px] h-[140px] rounded-full flex items-center justify-center bg-[#1a1b2e]"
                        style={{ border: `4px solid ${health.color}40` }}
                >
                    {/* Active Ring Segment */}
                    <div className="absolute inset-0 rounded-full" style={{ border: `4px solid ${health.color}` }} />

                    <Avatar className={cn(
                        "w-[124px] h-[124px] border-4 border-[#1a1b2e]",
                        isUploading && "opacity-50"
                    )}>
                        <AvatarImage src={contact.photo_url || ""} className="object-cover" />
                        <AvatarFallback className="text-4xl font-bold bg-[#242642] text-white">
                        {initials}
                        </AvatarFallback>
                    </Avatar>

                    {/* Status Dot */}
                    <div 
                            className="absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-[#1a1b2e]" 
                            style={{ backgroundColor: health.color }} 
                    />
                    
                    {/* Hover Upload Icon */}
                    <div className={cn(
                        "absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity",
                         isUploading && "opacity-100 bg-black/50"
                    )}>
                        {isUploading ? (
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                        ) : (
                            <Camera className="w-8 h-8 text-white drop-shadow-lg" />
                        )}
                    </div>
                </div>
            </div>

            {/* Name & Identity */}
            <h1 className="text-2xl font-bold text-white text-center mb-1">{fullName}</h1>
            {(contact.job_title || contact.company) && (
                <p className="text-sm font-medium text-gray-400 text-center mb-2">
                    {contact.job_title || contact.jobTitle}
                    {contact.job_title && contact.company && " at "}
                    {contact.company}
                </p>
            )}
             {/* Birthday Badge - Restored */}
             <div className="flex items-center justify-center gap-2 mb-4">
                <Badge variant="outline" className="px-3 py-1.5 bg-[#242642] border-white/10 text-gray-300 rounded-full font-medium">
                    <Cake className="w-3.5 h-3.5 mr-1.5 inline-block -mt-0.5 text-indigo-400" />
                    {contact.birthday
                    ? new Date(contact.birthday).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
                    : "Birthday: Not set"}
                </Badge>
            </div>
        </div>

        {/* 2. Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
            <a href={contact.phone ? `tel:${contact.phone}` : undefined} 
                className={cn(
                    "flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all duration-200 border border-white/5",
                    contact.phone 
                    ? "bg-[#242642] hover:bg-[#2e3152] active:scale-95 text-indigo-300" 
                    : "bg-[#242642]/30 cursor-not-allowed opacity-50 text-gray-500"
                )}
            >
                <Phone size={20} />
                <span className="text-xs font-medium text-gray-300">Call</span>
            </a>

            <a href={contact.email ? `mailto:${contact.email}` : undefined} 
                className={cn(
                    "flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all duration-200 border border-white/5",
                    contact.email 
                    ? "bg-[#242642] hover:bg-[#2e3152] active:scale-95 text-indigo-300"
                    : "bg-[#242642]/30 cursor-not-allowed opacity-50 text-gray-500"
                )}
            >
                <Mail size={20} /> 
                <span className="text-xs font-medium text-gray-300">Email</span>
            </a>

            <a href={contact.phone ? `sms:${contact.phone}` : undefined} 
                className={cn(
                    "flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all duration-200 border border-white/5",
                    contact.phone 
                    ? "bg-[#242642] hover:bg-[#2e3152] active:scale-95 text-indigo-300" 
                    : "bg-[#242642]/30 cursor-not-allowed opacity-50 text-gray-500"
                )}
            >
                <MessageSquare size={20} />
                <span className="text-xs font-medium text-gray-300">Text</span>
            </a>
        </div>

        <div className="w-full h-px bg-white/5" />

        {/* 3. Interaction Logger */}
        <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Log Interaction</h3>
            <InteractionLogger 
                contactId={contact.id} 
                contactName={contact.firstName} 
            />
        </div>

        <div className="w-full h-px bg-white/5" />

        {/* 4. Contact Details (Secondary) */}
        <div className="space-y-3">
             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Details</h3>
             
             {/* Importance & Frequency */}
             <div className="space-y-4">
                 {/* Importance Selector */}
                <div>
                   <div className="flex items-center gap-2 text-sm text-gray-400 mb-1.5">
                      <span className="font-medium">Relationship Level</span>
                   </div>
                   <ImportanceSelector 
                      importance={contact.importance || 'medium'} 
                      onChange={(val) => onImportanceChange?.(val)} 
                   />
                 </div>

                 {/* Frequency Selector */}
                 <div>
                     <div className="flex items-center gap-2 text-sm text-gray-400 mb-1.5">
                      <div className="flex items-center gap-2">
                        <Repeat className="w-3.5 h-3.5 text-gray-500" />
                        <span className="font-medium">Cadence</span>
                      </div>
                    </div>
                    <select
                      value={contact.target_frequency_days || 30}
                      onChange={(e) => onFrequencyChange?.(parseInt(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-[#242642] text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer"
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

             {/* Existing Contact Info Links */}
             <div className="space-y-1 pt-2">
                {contact.email && (
                    <a href={`mailto:${contact.email}`} className="flex items-center gap-3 text-sm text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5">
                        <Mail className="w-4 h-4 shrink-0" />
                        <span className="truncate">{contact.email}</span>
                    </a>
                )}
                {contact.phone && (
                    <a href={`tel:${contact.phone}`} className="flex items-center gap-3 text-sm text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5">
                        <Phone className="w-4 h-4 shrink-0" />
                        <span>{contact.phone}</span>
                    </a>
                )}
                {contact.linkedin && (
                    <a href={contact.linkedin.startsWith('http') ? contact.linkedin : `https://${contact.linkedin}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5">
                        <Briefcase className="w-4 h-4 shrink-0" />
                        <span>LinkedIn</span>
                    </a>
                )}
             </div>
        </div>

        
      </div>
    </aside>
  );
}

