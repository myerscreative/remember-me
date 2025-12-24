'use client';

import { useState } from 'react';
import { StoryGrid } from '@/app/contacts/[id]/components/StoryGrid';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Plus, Tag, X, Loader2 } from 'lucide-react';
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
      <section>
        <div className="group bg-white dark:bg-[#252931]/50 border-2 border-dashed border-[#d1d5db] dark:border-[#374151] rounded-[0.875rem] p-5 flex items-center justify-between hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-all duration-300 cursor-pointer mb-8">
          <span className="text-[#9ca3af] dark:text-gray-400 text-lg group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">✨ Add important info to your memory</span>
          <button className="text-[#9ca3af] dark:text-gray-500 text-2xl group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">+</button>
        </div>
      </section>

      {/* Tags & Interests Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tags Section */}
        <div className="bg-card border border-border rounded-2xl p-6 min-h-[200px] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-2">
              <Tag className="w-4 h-4 text-teal-500 dark:text-teal-400" /> Tags
            </h3>
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsTagsOpen(!isTagsOpen)}
                className={cn("h-6 w-6 p-0 text-gray-400 hover:text-indigo-600", isTagsOpen && "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10")}
            >
              <Plus className={cn("w-4 h-4 transition-transform", isTagsOpen && "rotate-45")} />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.length > 0 ? (
              tags.map((tag: string, i: number) => (
                <Badge 
                    key={i} 
                    className="group bg-[#f3f4f6] dark:bg-gray-800 text-[#4b5563] dark:text-gray-300 rounded-[0.5rem] px-3.5 py-1.5 text-[0.8125rem] font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-default pr-2"
                >
                    {tag}
                    <button 
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </Badge>
              ))
            ) : (
              !isTagsOpen && <p className="text-sm text-gray-400 italic">No tags added yet.</p>
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
        <div className="bg-card border border-border rounded-2xl p-6 min-h-[200px] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500 dark:text-purple-400" /> Interests
            </h3>
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsInterestsOpen(!isInterestsOpen)}
                className={cn("h-6 w-6 p-0 text-gray-400 hover:text-indigo-600", isInterestsOpen && "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10")}
            >
              <Plus className={cn("w-4 h-4 transition-transform", isInterestsOpen && "rotate-45")} />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {interests.length > 0 ? (
              interests.map((interest: string, i: number) => (
                <Badge 
                    key={i} 
                    className="group bg-[#f3f4f6] dark:bg-gray-800 text-[#4b5563] dark:text-gray-300 rounded-[0.5rem] px-3.5 py-1.5 text-[0.8125rem] font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-default pr-2"
                >
                    {interest}
                    <button 
                        onClick={() => handleRemoveInterest(interest)}
                        className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </Badge>
              ))
            ) : (
                !isInterestsOpen && <p className="text-sm text-gray-400 italic">No interests added yet.</p>
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
