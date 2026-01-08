'use client';

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import toast, { Toaster } from "react-hot-toast";

// Icons
import { ArrowLeft, Edit, Mail, Phone, Check, Repeat, Star, Camera, RefreshCw } from "lucide-react";
import { FREQUENCY_PRESETS } from "@/lib/relationship-health";

// Components
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ErrorFallback } from "@/components/error-fallback";
import { Input } from "@/components/ui/input";

import { ProfileSidebar } from "./components/ProfileSidebar";

import { OverviewTab } from "./components/tabs/OverviewTab";
import { AvatarCropModal } from "./components/AvatarCropModal";
import { StoryTab } from "@/app/contacts/[id]/components/tabs/StoryTab";
import { FamilyTab } from "@/app/contacts/[id]/components/tabs/FamilyTab";
import { PersonHeader } from "@/app/contacts/[id]/components/PersonHeader";
import { ContactImportance } from "@/types/database.types";
import { EditContactModal } from "./components/EditContactModal";
import LogInteractionModal from "@/components/relationship-garden/LogInteractionModal";
import { InteractionType } from "@/lib/relationship-health";
import { useRouter, useSearchParams } from "next/navigation";
import { getInitials } from "@/lib/utils/contact-helpers";

const tabs = ["Overview", "Story", "Family"];

export default function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  // State
  const [contact, setContact] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("Overview");
  
  // Mobile Edit State
  const [isEditMode, setIsEditMode] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Log Interaction Modal State
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logInitialMethod, setLogInitialMethod] = useState<InteractionType | undefined>(undefined);

  // Avatar Crop Modal State
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string>('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Check searchParams for action trigger
  useEffect(() => {
    const action = searchParams.get('action');
    if (action) {
       let method: InteractionType = 'in-person';
       if (action === 'call') method = 'call';
       else if (action === 'email') method = 'email';
       else if (action === 'message' || action === 'text') method = 'text';
       else if (action === 'social') method = 'social';
       else if (action === 'in-person') method = 'in-person';
       
       setLogInitialMethod(method);
       setIsLogModalOpen(true);
    }
  }, [searchParams]);

  const closeLogModal = () => {
      setIsLogModalOpen(false);
      // Clean URL without refresh using router.replace
      const params = new URLSearchParams(searchParams.toString());
      params.delete('action');
      router.replace(`/contacts/${id}?${params.toString()}`, { scroll: false });
  };

  const handleRefresh = async () => {
    window.location.reload();
  };

  // Fetch Data
  useEffect(() => {
    async function fetchContact() {
      try {
        const supabase = createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error("Not authenticated");

        // 1. Fetch Basic Info
        const { data: person, error: personError } = await (supabase as any)
          .from("persons")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (personError) throw personError;

        // 2. Fetch Tags
        const { data: tagData } = await (supabase as any)
          .from("person_tags")
          .select("tags(name)")
          .eq("person_id", id);
        
        const tags = tagData?.map((t: any) => t.tags.name) || [];

        // 3. Fetch Shared Memories
        const { data: sharedMemories } = await (supabase as any)
          .from("shared_memories")
          .select("content")
          .eq("person_id", id)
          .order('created_at', { ascending: false });

        // 4. Assemble complete object
        const latestMemory = sharedMemories?.[0]?.content;
        const baseAiSummary = person.ai_summary || "";
        const enhancedAiSummary = latestMemory 
            ? `Most Recent Memory: ${latestMemory}\n\n${baseAiSummary}`
            : baseAiSummary;

        const fullContact = {
            ...person,
            firstName: person.first_name || person.name?.split(" ")[0] || "",
            lastName: person.last_name || person.name?.split(" ").slice(1).join(" ") || "",
            tags: tags,
            shared_memories: sharedMemories || [],
            story: {
                whereWeMet: person.where_met,
                whyStayInContact: person.why_stay_in_contact,
                whatsImportant: person.most_important_to_them
            },
            deep_lore: person.deep_lore,
            important_dates: person.important_dates,
            birthday: person.birthday,
            custom_anniversary: person.custom_anniversary,
            // Legacy/Schema compat
            photo_url: person.photo_url || person.avatar_url, 
            familyMembers: person.family_members || [],
            interests: person.interests || [],
            aiSummary: enhancedAiSummary,
            next_contact_date: person.next_contact_date,
            last_contact_date: person.last_contacted_date,
            whatFoundInteresting: person.what_found_interesting,
            importance: person.importance,
        };

        setContact(fullContact);
        setFirstName(fullContact.firstName);
        setLastName(fullContact.lastName);

      } catch (err) {
        console.error("Error loading contact:", err);
        setError(err instanceof Error ? err.message : "Failed to load contact");
      } finally {
        setLoading(false);
      }
    }

    fetchContact();
  }, [id]);

  const handleSaveName = async () => {
      try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if(!user) return;
          
          const fullName = `${firstName} ${lastName}`.trim();
          await (supabase as any).from("persons").update({
              first_name: firstName,
              last_name: lastName,
              name: fullName
          }).eq("id", id).eq("user_id", user.id);
          
          setContact({...contact, firstName, lastName, name: fullName});
          setIsEditMode(false);
          toast.success("Name updated");
      } catch {
          toast.error("Failed to update name");
      }
  };

  // Handle frequency change
  // Handle frequency change
  const handleFrequencyChange = async (days: number) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate new next_contact_date if last_contact_date exists
      let nextContactDate = contact?.next_contact_date;
      
      // If we have a last contact date, calculate the next one
      if (contact?.last_contact_date) {
        const lastDate = new Date(contact.last_contact_date);
        const nextDate = new Date(lastDate);
        nextDate.setDate(lastDate.getDate() + days);
        nextContactDate = nextDate.toISOString();
      } else {
        // If no last contact date (Manual Mode), setting a cadence implies we should start tracking
        // Set next contact date to specific days from TODAY to kickstart the cycle
        const today = new Date();
        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() + days);
        nextContactDate = nextDate.toISOString();
      }

      await (supabase as any).from("persons").update({
        target_frequency_days: days,
        next_contact_date: nextContactDate
      }).eq("id", id).eq("user_id", user.id);

      // Update local state
      setContact({ 
        ...contact, 
        target_frequency_days: days,
        next_contact_date: nextContactDate 
      });
      
      toast.success("Contact cadence updated!");
    } catch {
      toast.error("Failed to update cadence");
    }
  };

  // Handle importance change
  const handleImportanceChange = async (importance: ContactImportance) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await (supabase as any).from("persons").update({
        importance
      }).eq("id", id).eq("user_id", user.id);

      setContact({ ...contact, importance });
      toast.success(`Priority set to ${importance}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update priority");
    }
  };

  const handleToggleFavorite = async () => {
    const newImportance = contact.importance === 'high' ? 'medium' : 'high';
    await handleImportanceChange(newImportance as any);
  };

  const handleLastContactChange = async (date: string, method: string) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await (supabase as any).from("persons").update({
        last_contact_date: date,
        last_contact_method: method
      }).eq("id", id).eq("user_id", user.id);

      setContact({ ...contact, last_contact_date: date, last_contact_method: method });
      toast.success("Last contact updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update last contact");
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setIsCropModalOpen(false);
    setIsUploadingAvatar(true);
    console.log('Starting avatar upload, blob size:', croppedBlob.size);

    const supabase = createClient();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user found');
        toast.error('Not authenticated');
        return;
      }

      const fileName = `${contact.id}-${Date.now()}.jpg`;
      const filePath = `${fileName}`;

      console.log('Uploading to Supabase Storage, path:', filePath);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, croppedBlob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful, getting public URL');

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);

      const { error: dbError } = await (supabase as any)
        .from('persons')
        .update({ photo_url: publicUrl })
        .eq('id', contact.id)
        .eq('user_id', user.id);

      if (dbError) {
        console.error('Database update error:', dbError);
        throw dbError;
      }

      console.log('Avatar updated successfully');
      toast.success("Profile photo updated");
      setContact({ ...contact, photo_url: publicUrl });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to update photo: ' + (error as any).message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  if (loading) {
     return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Loading profile...</div></div>;
  }

  if (error || !contact) {
      return (
        <ErrorFallback 
            error={error ? new Error(error) : new Error("Contact not found")} 
            reset={() => window.location.reload()} 
        />
      );
  }

  return (
    <div className="flex min-h-screen">
      <Toaster position="top-center" />
      
      {/* DESKTOP SIDEBAR (Hidden on Mobile) */}
      <div className="hidden md:block border-r border-border/50">
        <ProfileSidebar 
            contact={contact} 
            onFrequencyChange={handleFrequencyChange}
            onImportanceChange={handleImportanceChange}
            onContactAction={(method) => {
                 setLogInitialMethod(method === 'text' ? 'text' : method === 'email' ? 'email' : 'call');
                 setIsLogModalOpen(true);
            }}
            onLastContactChange={handleLastContactChange}
            onPhotoUpdate={(newUrl) => {
                setContact(prev => ({ ...prev, photo_url: newUrl }));
            }}
        />
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden">
         
         <PersonHeader 
            contact={contact} 
            onEdit={() => setIsEditModalOpen(true)}
            onToggleFavorite={handleToggleFavorite}
            onAvatarClick={() => {
                if (isUploadingAvatar) return;
                
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e: any) => {
                    const file = e.target?.files?.[0];
                    if (!file) return;
                    
                    if (!file.type.startsWith('image/')) {
                        // toast.error('Please upload an image file'); // Assuming toast available or irrelevant
                        return;
                    }
                    
                    const reader = new FileReader();
                    reader.onload = () => {
                        setSelectedImageSrc(reader.result as string);
                        setIsCropModalOpen(true);
                    };
                    reader.readAsDataURL(file);
                };
                input.click();
            }}
         />


         {/* SCROLLABLE CONTENT */}
         <main className="flex-1 p-3 md:p-10 max-w-5xl mx-auto w-full md:mt-6 bg-sidebar overflow-x-hidden">

            {/* TAB NAVIGATION */}
            <div className="flex items-center gap-6 md:gap-8 border-b border-border/50 mb-6 md:mb-8 overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "pb-2.5 md:pb-3 text-sm md:text-[15px] font-medium transition-all relative whitespace-nowrap",
                            activeTab === tab
                                ? "text-primary dark:text-primary"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {tab}
                        {activeTab === tab && (
                            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary rounded-t-full shadow-[0_-2px_6px_rgba(99,102,241,0.2)]" />
                        )}
                    </button>
                ))}
            </div>

            {/* TAB CONTENT */}
            <div className="min-h-[500px]">
                {activeTab === "Overview" && (
                    <OverviewTab contact={contact} />
                )}
                
                {activeTab === "Story" && (
                    <StoryTab contact={contact} />
                )}
                
                {activeTab === "Family" && (
                    <FamilyTab 
                      contactId={id} 
                      contactName={contact.name} 
                      familyMembers={contact.family_members} 
                    />
                )}
            </div>

         </main>
      
      </div>
      <EditContactModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        contact={contact}
        onSuccess={handleRefresh}
      />
      
      {contact && (
          <LogInteractionModal 
            isOpen={isLogModalOpen}
            onClose={closeLogModal}
            contact={{
                id: contact.id,
                name: contact.name,
                initials: getInitials(contact.first_name, contact.last_name),
                importance: contact.importance
            }}
            initialMethod={logInitialMethod}
            onSuccess={handleRefresh}
          />
      )}

      {/* Avatar Crop Modal */}
      <AvatarCropModal
        open={isCropModalOpen}
        imageSrc={selectedImageSrc}
        onClose={() => setIsCropModalOpen(false)}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
