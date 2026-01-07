'use client';

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import toast, { Toaster } from "react-hot-toast";

// Icons
import { ArrowLeft, Edit, Mail, Phone, Check, Repeat, Star } from "lucide-react";
import { FREQUENCY_PRESETS } from "@/lib/relationship-health";

// Components
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ErrorFallback } from "@/components/error-fallback";
import { Input } from "@/components/ui/input";

import { ProfileSidebar } from "./components/ProfileSidebar";
import { ProfileHeader } from "./components/ProfileHeader";
import { OverviewTab } from "./components/tabs/OverviewTab";
import { StoryTab } from "@/app/contacts/[id]/components/tabs/StoryTab";
import { FamilyTab } from "@/app/contacts/[id]/components/tabs/FamilyTab";
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
        />
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden">
         
         {/* DESKTOP HEADER (Hidden on Mobile) */}
         <ProfileHeader 
            onEdit={() => setIsEditModalOpen(true)} 
            importance={contact.importance}
            onToggleFavorite={handleToggleFavorite}
         />

         {/* MOBILE HEADER (Visible < 768px) */}
         <div className="md:hidden bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-b-[2rem] pt-4 pb-5 px-4 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('/noise.png')]"></div>

            {/* Top Bar Mobile */}
            <div className="flex justify-between items-center relative z-10 mb-2">
                <Link href="/">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full h-8 w-8">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex gap-1.5 relative z-10">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-8 w-8 hover:bg-white/10 rounded-full transition-all duration-200",
                          contact.importance === 'high' ? "text-amber-400" : "text-white"
                        )}
                        onClick={handleToggleFavorite}
                    >
                        <Star className={cn("h-4 w-4", contact.importance === 'high' && "fill-amber-400")} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white hover:bg-white/10 rounded-full"
                        onClick={() => setIsEditMode(!isEditMode)}
                    >
                        {isEditMode ? <Check className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {/* Mobile Profile Info */}
            <div className="relative z-10 flex flex-col items-center text-center">
                <div className="mb-3 relative">
                    <Avatar className="h-24 w-24 border-4 border-white/30 shadow-2xl">
                        <AvatarImage src={contact.photo_url} className="object-cover" />
                        <AvatarFallback className="text-2xl bg-indigo-700 text-white/50">
                            {(contact.firstName?.[0] || "")}
                        </AvatarFallback>
                    </Avatar>
                </div>

                {isEditMode ? (
                     <div className="flex gap-2 mb-2">
                        <Input value={firstName} onChange={e => setFirstName(e.target.value)} className="bg-white/10 border-white/20 text-white placeholder:text-white/50 text-center w-24 h-8 text-sm" placeholder="First" />
                        <Input value={lastName} onChange={e => setLastName(e.target.value)} className="bg-white/10 border-white/20 text-white placeholder:text-white/50 text-center w-24 h-8 text-sm" placeholder="Last" />
                        <Button size="sm" onClick={handleSaveName} className="bg-white text-indigo-600 h-8 w-8 p-0"><Check className="h-3.5 w-3.5" /></Button>
                     </div>
                ) : (
                    <div className="flex flex-col items-center gap-1 mb-2">
                        <div className="flex items-center gap-2 justify-center flex-wrap px-4">
                            <h1 className="text-xl font-bold leading-tight">{contact.firstName} {contact.lastName}</h1>
                            <span className="hidden sm:inline text-indigo-200">•</span>
                            
                            {/* Inline Frequency Pill */}
                             <div className="relative group">
                                <span className={cn(
                                    "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border border-indigo-300/30",
                                    contact.current_health === 'neglected' ? "bg-rose-500/20 text-rose-100 border-rose-400/30" : "bg-indigo-400/20 text-indigo-100"
                                )}>
                                    {FREQUENCY_PRESETS.find(p => p.days === contact.target_frequency_days)?.label || "Monthly"}
                                </span>
                                <select
                                    value={contact.target_frequency_days || 30}
                                    onChange={(e) => handleFrequencyChange(parseInt(e.target.value))}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    title="Change Frequency"
                                >
                                    {FREQUENCY_PRESETS.map(preset => (
                                    <option key={preset.days} value={preset.days} className="text-gray-900">
                                        {preset.label}
                                    </option>
                                    ))}
                                </select>
                             </div>
                        </div>
                        {contact.job_title && (
                            <p className="text-indigo-200 text-xs font-medium">{contact.job_title}</p>
                        )}
                    </div>
                )}


                {/* Contact Details (Icons Row) */}
                <div className="flex items-center justify-center gap-4 mt-1">
                   {contact.phone && (
                        <a href={`tel:${contact.phone}`} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors border border-white/10"> 
                            <Phone className="h-4 w-4" />
                        </a>
                   )}
                   {contact.email && (
                        <a href={`mailto:${contact.email}`} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors border border-white/10">
                            <Mail className="h-4 w-4" />
                        </a>
                   )}
                </div>
            </div>
         </div>


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
    </div>
  );
}
