'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { StoryTab } from './tabs/StoryTab';
import { FamilyTab } from './tabs/FamilyTab';
import { BrainDumpTab } from './tabs/BrainDumpTab';
import { AvatarCropModal } from './AvatarCropModal';
import { logHeaderInteraction } from '@/app/actions/log-header-interaction';
import { scheduleNextContact } from '@/app/actions/schedule-next-contact';
import { OverviewTab } from './tabs/OverviewTab';
import Image from 'next/image';
import { Camera, Edit2 } from 'lucide-react';
import { EditContactModal } from './EditContactModal';

const GlobalTabs = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: any) => void }) => {
  return (
    <nav className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 w-full">
      <div className="flex justify-around items-center p-2 max-w-2xl mx-auto">
        {['Overview', 'Story', 'Family', 'Brain Dump'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              activeTab === tab 
              ? 'bg-slate-800 text-white border border-slate-700' 
              : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </nav>
  );
};

import { HealthStatus } from '@/lib/relationship-health';

interface ConnectionProfileProps {
  contact: any;
  health?: HealthStatus;
  lastContact?: string;
  synopsis?: string | null;
  summaryLevel?: 'micro' | 'default' | 'full';
  sharedMemory?: string;
  onRefreshAISummary?: () => Promise<void>;
  onDataUpdate?: () => Promise<void>;
}

export default function ConnectionProfile({ 
    contact, 
    onDataUpdate,
    synopsis,
    onRefreshAISummary,
    health,
    lastContact,
    summaryLevel,
    sharedMemory
}: ConnectionProfileProps) {
  const router = useRouter();

  // --- States ---
  const [activeTab, setActiveTab] = useState<'Overview' | 'Story' | 'Family' | 'Brain Dump'>('Overview');
  const [isLogging, setIsLogging] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string>('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error('Image must be less than 20MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImageSrc(reader.result as string);
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleEditSuccess = async () => {
    if (onDataUpdate) {
      await onDataUpdate();
    } else {
      router.refresh();
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setIsUploadingPhoto(true);
    const supabase = createClient();

    try {
      const fileName = `${contact.id}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedBlob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: dbError } = await (supabase as any)
        .from('persons')
        .update({ photo_url: publicUrl })
        .eq('id', contact.id);

      if (dbError) throw dbError;

      toast.success('Photo updated successfully!');
      setIsCropModalOpen(false);
      setSelectedImageSrc('');

      if (onDataUpdate) { await onDataUpdate(); } else { router.refresh(); }

    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const targetDays = contact.target_frequency_days || 30;
  const name = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.name;
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  
  // Health Score Logic (Consistent with OverviewTab)
  const daysSince = contact.days_since_last_interaction ?? 30;
  const baseHealthScore = Math.max(0, Math.min(100, Math.round(100 - (daysSince / (targetDays * 1.5)) * 100)));
  const healthScore = Math.min(100, baseHealthScore + (contact.health_boost || 0));

  const birthdayText = contact.birthday 
    ? new Date(contact.birthday).toLocaleDateString(undefined, { month: 'long', day: 'numeric', timeZone: 'UTC' })
    : 'Not set';

  const handleLogInteraction = async (note: string, type: 'connected' | 'attempted', date: string, nextDate?: string) => {
    setIsLogging(true);
    try {
      const result = await logHeaderInteraction(
        contact.id, 
        type === 'connected' ? 'connection' : 'attempt', 
        note, 
        date
      );
      if (result.success) {
        if (nextDate) {
          await scheduleNextContact(contact.id, nextDate);
        }
        toast.success("Interaction logged!");
        if (onDataUpdate) await onDataUpdate(); else router.refresh();
      } else {
        toast.error(`Failed to log: ${result.error}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <GlobalTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="max-w-2xl mx-auto px-4 pb-32">
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange} 
        />

        {/* Profile Identity - Shared across tabs */}
        <section className="flex flex-col items-center pt-10 pb-8 text-center border-b border-slate-900 mb-6">
          <div className="relative group mb-6 cursor-pointer" onClick={handleAvatarClick}>
            <div className={cn(
              "w-32 h-32 rounded-full bg-slate-900 flex items-center justify-center text-4xl font-black text-white border-4 transition-all duration-500 shadow-2xl group-hover:scale-105",
              healthScore > 80 ? "border-emerald-500" : healthScore > 40 ? "border-orange-500" : "border-red-500"
            )}>
              {contact.photo_url ? (
                <div className="relative w-full h-full rounded-full overflow-hidden">
                  <Image src={contact.photo_url} alt={name} fill className="object-cover" />
                </div>
              ) : (
                initials
              )}
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={32} className="text-white drop-shadow-lg" />
              </div>
            </div>
            <div className={cn(
              "absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-slate-950 shadow-md",
              healthScore > 80 ? "bg-emerald-500" : healthScore > 40 ? "bg-orange-500" : "bg-red-500"
            )} />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-extrabold text-white tracking-tight leading-none">{name}</h1>
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-full transition-all"
              title="Edit Profile"
            >
              <Edit2 size={18} />
            </button>
          </div>
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.2em]">
            Birthday: {birthdayText}
          </p>
        </section>

        {/* Tab Content */}
        <div className="animate-in fade-in duration-500">
          {activeTab === 'Overview' && (
            <OverviewTab 
              contact={contact}
              interactions={contact.interactions || []}
              onLogInteraction={handleLogInteraction}
              isLogging={isLogging || isUploadingPhoto}
              synopsis={synopsis}
              onRefreshAISummary={onRefreshAISummary}
              onEdit={() => setIsEditModalOpen(true)}
            />
          )}
          {activeTab === 'Story' && <StoryTab contact={contact} onEdit={() => setIsEditModalOpen(true)} />}
          {activeTab === 'Family' && <FamilyTab contact={contact} />}
          {activeTab === 'Brain Dump' && <BrainDumpTab contact={contact} />}
        </div>
      </main>

      <AvatarCropModal
        open={isCropModalOpen}
        imageSrc={selectedImageSrc}
        onClose={() => {
          setIsCropModalOpen(false);
          setSelectedImageSrc('');
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
        onCropComplete={handleCropComplete}
      />

      <EditContactModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        contact={contact}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
