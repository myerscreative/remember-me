'use client';

import { useState, useEffect } from 'react';
import { StoryGrid } from '@/app/contacts/[id]/components/StoryGrid';
import { StoryTimeline } from '@/app/contacts/[id]/components/tabs/story/StoryTimeline';
import { getStoryTimeline, type TimelineItem } from '@/lib/story/story-data';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Cake,
  Calendar,
  Plus,
  Trash2,
  BookOpen,
  Sparkles,
  Save,
  Loader2,
  History
} from "lucide-react";
import { updateDeepLore, addMilestone, deleteMilestone, upsertSharedMemory } from "@/app/actions/story-actions";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface Milestone {
  label: string;
  date: string;
}

interface StoryTabProps {
  contact: {
    id: string;
    name: string;
    first_name?: string;
    birthday?: string | null;
    custom_anniversary?: string | null;
    important_dates?: any;
    deep_lore?: string | null;
    story?: any;
    whatFoundInteresting?: string;
    shared_memories?: { content: string }[];
  };
}

export function StoryTab({ contact }: StoryTabProps) {
  const initialMemory = contact.shared_memories?.[0]?.content || "";
  const [isSavingLore, setIsSavingLore] = useState(false);
  const [sharedMemory, setSharedMemory] = useState(initialMemory);
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ label: "", date: "" });
  const [isSubmittingMilestone, setIsSubmittingMilestone] = useState(false);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(true);

  // Fetch timeline data
  const loadTimeline = async () => {
    setIsLoadingTimeline(true);
    const data = await getStoryTimeline(contact.id);
    setTimeline(data);
    setIsLoadingTimeline(false);
  };

  useEffect(() => {
    loadTimeline();
  }, [contact.id]);

  // Group all milestones
  const milestones: Milestone[] = [];
  if (contact.birthday) milestones.push({ label: "Birthday", date: contact.birthday });
  if (contact.custom_anniversary) milestones.push({ label: "Anniversary", date: contact.custom_anniversary });
  
  const customDates = Array.isArray(contact.important_dates) ? contact.important_dates : [];
  milestones.push(...customDates);

  const handleSaveMemory = async () => {
    setIsSavingLore(true);
    const res = await upsertSharedMemory(contact.id, sharedMemory);
    setIsSavingLore(false);
    if (res.success) {
      toast.success("Shared Memory saved! 📚");
    } else {
      toast.error(res.error || "Failed to save");
    }
  };

  const handleAddMilestone = async () => {
    if (!newMilestone.label || !newMilestone.date) {
      toast.error("Please provide both label and date");
      return;
    }
    setIsSubmittingMilestone(true);
    const res = await addMilestone(contact.id, newMilestone.label, newMilestone.date);
    setIsSubmittingMilestone(false);
    if (res.success) {
      toast.success("Milestone added! 🎈");
      setIsAddingMilestone(false);
      setNewMilestone({ label: "", date: "" });
    } else {
      toast.error(res.error || "Failed to add milestone");
    }
  };

  const handleDeleteMilestone = async (m: Milestone) => {
    const res = await deleteMilestone(contact.id, m.label, m.date);
    if (res.success) {
      toast.success("Milestone removed");
    } else {
      toast.error(res.error || "Failed to remove milestone");
    }
  };

  return (
    <div className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Activity Timeline Section */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
            <History className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Activity History</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Your interactions and shared moments</p>
          </div>
        </div>
        {isLoadingTimeline ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <StoryTimeline items={timeline} />
        )}
      </section>

      {/* Narrative Cards Section */}
      <section>
        <div className="flex items-center gap-2 mb-6">
           <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
             <span className="text-xl">📖</span> The Story
           </h2>
        </div>
        <StoryGrid
            contactId={contact.id}
            story={{
              ...contact.story,
              whatFoundInteresting: contact.whatFoundInteresting
            }}
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        {/* Column 1: Important Milestones */}
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-2">
             <h3 className="text-sm font-black uppercase tracking-tighter text-[#38BDF8] flex items-center gap-2">
               <Calendar className="h-4 w-4" />
               Important Milestones
             </h3>
             <Button 
               variant="ghost" 
               size="sm" 
               onClick={() => setIsAddingMilestone(!isAddingMilestone)}
               className="h-8 text-[10px] font-black uppercase text-[#38BDF8] hover:text-[#38BDF8] hover:bg-[#38BDF8]/10"
             >
               {isAddingMilestone ? "Cancel" : <><Plus className="h-3 w-3 mr-1" /> Add Milestone</>}
             </Button>
          </div>

          {isAddingMilestone && (
            <Card className="bg-[#0F172A] border-slate-200 dark:border-slate-800 border-t-2 border-t-[#38BDF8] rounded-none mb-6 slide-in-from-top-2 animate-in duration-300">
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Label</label>
                    <Input 
                      placeholder="e.g. Work Anniversary" 
                      value={newMilestone.label}
                      onChange={(e) => setNewMilestone({...newMilestone, label: e.target.value})}
                      className="h-9 bg-[#1E293B] border-slate-200 dark:border-slate-800 text-white text-xs rounded-none focus-visible:ring-[#38BDF8]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Date</label>
                    <Input 
                      type="date"
                      value={newMilestone.date}
                      onChange={(e) => setNewMilestone({...newMilestone, date: e.target.value})}
                      className="h-9 bg-[#1E293B] border-slate-200 dark:border-slate-800 text-white text-xs rounded-none focus-visible:ring-[#38BDF8]"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleAddMilestone}
                  disabled={isSubmittingMilestone}
                  className="w-full h-9 bg-[#38BDF8] hover:bg-[#0EA5E9] text-[#0F172A] font-black uppercase text-[11px] rounded-none"
                >
                  {isSubmittingMilestone ? <Loader2 className="h-4 w-4 animate-spin" /> : "Blast to Radar"}
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {milestones.length > 0 ? (
              milestones.map((m, idx) => (
                <div 
                  key={`${m.label}-${idx}`} 
                  className="group flex items-center justify-between p-4 bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-[#38BDF8]/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-[#1E293B] flex items-center justify-center border border-slate-200 dark:border-slate-800">
                      <Cake className={cn("h-5 w-5", m.label.toLowerCase().includes('birthday') ? "text-rose-500" : "text-[#38BDF8]")} />
                    </div>
                    <div>
                      <p className="text-white font-black uppercase text-xs tracking-tight">{m.label}</p>
                      <p className="text-slate-500 text-[10px] font-bold uppercase mt-0.5">
                        {new Date(m.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDeleteMilestone(m)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 bg-[#0F172A]/30">
                 <Calendar className="h-8 w-8 text-slate-800 mx-auto mb-3" />
                 <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No milestones recorded yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Shared Memory */}
        <div className="space-y-6">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                 <BookOpen className="w-5 h-5 text-indigo-500" />
               </div>
               <div>
                 <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Shared Memories & Context</h2>
                 <p className="text-xs text-slate-500 dark:text-slate-400">The deep history of your relationship</p>
               </div>
             </div>
          <div className="flex items-center justify-end mb-2">
             <div className="flex items-center gap-2">
               <span className="text-[10px] font-bold text-slate-600 uppercase">Markdown Supported</span>
               <Button 
                 size="sm" 
                 onClick={handleSaveMemory}
                 disabled={isSavingLore || sharedMemory === initialMemory}
                 className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] rounded-none px-4 shadow-sm"
               >
                 {isSavingLore ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                 Save Memory
               </Button>
             </div>
          </div>

          <Card className="bg-[#0F172A] border-slate-200 dark:border-slate-800 shadow-2xl rounded-none flex flex-col min-h-[400px]">
            <CardHeader className="p-4 border-b border-slate-200 dark:border-slate-800 bg-[#1E293B]/30">
              <div className="flex items-center gap-2">
                 <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shared Memories & Important Context</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 flex flex-col">
              <textarea
                value={sharedMemory}
                onChange={(e) => setSharedMemory(e.target.value)}
                placeholder="What makes this relationship special? Family notes, shared interests, career goals, or recurring inside jokes..."
                className="flex-1 w-full bg-transparent p-6 text-slate-300 text-sm leading-relaxed focus:outline-none resize-none min-h-[350px] font-medium"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
