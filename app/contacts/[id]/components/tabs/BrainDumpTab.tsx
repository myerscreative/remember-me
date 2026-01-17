'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PostCallPulse } from '../PostCallPulse';
import { Mic, Plus, Loader2 } from 'lucide-react';
import { addSharedMemory } from '@/app/actions/story-actions';

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

  const contactName = `${contact.first_name} ${contact.last_name || ''}`.trim();

  const handleAddMemory = async () => {
    if (!newMemory.trim()) return;

    setIsAddingMemory(true);
    const result = await addSharedMemory(contact.id, newMemory.trim());
    setIsAddingMemory(false);

    if (result.success) {
      toast.success("Memory added! AI summary updating in background...", { duration: 2000 });
      setNewMemory('');
      router.refresh();
    } else {
      toast.error("Failed to add memory");
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
          Capture what you just discussed with {contactName} while it's fresh in your mind.
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
        <h3 className="text-[#94a3b8] text-[11px] font-semibold uppercase tracking-wider mb-3">
          💭 Memory Vault ({contact.shared_memories?.length || 0})
        </h3>
        {(contact.shared_memories?.length || 0) > 0 ? (
          <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto">
            {contact.shared_memories!.map((memory, index) => (
              <div key={index} className="bg-[#0f1419] p-4 rounded-lg border border-[#2d3748]">
                <div className="text-[#64748b] text-[11px] mb-2">
                  {new Date(memory.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
                <div className="text-[#cbd5e1] text-[14px] leading-relaxed whitespace-pre-wrap">
                  {memory.content}
                </div>
              </div>
            ))}
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
    </div>
  );
}
