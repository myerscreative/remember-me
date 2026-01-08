'use client';

import { useState, useOptimistic, useRef } from 'react';
import { Person } from '@/types/database.types';
import { getRelationshipHealth, FREQUENCY_PRESETS } from '@/lib/relationship-health';
import { formatBirthday, getInitials } from '@/lib/utils/contact-helpers';
import { uploadPersonPhoto } from '@/app/actions/upload-photo';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  Camera, 
  Star, 
  Calendar, 
  Loader2,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface PersonHeaderProps {
  contact: Person;
  onEdit: () => void;
  onToggleFavorite: () => void;
}

export function PersonHeader({ contact, onEdit, onToggleFavorite }: PersonHeaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Optimistic UI for photo
  const [optimisticPhotoUrl, setOptimisticPhotoUrl] = useOptimistic(
    contact.photo_url,
    (state: string | null, newUrl: string) => newUrl
  );

  const health = getRelationshipHealth(contact.last_interaction_date, contact.target_frequency_days || 30);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type and size
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // Optimistic update
      const objectUrl = URL.createObjectURL(file);
      setOptimisticPhotoUrl(objectUrl);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('personId', contact.id);

      const result = await uploadPersonPhoto(formData);

      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success('Photo updated successfully');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload photo');
      // Revert optimistic update implicitly by next render or explicit state if needed
      // (useOptimistic handles temporary state, but persistent state comes from props)
    } finally {
      setIsUploading(false);
    }
  };

  const handleContact = (method: 'call' | 'email' | 'text') => {
    switch (method) {
      case 'call':
        if (contact.phone) {
          window.location.href = `tel:${contact.phone}`;
        } else {
          toast.error('No phone number available');
        }
        break;
      case 'email':
        if (contact.email) {
          window.location.href = `mailto:${contact.email}`;
        } else {
          toast.error('No email address available');
        }
        break;
      case 'text':
        if (contact.phone) {
          window.location.href = `sms:${contact.phone}`;
        } else {
          toast.error('No phone number available');
        }
        break;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-6">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
        
        {/* Avatar Section with Health Ring */}
        <div className="relative group">
           {/* Ring SVG */}
           <div className="absolute -inset-1 rounded-full pointer-events-none" 
                style={{ 
                  border: `3px solid ${health.color}`,
                  opacity: 0.8 
                }} 
           />
           
           <div className="relative">
             <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-background">
               <AvatarImage src={optimisticPhotoUrl || ''} className="object-cover" />
               <AvatarFallback className="text-2xl md:text-3xl bg-muted text-muted-foreground">
                 {getInitials(contact.first_name, contact.last_name)}
               </AvatarFallback>
             </Avatar>

             {/* Upload Loading Overlay */}
             {isUploading && (
               <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                 <Loader2 className="w-8 h-8 text-white animate-spin" />
               </div>
             )}
             
             {/* Upload Button */}
             <button
               onClick={() => fileInputRef.current?.click()}
               className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors"
               disabled={isUploading}
               aria-label="Upload profile photo"
             >
               <Camera size={16} />
             </button>
             <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
             />
           </div>
        </div>

        {/* Info Section */}
        <div className="flex-1 text-center md:text-left space-y-4 w-full">
          <div className="space-y-1">
             <div className="flex items-center justify-center md:justify-start gap-3">
               <h1 className="text-2xl md:text-3xl font-bold truncate">
                 {contact.first_name} {contact.last_name}
               </h1>
               <button 
                 onClick={onToggleFavorite}
                 className={cn(
                   "p-1 rounded-full transition-colors",
                   contact.is_favorite ? "text-yellow-400" : "text-muted-foreground hover:text-yellow-400"
                 )}
               >
                 <Star size={24} fill={contact.is_favorite ? "currentColor" : "none"} />
               </button>
             </div>
             
             {/* Subtitle / Context */}
             <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-muted-foreground">
                {contact.job_title && <span>{contact.job_title}</span>}
                {contact.company && (
                  <>
                    <span className="hidden md:inline">•</span>
                    <span>{contact.company}</span>
                  </>
                )}
                {contact.location && (
                  <>
                    <span className="hidden md:inline">•</span>
                    <span>{contact.location}</span>
                  </>
                )}
             </div>
          </div>

          {/* Quick Stats / Info Badges */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
             {contact.birthday && (
               <div className="flex items-center gap-1.5 px-3 py-1 bg-muted/50 rounded-full text-xs font-medium">
                 <Calendar size={14} />
                 <span>{formatBirthday(contact.birthday)}</span>
               </div>
             )}
             <div className="flex items-center gap-1.5 px-3 py-1 bg-muted/50 rounded-full text-xs font-medium" style={{ color: health.color }}>
                <span className="w-2 h-2 rounded-full bg-current" />
                <span>{health.status}</span>
             </div>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-center md:justify-start gap-3 pt-2">
             <Button 
               variant="outline" 
               size="icon" 
               className="rounded-full w-10 h-10 md:w-11 md:h-11 border-muted-foreground/20"
               onClick={() => handleContact('call')}
               aria-label={`Call ${contact.first_name}`}
               disabled={!contact.phone}
             >
               <Phone size={18} />
             </Button>
             
             <Button 
               variant="outline" 
               size="icon" 
               className="rounded-full w-10 h-10 md:w-11 md:h-11 border-muted-foreground/20"
               onClick={() => handleContact('text')}
               aria-label={`Message ${contact.first_name}`}
               disabled={!contact.phone}
             >
               <MessageSquare size={18} />
             </Button>
             
             <Button 
               variant="outline" 
               size="icon" 
               className="rounded-full w-10 h-10 md:w-11 md:h-11 border-muted-foreground/20"
               onClick={() => handleContact('email')}
               aria-label={`Email ${contact.first_name}`}
               disabled={!contact.email}
             >
               <Mail size={18} />
             </Button>

             <Button
               variant="ghost"
               size="sm"
               onClick={onEdit}
               className="ml-auto md:ml-2 text-xs md:text-sm text-muted-foreground hover:text-foreground"
             >
               Edit Profile
             </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
