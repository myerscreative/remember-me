'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Plus, Tag, X, Loader2, Mail, MapPin, Users, Phone, Edit2, Check, RefreshCw } from 'lucide-react';
import { MemoryCapture } from '@/app/contacts/[id]/components/MemoryCapture';
import { toggleTag } from '@/app/actions/toggle-tag';
import { toggleInterest } from '@/app/actions/toggle-interest';
import { processMemory } from '@/app/actions/process-memory';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { ReachOutPanel } from '@/components/contacts/ReachOutPanel';

// Minimal Contact type for typing
interface Contact {
  id: string;
  name: string;
  story: any;
  tags?: string[];
  interests?: string[];
  deep_lore?: string | null;
  why_stay_in_contact?: string | null;
  shared_memories?: Array<{ content: string }> | null;
  relationship_summary?: string | null;
  ai_summary?: string | null;
  where_met?: string | null;
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
  const [isReachOutOpen, setIsReachOutOpen] = useState(false);

  // Synopsis editing state
  const [isEditingSynopsis, setIsEditingSynopsis] = useState(false);
  const [editedSynopsis, setEditedSynopsis] = useState(contact.deep_lore || '');
  const [isSavingSynopsis, setIsSavingSynopsis] = useState(false);
  const [isRefreshingSynopsis, setIsRefreshingSynopsis] = useState(false);

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

  const handleSaveSynopsis = async () => {
    setIsSavingSynopsis(true);
    try {
      const supabase = createClient();
      const { error } = await (supabase as any)
        .from('persons')
        .update({ deep_lore: editedSynopsis })
        .eq('id', contact.id);

      if (error) throw error;

      contact.deep_lore = editedSynopsis;
      setIsEditingSynopsis(false);
      toast.success('Synopsis updated');
    } catch (error) {
      console.error('Error saving synopsis:', error);
      toast.error('Failed to save synopsis');
    } finally {
      setIsSavingSynopsis(false);
    }
  };

  const handleRefreshSynopsis = async () => {
    setIsRefreshingSynopsis(true);
    try {
      // Re-process existing deep_lore to regenerate with latest AI formatting
      const currentContent = contact.deep_lore || 'Regenerate synopsis for this person';
      const result = await processMemory(contact.id, currentContent);
      
      if (result.success) {
        // Refresh the page to show updated content
        window.location.reload();
      } else {
        toast.error('Failed to refresh synopsis');
      }
    } catch (error) {
      console.error('Error refreshing synopsis:', error);
      toast.error('Failed to refresh synopsis');
    } finally {
      setIsRefreshingSynopsis(false);
    }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-4 md:gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* MAIN CONTENT COLUMN */}
      <div className="flex-1 space-y-8 min-w-0">
        
        {/* AI Synopsis - Always Visible */}
        <section className="bg-gradient-to-br from-indigo-50 via-purple-50/30 to-white dark:from-[#1E293B] dark:via-[#1E293B] dark:to-[#0F172A] border-2 border-indigo-200/50 dark:border-indigo-900/50 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-indigo-900 dark:text-indigo-200 font-bold text-lg">
              AI Synopsis
            </h2>
          </div>
          
          {/* Content or Empty State with Integrated Input */}
          {contact.deep_lore || contact.where_met || contact.ai_summary ? (
            <>
              <div className="space-y-4 mb-6">
                 {/* Unified Synopsis Display */}
                 <div className="bg-white/60 dark:bg-slate-800/30 rounded-lg p-5 border border-indigo-100 dark:border-indigo-900/30 relative group">
                    {/* Edit/Refresh buttons */}
                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                        onClick={handleRefreshSynopsis}
                        disabled={isRefreshingSynopsis || isEditingSynopsis}
                      >
                        <RefreshCw className={cn("h-3.5 w-3.5", isRefreshingSynopsis && "animate-spin")} />
                      </Button>
                      {!isEditingSynopsis && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                          onClick={() => {
                            setIsEditingSynopsis(true);
                            setEditedSynopsis(contact.deep_lore || '');
                          }}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>

                    {isEditingSynopsis ? (
                      <div className="space-y-3">
                        <Textarea
                          value={editedSynopsis}
                          onChange={(e) => setEditedSynopsis(e.target.value)}
                          className="min-h-[200px] text-sm font-medium"
                          placeholder="Edit synopsis..."
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsEditingSynopsis(false);
                              setEditedSynopsis(contact.deep_lore || '');
                            }}
                            disabled={isSavingSynopsis}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveSynopsis}
                            disabled={isSavingSynopsis}
                            className="bg-indigo-600 hover:bg-indigo-700"
                          >
                            {isSavingSynopsis ? (
                              <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Saving...</>
                            ) : (
                              <><Check className="h-3 w-3 mr-1" /> Save</>
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium pr-16">
                            {contact.deep_lore || contact.ai_summary || "No synopsis available."}
                        </p>
                        
                        {/* Append Where Met if not included in deep_lore (simple check) */}
                        {contact.where_met && (!contact.deep_lore || !contact.deep_lore.includes(contact.where_met)) && (
                            <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mt-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/10">
                                <span className="font-semibold text-indigo-600 dark:text-indigo-400">Where we met:</span> {contact.where_met}
                            </p>
                        )}
                      </>
                    )}
                 </div>
              </div>
              
              {/* Memory Capture - Below content */}
              <div className="pt-4 border-t border-indigo-200/50 dark:border-indigo-900/30">
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-3 uppercase tracking-wider">
                  Add More Memories
                </p>
                <MemoryCapture contactId={contact.id} />
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="text-center py-4">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  No story yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
                  Start building {contact.name?.split(' ')[0] || 'this person'}'s story. 
                  Share where you met, memorable moments, or anything that helps you remember your connection.
                </p>
              </div>
              
              {/* Memory Capture - Integrated in empty state */}
              <MemoryCapture contactId={contact.id} />
            </div>
          )}
        </section>

        {/* Tags & Interests Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tags Section */}
            <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col shadow-sm transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> Tags
                </h3>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsTagsOpen(!isTagsOpen)}
                    className={cn("h-6 w-6 p-0 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5", isTagsOpen && "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-400/10")}
                >
                  <Plus className={cn("w-4 h-4 transition-transform", isTagsOpen && "rotate-45")} />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {tags.length > 0 ? (
                  tags.map((tag: string, i: number) => (
                    <Badge 
                        key={i} 
                        className="group bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-[0.5rem] px-3.5 py-1.5 text-[0.75rem] font-medium hover:border-teal-500/50 hover:text-teal-600 dark:hover:text-teal-400 transition-all cursor-default pr-2"
                    >
                        {tag}
                        <button 
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity hover:text-rose-500 dark:hover:text-rose-400 focus:opacity-100"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </Badge>
                  ))
                ) : (
                  !isTagsOpen && <p className="text-xs font-medium text-slate-400 dark:text-slate-600 uppercase tracking-widest mt-2">No tags set</p>
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
                              className="h-9 text-sm bg-white dark:bg-transparent border-slate-200 dark:border-slate-700"
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
            <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col shadow-sm transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Interests
                </h3>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsInterestsOpen(!isInterestsOpen)}
                    className={cn("h-6 w-6 p-0 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5", isInterestsOpen && "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-400/10")}
                >
                  <Plus className={cn("w-4 h-4 transition-transform", isInterestsOpen && "rotate-45")} />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {interests.length > 0 ? (
                  interests.map((interest: string, i: number) => (
                    <Badge 
                        key={i} 
                        className="group bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-[0.5rem] px-3.5 py-1.5 text-[0.75rem] font-medium hover:border-purple-500/50 hover:text-purple-600 dark:hover:text-purple-400 transition-all cursor-default pr-2"
                    >
                        {interest}
                        <button 
                            onClick={() => handleRemoveInterest(interest)}
                            className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity hover:text-rose-500 dark:hover:text-rose-400 focus:opacity-100"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </Badge>
                  ))
                ) : (
                    !isInterestsOpen && <p className="text-xs font-medium text-slate-400 dark:text-slate-600 uppercase tracking-widest mt-2">No interests set</p>
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
                              className="h-9 text-sm bg-white dark:bg-transparent border-slate-200 dark:border-slate-700"
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

      {/* RIGHT SIDEBAR */}
      <div className="w-full xl:w-80 space-y-6">
           


           {/* Contact Info Card */}
          <div className="bg-card border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
             <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">Contact Info</h3>
             <div className="space-y-4 text-sm">
                 <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                         <Mail className="w-4 h-4 text-slate-500" />
                     </div>
                     <div className="overflow-hidden">
                         <p className="text-xs text-muted-foreground">Email</p>
                         <p className="text-foreground truncate font-medium">{contact.email || "No email"}</p>
                     </div>
                 </div>
                 <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                         <Phone className="w-4 h-4 text-slate-500" />
                     </div>
                     <div>
                         <p className="text-xs text-muted-foreground">Phone</p>
                         <p className="text-foreground font-medium">{contact.phone || "No phone"}</p>
                     </div>
                 </div>
                 {contact.location && (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Location</p>
                            <p className="text-foreground font-medium">{contact.location}</p>
                        </div>
                    </div>
                 )}
             </div>
          </div>

          {/* Family & Connections Ghost State */}
          {(!contact.familyMembers || contact.familyMembers.length === 0) && (
             <div className="text-center py-4">
                 <p className="text-sm text-muted-foreground mb-3">No connections yet</p>
                 <Button variant="outline" size="sm" className="text-xs">
                    <Users className="w-3.5 h-3.5 mr-1.5" />
                    Link a Connection
                 </Button>
             </div>
          )}

      </div>

       <ReachOutPanel 
         isOpen={isReachOutOpen} 
         onClose={() => setIsReachOutOpen(false)} 
         contact={contact} 
       />
    </div>
  );
}
