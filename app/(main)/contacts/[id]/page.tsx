'use client';

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import toast, { Toaster } from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { ErrorFallback } from "@/components/error-fallback";
import { LinkConnectionModal } from "./components/LinkConnectionModal";
import ConnectionProfile from "./components/ConnectionProfile";
import { getRelationshipHealth } from "@/lib/relationship-health";
import { getEffectiveSummaryLevel, getSummaryAtLevel } from "@/lib/utils/summary-levels";

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
  const [userSettings, setUserSettings] = useState<any>(null);
  const [effectiveSummaryLevel, setEffectiveSummaryLevel] = useState<'micro' | 'default' | 'full'>('default');

  // Modal States
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleRefresh = async () => {
    window.location.reload();
    // Ideally we would re-fetch here instead of reload to hold state, but for MVP speed reload is reliable
  };

  const handleRefreshAISummary = async () => {
    try {
      toast.loading('Refreshing AI summary...', { id: 'ai-refresh' });

      const response = await fetch('/api/refresh-ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to refresh AI summary');
      }

      toast.success('AI summary refreshed!', { id: 'ai-refresh' });

      // Update the contact state with all three summary levels
      // Update the contact state with all three summary levels
      setContact((prev: any) => {
        // Create a temporary object with the new summaries to calculate the correct display text
        const updatedFields = {
            summary_micro: data.summary_micro,
            summary_default: data.summary_default,
            summary_full: data.summary_full,
            relationship_summary: data.summary_default,
        };

        const tempContactForCalc = { ...prev, ...updatedFields };
        const summaryText = getSummaryAtLevel(tempContactForCalc, effectiveSummaryLevel);

        return {
            ...prev,
            ...updatedFields,
            ai_summary: summaryText,
            updated_at: new Date().toISOString()
        };
      });
    } catch (error) {
      console.error('Error refreshing AI summary:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to refresh AI summary', { id: 'ai-refresh' });
    }
  };

  // Fetch Data
  useEffect(() => {
  // Fetch Data
  const fetchContact = async () => {
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

      // 1b. Fetch User Settings for summary level preference
      const { data: userSettings } = await (supabase as any)
        .from("user_settings")
        .select("summary_level_default")
        .eq("user_id", user.id)
        .single();

      // 2. Fetch Tags
      const { data: tagData } = await (supabase as any)
        .from("person_tags")
        .select("tags(name)")
        .eq("person_id", id);
      
      const tags = tagData?.map((t: any) => t.tags.name) || [];

      // 3. Fetch Shared Memories
      const { data: sharedMemories } = await (supabase as any)
        .from("shared_memories")
        .select("id, content, created_at")
        .eq("person_id", id)
        .order('created_at', { ascending: false });

      // 3b. Fetch Interactions
      const { data: interactions } = await (supabase as any)
        .from("interactions")
        .select("*")
        .eq("person_id", id)
        .order('date', { ascending: false })
        .limit(10);

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


      // 5. Compute effective summary level
      const effectiveLevel = getEffectiveSummaryLevel(person, userSettings);
      setEffectiveSummaryLevel(effectiveLevel);
      setUserSettings(userSettings);

      // Get the appropriate summary at the effective level
      const summaryAtLevel = getSummaryAtLevel(person, effectiveLevel);

      // Fallback logic for when no summaries exist yet
      const latestMemory = sharedMemories?.[0]?.content;
      const storyFallback = [
          person.where_met ? `**Origin:** ${person.where_met}` : null,
          person.why_stay_in_contact ? `**Philosophy:** ${person.why_stay_in_contact}` : null,
          person.most_important_to_them ? `**Priorities:** ${person.most_important_to_them}` : null
      ].filter(Boolean).join('\n\n');

      const fallbackContent = [person.deep_lore, storyFallback].filter(Boolean).join('\n\n___\n\n');

      // Use the level-specific summary, or fall back to relationship_summary, or finally to fallback content
      const baseSummary = summaryAtLevel || person.relationship_summary || fallbackContent || "";

      const fullContact = {
          ...person,
          firstName: person.first_name || person.name?.split(" ")[0] || "",
          lastName: person.last_name || person.name?.split(" ").slice(1).join(" ") || "",
          tags: tags,
          shared_memories: sharedMemories || [],
          interactions: interactions || [],

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
          ai_summary: baseSummary,
          next_contact_date: person.next_contact_date,
          last_contact_date: person.last_contacted_date,
          last_interaction_date: person.last_interaction_date, 
          importance: person.importance,
          target_frequency_days: person.target_frequency_days,
          company: person.company,
          job_title: person.job_title,
          current_challenges: person.current_challenges,
          goals_aspirations: person.goals_aspirations,
          // 6-Block Structured Data
          identity_context: person.identity_context,
          family_personal: person.family_personal,
          career_craft: person.career_craft,
          interests_hobbies: person.interests_hobbies,
          values_personality: person.values_personality,
          history_touchpoints: person.history_touchpoints,
          // Additional 6-Block Fields
          relationship_type: person.relationship_type,
          life_stage: person.life_stage,
          career_trajectory: person.career_trajectory,
          pain_points: person.pain_points,
          career_goals: person.career_goals,
          core_values: person.core_values,
          communication_style: person.communication_style,
          personality_notes: person.personality_notes,
          mutual_value_introductions: person.mutual_value_introductions
      };

      setContact(fullContact);

    } catch (err) {
      console.error("Error loading contact:", err);
      setError(err instanceof Error ? err.message : "Failed to load contact");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
            summaryLevel={effectiveSummaryLevel}
            sharedMemory={contact.deep_lore || contact.interests?.[0]}
            onRefreshAISummary={handleRefreshAISummary}
            onDataUpdate={fetchContact}
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
