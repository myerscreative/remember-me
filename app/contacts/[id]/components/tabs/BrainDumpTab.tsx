'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PostCallPulse } from '../PostCallPulse';
import { Mic, Plus, Loader2 } from 'lucide-react';
import { addSharedMemory } from '@/app/actions/story-actions';
import { ReviewChangesModal } from '../ReviewChangesModal';
import { updateStoryFields } from '@/app/actions/story-actions';
import { updateFamilyMembers } from '@/app/actions/update-family-members';

interface SharedMemory {
  created_at: string;
  content: string;
}

interface BrainDumpTabProps {
  contact: {
    id: string;
    first_name: string;
    last_name?: string;
    shared_memories?: SharedMemory[];
  };
}

export function BrainDumpTab({ contact }: BrainDumpTabProps) {
  const router = useRouter();
  const [showPostCallPulse, setShowPostCallPulse] = useState(false);
  const [newMemory, setNewMemory] = useState('');
  const [isAddingMemory, setIsAddingMemory] = useState(false);
  const [optimisticMemories, setOptimisticMemories] = useState<SharedMemory[]>([]);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<any>(null);

  const contactName = `${contact.first_name} ${contact.last_name || ''}`.trim();

  // Combine optimistic memories with real ones
  const allMemories = [...optimisticMemories, ...(contact.shared_memories || [])];

  const handleAddMemory = async () => {
    if (!newMemory.trim()) {
      toast.error('Please enter some text');
      return;
    }

    console.log('🔵 [BrainDumpTab] Starting to add memory:', newMemory.substring(0, 50));
    
    // Optimistically add to UI
    const optimisticMemory: SharedMemory = {
      id: `temp-${Date.now()}`,
      content: newMemory,
      created_at: new Date().toISOString(),
      person_id: contact.id,
      user_id: ''
    };
    
    setOptimisticMemories(prev => [optimisticMemory, ...prev]);
    setNewMemory('');
    setIsAddingMemory(true); // Using existing state variable name

    try {
      console.log('🔵 [BrainDumpTab] Calling addSharedMemory for contact:', contact.id);
      const result = await addSharedMemory(contact.id, newMemory);
      
      console.log('🔵 [BrainDumpTab] addSharedMemory result:', result);
      
      if (result.success) {
        console.log('✅ [BrainDumpTab] Memory saved successfully');
        toast.success('Memory saved!');
        // Clear optimistic update and refresh to get real data
        setOptimisticMemories([]);
        router.refresh(); // Refresh the page data to show the new memory
      } else {
        console.error('❌ [BrainDumpTab] Failed to save memory:', result.error);
        toast.error(result.error || 'Failed to save memory');
        // Remove optimistic update on error
        setOptimisticMemories([]);
        setNewMemory(newMemory); // Restore the text
      }
    } catch (error) {
      console.error('❌ [BrainDumpTab] Exception:', error);
      toast.error('Failed to save memory');
      setOptimisticMemories([]);
      setNewMemory(newMemory);
    } finally {
      setIsAddingMemory(false); // Using existing state variable name
    }
  };

  const handleReprocessMemories = async () => {
    setIsReprocessing(true);
    try {
      // Step 1: Get preview of changes
      const response = await fetch('/api/reprocess-memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId: contact.id, preview: true })
      });

      if (!response.ok) throw new Error('Failed to reprocess');

      const result = await response.json();
      
      // Step 2: Show review modal with extracted changes
      if (result.preview) {
        setPendingChanges(result.preview);
        setShowReviewModal(true);
      } else {
        toast.success('No changes detected');
      }
    } catch (error) {
      console.error('Reprocess error:', error);
      toast.error('Failed to reprocess memories');
    } finally {
      setIsReprocessing(false);
    }
  };

  const handleAcceptChanges = async (editedChanges: any) => {
    try {
      // Save all the edited changes
      const storyFields: any = {};
      if (editedChanges.company) storyFields.company = editedChanges.company;
      if (editedChanges.job_title) storyFields.job_title = editedChanges.job_title;
      if (editedChanges.most_important_to_them) storyFields.most_important_to_them = editedChanges.most_important_to_them;
      if (editedChanges.current_challenges) storyFields.current_challenges = editedChanges.current_challenges;
      if (editedChanges.goals_aspirations) storyFields.goals_aspirations = editedChanges.goals_aspirations;
      if (editedChanges.where_met) storyFields.where_met = editedChanges.where_met;

      if (Object.keys(storyFields).length > 0) {
        await updateStoryFields(contact.id, storyFields);
      }

      if (editedChanges.family_members && editedChanges.family_members.length > 0) {
        await updateFamilyMembers(contact.id, editedChanges.family_members);
      }

      setShowReviewModal(false);
      setPendingChanges(null);
      toast.success('Changes saved successfully!');
      router.refresh();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save changes');
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-20">
      {/* Quick Voice Brain Dump Button */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 shadow-xl">
        <h3 className="text-white text-lg font-bold mb-2 flex items-center gap-2">
          <Mic className="w-5 h-5" />
          Voice Brain Dump
        </h3>
        <p className="text-indigo-100 text-sm mb-4">
          Capture what you just discussed with {contactName} while it&apos;s fresh in your mind.
        </p>
        <button
          onClick={() => setShowPostCallPulse(true)}
          className="w-full bg-white text-indigo-600 font-bold py-3 px-4 rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
        >
          <Mic className="w-5 h-5" />
          Start Brain Dump
        </button>
      </div>

      {/* Text Input for Quick Memory */}
      <div className="bg-[#1a1f2e] rounded-2xl p-5 border border-slate-800/50">
        <label className="text-[#94a3b8] text-[11px] font-semibold uppercase tracking-wider mb-3 block">
          ✏️ Quick Text Memory
        </label>
        <textarea
          value={newMemory}
          onChange={(e) => setNewMemory(e.target.value)}
          placeholder={`Add a quick note about ${contactName}...`}
          className="w-full bg-[#0f1419] border border-[#2d3748] focus:border-[#7c3aed] rounded-xl p-3.5 text-white text-[15px] outline-none resize-none min-h-[100px] placeholder:text-[#64748b] transition-colors"
        />
        <button
          onClick={handleAddMemory}
          disabled={!newMemory.trim() || isAddingMemory}
          className="mt-3 w-full bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {isAddingMemory ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              Add Memory
            </>
          )}
        </button>
      </div>

      {/* Recent Memories */}
      <div className="bg-[#1a1f2e] rounded-2xl p-5 border border-slate-800/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[#94a3b8] text-[11px] font-semibold uppercase tracking-wider">
            💭 Memory Vault ({allMemories.length})
          </h3>
          <button
            onClick={handleReprocessMemories}
            disabled={isReprocessing || allMemories.length === 0}
            className="text-[10px] bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
          >
            {isReprocessing ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                🤖 Reprocess All
              </>
            )}
          </button>
          {optimisticMemories.length > 0 && (
            <span className="text-[#fbbf24] text-[10px] font-medium animate-pulse">
              Saving...
            </span>
          )}
        </div>
        {allMemories.length > 0 ? (
          <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto">
            {allMemories.map((memory, index) => {
              const isOptimistic = optimisticMemories.includes(memory);
              return (
                <div key={index} className={`bg-[#0f1419] p-4 rounded-lg border transition-all ${
                  isOptimistic ? 'border-[#fbbf24] animate-pulse' : 'border-[#2d3748]'
                }`}>
                  <div className="text-[#64748b] text-[11px] mb-2 flex items-center justify-between">
                    <span>
                      {new Date(memory.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </span>
                    {isOptimistic && (
                      <span className="text-[#fbbf24] text-[10px] font-medium">
                        Saving...
                      </span>
                    )}
                  </div>
                  <div className="text-[#cbd5e1] text-[14px] leading-relaxed whitespace-pre-wrap">
                    {memory.content}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-[#64748b] text-[13px] italic text-center py-8">
            No memories yet. Add one above!
          </div>
        )}
      </div>

      {/* Post Call Pulse Modal */}
      {showPostCallPulse && (
        <PostCallPulse
          contactId={contact.id}
          name={contactName}
          onClose={() => setShowPostCallPulse(false)}
          onComplete={() => {
            setShowPostCallPulse(false);
            toast.success("Brain dump saved! AI summary updating...", { duration: 2000 });
            router.refresh();
          }}
        />
      )}

      {/* Review Changes Modal */}
      {showReviewModal && pendingChanges && (
        <ReviewChangesModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setPendingChanges(null);
          }}
          changes={pendingChanges}
          onAccept={handleAcceptChanges}
        />
      )}
    </div>
  );
}
