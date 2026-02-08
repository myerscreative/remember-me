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

interface ConnectionProfileProps {
  contact: any; // Ideally a specific interface, but keeping 'any' to match rest of codebase for now
  synopsis: string | null;
  onDataUpdate?: () => Promise<void>;
}

export default function ConnectionProfile({ 
    contact, 
    onDataUpdate 
}: ConnectionProfileProps) {
  const router = useRouter();

  // --- States ---
  const [activeTab, setActiveTab] = useState<'Overview' | 'Story' | 'Family' | 'Brain Dump'>('Overview');
  const [isLogging, setIsLogging] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string>('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
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

  const lastContactDate = contact.last_interaction_date ? new Date(contact.last_interaction_date) : null;
  const targetDays = contact.target_frequency_days || 30;
  const nextDueDate = lastContactDate 
    ? new Date(lastContactDate.getTime() + (targetDays * 24 * 60 * 60 * 1000)) 
    : null;

  const navigationTabs = (
    <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-1 border border-slate-800 flex transition-all shadow-xl shadow-black/20 gap-2">
      {['Overview', 'Story', 'Family', 'Brain Dump'].map((tab) => (
        <button 
          key={tab}
          onClick={() => setActiveTab(tab as any)}
          className={cn(
            "flex-1 py-3 rounded-xl text-[14px] font-bold transition-all",
            activeTab === tab 
              ? "bg-slate-800 text-white shadow-sm border border-slate-700" 
              : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/40"
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 max-w-7xl mx-auto items-start min-h-screen">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileChange} 
      />

      {/* Main Content */}
      <div className="flex flex-col gap-6 px-4 lg:px-0 pb-32 lg:pb-0">
        {activeTab !== 'Overview' && (
          <div className="pt-4">
            {navigationTabs}
          </div>
        )}

        {activeTab === 'Overview' && (
          <div className="flex flex-col gap-6 pt-4">
            <OverviewTab 
              contact={contact}
              interactions={contact.interactions || []}
              isLogging={isLogging || isUploadingPhoto}
              onAvatarClick={handleAvatarClick}
              onLogInteraction={async (note, type, date, nextDate) => {
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
              }}
            />
            {navigationTabs}
          </div>
        )}
        {activeTab === 'Story' && <StoryTab contact={contact} />}
        {activeTab === 'Family' && <FamilyTab contact={contact} />}
        {activeTab === 'Brain Dump' && <BrainDumpTab contact={contact} />}
      </div>

      {/* Sidebar - Desktop Only */}
      <aside className="hidden lg:flex flex-col gap-6 sticky top-8">
        <div className="bg-slate-900 border border-slate-200/20 rounded-2xl p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Nurture Pulse</h3>
            <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded text-[10px] font-bold">ACTIVE</span>
          </div>
          
          <div className="flex items-center gap-4 mb-8">
            <div className="text-5xl font-black text-white">
              {contact.days_since_last_interaction !== null 
                ? Math.round(Math.max(0, 100 - (contact.days_since_last_interaction / (targetDays * 1.5)) * 100))
                : 85}
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Health score</p>
              <div className="flex gap-1 mt-1">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className={cn("w-3 h-1 rounded-full", i <= 4 ? "bg-emerald-500" : "bg-slate-800")} />
                ))}
              </div>
            </div>
          </div>
          
          <div className="space-y-4 pt-6 border-t border-slate-800">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500">Last Contact</span>
              <span className="text-xs font-bold text-slate-300">{lastContactDate ? lastContactDate.toLocaleDateString() : 'Never'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500">Next Due</span>
              <span className={cn(
                "text-xs font-black",
                nextDueDate && nextDueDate < new Date() ? 'text-red-400' : 'text-indigo-400'
              )}>
                {nextDueDate ? nextDueDate.toLocaleDateString() : 'Not set'}
              </span>
            </div>
          </div>
        </div>
      </aside>

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
    </div>
  );
}
