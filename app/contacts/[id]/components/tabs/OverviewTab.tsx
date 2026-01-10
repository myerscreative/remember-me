'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Plus, Tag, X, Loader2, MessageSquare } from 'lucide-react';
import { toggleTag } from '@/app/actions/toggle-tag';
import { toggleInterest } from '@/app/actions/toggle-interest';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { ReachOutPanel } from '@/components/contacts/ReachOutPanel';
import { getInteractionStats } from '@/app/actions/get-interaction-stats';
import { getConnectionCount } from '@/app/actions/get-connection-count';

// New components
import { AISynopsisCard } from './overview/AISynopsisCard';
import { ContactInfoGrid } from './overview/ContactInfoGrid';
import { RelationshipSettingsCard } from './overview/RelationshipSettingsCard';
import { QuickStatsCard } from './overview/QuickStatsCard';
import { ConnectionsNotice } from './overview/ConnectionsNotice';

// Minimal Contact type for typing
interface Contact {
  id: string;
  name: string;
  firstName?: string;
  first_name?: string;
  story: any;
  tags?: string[];
  interests?: string[];
  deep_lore?: string | null;
  why_stay_in_contact?: string | null;
  shared_memories?: Array<{ content: string }> | null;
  relationship_summary?: string | null;
  ai_summary?: string | null;
  where_met?: string | null;
  email?: string | null;
  phone?: string | null;
  last_contact_date?: string | null;
  last_contacted_date?: string | null;
  next_contact_date?: string | null;
  target_frequency_days?: number;
  importance?: 'high' | 'medium' | 'low';
  updated_at?: string;
  [key: string]: any;
}

interface OverviewTabProps {
  contact: Contact;
  onFrequencyChange?: (days: number) => void;
  onImportanceChange?: (importance: 'high' | 'medium' | 'low') => void;
  onNavigateToTab?: (tab: string) => void;
}

export function OverviewTab({ contact, onFrequencyChange, onImportanceChange, onNavigateToTab }: OverviewTabProps) {
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

  // Stats state
  const [interactionCount, setInteractionCount] = useState(0);
  const [connectionCount, setConnectionCount] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Fetch stats on mount
  useEffect(() => {
    async function fetchStats() {
      setIsLoadingStats(true);
      try {
        const [interactionResult, connectionResult] = await Promise.all([
          getInteractionStats(contact.id),
          getConnectionCount(contact.id)
        ]);

        if (interactionResult.success) {
          setInteractionCount(interactionResult.count);
        }
        if (connectionResult.success) {
          setConnectionCount(connectionResult.count);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    }

    fetchStats();
  }, [contact.id]);

  // Handlers
  const handleAddTag = async () => {
    if (!tagInput.trim()) return;
    const newTag = tagInput.trim();
    
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

  const handleNavigateToStory = () => {
    if (onNavigateToTab) {
      onNavigateToTab('Story');
    }
  };

  const handleNavigateToFamily = () => {
    if (onNavigateToTab) {
      onNavigateToTab('Family');
    }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-4 md:gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* MAIN CONTENT COLUMN */}
      <div className="flex-1 space-y-6 min-w-0">
        
        {/* AI Synopsis Card */}
        <AISynopsisCard
          contactId={contact.id}
          contactName={contact.firstName || contact.first_name || contact.name}
          deepLore={contact.deep_lore}
          whereMet={contact.where_met}
          aiSummary={contact.ai_summary}
          lastUpdated={contact.updated_at}
          onNavigateToStory={handleNavigateToStory}
        />

        {/* Contact Info Grid */}
        <ContactInfoGrid
          email={contact.email}
          phone={contact.phone}
        />

        {/* Relationship Settings */}
        <RelationshipSettingsCard
          importance={contact.importance || 'medium'}
          targetFrequencyDays={contact.target_frequency_days || 30}
          onImportanceChange={(importance) => {
            if (onImportanceChange) {
              onImportanceChange(importance);
            }
          }}
          onFrequencyChange={(days) => {
            if (onFrequencyChange) {
              onFrequencyChange(days);
            }
          }}
        />

        {/* Tags & Interests - Single Card with 2-column layout */}
        <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tags Column */}
            <div className="min-w-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  🏷️ Tags
                </h3>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsTagsOpen(!isTagsOpen)}
                    className={cn("h-6 w-6 p-0 text-muted-foreground hover:text-foreground", isTagsOpen && "text-teal-600 dark:text-teal-400")}
                >
                  <Plus className={cn("w-4 h-4 transition-transform", isTagsOpen && "rotate-45")} />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.length > 0 ? (
                  tags.map((tag: string, i: number) => (
                    <Badge 
                        key={i} 
                        className="group bg-muted border border-border text-foreground rounded-lg px-3 py-1 text-xs font-medium hover:border-teal-500/50 transition-all cursor-default"
                    >
                        {tag}
                        <button 
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:text-rose-500 focus:opacity-100"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </Badge>
                  ))
                ) : (
                  !isTagsOpen && <span className="text-xs text-muted-foreground italic">No tags</span>
                )}
              </div>

              {isTagsOpen && (
                  <div className="animate-in fade-in slide-in-from-top-1">
                      <div className="flex gap-2">
                          <Input 
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, handleAddTag, setTagInput)}
                              placeholder="Add a tag..."
                              className="h-8 text-sm"
                              autoFocus
                          />
                          <Button size="sm" onClick={handleAddTag} disabled={!tagInput.trim() || submittingTag} className="h-8">
                              {submittingTag ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                          </Button>
                      </div>
                  </div>
              )}
            </div>

            {/* Interests Column */}
            <div className="min-w-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  ✨ Interests
                </h3>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsInterestsOpen(!isInterestsOpen)}
                    className={cn("h-6 w-6 p-0 text-muted-foreground hover:text-foreground", isInterestsOpen && "text-purple-600 dark:text-purple-400")}
                >
                  <Plus className={cn("w-4 h-4 transition-transform", isInterestsOpen && "rotate-45")} />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {interests.length > 0 ? (
                  interests.map((interest: string, i: number) => (
                    <Badge 
                        key={i} 
                        className="group bg-muted border border-border text-foreground rounded-lg px-3 py-1 text-xs font-medium hover:border-purple-500/50 transition-all cursor-default"
                    >
                        {interest}
                        <button 
                            onClick={() => handleRemoveInterest(interest)}
                            className="ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:text-rose-500 focus:opacity-100"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </Badge>
                  ))
                ) : (
                    !isInterestsOpen && <span className="text-xs text-muted-foreground italic">No interests</span>
                )}
              </div>

              {isInterestsOpen && (
                  <div className="animate-in fade-in slide-in-from-top-1">
                      <div className="flex gap-2">
                          <Input 
                              value={interestInput}
                              onChange={(e) => setInterestInput(e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, handleAddInterest, setInterestInput)}
                              placeholder="Add an interest..."
                              className="h-8 text-sm"
                              autoFocus
                          />
                          <Button size="sm" onClick={handleAddInterest} disabled={!interestInput.trim() || submittingInterest} className="h-8">
                              {submittingInterest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                          </Button>
                      </div>
                  </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* RIGHT SIDEBAR */}
      <div className="w-full xl:w-80 space-y-6">
           
           {/* Ready to Connect */}
           <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6 shadow-lg">
               <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-white/90">Ready to connect?</h3>
               <p className="text-xs text-white/70 mb-4">Generate a personalized script based on your memories.</p>
               <Button 
                onClick={() => setIsReachOutOpen(true)}
                className="w-full bg-white hover:bg-white/90 text-purple-700 border-0 shadow-md text-xs h-9 font-semibold"
               >
                  <MessageSquare className="w-3.5 h-3.5 mr-2" />
                   Draft Reconnection
               </Button>
           </div>

           {/* Quick Stats */}
           <QuickStatsCard
             lastContactDate={contact.last_contact_date || contact.last_contacted_date}
             totalInteractions={interactionCount}
             nextContactDate={contact.next_contact_date}
           />

           {/* Connections Notice */}
           <ConnectionsNotice
             connectionCount={connectionCount}
             onLinkConnection={handleNavigateToFamily}
           />
      </div>

       <ReachOutPanel 
         isOpen={isReachOutOpen} 
         onClose={() => setIsReachOutOpen(false)} 
         contact={contact} 
       />
    </div>
  );
}
