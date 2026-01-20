
import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useMemo } from 'react';
import toast from 'react-hot-toast';
import { Camera } from 'lucide-react';
import { AISynopsisCard } from './tabs/overview/AISynopsisCard';
import { StoryTab } from './tabs/StoryTab';
import { FamilyTab } from './tabs/FamilyTab';
import ValuesTab from './tabs/ValuesTab';
import MutualValueTab from './tabs/MutualValueTab';
import { BrainDumpTab } from './tabs/BrainDumpTab';
import { AvatarCropModal } from './AvatarCropModal';
import { updateContact } from '@/app/actions/update-contact';
import { logHeaderInteraction } from '@/app/actions/log-header-interaction';
import { deleteInteraction } from '@/app/actions/delete-interaction';
import { updateInteraction } from '@/app/actions/update-interaction';
import { deleteContact } from '@/app/actions/delete-contact';
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
  const [activeTab, setActiveTab] = useState<'Overview' | 'Story' | 'Family' | 'Brain Dump'>('Overview');
  const [isLogging, setIsLogging] = useState(false);
  const [logNote, setLogNote] = useState('');
  const [logType, setLogType] = useState<'connection' | 'attempt'>('connection');
  const [deletingInteractionId, setDeletingInteractionId] = useState<string | null>(null);
  const [editingInteractionId, setEditingInteractionId] = useState<string | null>(null);
  const [editInteractionForm, setEditInteractionForm] = useState({
    date: '',
    notes: ''
  });
  // Local state for interactions to enable optimistic updates
  const [interactions, setInteractions] = useState(contact.interactions || []);
  const [isEditingRelationship, setIsEditingRelationship] = useState(false);
  const [relationshipForm, setRelationshipForm] = useState({
    importance: contact.importance || 'medium',
    target_frequency_days: contact.target_frequency_days || 30
  });
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [headerForm, setHeaderForm] = useState({
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      company: contact.company || '',
      job_title: contact.job_title || '',
      birthday: contact.birthday ? new Date(contact.birthday).toISOString().split('T')[0] : '',
      photo_url: contact.photo_url || ''
  });
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editForm, setEditForm] = useState({
      email: contact.email || '',
      phone: contact.phone || '',
      birthday: contact.birthday ? new Date(contact.birthday).toISOString().split('T')[0] : '',
      address: contact.address || '',
      city: contact.city || '',
      state: contact.state || '',
      zip_code: contact.zip_code || '',
      country: contact.country || ''
  });
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string>('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const photoUrl = contact.photo_url;

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
    
    // Create optimistic interaction
    const optimisticInteraction = {
        id: `temp-${Date.now()}`,
        person_id: contact.id,
        date: new Date().toISOString(),
        notes: logType === 'attempt' ? `[Attempt] ${logNote}` : logNote,
        created_at: new Date().toISOString()
    };
    
    // Optimistically add to interactions list
    setInteractions(prev => [optimisticInteraction, ...prev]);
    setLogNote('');
    setLogType('connection');
    
    try {
        const result = await logHeaderInteraction(
            contact.id,
            logType,
            logNote
        );

        if (!result.success) {
            console.error('Error logging interaction:', result.error);
            const errorDetails = result.details ? JSON.stringify(result.details, null, 2) : '';
            toast.error(`Failed to log: ${result.error}`);
            // Remove optimistic interaction on failure
            setInteractions(prev => prev.filter(i => i.id !== optimisticInteraction.id));
            return;
        }

        toast.success("Interaction logged!");
        // Refresh to get the real interaction data from server
        router.refresh();
    } catch (error) {
        console.error('Error logging interaction:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Failed to log: ${errorMessage}`);
        // Remove optimistic interaction on error
        setInteractions(prev => prev.filter(i => i.id !== optimisticInteraction.id));
    } finally {
        setIsLogging(false);
    }
  };

  const handleDeleteInteraction = async (interactionId: string) => {
    if (!confirm('Are you sure you want to delete this interaction?')) return;

    console.log('Deleting interaction:', interactionId);
    setDeletingInteractionId(interactionId);

    try {
        const result = await deleteInteraction(interactionId, contact.id);
        console.log('Delete result:', result);

        if (!result.success) {
            console.error('Delete failed:', result.error);
            toast.error(`Failed to delete: ${result.error}`);
            setDeletingInteractionId(null);
            return;
        }

        // Success - show toast and refresh
        toast.success('Interaction deleted!');
        setDeletingInteractionId(null);

        // Force a hard refresh to ensure UI updates
        router.refresh();

        // Additional refresh after a short delay to ensure data is updated
        setTimeout(() => {
            router.refresh();
        }, 100);
    } catch (error) {
        console.error('Error deleting interaction:', error);
        toast.error('An error occurred while deleting');
        setDeletingInteractionId(null);
    }
  };

  const handleStartEditInteraction = (interaction: any) => {
    setEditingInteractionId(interaction.id);
    // Convert ISO date to datetime-local format (YYYY-MM-DDTHH:mm)
    const date = new Date(interaction.date);
    const localDatetime = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
      .toISOString()
      .slice(0, 16);

    setEditInteractionForm({
      date: localDatetime,
      notes: interaction.notes || ''
    });
  };

  const handleCancelEditInteraction = () => {
    setEditingInteractionId(null);
    setEditInteractionForm({ date: '', notes: '' });
  };

  const handleSaveInteraction = async (interactionId: string) => {
    try {
        // Convert local datetime back to ISO string
        const isoDate = new Date(editInteractionForm.date).toISOString();

        const result = await updateInteraction(interactionId, contact.id, {
            date: isoDate,
            notes: editInteractionForm.notes
        });

        if (!result.success) {
            alert(`Failed to update interaction: ${result.error}`);
            return;
        }

        // Refresh to show updated interactions
        router.refresh();
    } catch (error) {
        console.error('Error updating interaction:', error);
        alert('An error occurred while updating the interaction');
    }
  };

  const handleSaveHeader = async () => {
    try {
        const result = await updateContact(contact.id, headerForm);
        if (result.success) {
            setIsEditingHeader(false);
            router.refresh();
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
          // Optimistic update mechanism
          const updatedContact = {
              ...contact,
              ...editForm,
              updated_at: new Date().toISOString()
          };
          
          setIsEditingInfo(false);
          toast.loading("Saving changes...", { id: "save-contact" });

          const result = await updateContact(contact.id, editForm);

          if (result.success) {
              toast.success("Saved successfully!", { id: "save-contact" });
              router.refresh();
          } else {
              toast.error('Failed to update contact info', { id: "save-contact" });
              setIsEditingInfo(true);
          }
      } catch (error) {
          console.error('Error saving contact info:', error);
          toast.error('An error occurred while saving', { id: "save-contact" });
          setIsEditingInfo(true);
      }
  };

  const handleSaveRelationship = async () => {
      try {
          const result = await updateContact(contact.id, relationshipForm);

          if (result.success) {
              setIsEditingRelationship(false);
              router.refresh();
          } else {
              alert('Failed to update relationship settings');
          }
      } catch (error) {
          console.error('Error saving relationship:', error);
          alert('An error occurred while saving');
      }
  };

  const handleAvatarClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
          toast.error('Please upload an image file');
          return;
      }

      // Validate file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
          toast.error('Image must be less than 20MB');
          return;
      }

      // Read file and open crop modal
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
          // Generate unique filename
          const fileExt = 'jpg';
          const fileName = `${contact.id}-${Date.now()}.${fileExt}`;
          const filePath = `${fileName}`;

          // Upload to Supabase Storage
          const { error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(filePath, croppedBlob, {
                  contentType: 'image/jpeg',
                  upsert: true
              });

          if (uploadError) throw uploadError;

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
              .from('avatars')
              .getPublicUrl(filePath);

          // Update contact in database
          const { error: dbError } = await (supabase as any)
              .from('persons')
              .update({ photo_url: publicUrl })
              .eq('id', contact.id);

          if (dbError) throw dbError;

          toast.success('Photo updated successfully!');
          setIsCropModalOpen(false);
          setSelectedImageSrc('');

          // Update local state and refresh
          setHeaderForm(prev => ({ ...prev, photo_url: publicUrl }));
          router.refresh();

      } catch (error) {
          console.error('Error uploading photo:', error);
          toast.error('Failed to upload photo');
      } finally {
          setIsUploadingPhoto(false);
          // Reset file input
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  // Health Score Dates
  const lastContactDate = contact.last_interaction_date ? new Date(contact.last_interaction_date) : null;
  const nextDueDate = lastContactDate && contact.target_frequency_days 
    ? new Date(lastContactDate.getTime() + (contact.target_frequency_days * 24 * 60 * 60 * 1000)) 
    : null;

  // Define Navigation Tabs Component
  const navigationTabs = (
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
            <button
              onClick={() => setActiveTab('Brain Dump')}
              className={`flex-1 py-3 rounded-xl text-[14px] font-medium transition-all ${
                activeTab === 'Brain Dump'
                  ? 'bg-[#2d3748] text-white shadow-sm'
                  : 'text-[#94a3b8] hover:text-[#cbd5e1] hover:bg-[#2d3748]/50'
              }`}
            >
              Brain Dump
            </button>
        </div>
  );


  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 max-w-7xl mx-auto items-start">

      {/* LEFT COLUMN */}
      <div className="flex flex-col gap-6 px-4 lg:px-0 pb-24 lg:pb-0">
        
        {/* Navigation Tabs - Show at top only if NOT Overview */}
        {activeTab !== 'Overview' && navigationTabs}

        {activeTab === 'Overview' && (
          <div className="flex flex-col gap-6 pt-4">
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
                                birthday: contact.birthday ? new Date(contact.birthday).toISOString().split('T')[0] : '',
                                photo_url: contact.photo_url || ''
                            });
                        } else {
                            setIsEditingHeader(true);
                        }
                    }}
                    className="absolute top-4 right-4 text-sm text-[#60a5fa] hover:text-[#93c5fd] transition-colors"
                >
                    {isEditingHeader ? 'Cancel' : '✏️ Edit'}
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
                         <div className="flex flex-col gap-1">
                            <span className="text-[13px] text-[#64748b] text-center">📷 Profile Photo:</span>
                            <button
                                type="button"
                                onClick={handleAvatarClick}
                                disabled={isUploadingPhoto}
                                className="w-full bg-[#60a5fa] hover:bg-[#3b82f6] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Camera size={16} />
                                {isUploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
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
                        🎂 Birthday: {contact.birthday ? new Date(contact.birthday).toLocaleDateString(undefined, { timeZone: 'UTC', month: 'long', day: 'numeric' }) : 'Not set'}
                        </div>
                    </>
                )}

                <div className="grid grid-cols-3 gap-2.5">
                    <ActionButton icon={<span>📞</span>} label="Call" href={contact.phone ? `tel:${contact.phone}` : undefined} disabled={!contact.phone} />
                    <ActionButton icon={<span>✉️</span>} label="Email" href={contact.email ? `mailto:${contact.email}` : undefined} disabled={!contact.email} />
                    <ActionButton icon={<span>💬</span>} label="Text" href={contact.phone ? `sms:${contact.phone}` : undefined} disabled={!contact.phone} />
                </div>

                {/* Delete Button - Only show in edit mode */}
                {isEditingHeader && (
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={async () => {
                                if (confirm(`Are you sure you want to delete ${contact.first_name} ${contact.last_name || ''}? They can be recovered within 30 days.`)) {
                                    const result = await deleteContact(contact.id);
                                    if (result.success) {
                                        toast.success('Contact deleted (recoverable for 30 days)');
                                        router.push('/garden');
                                    } else {
                                        toast.error(result.error || 'Failed to delete contact');
                                    }
                                }
                            }}
                            className="text-xs text-red-400 hover:text-red-300 hover:underline transition-colors"
                        >
                            🗑️ Delete Contact
                        </button>
                    </div>
                )}
            </div>
            
            {/* Navigation Tabs - Show below header in Overview */}
            {navigationTabs}

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
                                        birthday: contact.birthday ? new Date(contact.birthday).toISOString().split('T')[0] : '',
                                        address: contact.address || '',
                                        city: contact.city || '',
                                        state: contact.state || '',
                                        zip_code: contact.zip_code || '',
                                        country: contact.country || ''
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
                        <div className="flex items-center gap-3 py-3 border-b border-[#2d3748]">
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
                        <div className="flex items-center gap-3 py-3 border-b border-[#2d3748]">
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
                                        {contact.birthday ? new Date(contact.birthday).toLocaleDateString(undefined, { timeZone: 'UTC', month: 'long', day: 'numeric' }) : 'Not set'}
                                    </div>
                                )}
                            </div>
                        </div>

                         <div className="flex items-start gap-3 py-3">
                            <div className="w-10 h-10 bg-[#2d3748] rounded-xl flex items-center justify-center text-lg shrink-0">📍</div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[10px] text-[#64748b] uppercase tracking-[0.3px] mb-0.5 font-semibold">Location</div>
                                {isEditingInfo ? (
                                    <div className="grid grid-cols-1 gap-2">
                                        <input 
                                            type="text"
                                            className="w-full bg-[#0f1419] border border-[#3d4758] rounded-lg px-2 py-1.5 text-[13px] text-white focus:border-[#60a5fa] outline-none"
                                            value={editForm.address}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                                            placeholder="Street Address"
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <input 
                                                type="text"
                                                className="w-full bg-[#0f1419] border border-[#3d4758] rounded-lg px-2 py-1.5 text-[13px] text-white focus:border-[#60a5fa] outline-none"
                                                value={editForm.city}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                                                placeholder="City"
                                            />
                                            <input 
                                                type="text"
                                                className="w-full bg-[#0f1419] border border-[#3d4758] rounded-lg px-2 py-1.5 text-[13px] text-white focus:border-[#60a5fa] outline-none"
                                                value={editForm.state}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, state: e.target.value }))}
                                                placeholder="State"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input 
                                                type="text"
                                                className="w-full bg-[#0f1419] border border-[#3d4758] rounded-lg px-2 py-1.5 text-[13px] text-white focus:border-[#60a5fa] outline-none"
                                                value={editForm.zip_code}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, zip_code: e.target.value }))}
                                                placeholder="Zip"
                                            />
                                            <input 
                                                type="text"
                                                className="w-full bg-[#0f1419] border border-[#3d4758] rounded-lg px-2 py-1.5 text-[13px] text-white focus:border-[#60a5fa] outline-none"
                                                value={editForm.country}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, country: e.target.value }))}
                                                placeholder="Country"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`text-[14px] leading-relaxed ${!contact.address && !contact.city && !contact.state ? 'text-[#64748b] italic' : 'text-[#e2e8f0]'}`}>
                                        {(contact.address || contact.city || contact.state || contact.zip_code || contact.country) ? (
                                            <>
                                                {contact.address && <div>{contact.address}</div>}
                                                <div>{[contact.city, contact.state, contact.zip_code].filter(Boolean).join(', ')}</div>
                                                {contact.country && <div>{contact.country}</div>}
                                            </>
                                        ) : 'No location info'}
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
                        <div className="text-[#94a3b8] text-[11px] font-semibold uppercase tracking-wider mb-2.5">Recent Activity ({interactions.length})</div>
                        {interactions.length > 0 ? (
                            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
                                {interactions.map((interaction: any) => (
                                    <div key={interaction.id} className="bg-[#0f1419] p-3 rounded-lg border border-[#2d3748] group hover:border-[#3d4758] transition-colors">
                                        {editingInteractionId === interaction.id ? (
                                            <div className="flex flex-col gap-2">
                                                <div>
                                                    <label className="text-[#94a3b8] text-[11px] font-medium mb-1 block">Date & Time</label>
                                                    <input
                                                        type="datetime-local"
                                                        className="w-full bg-[#0a0e1a] border border-[#3d4758] rounded-lg px-2 py-1.5 text-[13px] text-white [color-scheme:dark]"
                                                        value={editInteractionForm.date}
                                                        onChange={(e) => setEditInteractionForm({...editInteractionForm, date: e.target.value})}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[#94a3b8] text-[11px] font-medium mb-1 block">Notes</label>
                                                    <textarea
                                                        className="w-full bg-[#0a0e1a] border border-[#3d4758] rounded-lg px-2 py-1.5 text-[13px] text-white resize-none"
                                                        rows={2}
                                                        value={editInteractionForm.notes}
                                                        onChange={(e) => setEditInteractionForm({...editInteractionForm, notes: e.target.value})}
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleSaveInteraction(interaction.id)}
                                                        className="flex-1 bg-[#60a5fa] hover:bg-[#3b82f6] text-white px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEditInteraction}
                                                        className="flex-1 bg-[#2d3748] hover:bg-[#3d4758] text-[#94a3b8] px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[#cbd5e1] text-[12px] font-medium mb-1">
                                                        {new Date(interaction.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        {' at '}
                                                        {new Date(interaction.date).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })}
                                                        {interaction.notes?.startsWith('[Attempt]') && <span className="ml-2 text-[#fbbf24]">📝 Attempt</span>}
                                                        {!interaction.notes?.startsWith('[Attempt]') && <span className="ml-2 text-[#10b981]">✅ Connected</span>}
                                                    </div>
                                                    <div className="text-[#94a3b8] text-[13px] leading-snug break-words">
                                                        {interaction.notes?.replace('[Attempt] ', '') || 'No notes'}
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity shrink-0">
                                                    <button
                                                        onClick={() => handleStartEditInteraction(interaction)}
                                                        className="text-[#64748b] hover:text-[#60a5fa] p-1 rounded transition-colors"
                                                        title="Edit interaction"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteInteraction(interaction.id)}
                                                        disabled={deletingInteractionId === interaction.id}
                                                        className="text-[#64748b] hover:text-[#ef4444] p-1 rounded transition-colors disabled:opacity-50"
                                                        title="Delete interaction"
                                                    >
                                                        {deletingInteractionId === interaction.id ? '⏳' : '🗑️'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-[#64748b] text-[13px] italic">No interactions logged yet</div>
                        )}
                    </div>
                </div>

                {/* Relationship Settings */}
                <div className="bg-[#1a1f2e] rounded-2xl p-5 border border-slate-800/50">
                    <div className="flex items-center justify-between gap-4 mb-3">
                        <div className="text-[#94a3b8] text-[11px] font-semibold uppercase tracking-wider">Relationship</div>
                        <button
                            onClick={() => {
                                if (isEditingRelationship) {
                                    setIsEditingRelationship(false);
                                    setRelationshipForm({
                                        importance: contact.importance || 'medium',
                                        target_frequency_days: contact.target_frequency_days || 30
                                    });
                                } else {
                                    setIsEditingRelationship(true);
                                }
                            }}
                            className="text-[#94a3b8] border border-[#3d4758] hover:border-[#7c3aed] px-4 py-2 rounded-lg text-[13px] font-medium transition-colors shrink-0"
                        >
                            {isEditingRelationship ? 'Cancel' : 'Edit'}
                        </button>
                    </div>

                    {isEditingRelationship ? (
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="text-[#94a3b8] text-[11px] font-medium mb-2 block">Circle Level</label>
                                <select
                                    className="w-full bg-[#0f1419] border border-[#3d4758] rounded-lg px-3 py-2 text-white text-[13px] focus:border-[#7c3aed] outline-none"
                                    value={relationshipForm.importance}
                                    onChange={(e) => setRelationshipForm({...relationshipForm, importance: e.target.value})}
                                >
                                    <option value="high">Core Circle</option>
                                    <option value="medium">Steady Friends</option>
                                    <option value="low">Acquaintance</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[#94a3b8] text-[11px] font-medium mb-2 block">Contact Frequency</label>
                                <select
                                    className="w-full bg-[#0f1419] border border-[#3d4758] rounded-lg px-3 py-2 text-white text-[13px] focus:border-[#7c3aed] outline-none"
                                    value={relationshipForm.target_frequency_days}
                                    onChange={(e) => setRelationshipForm({...relationshipForm, target_frequency_days: parseInt(e.target.value)})}
                                >
                                    <option value="7">Weekly</option>
                                    <option value="14">Bi-weekly</option>
                                    <option value="30">Monthly</option>
                                    <option value="60">Every 2 Months</option>
                                    <option value="90">Quarterly</option>
                                </select>
                            </div>
                            <button
                                onClick={handleSaveRelationship}
                                className="w-full bg-[#60a5fa] hover:bg-[#3b82f6] text-white px-4 py-2 rounded-lg text-[13px] font-bold transition-all shadow-lg shadow-blue-900/20"
                            >
                                Save Changes
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            <span className="bg-[#3b4a6b] px-3.5 py-1.5 rounded-lg text-[12px] text-[#93c5fd] flex items-center gap-1.5 font-medium whitespace-nowrap">
                                <span>👥</span> {contact.importance ? (contact.importance === 'high' ? 'Core Circle' : contact.importance === 'medium' ? 'Steady Friends' : 'Acquaintance') : 'Steady Friends'}
                            </span>
                            <span className="bg-[#2d3748] px-3.5 py-1.5 rounded-lg text-[12px] text-[#cbd5e1] flex items-center gap-1.5 font-medium whitespace-nowrap">
                                <span>📅</span> {contact.target_frequency_days === 7 ? 'Weekly' : contact.target_frequency_days === 30 ? 'Monthly' : `${contact.target_frequency_days} Days`}
                            </span>
                        </div>
                    )}
                </div>
          </div>
        )}
        {activeTab === 'Story' && <StoryTab contact={contact} />}
        {activeTab === 'Family' && <FamilyTab contact={contact} />}
        {activeTab === 'Brain Dump' && <BrainDumpTab contact={contact} />}
      </div>

      {/* RIGHT COLUMN - SIDEBAR */}
      <div className="flex flex-col gap-5 px-4 lg:px-0 pb-24 lg:pb-0">
         
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

      {/* Avatar Crop Modal */}
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
