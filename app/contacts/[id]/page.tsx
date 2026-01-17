'use client';

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import toast, { Toaster } from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { ErrorFallback } from "@/components/error-fallback";
import { LinkConnectionModal } from "./components/LinkConnectionModal";
import ConnectionProfile from "./components/ConnectionProfile";
import { getRelationshipHealth } from "@/lib/relationship-health";

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
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();

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
          .select("content, created_at")
          .eq("person_id", id)
          .order('created_at', { ascending: false });

        // 4. Fetch Connections (Relationships)
        // We need both directions: where this person is 'from' OR 'to'
        const { data: rawRelationships, error: relError } = await (supabase as any)
          .from("relationships")
          .select(`
            id,
            relationship_type,
            context,
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
            context: rel.context,
            person: otherPerson
          };
        });


        // 5. Assemble complete object
        const latestMemory = sharedMemories?.[0]?.content;
        
        // Priority for AI Summary:
        // 1. relationship_summary (AI generated snapshot)
        // 2. deep_lore (Manual narrative lore)
        // 3. Story details fallback (The Origin + Philosophy + Priorities)
        
        const storyFallback = [
            person.where_met ? `**Origin:** ${person.where_met}` : null,
            person.why_stay_in_contact ? `**Philosophy:** ${person.why_stay_in_contact}` : null,
            person.most_important_to_them ? `**Priorities:** ${person.most_important_to_them}` : null
        ].filter(Boolean).join('\n\n');

        // If no high-quality AI summary exists, combine deep_lore with the structured story data
        // This ensures that even if deep_lore just says "Imported contact", we still show the other fields if they exist.
        const fallbackContent = [person.deep_lore, storyFallback].filter(Boolean).join('\n\n___\n\n');

        const baseSummary = person.relationship_summary || fallbackContent || "";
        
        const enhancedAiSummary = latestMemory 
            ? `**Most Recent Memory:** ${latestMemory}\n\n${baseSummary}`
            : baseSummary;

        const fullContact = {
            ...person,
            firstName: person.first_name || person.name?.split(" ")[0] || "",
            lastName: person.last_name || person.name?.split(" ").slice(1).join(" ") || "",
            tags: tags,
            shared_memories: sharedMemories || [],

            connections: processedConnections, // Add connections to contact object
            gift_ideas: person.gift_ideas || [], // Gift Vault
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
            last_interaction_date: person.last_interaction_date, 
            importance: person.importance,
            target_frequency_days: person.target_frequency_days,
            company: person.company,
            job_title: person.job_title
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

  // Calculate Health State for UI
  const healthState = getRelationshipHealth({
      lastContactDate: contact.last_interaction_date,
      cadenceDays: contact.target_frequency_days || 30
  });
  
  // Format Last Contact
  const lastContactDate = contact.last_interaction_date ? new Date(contact.last_interaction_date) : null;
  const lastContactFormatted = lastContactDate 
    ? lastContactDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : 'Never';

  return (
    <div className="flex flex-col items-center md:items-start min-h-screen bg-[#0a0e1a]">
      <Toaster position="top-center" />
      
    <div className="w-full max-w-[1200px] mx-auto">
        <ConnectionProfile
            contact={contact}
            health={healthState}
            lastContact={lastContactFormatted}
            synopsis={contact.ai_summary}
            sharedMemory={contact.deep_lore || contact.interests?.[0]}
        />
      </div>

      {/* 
        Legacy / Hidden Components 
        Keeping these commented out or hidden vs fully deleted in case we need to restore 
        Story/Family access, although the prompt requested a "Redesign".
        For now, I'm replacing the view entirely as per instructions.
      */}
      
       {/* MODALS - Keep these if triggered from outside or deep links, though UI for them is gone from main view */}
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
