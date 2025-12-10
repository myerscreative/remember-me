"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  MessageSquare,
  Edit,
  Check,
  X,
  Plus,
  Clock,
  Sparkles,
  Eye,
  EyeOff,
  Cake,
  Camera,
  Calendar,
  Bell,
  RefreshCw,
  Info,
} from "lucide-react";
import { use, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ImageCropModal } from "@/components/image-crop-modal";
import { ArchiveContactDialog } from "@/components/archive-contact-dialog";
import { StoryCompletenessIndicator } from "@/components/story-completeness-indicator";
import toast, { Toaster } from "react-hot-toast";
import { getInitials, getFullName, getGradient } from "@/lib/utils/contact-helpers";
import { ErrorFallback } from "@/components/error-fallback";

const tabs = ["Profession", "Family", "Interests"];

export default function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("Profession");
  
  // State for editable content
  const [professionSynopsis, setProfessionSynopsis] = useState("");
  const [familySynopsis, setFamilySynopsis] = useState("");
  const [interestsSynopsis, setInterestsSynopsis] = useState("");
  const [story, setStory] = useState({
    whereWeMet: "",
    whyStayInContact: "",
    whatsImportant: "",
  });
  const [notes, setNotes] = useState("");
  const [profession, setProfession] = useState("");
  const [familyNotes, setFamilyNotes] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingSynopsis, setEditingSynopsis] = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  const [editingInterests, setEditingInterests] = useState(false);
  const [editingBirthday, setEditingBirthday] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [newInterestInput, setNewInterestInput] = useState("");
  const [birthdayValue, setBirthdayValue] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [familyMembers, setFamilyMembers] = useState<Array<{ name: string; relationship: string }>>([]);
  const [editingFamilyMember, setEditingFamilyMember] = useState<number | null>(null);
  const [newFamilyMemberName, setNewFamilyMemberName] = useState("");
  const [newFamilyMemberRelationship, setNewFamilyMemberRelationship] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [emailValue, setEmailValue] = useState("");
  const [phoneValue, setPhoneValue] = useState("");
  const [hobbies, setHobbies] = useState("");
  const [editingHobbies, setEditingHobbies] = useState(false);
  
  // Nurture tracking state
  const [nextContactDate, setNextContactDate] = useState<string>("");
  const [nextContactReason, setNextContactReason] = useState("");
  const [lastContactedDate, setLastContactedDate] = useState<string>("");
  const [editingNextContact, setEditingNextContact] = useState(false);
  
  // AI Suggestions drawer state
  const [showSuggestionsDrawer, setShowSuggestionsDrawer] = useState(false);
  
  // AI prompting for missing information
  const [missingInfo, setMissingInfo] = useState<Array<{
    type: string;
    prompt: string;
    suggestion: string;
  }>>([]);
  
  // AI Suggestions toggle (stored in localStorage)
  const [aiSuggestionsEnabled, setAiSuggestionsEnabled] = useState(true);
  
  // Ignored suggestions (stored in localStorage, keyed by contactId and suggestion type)
  const [ignoredSuggestions, setIgnoredSuggestions] = useState<Set<string>>(new Set());

  // Story completeness
  const [storyCompleteness, setStoryCompleteness] = useState<number>(0);
  const [missingStoryFields, setMissingStoryFields] = useState<string[]>([]);

  // Load AI suggestions preference and ignored suggestions from localStorage
  useEffect(() => {
    // Load AI suggestions toggle preference
    const savedAiSuggestionsEnabled = localStorage.getItem("aiSuggestionsEnabled");
    if (savedAiSuggestionsEnabled !== null) {
      setAiSuggestionsEnabled(savedAiSuggestionsEnabled === "true");
    }
    
    // Load ignored suggestions for this contact
    const savedIgnored = localStorage.getItem(`ignoredSuggestions_${id}`);
    if (savedIgnored) {
      try {
        const ignored = JSON.parse(savedIgnored);
        setIgnoredSuggestions(new Set(ignored));
      } catch (e) {
        console.error("Error parsing ignored suggestions:", e);
      }
    }
  }, [id]);

  // Fetch contact data from Supabase
  useEffect(() => {
    async function fetchContact() {
      try {
        const supabase = createClient();
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push("/login?redirect=/contacts/" + id);
          return;
        }

        // Fetch person with tags
        const { data: person, error: personError } = await (supabase as any)
          .from("persons")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (personError) {
          throw personError;
        }

        if (!person) {
          setError("Contact not found");
          setLoading(false);
          return;
        }

        // Fetch tags for this person
        const { data: personTags, error: tagsError } = await (supabase as any)
          .from("person_tags")
          .select("tag_id, tags(name)")
          .eq("person_id", id);

        const tagNames = personTags?.map((pt: any) => pt.tags?.name).filter(Boolean) || [];

        // Transform database data to component format
        const contactData = {
          id: person.id,
          firstName: person.first_name || person.name?.split(' ')[0] || "",
          lastName: person.last_name || person.name?.split(' ').slice(1).join(' ') || null,
          name: getFullName(person.first_name || person.name?.split(' ')[0] || "", person.last_name || person.name?.split(' ').slice(1).join(' ') || null),
          initials: getInitials(person.first_name || person.name?.split(' ')[0] || "", person.last_name || person.name?.split(' ').slice(1).join(' ') || null),
          avatar: person.photo_url || "",
          title: person.linkedin || person.email || "",
          phone: person.phone || "",
          email: person.email || "",
          birthday: person.birthday || null,
          tags: tagNames,
          interests: person.interests || [],
          professionSynopsis: person.what_found_interesting || "",
          familySynopsis: person.family_notes || "",
          interestsSynopsis: person.interests?.join(", ") || "",
          familyMembers: Array.isArray(person.family_members) ? person.family_members : [],
          story: {
            whereWeMet: person.where_met || "",
            whyStayInContact: person.why_stay_in_contact || "",
            whatsImportant: person.most_important_to_them || "",
          },
          notes: person.notes || "",
          profession: person.what_found_interesting || "",
          familyNotes: person.family_notes || "",
          nextContactDate: person.next_contact_date || null,
          nextContactReason: person.next_contact_reason || "",
          lastContactedDate: person.last_contacted_date || null,
          mostRecentInteraction: {
            type: "Email",
            date: person.last_contact 
              ? new Date(person.last_contact).toLocaleDateString()
              : "Never",
            summary: person.last_contact 
              ? `Last contacted on ${new Date(person.last_contact).toLocaleDateString()}`
              : "No recent interactions",
          },
          connections: person.who_introduced 
            ? [{ name: person.who_introduced, relationship: "Introduced us" }]
            : [],
        };

        setContact(contactData);
        setProfessionSynopsis(contactData.professionSynopsis);
        setFamilySynopsis(contactData.familySynopsis);
        setInterestsSynopsis(contactData.interestsSynopsis);
        setStory(contactData.story);
        setNotes(contactData.notes);
        setProfession(contactData.profession);
        setFamilyNotes(contactData.familyNotes);
        setInterests(contactData.interests);
        setTags(contactData.tags);
        setFirstName(contactData.firstName);
        setLastName(contactData.lastName || "");
        setFamilyMembers(contactData.familyMembers || []);
        setEmailValue(contactData.email || "");
        setPhoneValue(contactData.phone || "");
        setHobbies(person.hobbies || "");
        setNextContactDate(contactData.nextContactDate || "");
        setNextContactReason(contactData.nextContactReason || "");
        setLastContactedDate(contactData.lastContactedDate || "");
        // Initialize birthday value for editing (format as YYYY-MM-DD for input)
        if (contactData.birthday) {
          try {
            const parts = contactData.birthday.split('-');
            if (parts.length === 3) {
              setBirthdayValue(contactData.birthday); // Already in YYYY-MM-DD format
            } else {
              const date = new Date(contactData.birthday);
              if (!isNaN(date.getTime())) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                setBirthdayValue(`${year}-${month}-${day}`);
              }
            }
          } catch (e) {
            setBirthdayValue("");
          }
        } else {
          setBirthdayValue("");
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching contact:", err);
        setError(err instanceof Error ? err.message : "Failed to load contact");
        setLoading(false);
      }
    }

    fetchContact();
  }, [id, router]);

  // Fetch story completeness
  useEffect(() => {
    async function fetchStoryCompleteness() {
      if (!contact) return;

      try {
        const response = await fetch(`/api/story-completeness/${id}`);
        if (response.ok) {
          const data = await response.json();
          setStoryCompleteness(data.completeness || 0);
          setMissingStoryFields(data.missingFields || []);
        }
      } catch (error) {
        console.error("Error fetching story completeness:", error);
      }
    }

    fetchStoryCompleteness();
  }, [id, contact]);

  // Get current synopsis based on active tab
  const getCurrentSynopsis = () => {
    switch (activeTab) {
      case "Profession":
        return professionSynopsis;
      case "Family":
        return familySynopsis;
      case "Interests":
        return interestsSynopsis;
      default:
        return professionSynopsis;
    }
  };

  const getCurrentSynopsisSetter = () => {
    switch (activeTab) {
      case "Profession":
        return setProfessionSynopsis;
      case "Family":
        return setFamilySynopsis;
      case "Interests":
        return setInterestsSynopsis;
      default:
        return setProfessionSynopsis;
    }
  };

  const [localSynopsis, setLocalSynopsis] = useState(getCurrentSynopsis());

  const handleEdit = (section: string) => {
    setEditingSection(section);
  };

  const handleSave = async (sectionKey?: string, value?: string) => {
    setEditingSection(null);
    
    // Save to database based on section
    if (sectionKey === "notes" && value !== undefined) {
      try {
        const supabase = createClient();
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push("/login?redirect=/contacts/" + id);
          return;
        }

        // Update notes in database
        const { error: updateError } = await (supabase as any)
          .from("persons")
          .update({ 
            notes: value.trim() || null
          })
          .eq("id", id)
          .eq("user_id", user.id);

        if (updateError) {
          throw updateError;
        }

        // Update local state
        setNotes(value.trim());
        setContact({ ...contact, notes: value.trim() });
      } catch (err) {
        console.error("Error saving notes:", err);
        toast.error(err instanceof Error ? err.message : "Failed to save notes");
      }
    } else if (sectionKey === "whereWeMet" && value !== undefined) {
      try {
        const supabase = createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push("/login?redirect=/contacts/" + id);
          return;
        }
        const { error: updateError } = await (supabase as any)
          .from("persons")
          .update({ where_met: value.trim() || null })
          .eq("id", id)
          .eq("user_id", user.id);
        if (updateError) throw updateError;
        setStory({ ...story, whereWeMet: value.trim() });
        toast.success("Location updated successfully!");
      } catch (err) {
        console.error("Error saving:", err);
        toast.error(err instanceof Error ? err.message : "Failed to save");
      }
    } else if (sectionKey === "whyStayInContact" && value !== undefined) {
      try {
        const supabase = createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push("/login?redirect=/contacts/" + id);
          return;
        }
        const { error: updateError } = await (supabase as any)
          .from("persons")
          .update({ why_stay_in_contact: value.trim() || null })
          .eq("id", id)
          .eq("user_id", user.id);
        if (updateError) throw updateError;
        setStory({ ...story, whyStayInContact: value.trim() });
        toast.success("Saved successfully!");
      } catch (err) {
        console.error("Error saving:", err);
        toast.error(err instanceof Error ? err.message : "Failed to save");
      }
    } else if (sectionKey === "whatsImportant" && value !== undefined) {
      try {
        const supabase = createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push("/login?redirect=/contacts/" + id);
          return;
        }
        const { error: updateError } = await (supabase as any)
          .from("persons")
          .update({ most_important_to_them: value.trim() || null })
          .eq("id", id)
          .eq("user_id", user.id);
        if (updateError) throw updateError;
        setStory({ ...story, whatsImportant: value.trim() });
        toast.success("Saved successfully!");
      } catch (err) {
        console.error("Error saving:", err);
        toast.error(err instanceof Error ? err.message : "Failed to save");
      }
    }
  };

  const handleCancel = () => {
    setEditingSection(null);
    // Reset to original values from contact
    if (contact) {
      setProfessionSynopsis(contact.professionSynopsis);
      setFamilySynopsis(contact.familySynopsis);
      setInterestsSynopsis(contact.interestsSynopsis);
      setStory(contact.story);
      setNotes(contact.notes);
      setProfession(contact.profession);
      setFamilyNotes(contact.familyNotes);
      setInterests(contact.interests || []);
    }
  };

  const handleSaveSynopsis = async () => {
    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push("/login?redirect=/contacts/" + id);
        return;
      }

      // Determine which field to update based on active tab
      let updateData: any = {};
      if (activeTab === "Profession") {
        updateData.what_found_interesting = localSynopsis.trim() || null;
      } else if (activeTab === "Family") {
        updateData.family_notes = localSynopsis.trim() || null;
      }

      // Update synopsis in database
      const { error: updateError } = await (supabase as any)
        .from("persons")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", user.id);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      const setter = getCurrentSynopsisSetter();
      setter(localSynopsis);
      
      // Update contact object
      if (activeTab === "Profession") {
        setContact({ ...contact, professionSynopsis: localSynopsis.trim(), profession: localSynopsis.trim() });
      } else if (activeTab === "Family") {
        setContact({ ...contact, familySynopsis: localSynopsis.trim(), familyNotes: localSynopsis.trim() });
      }
      
      setEditingSynopsis(false);
      toast.success("Synopsis updated successfully!");
    } catch (err) {
      console.error("Error saving synopsis:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  };

  const handleCancelSynopsis = () => {
    setLocalSynopsis(getCurrentSynopsis());
    setEditingSynopsis(false);
  };

  const handleAddTag = () => {
    const trimmedTag = newTagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setNewTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSaveTags = async () => {
    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push("/login?redirect=/contacts/" + id);
        return;
      }

      // First, get existing tags for this person
      const { data: existingPersonTags } = await (supabase as any)
        .from("person_tags")
        .select("tag_id, tags(name)")
        .eq("person_id", id);

      const existingTagNames = existingPersonTags?.map((pt: any) => pt.tags?.name).filter(Boolean) || [];

      // Determine which tags to add and which to remove
      const tagsToAdd = tags.filter((t: any) => !existingTagNames.includes(t));
      const tagsToRemove = existingTagNames.filter((t: string) => !tags.includes(t));

      // Add new tags
      for (const tagName of tagsToAdd) {
        // First, ensure the tag exists in the tags table
        const { data: existingTag } = await (supabase as any)
          .from("tags")
          .select("id, name")
          .eq("name", tagName)
          .eq("user_id", user.id)
          .single();

        let tagId = existingTag?.id;

        if (!tagId) {
          // Create the tag if it doesn't exist
          const { data: newTag, error: tagError } = await (supabase as any)
            .from("tags")
            .insert({ name: tagName, user_id: user.id })
            .select()
            .single();

          if (tagError) throw tagError;
          tagId = newTag.id;
        }

        // Link the tag to the person
        await (supabase as any)
          .from("person_tags")
          .insert({ person_id: id, tag_id: tagId });
      }

      // Remove tags
      if (tagsToRemove.length > 0) {
        const { data: tagsToDelete } = await (supabase as any)
          .from("tags")
          .select("id")
          .in("name", tagsToRemove)
          .eq("user_id", user.id);

        if (tagsToDelete && tagsToDelete.length > 0) {
          const tagIdsToDelete = tagsToDelete.map((t: any) => t.id);
          await (supabase as any)
            .from("person_tags")
            .delete()
            .eq("person_id", id)
            .in("tag_id", tagIdsToDelete);
        }
      }

      // Update local state
      setContact({ ...contact, tags });
      setEditingTags(false);
      setNewTagInput("");
      toast.success("Tags saved!");
    } catch (err) {
      console.error("Error saving tags:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save tags");
    }
  };

  const handleCancelTags = () => {
    setTags(contact?.tags || []);
    setEditingTags(false);
    setNewTagInput("");
  };

  const handleTagKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleAddInterest = () => {
    const trimmedInterest = newInterestInput.trim();
    if (trimmedInterest && !interests.includes(trimmedInterest)) {
      setInterests([...interests, trimmedInterest]);
      setNewInterestInput("");
    }
  };

  const handleRemoveInterest = (interestToRemove: string) => {
    setInterests(interests.filter((interest) => interest !== interestToRemove));
  };

  const handleSaveInterests = async () => {
    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push("/login?redirect=/contacts/" + id);
        return;
      }

      // Update interests in database
      const { error: updateError } = await (supabase as any)
        .from("persons")
        .update({ 
          interests: interests.length > 0 ? interests : null
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setContact({ ...contact, interests });
      setEditingInterests(false);
      setNewInterestInput("");
      toast.success("Interests saved!");
    } catch (err) {
      console.error("Error saving interests:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save interests");
    }
  };

  const handleCancelInterests = () => {
    setInterests(contact?.interests || []);
    setEditingInterests(false);
    setNewInterestInput("");
  };

  const handleInterestKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddInterest();
    }
  };

  const handleSaveHobbies = async () => {
    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push("/login?redirect=/contacts/" + id);
        return;
      }

      // Update hobbies in database
      const { error: updateError } = await (supabase as any)
        .from("persons")
        .update({ 
          hobbies: hobbies.trim() || null
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setContact({ ...contact, hobbies: hobbies.trim() });
      setEditingHobbies(false);
      toast.success("Hobbies saved!");
    } catch (err) {
      console.error("Error saving hobbies:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save hobbies");
    }
  };

  const handleCancelHobbies = () => {
    setHobbies(contact?.hobbies || "");
    setEditingHobbies(false);
  };

  const handleSaveBirthday = async (valueToSave?: string) => {
    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push("/login?redirect=/contacts/" + id);
        return;
      }

      // Use provided value or current state value
      const rawValue = valueToSave !== undefined ? valueToSave : birthdayValue;
      
      // Handle different value types
      let birthdayToSave: string | null = null;
      
      if (rawValue == null || rawValue === "") {
        birthdayToSave = null;
      } else if (typeof rawValue === "string") {
        // If it's already a string, trim it
        const trimmed = rawValue.trim();
        if (trimmed === "") {
          birthdayToSave = null;
        } else {
          // Validate YYYY-MM-DD format
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (dateRegex.test(trimmed)) {
            birthdayToSave = trimmed;
          } else {
            // Try to parse and reformat
            try {
              const date = new Date(trimmed);
              if (!isNaN(date.getTime())) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                birthdayToSave = `${year}-${month}-${day}`;
              } else {
                birthdayToSave = null;
              }
            } catch {
              birthdayToSave = null;
            }
          }
        }
      } else if ((rawValue as any) instanceof Date) {
        // If it's a Date object, format as YYYY-MM-DD
        if (!isNaN((rawValue as any).getTime())) {
          const year = (rawValue as any).getFullYear();
          const month = String((rawValue as any).getMonth() + 1).padStart(2, '0');
          const day = String((rawValue as any).getDate()).padStart(2, '0');
          birthdayToSave = `${year}-${month}-${day}`;
        } else {
          birthdayToSave = null;
        }
      } else {
        // For any other type, set to null
        birthdayToSave = null;
      }

      // Update birthday in database and return the updated row
      const { data: updatedData, error: updateError } = await (supabase as any)
        .from("persons")
        .update({ birthday: birthdayToSave })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (updateError) {
        console.error("Database update error:", updateError);
        throw updateError;
      }

      if (!updatedData) {
        console.error("No data returned from update");
        throw new Error("Failed to update birthday - no data returned");
      }

      // Update local state with the data from the database
      setBirthdayValue(birthdayToSave || "");
      setContact({ ...contact, birthday: updatedData.birthday });
      setEditingBirthday(false);
      toast.success("Birthday updated!");
    } catch (err) {
      console.error("Error saving birthday:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save birthday");
    }
  };

  // Next Contact Date handlers
  const handleSaveNextContact = async () => {
    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push("/login?redirect=/contacts/" + id);
        return;
      }

      const { error: updateError } = await supabase
        .from("persons")
        .update({ 
          next_contact_date: nextContactDate || null,
          next_contact_reason: nextContactReason?.trim() || null
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setContact({ 
        ...contact, 
        nextContactDate: nextContactDate || null,
        nextContactReason: nextContactReason?.trim() || ""
      });
      setEditingNextContact(false);
    } catch (err) {
      console.error("Error saving next contact date:", err);
      alert(err instanceof Error ? err.message : "Failed to save next contact date");
    }
  };

  const handleMarkAsContacted = async () => {
    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push("/login?redirect=/contacts/" + id);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      
      // Suggest next contact date (60 days from now by default)
      const suggestedNext = new Date();
      suggestedNext.setDate(suggestedNext.getDate() + 60);
      const suggestedNextStr = suggestedNext.toISOString().split('T')[0];

      const { error: updateError } = await supabase
        .from("persons")
        .update({ 
          last_contacted_date: today,
          next_contact_date: suggestedNextStr,
          last_contact: new Date().toISOString()
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setLastContactedDate(today);
      setNextContactDate(suggestedNextStr);
      setContact({ 
        ...contact, 
        lastContactedDate: today,
        nextContactDate: suggestedNextStr
      });
    } catch (err) {
      console.error("Error marking as contacted:", err);
      alert(err instanceof Error ? err.message : "Failed to mark as contacted");
    }
  };

  const handleSnoozeNextContact = async (days: number) => {
    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push("/login?redirect=/contacts/" + id);
        return;
      }

      const baseDate = nextContactDate ? new Date(nextContactDate) : new Date();
      baseDate.setDate(baseDate.getDate() + days);
      const newDate = baseDate.toISOString().split('T')[0];

      const { error: updateError } = await supabase
        .from("persons")
        .update({ next_contact_date: newDate })
        .eq("id", id)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setNextContactDate(newDate);
      setContact({ ...contact, nextContactDate: newDate });
    } catch (err) {
      console.error("Error snoozing contact:", err);
      alert(err instanceof Error ? err.message : "Failed to snooze");
    }
  };

  const getUrgencyInfo = () => {
    if (!nextContactDate) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const contactDate = new Date(nextContactDate);
    contactDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((contactDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return {
        status: 'overdue',
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        label: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`
      };
    } else if (diffDays === 0) {
      return {
        status: 'today',
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        borderColor: 'border-orange-200 dark:border-orange-800',
        label: 'Today'
      };
    } else if (diffDays <= 3) {
      return {
        status: 'urgent',
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        label: `In ${diffDays} day${diffDays !== 1 ? 's' : ''}`
      };
    } else if (diffDays <= 7) {
      return {
        status: 'soon',
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        label: `In ${diffDays} days`
      };
    } else {
      return {
        status: 'upcoming',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        label: `In ${diffDays} days`
      };
    }
  };

  const handleCancelBirthday = () => {
    // Reset to original value from contact
    if (contact?.birthday) {
      try {
        const parts = contact.birthday.split('-');
        if (parts.length === 3) {
          setBirthdayValue(contact.birthday);
        } else {
          const date = new Date(contact.birthday);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            setBirthdayValue(`${year}-${month}-${day}`);
          }
        }
      } catch (e) {
        setBirthdayValue("");
      }
    } else {
      setBirthdayValue("");
    }
    setEditingBirthday(false);
  };

  const handleSaveName = async () => {
    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push("/login?redirect=/contacts/" + id);
        return;
      }

      // Validate first name is not empty
      if (!firstName.trim()) {
        toast.error("First name is required");
        return;
      }

      // Update name in database
      const { error: updateError } = await (supabase as any)
        .from("persons")
        .update({ 
          first_name: firstName.trim(),
          last_name: lastName.trim() || null,
          name: getFullName(firstName.trim(), lastName.trim() || null) // Keep name for backward compatibility
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      const fullName = getFullName(firstName.trim(), lastName.trim() || null);
      setContact({ ...contact, firstName: firstName.trim(), lastName: lastName.trim() || null, name: fullName });
      setEditingName(false);
      toast.success("Name updated successfully!");
    } catch (err) {
      console.error("Error saving name:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save name");
    }
  };

  const handleCancelName = () => {
    // Reset to original values from contact
    if (contact) {
      setFirstName(contact.firstName || "");
      setLastName(contact.lastName || "");
    }
    setEditingName(false);
  };

  const handleSaveContact = async () => {
    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push("/login?redirect=/contacts/" + id);
        return;
      }

      // Update email and phone in database
      const { data: updatedData, error: updateError } = await (supabase as any)
        .from("persons")
        .update({ 
          email: emailValue.trim() || null,
          phone: phoneValue.trim() || null,
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Update local state with saved values
      const updatedEmail = emailValue.trim();
      const updatedPhone = phoneValue.trim();
      const updatedTitle = updatedData?.linkedin || updatedEmail || "";
      
      setContact({
        ...contact,
        email: updatedEmail,
        phone: updatedPhone,
        title: updatedTitle
      });
      setEditingContact(false);
      toast.success("Contact info updated!");
    } catch (err) {
      console.error("Error saving contact info:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save contact info");
    }
  };

  const handleCancelContact = () => {
    // Reset to original values from contact
    if (contact) {
      setEmailValue(contact.email || "");
      setPhoneValue(contact.phone || "");
    }
    setEditingContact(false);
  };

  const handleSaveFamilyMembers = async () => {
    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push("/login?redirect=/contacts/" + id);
        return;
      }

      // Update family_members in database
      const { error: updateError } = await (supabase as any)
        .from("persons")
        .update({ 
          family_members: familyMembers.length > 0 ? familyMembers : null
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setContact({ ...contact, familyMembers });
      setEditingFamilyMember(null);
      setNewFamilyMemberName("");
      setNewFamilyMemberRelationship("");
      toast.success("Family members saved!");
    } catch (err) {
      console.error("Error saving family members:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save family members");
    }
  };

  const handleAddFamilyMember = () => {
    if (newFamilyMemberName.trim() && newFamilyMemberRelationship.trim()) {
      setFamilyMembers([...familyMembers, {
        name: newFamilyMemberName.trim(),
        relationship: newFamilyMemberRelationship.trim()
      }]);
      setNewFamilyMemberName("");
      setNewFamilyMemberRelationship("");
    }
  };

  const handleRemoveFamilyMember = (index: number) => {
    setFamilyMembers(familyMembers.filter((_, i) => i !== index));
  };

  const handleEditFamilyMember = (index: number) => {
    const member = familyMembers[index];
    setNewFamilyMemberName(member.name);
    setNewFamilyMemberRelationship(member.relationship);
    setEditingFamilyMember(index);
  };

  const handleUpdateFamilyMember = () => {
    if (editingFamilyMember !== null && newFamilyMemberName.trim() && newFamilyMemberRelationship.trim()) {
      const updated = [...familyMembers];
      updated[editingFamilyMember] = {
        name: newFamilyMemberName.trim(),
        relationship: newFamilyMemberRelationship.trim()
      };
      setFamilyMembers(updated);
      setEditingFamilyMember(null);
      setNewFamilyMemberName("");
      setNewFamilyMemberRelationship("");
    }
  };

  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      event.target.value = '';
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      event.target.value = '';
      return;
    }

    // Read the file as data URL for cropping
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setSelectedFileName(file.name);
    };
    reader.readAsDataURL(file);

    // Reset file input
    event.target.value = '';
  };

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    setUploadingAvatar(true);
    setImageToCrop(null);

    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push("/login?redirect=/contacts/" + id);
        return;
      }

      // Delete old avatar if it exists
      if (contact?.avatar) {
        try {
          // Extract file path from URL
          const oldUrl = contact.avatar;
          const urlParts = oldUrl.split('/');
          const fileIndex = urlParts.findIndex((part: any) => part === 'avatars');
          if (fileIndex !== -1) {
            const filePath = urlParts.slice(fileIndex + 1).join('/');
            await supabase.storage.from('avatars').remove([filePath]);
          }
        } catch (err) {
          console.warn('Could not delete old avatar:', err);
          // Continue anyway - old avatar will be overwritten
        }
      }

      // Upload cropped avatar to Supabase Storage
      const fileExt = selectedFileName.split('.').pop() || 'jpg';
      const fileName = `${id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await (supabase as any)
        .storage
        .from('avatars')
        .upload(filePath, croppedImageBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = (supabase as any)
        .storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update photo_url in database
      const { data: updatedData, error: updateError } = await (supabase as any)
        .from("persons")
        .update({ photo_url: publicUrl })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setContact({ ...contact, avatar: publicUrl });
      toast.success("Avatar updated successfully!");
    } catch (err) {
      console.error("Error uploading avatar:", err);
      toast.error(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCropCancel = () => {
    setImageToCrop(null);
    setSelectedFileName("");
  };

  // Sync localSynopsis when synopsis changes (but not when editing) or when tab changes
  useEffect(() => {
    if (!editingSynopsis) {
      // Get current synopsis based on active tab
      let currentSynopsis: string;
      switch (activeTab) {
        case "Profession":
          currentSynopsis = professionSynopsis;
          break;
        case "Family":
          currentSynopsis = familySynopsis;
          break;
        case "Interests":
          currentSynopsis = interestsSynopsis;
          break;
        default:
          currentSynopsis = professionSynopsis;
      }
      setLocalSynopsis(currentSynopsis);
    }
  }, [activeTab, professionSynopsis, familySynopsis, interestsSynopsis, editingSynopsis]);

  // Detect missing information when synopsis or tab changes
  useEffect(() => {
    const detectMissingInfo = async () => {
      // Get current synopsis based on active tab (use editing value if currently editing)
      let currentSynopsis: string;
      if (editingSynopsis) {
        currentSynopsis = localSynopsis;
      } else {
        switch (activeTab) {
          case "Profession":
            currentSynopsis = professionSynopsis;
            break;
          case "Family":
            currentSynopsis = familySynopsis;
            break;
          case "Interests":
            currentSynopsis = interestsSynopsis;
            break;
          default:
            currentSynopsis = professionSynopsis;
        }
      }

      if (!currentSynopsis || currentSynopsis.trim().length === 0) {
        setMissingInfo([]);
        return;
      }

      try {
        const response = await fetch("/api/detect-missing-info", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: currentSynopsis,
            context: activeTab as "Profession" | "Family" | "Interests",
            contactName: contact?.name || "",
            familyMembers: activeTab === "Family" ? familyMembers : undefined, // Pass family members for context
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setMissingInfo(data.missingInfo || []);
        } else {
          setMissingInfo([]);
        }
      } catch (error) {
        console.error("Error detecting missing info:", error);
        setMissingInfo([]);
      }
    };

    // Detect when contact exists and AI suggestions are enabled
    if (contact && aiSuggestionsEnabled) {
      // Debounce detection when editing to avoid too many API calls
      const timeoutId = setTimeout(() => {
        detectMissingInfo();
      }, editingSynopsis ? 500 : 0); // 500ms delay when editing, immediate otherwise

      return () => clearTimeout(timeoutId);
    } else if (!aiSuggestionsEnabled) {
      // Clear suggestions if disabled
      setMissingInfo([]);
    }
  }, [activeTab, professionSynopsis, familySynopsis, interestsSynopsis, editingSynopsis, localSynopsis, contact?.name, aiSuggestionsEnabled, familyMembers]);

  // Toggle AI suggestions
  const handleToggleAiSuggestions = () => {
    const newValue = !aiSuggestionsEnabled;
    setAiSuggestionsEnabled(newValue);
    localStorage.setItem("aiSuggestionsEnabled", String(newValue));
    if (!newValue) {
      setMissingInfo([]);
    }
  };

  // Ignore a specific suggestion
  const handleIgnoreSuggestion = (suggestionType: string, prompt: string) => {
    // Create a unique key for this suggestion (contactId + type + prompt hash)
    const suggestionKey = `${id}_${suggestionType}_${prompt.slice(0, 50)}`;
    const newIgnored = new Set(ignoredSuggestions);
    newIgnored.add(suggestionKey);
    setIgnoredSuggestions(newIgnored);
    
    // Save to localStorage
    localStorage.setItem(`ignoredSuggestions_${id}`, JSON.stringify(Array.from(newIgnored)));
  };

  // Filter out ignored suggestions
  const filteredMissingInfo = missingInfo.filter(info => {
    const key = `${id}_${info.type}_${info.prompt.slice(0, 50)}`;
    return !ignoredSuggestions.has(key);
  });

  const EditableSection = ({
    sectionKey,
    title,
    content,
    onSave,
  }: {
    sectionKey: string;
    title: string;
    content: string;
    onSave: (value: string) => void;
  }) => {
    const isEditing = editingSection === sectionKey;
    const [localValue, setLocalValue] = useState(content);

    // Sync localValue when content changes (but not when editing)
    useEffect(() => {
      if (!isEditing) {
        setLocalValue(content);
      }
    }, [content, isEditing]);

    const handleSaveLocal = () => {
      onSave(localValue);
      handleSave(sectionKey, localValue);
    };

    const handleCancelLocal = () => {
      setLocalValue(content);
      handleCancel();
    };

    const handleStartEdit = () => {
      setEditingSection(sectionKey);
      setLocalValue(content);
    };

    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {title}
          </h3>
        </div>
        <div 
          className={cn(
            "bg-gray-50 dark:bg-[#252931] rounded-lg p-4 md:p-5 shadow-sm dark:shadow-md dark:shadow-black/20",
            !isEditing && isEditMode && "cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2d3139] transition-colors"
          )}
          onClick={() => !isEditing && isEditMode && handleStartEdit()}
        >
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                className="bg-white dark:bg-[#1a1d24] border-gray-200 dark:border-[#3a3f4b] text-sm md:text-base text-gray-700 dark:text-gray-300 min-h-[100px] resize-none"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelLocal}
                  className="h-8"
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveLocal}
                  className="h-8 bg-blue-600 hover:bg-blue-700"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {content || <span className="text-gray-400 italic">{isEditMode ? "Click to add content" : "No content yet"}</span>}
            </p>
          )}
        </div>
      </div>
    );
  };


  // ...

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-white dark:bg-[#1a1d24] overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400">Loading contact...</div>
        </div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#1a1d24] flex items-center justify-center">
        <ErrorFallback
          error={error ? new Error(error) : new Error("Contact not found")}
          reset={() => window.location.reload()}
          title="Contact unavailable"
          message={error || "This contact doesn't exist or you don't have access to it."}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-[#1a1d24] overflow-hidden">
      <Toaster position="top-center" />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[850px] mx-auto w-full px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between pt-4 pb-4 md:pt-6 md:pb-6">
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-gray-100 dark:bg-[#252931] hover:bg-gray-200 dark:hover:bg-[#2d3139] transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </Button>
            </Link>
            <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white/90">Profile</h1>
            <div className="flex items-center gap-2">
              <Link href={`/briefing/${id}`}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-purple-100 hover:bg-purple-200"
                  title="Pre-meeting brief"
                >
                  <Sparkles className="h-5 w-5 text-purple-600" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                  className={cn(
                    "h-10 w-10 rounded-full transition-colors",
                    isEditMode ? "bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50" : "bg-gray-100 dark:bg-[#252931] hover:bg-gray-200 dark:hover:bg-[#2d3139]"
                  )}
                onClick={() => setIsEditMode(!isEditMode)}
              >
                <Edit className={cn("h-5 w-5", isEditMode ? "text-yellow-600" : "text-gray-600 dark:text-gray-400")} />
              </Button>
            </div>
          </div>

          {/* Profile Section - Card Container */}
          <div className="bg-gray-50 dark:bg-[#252931] rounded-2xl p-8 mb-8 md:mb-10 border border-gray-100 dark:border-[#3a3f4b] shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-md dark:shadow-black/20">
            {/* Avatar and Name/Title - Centered Header */}
            <div className="flex flex-col items-center text-center mb-6">
              {/* Avatar with upload functionality */}
              <div className="relative mb-4 group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                  className="hidden"
                  id="avatar-upload"
                  disabled={uploadingAvatar}
                />
                <label
                  htmlFor="avatar-upload"
                  className={cn(
                    "cursor-pointer block relative",
                    uploadingAvatar && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Avatar className="h-24 w-24 md:h-28 md:w-28">
                    <AvatarImage src={contact.avatar} />
                    <AvatarFallback className={cn("bg-gradient-to-br text-white text-2xl md:text-3xl font-semibold", getGradient(contact.name))}>
                      {contact.initials}
                    </AvatarFallback>
                  </Avatar>
                  {/* Camera icon overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Camera className="h-6 w-6 md:h-7 md:w-7 text-white" />
                  </div>
                </label>
                {uploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                  </div>
                )}
              </div>

              {/* Name and Title */}
              <div className="mb-6">
                {editingName ? (
                  <div className="space-y-3">
                    <div className="flex gap-2 justify-center">
                      <Input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First name"
                        className="h-10 text-base text-center"
                        autoFocus
                      />
                      <Input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last name (optional)"
                        className="h-10 text-base text-center"
                      />
                    </div>
                    <div className="flex gap-2 justify-center">
                      <Button
                        size="sm"
                        onClick={handleSaveName}
                        className="h-8 bg-blue-600 hover:bg-blue-700"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelName}
                        className="h-8"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 
                      className={cn(
                        "text-2xl md:text-3xl font-bold text-gray-900 dark:text-white/90 mb-2",
                        isEditMode && "cursor-pointer hover:text-gray-700 dark:hover:text-white transition-colors"
                      )}
                      onClick={() => isEditMode && setEditingName(true)}
                    >
                      {contact.name}
                    </h2>
                  </>
                )}
                
                {/* Email and Phone Section */}
                <div className="mt-3">
                  {editingContact ? (
                    <div className="space-y-3">
                      <div className="flex flex-col gap-2">
                        <Input
                          type="email"
                          value={emailValue}
                          onChange={(e) => setEmailValue(e.target.value)}
                          placeholder="Email address"
                          className="h-9 text-sm text-center"
                          autoFocus
                        />
                        <Input
                          type="tel"
                          value={phoneValue}
                          onChange={(e) => setPhoneValue(e.target.value)}
                          placeholder="Phone number"
                          className="h-9 text-sm text-center"
                        />
                      </div>
                      <div className="flex gap-2 justify-center">
                        <Button
                          size="sm"
                          onClick={handleSaveContact}
                          className="h-8 bg-blue-600 hover:bg-blue-700"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancelContact}
                          className="h-8"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {contact.email && (
                        <div className="flex items-center justify-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-gray-400" />
                          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                            {contact.email}
                          </p>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center justify-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                            {contact.phone}
                          </p>
                        </div>
                      )}
                      {isEditMode && !contact.email && !contact.phone && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingContact(true)}
                          className="h-7 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2d3139] mt-1"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Contact Info
                        </Button>
                      )}
                      {isEditMode && (contact.email || contact.phone) && (
                        <button
                          onClick={() => setEditingContact(true)}
                          className="mt-1 text-xs text-gray-400 hover:text-gray-300 transition-colors"
                        >
                          Click to edit
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Birthday Section */}
                <div className="mt-2 flex items-center justify-center gap-2">
                  {editingBirthday ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={birthdayValue}
                        onChange={(e) => setBirthdayValue(e.target.value)}
                        className="h-8 text-sm"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSaveBirthday()}
                        className="h-8 bg-blue-600 hover:bg-blue-700"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelBirthday}
                        className="h-8"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                      {birthdayValue && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSaveBirthday("")}
                          className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      {contact.birthday && contact.birthday.trim() !== '' && (() => {
                        try {
                          // Parse date string manually to avoid timezone issues
                          const parts = contact.birthday.split('-');
                          if (parts.length === 3) {
                            const year = parseInt(parts[0], 10);
                            const month = parseInt(parts[1], 10) - 1; // 0-indexed
                            const day = parseInt(parts[2], 10);
                            const birthdayDate = new Date(year, month, day);
                            
                            if (!isNaN(birthdayDate.getTime())) {
                              return (
                                <div 
                                  className={cn(
                                    "flex items-center gap-2",
                                    isEditMode && "cursor-pointer hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                                  )}
                                  onClick={() => isEditMode && setEditingBirthday(true)}
                                >
                                  <Cake className="h-4 w-4 text-orange-500" />
                                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                                    Birthday: {birthdayDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                  </p>
                                </div>
                              );
                            }
                          }
                          // Fallback: try direct date parsing
                          const birthdayDate = new Date(contact.birthday);
                          if (!isNaN(birthdayDate.getTime())) {
                            return (
                              <div 
                                className={cn(
                                  "flex items-center gap-2",
                                  isEditMode && "cursor-pointer hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                                )}
                                onClick={() => isEditMode && setEditingBirthday(true)}
                              >
                                <Cake className="h-4 w-4 text-orange-500" />
                                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                                  Birthday: {birthdayDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                </p>
                              </div>
                            );
                          }
                        } catch (e) {
                          console.error('Error formatting birthday:', e, contact.birthday);
                        }
                        return null;
                      })()}
                      {(!contact.birthday || contact.birthday.trim() === '') && isEditMode && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setBirthdayValue("");
                            setEditingBirthday(true);
                          }}
                          className="h-7 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        >
                          <Cake className="h-3 w-3 mr-1" />
                          Add Birthday
                        </Button>
                      )}
                    </>
                  )}
                </div>

                {/* Next Contact Date - Always show below birthday */}
                {!editingBirthday && (
                  <div className="mt-3 flex items-center justify-center">
                    {editingNextContact ? (
                      <div className="w-full max-w-md space-y-3 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                            Next Contact Date
                          </label>
                        </div>
                        <Input
                          type="date"
                          value={nextContactDate}
                          onChange={(e) => setNextContactDate(e.target.value)}
                          className="bg-white dark:bg-[#1a1d24]"
                          autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setNextContactDate(contact?.nextContactDate || "");
                              setEditingNextContact(false);
                            }}
                            className="h-8"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveNextContact}
                            className="h-8 bg-blue-600 hover:bg-blue-700"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : nextContactDate ? (
                      <div 
                        className={cn(
                          "mt-3 text-sm md:text-base",
                          isEditMode && "cursor-pointer hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                        )}
                        onClick={() => isEditMode && setEditingNextContact(true)}
                      >
                        <p className={cn(
                          (() => {
                            const urgency = getUrgencyInfo();
                            if (urgency && (urgency.status === 'overdue' || urgency.status === 'today' || urgency.status === 'urgent')) {
                              return urgency.color;
                            }
                            return "text-gray-600 dark:text-gray-400";
                          })()
                        )}>
                          Reach out to {contact.firstName} on {new Date(nextContactDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          {getUrgencyInfo() && ` (${getUrgencyInfo()?.label})`}
                        </p>
                      </div>
                    ) : (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNextContact(true);
                          }}
                          className="text-sm md:text-base font-semibold underline transition-colors text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer"
                        >
                          Don't lose touch. Set a reminder now!
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tab Navigation with Content Grouping */}
              <div className="w-full max-w-2xl mx-auto mt-6 bg-gray-50 dark:bg-[#252931] rounded-lg border border-gray-200 dark:border-[#3a3f4b] p-4 md:p-6 shadow-sm dark:shadow-md dark:shadow-black/20">
                {/* Tabs Container */}
                <div className="border-b border-gray-200 dark:border-[#3a3f4b] mb-6 -mx-4 md:-mx-6 px-4 md:px-6">
                  <div className="flex justify-center gap-6 md:gap-8 relative">
                    {tabs.map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                          "px-3 md:px-4 pb-3 pt-1 text-sm md:text-base font-medium transition-colors relative",
                          activeTab === tab
                            ? "text-gray-900 dark:text-white/90"
                            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        )}
                      >
                        {tab}
                        {activeTab === tab && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                        )}
                      </button>
                    ))}
                    
                    {/* AI Suggestions Badge */}
                    {filteredMissingInfo.length > 0 && aiSuggestionsEnabled && (activeTab === "Profession" || activeTab === "Family") && (
                      <button
                        onClick={() => setShowSuggestionsDrawer(true)}
                        className="absolute right-0 top-1 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-xs font-medium text-blue-700 dark:text-blue-300"
                      >
                        <Sparkles className="h-3 w-3" />
                        {filteredMissingInfo.length} {filteredMissingInfo.length === 1 ? 'suggestion' : 'suggestions'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Tab Content - Visually connected */}
                <div className="min-h-[200px]">
                {activeTab === "Interests" ? (
                  /* Interests List */
                  <div className="space-y-6">
                    {/* Hobbies Section */}
                    <div className="space-y-3">
                      <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-300">Hobbies</h3>
                      {editingHobbies ? (
                        <div className="space-y-3">
                          <Textarea
                            value={hobbies}
                            onChange={(e) => setHobbies(e.target.value)}
                            className="bg-white dark:bg-[#1a1d24] border-gray-200 dark:border-[#3a3f4b] text-sm md:text-base text-gray-700 dark:text-gray-300 min-h-[100px] resize-none"
                            placeholder="Describe their hobbies and activities..."
                            autoFocus
                          />
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCancelHobbies}
                              className="h-8"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleSaveHobbies}
                              className="h-8 bg-blue-600 hover:bg-blue-700"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className={cn(
                            "bg-gray-50 dark:bg-[#252931] rounded-lg p-4 md:p-5 shadow-sm dark:shadow-md dark:shadow-black/20",
                            isEditMode && "cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2d3139] transition-colors"
                          )}
                          onClick={() => isEditMode && setEditingHobbies(true)}
                        >
                          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {hobbies || <span className="text-gray-400 italic">{isEditMode ? "Click to add hobbies" : "No hobbies listed yet"}</span>}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Interests Tags Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-300">Interest Tags</h3>
                      </div>
                    
                    {editingInterests ? (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2 justify-center">
                          {interests.map((interest) => (
                            <Badge
                              key={interest}
                              className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-0 text-xs md:text-sm font-normal px-2 py-0.5 md:px-2.5 md:py-1 h-auto rounded flex items-center gap-1"
                            >
                              {interest}
                              <button
                                onClick={() => handleRemoveInterest(interest)}
                                className="ml-1 hover:text-purple-900 dark:hover:text-purple-100"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={newInterestInput}
                            onChange={(e) => setNewInterestInput(e.target.value)}
                            onKeyPress={handleInterestKeyPress}
                            placeholder="Add an interest..."
                            className="flex-1 h-8 text-sm"
                          />
                          <Button
                            size="sm"
                            onClick={handleAddInterest}
                            className="h-8 bg-blue-600 hover:bg-blue-700"
                            disabled={!newInterestInput.trim()}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelInterests}
                            className="h-8"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveInterests}
                            className="h-8 bg-blue-600 hover:bg-blue-700"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className={cn(
                          "flex flex-wrap gap-3 justify-center",
                          isEditMode && "cursor-pointer"
                        )}
                        onClick={() => isEditMode && setEditingInterests(true)}
                      >
                        {interests.length > 0 ? (
                          interests.map((interest) => (
                            <Badge
                              key={interest}
                              className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-0 text-xs md:text-sm font-normal px-2 py-1.5 h-auto rounded transition-colors hover:bg-purple-100 dark:hover:bg-purple-900/30"
                            >
                              {interest}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                            {isEditMode ? "Click to add interests" : "No interests added yet"}
                          </p>
                        )}
                      </div>
                    )}
                    </div>
                  </div>
                ) : activeTab === "Family" ? (
                  /* Family Members List */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-300">Family Members</h3>
                      {editingFamilyMember === null && (
                        isEditMode && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setNewFamilyMemberName("");
                              setNewFamilyMemberRelationship("");
                              setEditingFamilyMember(-1); // -1 means adding new
                            }}
                            className="h-7 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2d3139]"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Family Member
                          </Button>
                        )
                      )}
                    </div>
                    
                    {/* Add/Edit Family Member Form */}
                    {(editingFamilyMember !== null) && (
                      <div className="bg-gray-50 dark:bg-[#252931] rounded-lg p-4 border border-gray-200 dark:border-[#3a3f4b]">
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              placeholder="Name"
                              value={newFamilyMemberName}
                              onChange={(e) => setNewFamilyMemberName(e.target.value)}
                              className="h-8 text-sm"
                              autoFocus
                            />
                            <Input
                              placeholder="Relationship (e.g., child, spouse)"
                              value={newFamilyMemberRelationship}
                              onChange={(e) => setNewFamilyMemberRelationship(e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingFamilyMember(null);
                                setNewFamilyMemberName("");
                                setNewFamilyMemberRelationship("");
                              }}
                              className="h-8"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                if (editingFamilyMember === -1) {
                                  handleAddFamilyMember();
                                } else {
                                  handleUpdateFamilyMember();
                                }
                              }}
                              className="h-8 bg-blue-600 hover:bg-blue-700"
                              disabled={!newFamilyMemberName.trim() || !newFamilyMemberRelationship.trim()}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              {editingFamilyMember === -1 ? "Add" : "Update"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Family Members List */}
                    {familyMembers.length > 0 ? (
                      <div className="space-y-2">
                        {familyMembers.map((member, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 dark:bg-[#252931] rounded-lg p-4 border border-gray-200 dark:border-[#3a3f4b] flex items-center justify-between shadow-sm dark:shadow-md dark:shadow-black/20"
                          >
                            <div>
                              <span className="font-medium text-gray-900 dark:text-gray-300">{member.name}</span>
                              <span className="text-gray-500 dark:text-gray-400 ml-2">({member.relationship})</span>
                            </div>
                            {isEditMode && (
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-gray-400 hover:text-gray-600 dark:text-gray-400"
                                  onClick={() => handleEditFamilyMember(index)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-red-400 hover:text-red-600"
                                  onClick={() => handleRemoveFamilyMember(index)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-sm text-gray-400 dark:text-gray-500 italic">No family members added yet</p>
                      </div>
                    )}

                    {/* Save Button */}
                    {familyMembers.length > 0 && (
                      <div className="flex justify-end pt-2">
                        <Button
                          size="sm"
                          onClick={handleSaveFamilyMembers}
                          className="h-8 bg-blue-600 hover:bg-blue-700"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Save Family Members
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Synopsis for Profession and Family tabs */
                  <div className="space-y-4">
                    <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-300 text-center">
                      {activeTab === "Profession" ? "Professional Background" : "Family Notes"}
                    </h3>
                    {editingSynopsis ? (
                      <div className="space-y-3">
                        <Textarea
                          value={localSynopsis}
                          onChange={(e) => setLocalSynopsis(e.target.value)}
                          className="bg-white dark:bg-[#1a1d24] border-gray-200 dark:border-[#3a3f4b] text-sm md:text-base text-gray-700 dark:text-gray-300 min-h-[100px] resize-none"
                          placeholder={activeTab === "Profession" 
                            ? "What do they do? What's interesting about their work?"
                            : "Notes about their family background, dynamics, or important details..."}
                          autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelSynopsis}
                            className="h-8"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveSynopsis}
                            className="h-8 bg-blue-600 hover:bg-blue-700"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className={cn(
                          "relative text-center",
                          isEditMode && "cursor-pointer"
                        )}
                        onClick={() => {
                          if (isEditMode) {
                            setLocalSynopsis(getCurrentSynopsis());
                            setEditingSynopsis(true);
                          }
                        }}
                      >
                        <p className={cn(
                          "text-base md:text-lg text-gray-700 dark:text-gray-300 leading-relaxed",
                          isEditMode && "hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        )}>
                          {getCurrentSynopsis() || (
                            <span className="text-gray-400 dark:text-gray-500 italic">
                              {isEditMode ? "Click to add details" : "No details yet"}
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                </div>
              </div>
            </div>

            {/* Most Recent Interaction */}
            <div className="flex justify-center mb-6">
              <div className="w-full max-w-2xl">
                <div className="flex items-center justify-between mb-4 mt-6">
                  <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-300">Most Recent Interaction</h3>
                </div>
                <div className="bg-white dark:bg-[#252931] rounded-lg p-4 border border-gray-200 dark:border-[#3a3f4b] transition-all duration-200 hover:bg-gray-50 dark:hover:bg-[#2d3139] hover:shadow-sm dark:shadow-md dark:shadow-black/20 cursor-default">
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className="rounded-full bg-blue-100 dark:bg-blue-500/10 p-2 shrink-0">
                      <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-300">
                          {contact.mostRecentInteraction.type}
                        </span>
                        <span className="text-xs md:text-sm text-gray-400 dark:text-gray-500">•</span>
                        <span className="text-xs md:text-sm text-gray-400 dark:text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {contact.mostRecentInteraction.date}
                        </span>
                      </div>
                      <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                        {contact.mostRecentInteraction.summary}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Centered, prominent */}
            <div className="flex justify-center mb-6">
              <div className="flex gap-3 md:gap-4 w-full max-w-2xl">
                {contact.phone && (
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-12 md:h-14 rounded-lg transition-colors shadow-sm hover:shadow-md border-0"
                    onClick={() => window.location.href = `tel:${contact.phone}`}
                  >
                    <Phone className="h-5 w-5 mr-2" />
                    Call
                  </Button>
                )}
                {contact.email && (
                  <Button
                    variant="outline"
                    className="flex-1 bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-700 border border-gray-200 h-12 md:h-14 rounded-lg transition-all duration-200"
                    onClick={() => window.location.href = `mailto:${contact.email}`}
                  >
                    <Mail className="h-5 w-5 mr-2" />
                    Email
                  </Button>
                )}
                {contact.phone && (
                  <Button
                    variant="outline"
                    className="flex-1 bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-700 border border-gray-200 h-12 md:h-14 rounded-lg transition-all duration-200"
                    onClick={() => window.location.href = `sms:${contact.phone}`}
                  >
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Text
                  </Button>
                )}
              </div>
            </div>

            {/* Archive Button */}
            {isEditMode && (
              <div className="flex justify-center mb-6">
                <div className="w-full max-w-2xl">
                  <ArchiveContactDialog
                    contactId={id}
                    contactName={getFullName(contact.firstName, contact.lastName)}
                    isArchived={contact.archived || false}
                    onSuccess={() => {
                      // Refresh the page or redirect to home
                      router.push("/");
                    }}
                  />
                </div>
              </div>
            )}

            {/* Story Completeness Indicator */}
            {storyCompleteness < 100 && (
              <div className="flex justify-center mb-6">
                <div className="w-full max-w-2xl">
                  <StoryCompletenessIndicator
                    completeness={storyCompleteness}
                    missingFields={missingStoryFields}
                    contactName={getFullName(contact.firstName, contact.lastName)}
                  />
                </div>
              </div>
            )}

            {/* Tags - Centered */}
            <div className="flex justify-center">
              <div className="w-full max-w-2xl">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="text-xs md:text-sm font-medium text-gray-400 dark:text-gray-400 uppercase tracking-wide">
                    Tags
                  </span>
                </div>
                {editingTags ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2 justify-center">
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 border-0 text-xs md:text-sm font-normal px-2 py-0.5 md:px-2.5 md:py-1 h-auto rounded flex items-center gap-1"
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 hover:text-blue-900"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyPress={handleTagKeyPress}
                        placeholder="Add a tag..."
                        className="flex-1 h-8 text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={handleAddTag}
                        className="h-8 bg-blue-600 hover:bg-blue-700"
                        disabled={!newTagInput.trim()}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelTags}
                        className="h-8"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveTags}
                        className="h-8 bg-blue-600 hover:bg-blue-700"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className={cn(
                      "flex flex-wrap gap-3 justify-center",
                      isEditMode && "cursor-pointer"
                    )}
                    onClick={() => isEditMode && setEditingTags(true)}
                  >
                    {tags.length > 0 ? (
                      tags.map((tag) => (
                        <Badge
                          key={tag}
                          className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-0 text-xs md:text-sm font-normal px-2 py-1.5 h-auto rounded transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/30"
                        >
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic">
                        {isEditMode ? "Click to add tags" : "No tags yet"}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Original Content Sections */}
          <div className="pb-6 md:pb-12 border-t border-gray-200 dark:border-[#3a3f4b] pt-6 md:pt-8 mt-8 md:mt-10">
            {/* Story Section */}
            <div className="space-y-6 md:space-y-8 mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-black dark:text-white/90 mb-6">Story</h2>
              {/* Where We Met */}
              <EditableSection
                sectionKey="whereWeMet"
                title="Where We Met"
                content={story.whereWeMet}
                onSave={(value) => setStory({ ...story, whereWeMet: value })}
              />

              {/* Divider */}
              <div className="border-b border-gray-100 my-6 md:my-8"></div>

              {/* Why Stay in Contact */}
              <EditableSection
                sectionKey="whyStayInContact"
                title="Why Stay in Contact"
                content={story.whyStayInContact}
                onSave={(value) => setStory({ ...story, whyStayInContact: value })}
              />

              {/* Divider */}
              <div className="border-b border-gray-100 my-6 md:my-8"></div>

              {/* What's Important to Them */}
              <EditableSection
                sectionKey="whatsImportant"
                title="What's Important to Them"
                content={story.whatsImportant}
                onSave={(value) => setStory({ ...story, whatsImportant: value })}
              />
            </div>

            {/* Notes Section */}
            <div className="space-y-6 md:space-y-8 mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-black dark:text-white/90 mb-6">Notes</h2>
              <EditableSection
                sectionKey="notes"
                title="Notes"
                content={notes}
                onSave={(value) => setNotes(value)}
              />
            </div>

            {/* Connections Section */}
            <div className="space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-black dark:text-white/90 mb-6">Connections</h2>
              {contact.connections && contact.connections.length > 0 ? (
                contact.connections.map((connection: any, index: number) => (
                  <div
                    key={index}
                    className="bg-gray-50 dark:bg-[#252931] rounded-lg p-4 md:p-5 shadow-sm dark:shadow-md dark:shadow-black/20"
                  >
                    <p className="text-sm md:text-base font-medium text-gray-900 dark:text-gray-300 mb-1">
                      {connection.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {connection.relationship}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">No connections listed</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Suggestions Slide-Out Drawer */}
      {showSuggestionsDrawer && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 animate-fadeIn"
            onClick={() => setShowSuggestionsDrawer(false)}
          />
          
          {/* Drawer */}
          <div className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-white dark:bg-[#1a1d24] shadow-2xl z-50 overflow-y-auto animate-slideInRight">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-[#1a1d24] border-b border-gray-200 dark:border-[#3a3f4b] p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Complete Profile
                </h3>
              </div>
              <button
                onClick={() => setShowSuggestionsDrawer(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[#252931] rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-4 space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {filteredMissingInfo.length} suggestion{filteredMissingInfo.length !== 1 ? 's' : ''} to help you remember {contact.firstName} better
              </p>
              
              {filteredMissingInfo.map((info, index) => {
                const suggestionKey = `${id}_${info.type}_${info.prompt.slice(0, 50)}`;
                return (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-[#252931] rounded-lg border border-gray-200 dark:border-[#3a3f4b]">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-gray-200 font-medium mb-2">
                          {info.prompt}
                        </p>
                        {info.suggestion && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                            Example: {info.suggestion}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleIgnoreSuggestion(info.type, info.prompt)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-[#1a1d24] rounded transition-colors shrink-0"
                        title="Ignore this suggestion"
                      >
                        <X className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setShowSuggestionsDrawer(false);
                        if (!editingSynopsis) {
                          setLocalSynopsis(getCurrentSynopsis());
                          setEditingSynopsis(true);
                        }
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Edit className="h-3 w-3 mr-1.5" />
                      Add This Information
                    </Button>
                  </div>
                );
              })}
            </div>
            
            {/* Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-[#1a1d24] border-t border-gray-200 dark:border-[#3a3f4b] p-4">
              <Button
                variant="outline"
                onClick={handleToggleAiSuggestions}
                className="w-full"
              >
                <EyeOff className="h-4 w-4 mr-2" />
                Turn Off Suggestions
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Image Crop Modal */}
      {imageToCrop && (
        <ImageCropModal
          imageSrc={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}

