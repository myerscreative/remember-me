'use client';

import { useState } from 'react';
import { StoryGrid } from '@/app/contacts/[id]/components/StoryGrid';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sparkles, Plus, Tag, X, Loader2, Info } from 'lucide-react';
import { MemoryCapture } from '@/app/contacts/[id]/components/MemoryCapture';
import { toggleTag } from '@/app/actions/toggle-tag';
import { toggleInterest } from '@/app/actions/toggle-interest';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

// Minimal Contact type for typing
interface Contact {
  id: string;
  story: any;
  tags?: string[];
  interests?: string[];
  [key: string]: any;
}

interface OverviewTabProps {
  contact: Contact;
}

export function OverviewTab({ contact }: OverviewTabProps) {
  const [tags, setTags] = useState<string[]>(contact.tags || []);
  const [interests, setInterests] = useState<string[]>(contact.interests || []);
  
  // Input states
  const [tagInput, setTagInput] = useState('');
  const [interestInput, setInterestInput] = useState('');
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [isInterestsOpen, setIsInterestsOpen] = useState(false);
  const [submittingTag, setSubmittingTag] = useState(false);
  const [submittingInterest, setSubmittingInterest] = useState(false);

  // Handlers
  const handleAddTag = async () => {
    if (!tagInput.trim()) return;
    const newTag = tagInput.trim();
    
    // Optimistic update
    setTags(prev => [...prev, newTag]);
    setTagInput('');
    setSubmittingTag(true);
    
    try {
        const result = await toggleTag(contact.id, newTag);
        if (!result.success) throw new Error(result.error);
    } catch (e: any) {
        toast.error(e.message || 'Failed to add tag');
        setTags(prev => prev.filter(t => t !== newTag));
    } finally {
        setSubmittingTag(false);
        setIsTagsOpen(false); 
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
      setTags(prev => prev.filter(t => t !== tagToRemove));
      try {
          const result = await toggleTag(contact.id, tagToRemove);
          if (!result.success) throw new Error(result.error);
      } catch (e: any) {
          toast.error(e.message || 'Failed to remove tag');
          setTags(prev => [...prev, tagToRemove]);
      }
  };

  const handleAddInterest = async () => {
    if (!interestInput.trim()) return;
    const newInterest = interestInput.trim();

    // Optimistic update
    setInterests(prev => [...prev, newInterest]);
    setInterestInput('');
    setSubmittingInterest(true);

    try {
        const result = await toggleInterest(contact.id, newInterest);
        if (!result.success) throw new Error(result.error);
    } catch {
        toast.error('Failed to add interest');
        setInterests(prev => prev.filter(i => i !== newInterest));
    } finally {
        setSubmittingInterest(false);
    }
  };

  const handleRemoveInterest = async (interestToRemove: string) => {
      setInterests(prev => prev.filter(i => i !== interestToRemove));
      try {
          const result = await toggleInterest(contact.id, interestToRemove);
          if (!result.success) throw new Error(result.error);
      } catch {
          toast.error('Failed to remove interest');
          setInterests(prev => [...prev, interestToRemove]);
      }
  };

  const handleKeyDown = (
      e: React.KeyboardEvent, 
      action: () => void, 
      setInput: (val: string) => void
  ) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          action();
      } else if (e.key === 'Escape') {
          setInput('');
          setIsTagsOpen(false);
          setIsInterestsOpen(false);
      }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* HERO: The Story with container and header */}
      <section>
        <div className="bg-card border border-border rounded-2xl p-8 mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[1.25rem] font-semibold text-[#111827] dark:text-white flex items-center gap-2">
              <span className="text-2xl">📖</span> The Story
              <Popover>
                <PopoverTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-slate-400 hover:text-blue-500 transition-colors cursor-pointer focus:outline-none" aria-label="Story info" role="button" />
                </PopoverTrigger>
                <PopoverContent className="w-72 p-4 bg-[#1E293B] border-[#334155] shadow-xl rounded-xl z-[9999]">
                   <p className="text-slate-300 text-[11px] leading-relaxed mb-3">
                     <span className="text-white font-bold">Capture the Narrative.</span> Use these fields to document the foundation of your bond.
                   </p>
                   <ul className="space-y-2 text-[11px] text-slate-400 list-disc pl-4">
                      <li>&apos;Where We Met&apos; provides context for the origin.</li>
                      <li>&apos;Why Stay in Contact&apos; reminds you of the relationship&apos;s value.</li>
                      <li>&apos;What Matters&apos; and &apos;Points of Interest&apos; store the &apos;Deep Lore&apos; that makes your reach-outs feel personal.</li>
                   </ul>
                </PopoverContent>
              </Popover>
            </h2>
            <button className="bg-white dark:bg-[#1f2937] text-[#6366f1] dark:text-indigo-400 border border-[#e5e7eb] dark:border-[#374151] rounded-[0.5rem] px-3 py-1 text-sm font-medium hover:bg-gray-50 dark:hover:bg-[#374151] transition-colors shadow-sm">Edit</button>
          </div>
          <StoryGrid 
            contactId={contact.id} 
            story={{
              ...contact.story,
              whatFoundInteresting: contact.whatFoundInteresting
            }} 
          />
        </div>
      </section>

      {/* Memory Prompt */}
      <section className="mb-8">
        <MemoryCapture contactId={contact.id} />
      </section>

      {/* Tags & Interests Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tags Section */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-6 min-h-[200px] flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-teal-400" /> Tags
              <Popover>
                <PopoverTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-slate-500 hover:text-blue-500 transition-colors cursor-pointer focus:outline-none" aria-label="Tags info" role="button" />
                </PopoverTrigger>
                <PopoverContent className="w-72 p-4 bg-[#1E293B] border-[#334155] shadow-xl rounded-xl z-[9999]" align="start">
                  <p className="text-slate-300 text-[11px] leading-relaxed mb-3">
                    <span className="text-white font-bold">Organize your Tribes.</span> Group contacts by commonalities (e.g., &apos;NASA&apos;, &apos;Japan&apos;, &apos;Family&apos;).
                  </p>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    This allows you to monitor the health of entire groups at once on your <span className="text-white font-bold">Dashboard</span>.
                  </p>
                </PopoverContent>
              </Popover>
            </h3>
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsTagsOpen(!isTagsOpen)}
                className={cn("h-6 w-6 p-0 text-slate-400 hover:text-white hover:bg-white/5", isTagsOpen && "text-teal-400 bg-teal-400/10")}
            >
              <Plus className={cn("w-4 h-4 transition-transform", isTagsOpen && "rotate-45")} />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.length > 0 ? (
              tags.map((tag: string, i: number) => (
                <Badge 
                    key={i} 
                    className="group bg-[#0F172A] border border-[#334155] text-slate-300 rounded-[0.5rem] px-3.5 py-1.5 text-[0.75rem] font-medium hover:border-teal-500/50 hover:text-teal-400 transition-all cursor-default pr-2"
                >
                    {tag}
                    <button 
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity hover:text-rose-400 focus:opacity-100"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </Badge>
              ))
            ) : (
              !isTagsOpen && <p className="text-xs font-medium text-slate-600 uppercase tracking-widest mt-2">No tags set</p>
            )}
          </div>

          {isTagsOpen && (
              <div className="mt-auto pt-2 animate-in fade-in slide-in-from-top-1">
                  <div className="flex gap-2">
                      <Input 
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, handleAddTag, setTagInput)}
                          placeholder="Add a tag..."
                          className="h-9 text-sm"
                          autoFocus
                      />
                      <Button size="sm" onClick={handleAddTag} disabled={!tagInput.trim() || submittingTag}>
                          {submittingTag ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      </Button>
                  </div>
              </div>
          )}
        </div>

        {/* Interests Section */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-6 min-h-[200px] flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Interests
              <Popover>
                <PopoverTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-slate-500 hover:text-blue-500 transition-colors cursor-pointer focus:outline-none" aria-label="Interests info" role="button" />
                </PopoverTrigger>
                <PopoverContent className="w-72 p-4 bg-[#1E293B] border-[#334155] shadow-xl rounded-xl z-[9999]" align="start">
                  <p className="text-slate-300 text-[11px] leading-relaxed mb-3">
                    <span className="text-white font-bold">Personalize your Touch.</span> Log specific likes or hobbies here.
                  </p>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Use these details to craft meaningful messages that resonate when it&apos;s time to water the relationship.
                  </p>
                </PopoverContent>
              </Popover>
            </h3>
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsInterestsOpen(!isInterestsOpen)}
                className={cn("h-6 w-6 p-0 text-slate-400 hover:text-white hover:bg-white/5", isInterestsOpen && "text-purple-400 bg-purple-400/10")}
            >
              <Plus className={cn("w-4 h-4 transition-transform", isInterestsOpen && "rotate-45")} />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {interests.length > 0 ? (
              interests.map((interest: string, i: number) => (
                <Badge 
                    key={i} 
                    className="group bg-[#0F172A] border border-[#334155] text-slate-300 rounded-[0.5rem] px-3.5 py-1.5 text-[0.75rem] font-medium hover:border-purple-500/50 hover:text-purple-400 transition-all cursor-default pr-2"
                >
                    {interest}
                    <button 
                        onClick={() => handleRemoveInterest(interest)}
                        className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity hover:text-rose-400 focus:opacity-100"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </Badge>
              ))
            ) : (
                !isInterestsOpen && <p className="text-xs font-medium text-slate-600 uppercase tracking-widest mt-2">No interests set</p>
            )}
          </div>

          {isInterestsOpen && (
              <div className="mt-auto pt-2 animate-in fade-in slide-in-from-top-1">
                  <div className="flex gap-2">
                      <Input 
                          value={interestInput}
                          onChange={(e) => setInterestInput(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, handleAddInterest, setInterestInput)}
                          placeholder="Add an interest..."
                          className="h-9 text-sm"
                          autoFocus
                      />
                      <Button size="sm" onClick={handleAddInterest} disabled={!interestInput.trim() || submittingInterest}>
                          {submittingInterest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      </Button>
                  </div>
              </div>
          )}
        </div>
      </section>
    </div>
  );
}
