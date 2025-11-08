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
} from "lucide-react";
import { use, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ImageCropModal } from "@/components/image-crop-modal";
import { ArchiveContactDialog } from "@/components/archive-contact-dialog";
import { StoryCompletenessIndicator } from "@/components/story-completeness-indicator";

// Helper function to get initials from first and last name
const getInitials = (firstName: string, lastName: string | null): string => {
  if (!firstName) return "";
  const firstInitial = firstName.trim()[0]?.toUpperCase() || "";
  const lastInitial = lastName?.trim()[0]?.toUpperCase() || "";
  return (firstInitial + lastInitial) || firstName.substring(0, 2).toUpperCase();
};

// Helper function to get full name
const getFullName = (firstName: string, lastName: string | null): string => {
  if (!firstName) return "";
  return lastName ? `${firstName} ${lastName}`.trim() : firstName.trim();
};

// Helper function to get gradient color based on name hash
const getGradient = (name: string): string => {
  const gradients = [
    "from-purple-500 to-blue-500",
    "from-green-500 to-blue-500",
    "from-orange-500 to-yellow-500",
    "from-cyan-500 to-green-500",
    "from-pink-500 to-red-500",
    "from-indigo-500 to-purple-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
};

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
        const { data: person, error: personError } = await supabase
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
        const { data: personTags, error: tagsError } = await supabase
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
        const { error: updateError } = await supabase
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
        alert(err instanceof Error ? err.message : "Failed to save notes");
      }
    } else if (sectionKey === "whereWeMet" && value !== undefined) {
      try {
        const supabase = createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push("/login?redirect=/contacts/" + id);
          return;
        }
        const { error: updateError } = await supabase
          .from("persons")
          .update({ where_met: value.trim() || null })
          .eq("id", id)
          .eq("user_id", user.id);
        if (updateError) throw updateError;
        setStory({ ...story, whereWeMet: value.trim() });
      } catch (err) {
        console.error("Error saving:", err);
        alert(err instanceof Error ? err.message : "Failed to save");
      }
    } else if (sectionKey === "whyStayInContact" && value !== undefined) {
      try {
        const supabase = createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push("/login?redirect=/contacts/" + id);
          return;
        }
        const { error: updateError } = await supabase
          .from("persons")
          .update({ why_stay_in_contact: value.trim() || null })
          .eq("id", id)
          .eq("user_id", user.id);
        if (updateError) throw updateError;
        setStory({ ...story, whyStayInContact: value.trim() });
      } catch (err) {
        console.error("Error saving:", err);
        alert(err instanceof Error ? err.message : "Failed to save");
      }
    } else if (sectionKey === "whatsImportant" && value !== undefined) {
      try {
        const supabase = createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push("/login?redirect=/contacts/" + id);
          return;
        }
        const { error: updateError } = await supabase
          .from("persons")
          .update({ most_important_to_them: value.trim() || null })
          .eq("id", id)
          .eq("user_id", user.id);
        if (updateError) throw updateError;
        setStory({ ...story, whatsImportant: value.trim() });
      } catch (err) {
        console.error("Error saving:", err);
        alert(err instanceof Error ? err.message : "Failed to save");
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

  const handleSaveSynopsis = () => {
    const setter = getCurrentSynopsisSetter();
    setter(localSynopsis);
    setEditingSynopsis(false);
    // Here you would typically save to your backend/database
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

  const handleSaveTags = () => {
    setEditingTags(false);
    setNewTagInput("");
    // Here you would typically save to your backend/database
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

  const handleSaveInterests = () => {
    setEditingInterests(false);
    setNewInterestInput("");
    // Here you would typically save to your backend/database
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
      } else if (rawValue instanceof Date) {
        // If it's a Date object, format as YYYY-MM-DD
        if (!isNaN(rawValue.getTime())) {
          const year = rawValue.getFullYear();
          const month = String(rawValue.getMonth() + 1).padStart(2, '0');
          const day = String(rawValue.getDate()).padStart(2, '0');
          birthdayToSave = `${year}-${month}-${day}`;
        } else {
          birthdayToSave = null;
        }
      } else {
        // For any other type, set to null
        birthdayToSave = null;
      }

      // Update birthday in database and return the updated row
      const { data: updatedData, error: updateError } = await supabase
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
    } catch (err) {
      console.error("Error saving birthday:", err);
      alert(err instanceof Error ? err.message : "Failed to save birthday");
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
        alert("First name is required");
        return;
      }

      // Update name in database
      const { error: updateError } = await supabase
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
    } catch (err) {
      console.error("Error saving name:", err);
      alert(err instanceof Error ? err.message : "Failed to save name");
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
      const { error: updateError } = await supabase
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
    } catch (err) {
      console.error("Error saving family members:", err);
      alert(err instanceof Error ? err.message : "Failed to save family members");
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
      alert('Please select an image file');
      event.target.value = '';
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
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
          const fileIndex = urlParts.findIndex(part => part === 'avatars');
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

      const { error: uploadError } = await supabase
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
      const { data: { publicUrl } } = supabase
        .storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update photo_url in database
      const { data: updatedData, error: updateError } = await supabase
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
    } catch (err) {
      console.error("Error uploading avatar:", err);
      alert(err instanceof Error ? err.message : "Failed to upload avatar");
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

    // Only detect when not editing, contact exists, and AI suggestions are enabled
    if (!editingSynopsis && contact && aiSuggestionsEnabled) {
      detectMissingInfo();
    } else if (!aiSuggestionsEnabled) {
      // Clear suggestions if disabled
      setMissingInfo([]);
    }
  }, [activeTab, professionSynopsis, familySynopsis, interestsSynopsis, editingSynopsis, contact?.name, aiSuggestionsEnabled]);

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
          <h3 className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wider">
            {title}
          </h3>
          {!isEditing && isEditMode && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={handleStartEdit}
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 md:p-5">
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                className="bg-white dark:bg-gray-800 border-gray-200 text-sm md:text-base text-gray-700 min-h-[100px] resize-none"
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
            <p className="text-sm md:text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
              {content || <span className="text-gray-400 italic">Click edit to add content</span>}
            </p>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-white dark:bg-gray-900 overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400">Loading contact...</div>
        </div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="flex flex-col h-screen bg-white dark:bg-gray-900 overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Contact not found</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">{error || "This contact doesn't exist or you don't have access to it."}</p>
            <Link href="/">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Contacts
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[850px] mx-auto w-full px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between pt-4 pb-4 md:pt-6 md:pb-6">
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </Button>
            </Link>
            <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Profile</h1>
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
                    isEditMode ? "bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50" : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                  )}
                onClick={() => setIsEditMode(!isEditMode)}
              >
                <Edit className={cn("h-5 w-5", isEditMode ? "text-yellow-600" : "text-gray-600 dark:text-gray-400")} />
              </Button>
            </div>
          </div>

          {/* Profile Section - Card Container */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-8 mb-8 md:mb-10 border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
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
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {contact.name}
                    </h2>
                    {isEditMode && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 mx-auto text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        onClick={() => setEditingName(true)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                  </>
                )}
                <p className="text-base md:text-lg text-gray-500 mt-2">
                  {contact.title}
                </p>
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
                                <div className="flex items-center gap-2">
                                  <Cake className="h-4 w-4 text-orange-500" />
                                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                                    Birthday: {birthdayDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                  </p>
                                  {isEditMode && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                      onClick={() => setEditingBirthday(true)}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              );
                            }
                          }
                          // Fallback: try direct date parsing
                          const birthdayDate = new Date(contact.birthday);
                          if (!isNaN(birthdayDate.getTime())) {
                            return (
                              <div className="flex items-center gap-2">
                                <Cake className="h-4 w-4 text-orange-500" />
                                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                                  Birthday: {birthdayDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                </p>
                                {isEditMode && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                    onClick={() => setEditingBirthday(true)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                )}
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
              </div>

              {/* Tab Navigation - Centered below name */}
              <div className="w-full max-w-lg border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-center gap-6 md:gap-8">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "px-3 md:px-4 pb-3 pt-1 text-sm md:text-base font-medium transition-colors relative",
                        activeTab === tab
                          ? "text-gray-900 dark:text-white"
                          : "text-gray-500 hover:text-gray-700 dark:text-gray-300"
                      )}
                    >
                      {tab}
                      {activeTab === tab && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Synopsis - Centered, readable width */}
            <div className="flex justify-center mb-6">
              <div className="w-full max-w-2xl">
                {activeTab === "Family" ? (
                  /* Family Members List */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm md:text-base font-semibold text-gray-900">Family Members</h3>
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
                            className="h-7 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Family Member
                          </Button>
                        )
                      )}
                    </div>
                    
                    {/* Add/Edit Family Member Form */}
                    {(editingFamilyMember !== null) && (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
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
                            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 flex items-center justify-between"
                          >
                            <div>
                              <span className="font-medium text-gray-900">{member.name}</span>
                              <span className="text-gray-500 ml-2">({member.relationship})</span>
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
                      <div className="text-center py-8 text-gray-400">
                        <p className="text-sm">No family members added yet</p>
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
                  /* Synopsis for Profession and Interests tabs */
                  <>
                    {editingSynopsis ? (
                      <div className="space-y-3">
                        <Textarea
                          value={localSynopsis}
                          onChange={(e) => setLocalSynopsis(e.target.value)}
                          className="bg-white dark:bg-gray-800 border-gray-200 text-sm md:text-base text-gray-700 min-h-[100px] resize-none"
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
                      <div className="relative group text-center">
                        <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                          {getCurrentSynopsis()}
                        </p>
                        {isEditMode && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute -top-2 -right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            onClick={() => {
                              setLocalSynopsis(getCurrentSynopsis());
                              setEditingSynopsis(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* AI Prompt for Missing Information */}
            {!editingSynopsis && filteredMissingInfo.length > 0 && (
              <div className="flex justify-center mb-6">
                <div className="w-full max-w-2xl">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg p-4 md:p-5">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-blue-100 p-2 shrink-0 mt-0.5">
                        <Sparkles className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm md:text-base font-semibold text-blue-900">
                            Complete Your Profile
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleToggleAiSuggestions}
                            className="h-7 text-xs text-blue-700 hover:text-blue-900 hover:bg-blue-100"
                            title="Toggle AI Suggestions"
                          >
                            {aiSuggestionsEnabled ? (
                              <>
                                <EyeOff className="h-3 w-3 mr-1" />
                                Hide
                              </>
                            ) : (
                              <>
                                <Eye className="h-3 w-3 mr-1" />
                                Show
                              </>
                            )}
                          </Button>
                        </div>
                        {filteredMissingInfo.map((info, index) => {
                          const suggestionKey = `${id}_${info.type}_${info.prompt.slice(0, 50)}`;
                          return (
                            <div key={index} className="mb-3 last:mb-0 p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-100 dark:border-blue-800">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1">
                                  <p className="text-sm md:text-base text-blue-800 mb-2">
                                    {info.prompt}
                                  </p>
                                  {info.suggestion && (
                                    <p className="text-xs md:text-sm text-blue-600 italic mb-2">
                                      Example: {info.suggestion}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleIgnoreSuggestion(info.type, info.prompt)}
                                  className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100 shrink-0"
                                  title="Ignore this suggestion"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setLocalSynopsis(getCurrentSynopsis());
                                  setEditingSynopsis(true);
                                }}
                                className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm"
                              >
                                <Edit className="h-3 w-3 mr-1.5" />
                                Add This Information
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* AI Suggestions Toggle (shown when suggestions are disabled or no suggestions) */}
            {!editingSynopsis && filteredMissingInfo.length === 0 && aiSuggestionsEnabled && (
              <div className="flex justify-center mb-6">
                <div className="w-full max-w-2xl">
                  <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 rounded-lg p-3 md:p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">AI Suggestions are enabled</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleToggleAiSuggestions}
                        className="h-7 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      >
                        <EyeOff className="h-3 w-3 mr-1" />
                        Disable
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Show enable button when AI suggestions are disabled */}
            {!editingSynopsis && !aiSuggestionsEnabled && (
              <div className="flex justify-center mb-6">
                <div className="w-full max-w-2xl">
                  <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 rounded-lg p-3 md:p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">AI Suggestions are disabled</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleToggleAiSuggestions}
                        className="h-7 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Enable
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Most Recent Interaction */}
            <div className="flex justify-center mb-6">
              <div className="w-full max-w-2xl">
                <div className="flex items-center justify-between mb-4 mt-6">
                  <h3 className="text-sm md:text-base font-semibold text-gray-900">Most Recent Interaction</h3>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 transition-all duration-200 hover:bg-gray-50 hover:shadow-sm cursor-default">
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className="rounded-full bg-blue-100 p-2 shrink-0">
                      <Mail className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm md:text-base font-semibold text-gray-900">
                          {contact.mostRecentInteraction.type}
                        </span>
                        <span className="text-xs md:text-sm text-gray-400">•</span>
                        <span className="text-xs md:text-sm text-gray-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {contact.mostRecentInteraction.date}
                        </span>
                      </div>
                      <p className="text-sm md:text-base text-gray-600 leading-relaxed">
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
                  <span className="text-xs md:text-sm font-medium text-gray-400 uppercase tracking-wider">
                    Tags
                  </span>
                  {!editingTags && isEditMode && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-gray-400"
                      onClick={() => setEditingTags(true)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
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
                  <div className="flex flex-wrap gap-3 justify-center">
                    {tags.length > 0 ? (
                      tags.map((tag) => (
                        <Badge
                          key={tag}
                          className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 border-0 text-xs md:text-sm font-normal px-2 py-1.5 h-auto rounded transition-colors hover:bg-blue-100 cursor-default"
                        >
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic">
                        No tags yet
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Original Content Sections */}
          <div className="pb-6 md:pb-12 border-t border-gray-200 pt-6 md:pt-8 mt-8 md:mt-10">
            {/* Story Section */}
            <div className="space-y-6 md:space-y-8 mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-black mb-6">Story</h2>
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
              <h2 className="text-xl md:text-2xl font-bold text-black mb-6">Notes</h2>
              <EditableSection
                sectionKey="notes"
                title="Notes"
                content={notes}
                onSave={(value) => setNotes(value)}
              />
            </div>

            {/* Connections Section */}
            <div className="space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-black mb-6">Connections</h2>
              {contact.connections && contact.connections.length > 0 ? (
                contact.connections.map((connection: any, index: number) => (
                  <div
                    key={index}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 md:p-5"
                  >
                    <p className="text-sm md:text-base font-medium text-gray-900 mb-1">
                      {connection.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {connection.relationship}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 italic">No connections listed</p>
              )}
            </div>
          </div>
        </div>
      </div>

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

