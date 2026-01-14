'use client';

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import toast, { Toaster } from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { ErrorFallback } from "@/components/error-fallback";
import { PersonPanel } from "./components/PersonPanel";
import { OverviewPanel } from "./components/OverviewPanel";
import { getInitials } from "@/lib/utils/contact-helpers";
import { InteractionType } from "@/lib/relationship-health";

// Modals
import LogInteractionModal from "@/components/relationship-garden/LogInteractionModal";
import { EditContactModal } from "./components/EditContactModal";
import { AvatarCropModal } from "./components/AvatarCropModal";
import { LinkConnectionModal } from "./components/LinkConnectionModal";

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
  
  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logInitialMethod, setLogInitialMethod] = useState<InteractionType | undefined>(undefined);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check searchParams for action trigger (e.g. from dashboard)
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

  const handleRefresh = async () => {
    window.location.reload(); 
    // Ideally we would re-fetch here instead of reload to hold state, but for MVP speed reload is reliable
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

        // 4. Fetch Connections (Relationships)
        // We need both directions: where this person is 'from' OR 'to'
        const { data: rawRelationships, error: relError } = await (supabase as any)
          .from("relationships")
          .select(`
            id,
            relationship_type,
            from_person:from_person_id(id, name, photo_url, first_name, last_name),
            to_person:to_person_id(id, name, photo_url, first_name, last_name)
          `)
          .or(`from_person_id.eq.${id},to_person_id.eq.${id}`);

        if (relError) console.error("Error fetching relationships:", relError);

        // Process relationships to get the "other" person
        const processedConnections = (rawRelationships || []).map((rel: any) => {
          const isFrom = rel.from_person.id === id;
          const otherPerson = isFrom ? rel.to_person : rel.from_person;
          
          return {
            id: rel.id,
            relationship_type: rel.relationship_type,
            person: otherPerson
          };
        });


        // 5. Assemble complete object
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
            connections: processedConnections, // Add connections to contact object
            story: {
                whereWeMet: person.where_met,
                whyStayInContact: person.why_stay_in_contact,
                whatsImportant: person.most_important_to_them
            },
            deep_lore: person.deep_lore,
            birthday: person.birthday,
            photo_url: person.photo_url || person.avatar_url, 
            familyMembers: person.family_members || [],
            interests: person.interests || [],
            ai_summary: enhancedAiSummary,
            next_contact_date: person.next_contact_date,
            last_contact_date: person.last_contacted_date,
            last_interaction_date: person.last_interaction_date, // Ensuring this field flows through
            importance: person.importance,
            target_frequency_days: person.target_frequency_days
        };

        setContact(fullContact);

      } catch (err) {
        console.error("Error loading contact:", err);
        setError(err instanceof Error ? err.message : "Failed to load contact");
      } finally {
        setLoading(false);
      }
    }

    fetchContact();
  }, [id]);

  if (loading) {
     return <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a]"><div className="animate-pulse text-gray-500">Loading profile...</div></div>;
  }

  if (error || !contact) {
      return (
        <ErrorFallback 
            error={error ? new Error(error) : new Error("Contact not found")} 
            reset={() => window.location.reload()} 
        />
      );
  }

  const handleUnlinkConnection = async (connectionId: string) => {
    if (!confirm("Are you sure you want to unlink this connection?")) return;

    const supabase = createClient(); // Initialize Supabase client
    const { error } = await supabase
        .from('relationships')
        .delete()
        .eq('id', connectionId);

    if (error) {
        toast.error("Failed to unlink connection");
        console.error(error);
        return;
    }

    toast.success("Connection removed");
    
    // Update local state
    setContact(prev => {
        if (!prev) return null;
        return {
            ...prev,
            connections: prev.connections?.filter((c: any) => c.id !== connectionId) || []
        };
    });
  };

  return (
    <div className="flex flex-col md:flex-row h-auto md:h-screen overflow-y-auto md:overflow-hidden bg-[#0a0e1a] text-gray-200">
      <Toaster position="top-center" />
      
      {/* 
        COLUMN 2: PERSON PANEL 
        Fixed width on desktop (420px), Full width stack on mobile.
        Note: Column 1 is the SidebarNav handled in layout.tsx
      */}
      <PersonPanel 
        contact={contact}
      />

      {/* 
        COLUMN 3: OVERVIEW PANEL 
        Flexible width, vertical scroll.
      */}
      <OverviewPanel 
        contact={contact}
        onNavigateToTab={(tab) => console.log('Navigated to', tab)}
        onEdit={() => setIsEditModalOpen(true)}
        onLinkConnection={() => setIsLinkModalOpen(true)}
        onUnlinkConnection={handleUnlinkConnection}
        onFrequencyChange={(days) => setContact({...contact, target_frequency_days: days})}
        onImportanceChange={(imp) => setContact({...contact, importance: imp})}
      />

      {/* MODALS */}
      <LinkConnectionModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        currentContactId={contact.id}
        currentContactName={contact.name}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
