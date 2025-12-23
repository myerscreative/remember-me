'use client';

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import toast, { Toaster } from "react-hot-toast";

// Icons
import { ArrowLeft, Edit, Mail, Phone, Clock, Sparkles, Check } from "lucide-react";

// Components
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ErrorFallback } from "@/components/error-fallback";
import { Input } from "@/components/ui/input";

// New Components
import { ProfileSidebar } from "./components/ProfileSidebar";
import { ProfileHeader } from "./components/ProfileHeader";
import { OverviewTab } from "./components/tabs/OverviewTab";

const tabs = ["Overview", "Details", "History", "Family", "Interests"];

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

        // 3. Assemble complete object
        const fullContact = {
            ...person,
            firstName: person.first_name || person.name?.split(" ")[0] || "",
            lastName: person.last_name || person.name?.split(" ").slice(1).join(" ") || "",
            tags: tags,
            story: {
                whereWeMet: person.where_met,
                whyStayInContact: person.why_stay_in_contact,
                whatsImportant: person.most_important_to_them
            },
            // Legacy/Schema compat
            photo_url: person.photo_url || person.avatar_url, 
            familyMembers: person.family_members || [],
            interests: person.interests || [],
            aiSummary: person.ai_summary,
            next_contact_date: person.next_contact_date,
            last_contact_date: person.last_contacted_date,
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


  if (loading) {
     return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#1a1d24]"><div className="animate-pulse text-gray-400">Loading profile...</div></div>;
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
    <div className="flex min-h-screen bg-white dark:bg-[#1a1d24]">
      <Toaster position="top-center" />
      
      {/* DESKTOP SIDEBAR (Hidden on Mobile) */}
      <div className="hidden md:block">
        <ProfileSidebar contact={contact} />
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
         
         {/* DESKTOP HEADER (Hidden on Mobile) */}
         <ProfileHeader />

         {/* MOBILE HEADER (Visible < 768px) */}
         <div className="md:hidden bg-gradient-to-br from-indigo-500 to-indigo-600 text-white min-h-[300px] rounded-b-[2.5rem] p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('/noise.png')]"></div>
            
            {/* Top Bar Mobile */}
            <div className="flex justify-between items-center relative z-10 mb-8">
                <Link href="/">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <div className="flex gap-2">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-white hover:bg-white/10 rounded-full"
                        onClick={() => setIsEditMode(!isEditMode)}
                    >
                        {isEditMode ? <Check className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
                    </Button>
                </div>
            </div>

            {/* Mobile Profile Info */}
            <div className="relative z-10 flex flex-col items-center text-center">
                <div className="mb-4 relative">
                    <Avatar className="h-28 w-28 border-4 border-white/30 shadow-2xl">
                        <AvatarImage src={contact.photo_url} className="object-cover" />
                        <AvatarFallback className="text-2xl bg-indigo-700 text-white/50">
                            {(contact.firstName?.[0] || "")}
                        </AvatarFallback>
                    </Avatar>
                </div>
                
                {isEditMode ? (
                     <div className="flex gap-2 mb-2">
                        <Input value={firstName} onChange={e => setFirstName(e.target.value)} className="bg-white/10 border-white/20 text-white placeholder:text-white/50 text-center w-24 h-9" placeholder="First" />
                        <Input value={lastName} onChange={e => setLastName(e.target.value)} className="bg-white/10 border-white/20 text-white placeholder:text-white/50 text-center w-24 h-9" placeholder="Last" />
                        <Button size="sm" onClick={handleSaveName} className="bg-white text-indigo-600 h-9 w-9 p-0"><Check className="h-4 w-4" /></Button>
                     </div>
                ) : (
                    <h1 className="text-2xl font-bold mb-1">{contact.firstName} {contact.lastName}</h1>
                )}

                <p className="text-indigo-100 text-sm mb-6">{contact.linkedin || "Contact"}</p>
                
                {/* Mobile Actions */}
                <div className="flex items-center gap-3 w-full max-w-xs mx-auto">
                    <Button className="flex-1 bg-white text-indigo-600 hover:bg-indigo-50 border-0 shadow-lg font-semibold rounded-xl h-11">
                        <Phone className="h-4 w-4 mr-2" /> Call
                    </Button>
                    <Button className="flex-1 bg-indigo-700/50 text-white hover:bg-indigo-700/70 border-0 shadow-lg backdrop-blur-sm rounded-xl h-11">
                        <Mail className="h-4 w-4 mr-2" /> Email
                    </Button>
                </div>
            </div>
         </div>


         {/* SCROLLABLE CONTENT */}
         <main className="flex-1 p-4 md:p-10 max-w-5xl mx-auto w-full md:mt-6">

            {/* TAB NAVIGATION */}
            <div className="flex items-center gap-8 border-b border-gray-100 dark:border-[#3a3f4b] mb-8 overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "pb-3 text-[15px] font-medium transition-all relative whitespace-nowrap",
                            activeTab === tab 
                                ? "text-indigo-600 dark:text-indigo-400" 
                                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                        )}
                    >
                        {tab}
                        {activeTab === tab && (
                            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-500 rounded-t-full shadow-[0_-2px_6px_rgba(99,102,241,0.2)]" />
                        )}
                    </button>
                ))}
            </div>

            {/* TAB CONTENT */}
            <div className="min-h-[500px]">
                {activeTab === "Overview" && (
                    <OverviewTab contact={contact} />
                )}
                
                {activeTab === "Details" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                        <div className="bg-gray-50 dark:bg-[#252931] rounded-2xl p-6">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Contact Info</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-900 dark:text-white">{contact.phone || "No phone"}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-900 dark:text-white">{contact.email || "No email"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {activeTab === "History" && (
                     <div className="text-center py-20 bg-gray-50 dark:bg-[#252931] rounded-2xl border border-dashed border-gray-200 dark:border-[#3a3f4b]">
                        <Clock className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                         <p className="text-gray-400">Interaction History coming here.</p>
                     </div>
                )}
                
                {(activeTab === "Family" || activeTab === "Interests") && (
                     <div className="text-center py-20 bg-gray-50 dark:bg-[#252931] rounded-2xl border border-dashed border-gray-200 dark:border-[#3a3f4b]">
                        <Sparkles className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                         <p className="text-gray-400">{activeTab} details coming soon.</p>
                     </div>
                )}
            </div>

         </main>
      
      </div>
    </div>
  );
}
