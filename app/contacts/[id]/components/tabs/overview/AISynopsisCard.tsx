'use client';

import { useState } from 'react';
import { Sparkles, RefreshCw, Edit2, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { MemoryCapture } from '@/app/contacts/[id]/components/MemoryCapture';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { processMemory } from '@/app/actions/process-memory';

interface AISynopsisCardProps {
  contactId: string;
  contactName: string;
  deepLore: string | null | undefined;
  whereMet: string | null | undefined;
  aiSummary: string | null | undefined;
  lastUpdated?: string;
  onNavigateToStory: () => void;
}

export function AISynopsisCard({
  contactId,
  contactName,
  deepLore,
  whereMet,
  aiSummary,
  lastUpdated,
  onNavigateToStory
}: AISynopsisCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(deepLore || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const hasContent = deepLore || whereMet || aiSummary;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const supabase = createClient();
      const { error } = await (supabase as any)
        .from('persons')
        .update({ deep_lore: editedContent })
        .eq('id', contactId);

      if (error) throw error;

      setIsEditing(false);
      toast.success('Synopsis updated');
      window.location.reload(); // Refresh to show updated content
    } catch (error) {
      console.error('Error saving synopsis:', error);
      toast.error('Failed to save synopsis');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const currentContent = deepLore || 'Regenerate synopsis for this person';
      const result = await processMemory(contactId, currentContent);
      
      if (result.success) {
        window.location.reload();
      } else {
        toast.error('Failed to refresh synopsis');
      }
    } catch (error) {
      console.error('Error refreshing synopsis:', error);
      toast.error('Failed to refresh synopsis');
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Updated today';
    if (diffDays === 1) return 'Updated yesterday';
    if (diffDays < 7) return `Updated ${diffDays} days ago`;
    if (diffDays < 30) return `Updated ${Math.floor(diffDays / 7)} weeks ago`;
    return `Updated ${Math.floor(diffDays / 30)} months ago`;
  };

  // Empty State - Minimal
  if (!hasContent) {
    return (
      <section className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">
              Add story details to generate an AI summary.{' '}
              <button 
                onClick={onNavigateToStory}
                className="text-purple-600 dark:text-purple-400 font-medium hover:underline inline-flex items-center gap-1"
              >
                Go to Story <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </p>
          </div>
        </div>
        
        {/* Memory Capture in Empty State */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground font-semibold mb-3 uppercase tracking-wider">
            Add Memories
          </p>
          <MemoryCapture contactId={contactId} />
        </div>
      </section>
    );
  }

  // Populated State - Rich Content
  return (
    <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            AI Summary
          </h2>
        </div>
        <button 
          onClick={onNavigateToStory}
          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
        >
          View Full Story <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Content */}
      <div className="relative group">
        {/* Edit/Refresh Buttons */}
        <div className="absolute top-0 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950"
            onClick={handleRefresh}
            disabled={isRefreshing || isEditing}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
          </Button>
          {!isEditing && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950"
              onClick={() => {
                setIsEditing(true);
                setEditedContent(deepLore || '');
              }}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-[200px] text-sm"
              placeholder="Edit synopsis..."
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setEditedContent(deepLore || '');
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isSaving ? (
                  <>Saving...</>
                ) : (
                  <><Check className="h-3 w-3 mr-1" /> Save</>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-muted/30 rounded-lg p-5 border border-border/50">
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap pr-16">
              {deepLore || aiSummary || "No synopsis available."}
            </p>
            
            {/* Append Where Met if not included */}
            {whereMet && (!deepLore || !deepLore.includes(whereMet)) && (
              <p className="text-sm leading-relaxed mt-3 pt-3 border-t border-border/50">
                <span className="font-semibold text-purple-600 dark:text-purple-400">Where we met:</span> {whereMet}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Meta Footer */}
      {!isEditing && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <span className="text-xs text-muted-foreground">
            {formatTimeAgo(lastUpdated) || 'Recently updated'}
          </span>
          {/* Future: Add context badges here */}
        </div>
      )}

      {/* Memory Capture */}
      <div className="mt-6 pt-6 border-t border-border">
        <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mb-3 uppercase tracking-wider">
          Add More Memories
        </p>
        <MemoryCapture contactId={contactId} />
      </div>
    </section>
  );
}
