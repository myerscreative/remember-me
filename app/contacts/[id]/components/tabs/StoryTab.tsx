'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface Milestone {
  date: string;
  title: string;
  type: string;
}

interface SharedMemory {
  created_at: string;
  content: string;
}

import { Gift as GiftIcon, ShoppingBag, CheckCircle, Circle, Plus, Loader2 } from 'lucide-react';
import { addGiftIdea, toggleGiftStatus, type GiftIdea } from '@/app/actions/gift-actions';
import { updateStoryFields, addSharedMemory } from '@/app/actions/story-actions';

interface StoryTabProps {
  contact: {
    id: string;
    story?: {
      whereWeMet?: string;
      whyStayInContact?: string;
      whatsImportant?: string;
    };
    milestones?: Milestone[];
    gift_ideas?: GiftIdea[];
    shared_memories?: SharedMemory[];
  };
}

export function StoryTab({ contact }: StoryTabProps) {
  // Local state for auto-save fields
  const [whereMet, setWhereMet] = useState(contact.story?.whereWeMet || '');
  const [whyStay, setWhyStay] = useState(contact.story?.whyStayInContact || '');
  const [whatMatters, setWhatMatters] = useState(contact.story?.whatsImportant || '');
  const [company, setCompany] = useState((contact as any).company || '');
  const [jobTitle, setJobTitle] = useState((contact as any).job_title || '');
  
  // Memory Input State
  const [newMemory, setNewMemory] = useState('');
  const [isAddingMemory, setIsAddingMemory] = useState(false);
  const [isExpandedMemoryInput, setIsExpandedMemoryInput] = useState(false);

  // Auto-Save Handlers
  const handleBlur = async (field: string, value: string) => {
    const update: Record<string, string> = {};
    if (field === 'where_met') update.where_met = value;
    if (field === 'why_stay_in_contact') update.why_stay_in_contact = value;
    if (field === 'most_important_to_them') update.most_important_to_them = value;
    if (field === 'company') update.company = value;
    if (field === 'job_title') update.job_title = value;

    const result = await updateStoryFields(contact.id, update);
    if (!result.success) {
      toast.error("Failed to save");
    } else {
      // Notify user that AI summary is being generated
      toast.success("Saved! AI summary updating in background...", { duration: 2000 });
    }
  };

  const handleAddMemory = async () => {
    if (!newMemory.trim()) return;
    
    setIsAddingMemory(true);
    const result = await addSharedMemory(contact.id, newMemory.trim());
    setIsAddingMemory(false);

    if (result.success) {
      toast.success("Memory added to Vault");
      setNewMemory('');
      setIsExpandedMemoryInput(false);
    } else {
      toast.error("Failed to add memory");
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-20 text-slate-200">
      
      {/* SECTION: THE ORIGIN */}
      <div className="group">
        <label className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em] mb-2 block">
          The Origin Story
        </label>
        <textarea 
          placeholder="Where did you meet? What was your first impression?"
          className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all min-h-[120px] resize-none leading-relaxed"
          value={whereMet}
          onChange={(e) => setWhereMet(e.target.value)}
          onBlur={() => handleBlur('where_met', whereMet)}
        />
      </div>

      {/* SECTION: THE PHILOSOPHY */}
      <div className="group">
        <label className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em] mb-2 block">
          Connection Philosophy
        </label>
        <textarea 
          placeholder="Why do we stay in touch? What value does this connection bring?"
          className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[100px] resize-none leading-relaxed"
          value={whyStay}
          onChange={(e) => setWhyStay(e.target.value)}
          onBlur={() => handleBlur('why_stay_in_contact', whyStay)}
        />
      </div>

      {/* SECTION: WHAT MATTERS MOST */}
      <div className="group">
        <label className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em] mb-2 block">
          Current Priorities & Hobbies
        </label>
        <textarea 
          placeholder="What are they working on? (e.g., The Kalon Project, fishing trips, business scaling)"
          className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[120px] resize-none leading-relaxed"
          value={whatMatters}
          onChange={(e) => setWhatMatters(e.target.value)}
          onBlur={() => handleBlur('most_important_to_them', whatMatters)}
        />
      </div>

      {/* SECTION: CAREER & BUSINESS */}
      <div className="group">
        <label className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em] mb-2 block">
          Career & Business
        </label>
        <div className="flex flex-col md:flex-row gap-4">
          <input 
            type="text"
            placeholder="Job Title (e.g. Founder, Architect)"
            className="flex-1 bg-slate-900/50 border border-slate-800 rounded-xl p-3.5 text-slate-200 focus:outline-none focus:border-indigo-500"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            onBlur={() => handleBlur('job_title', jobTitle)}
          />
          <input 
            type="text"
            placeholder="Company (e.g. Kalon Project, Apple)"
            className="flex-1 bg-slate-900/50 border border-slate-800 rounded-xl p-3.5 text-slate-200 focus:outline-none focus:border-indigo-500"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            onBlur={() => handleBlur('company', company)}
          />
        </div>
      </div>

      {/* SECTION: MILESTONES */}
      <div className="group">
        <label className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em] mb-4 block">
          Key Milestones
        </label>
        
        <div className="space-y-3">
            {(contact.milestones || []).length > 0 ? (
                (contact.milestones || []).map((milestone, idx) => {
                    const milestoneDate = milestone.date ? new Date(milestone.date) : new Date();
                    const isUpcoming = milestoneDate > new Date();
                    return (
                        <div key={idx} className="flex gap-4 items-center bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                             <div className={`p-3 rounded-lg flex flex-col items-center justify-center w-14 h-14 ${isUpcoming ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800 text-slate-500'}`}>
                                <span className="text-[10px] font-bold uppercase">{milestoneDate.toLocaleString('default', { month: 'short' })}</span>
                                <span className="text-lg font-black leading-none">{milestoneDate.getDate()}</span>
                             </div>
                             
                             <div className="flex-1">
                                <h4 className={`text-sm font-bold ${isUpcoming ? 'text-white' : 'text-slate-500'}`}>{milestone.title}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full uppercase tracking-wide">{milestone.type}</span>
                                    {!isUpcoming && <span className="text-[10px] text-emerald-500 flex items-center gap-1">Occurred</span>}
                                </div>
                             </div>
                        </div>
                    );
                })
            ) : (
                <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl">
                    <p className="text-xs text-slate-500 italic">No upcoming milestones.</p>
                </div>
            )}
        </div>
      </div>



      {/* SECTION: GIFT VAULT */}
      <div className="group">
        <label className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
           <GiftIcon className="w-3 h-3" /> The Gift Vault
        </label>
        
        <GiftVault contactId={contact.id} initialGifts={contact.gift_ideas || []} />
      </div>

      {/* SECTION: THE VAULT (Shared Memories) */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <label className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em]">The Vault</label>
          <button 
            onClick={() => setIsExpandedMemoryInput(!isExpandedMemoryInput)}
            className="text-xs bg-indigo-600/20 text-indigo-400 px-3 py-1 rounded-full border border-indigo-600/30 hover:bg-indigo-600/40 transition-colors flex items-center gap-1"
          >
           <Plus size={12} /> Add Memory
          </button>
        </div>

        {/* Add Memory Form */}
        {isExpandedMemoryInput && (
           <div className="mb-4 bg-slate-900/80 p-3 rounded-xl border border-indigo-500/30 animate-in slide-in-from-top-2">
              <textarea
                autoFocus
                value={newMemory}
                onChange={(e) => setNewMemory(e.target.value)}
                placeholder="Log a specific moment..."
                className="w-full bg-transparent text-sm text-slate-200 focus:outline-none min-h-[60px] resize-none mb-2"
              />
              <div className="flex justify-end gap-2">
                 <button 
                   onClick={() => setIsExpandedMemoryInput(false)}
                   className="text-xs text-slate-500 hover:text-white px-3 py-1"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={handleAddMemory}
                   disabled={!newMemory.trim() || isAddingMemory}
                   className="bg-indigo-600 text-white text-xs px-4 py-1.5 rounded-lg hover:bg-indigo-500 disabled:opacity-50 flex items-center gap-2"
                 >
                   {isAddingMemory && <Loader2 size={12} className="animate-spin" />} Save to Vault
                 </button>
              </div>
           </div>
        )}

        <div className="space-y-3">
          {(contact.shared_memories || []).length > 0 ? (
            (contact.shared_memories || []).map((memory, idx) => {
               const createdAt = memory.created_at ? new Date(memory.created_at) : null;
               const formattedDate = createdAt 
                 ? createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                 : 'Recent';
               
               return (
                 <MemoryItem 
                   key={idx} 
                   date={formattedDate}
                   text={memory.content} 
                 />
               );
            })
          ) : (
            <div className="text-center py-8 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Vault is Empty</p>
                <p className="text-sm text-slate-600 mt-1">Add your first shared memory.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const MemoryItem = ({ date, text }: { date: string, text: string }) => (
  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl relative overflow-hidden group hover:border-slate-700 transition-colors">
    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50 group-hover:bg-indigo-500 transition-colors" />
    <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">{date}</span>
    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{text}</p>
  </div>
);



function GiftVault({ contactId, initialGifts }: { contactId: string, initialGifts: GiftIdea[] }) {
    const [gifts, setGifts] = useState<GiftIdea[]>(initialGifts);
    const [newGift, setNewGift] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleAdd = async () => {
        if (!newGift.trim()) return;
        setIsAdding(true);
        // Optimistic update
        const tempId = Math.random().toString();
        const optimisticGift: GiftIdea = {
            id: tempId,
            item: newGift,
            status: 'idea',
            created_at: new Date().toISOString()
        };
        setGifts([...gifts, optimisticGift]);

        const result = await addGiftIdea(contactId, newGift);
        if (!result.success) {
            toast.error("Failed to add gift");
            setGifts(gifts); // Revert
        } else {
             // In real app, we might want to replace tempId with real one from server or revalidate
             setIsAdding(false);
             setNewGift('');
        }
    };

    const handleToggle = async (id: string, currentStatus: GiftIdea['status']) => {
        const nextStatus: GiftIdea['status'] = currentStatus === 'idea' ? 'purchased' : (currentStatus === 'purchased' ? 'given' : 'idea');
        
        const updatedGifts = gifts.map(g => g.id === id ? { ...g, status: nextStatus } : g);
        setGifts(updatedGifts);

        await toggleGiftStatus(contactId, id, nextStatus);
    };

    return (
        <div className="space-y-4">
             {/* Add Input */}
             <div className="flex gap-2">
                 <input 
                    className="flex-1 bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
                    placeholder="Add a gift idea (e.g. Vintage Map, Sci-Fi Book)..."
                    value={newGift}
                    onChange={(e) => setNewGift(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                 />
                 <button 
                    onClick={handleAdd}
                    disabled={!newGift.trim() || isAdding}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl transition-colors disabled:opacity-50"
                 >
                    {isAdding ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                 </button>
             </div>

             {/* Gift List */}
             <div className="space-y-2">
                 {gifts.length > 0 ? (
                     gifts.map((gift) => (
                         <div key={gift.id} className="flex items-center justify-between p-3 bg-slate-900/40 border border-slate-800 rounded-xl group hover:border-slate-700 transition-colors">
                             <div className="flex items-center gap-3">
                                 <button onClick={() => handleToggle(gift.id, gift.status)} className="text-slate-500 hover:text-indigo-400 transition-colors">
                                     {gift.status === 'idea' && <Circle size={18} />}
                                     {gift.status === 'purchased' && <ShoppingBag size={18} className="text-emerald-500" />}
                                     {gift.status === 'given' && <CheckCircle size={18} className="text-slate-600" />}
                                 </button>
                                 <span className={cn("text-sm font-medium", gift.status === 'given' ? 'text-slate-600 line-through' : 'text-slate-300')}>
                                     {gift.item}
                                 </span>
                             </div>
                             <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600">
                                 {gift.status}
                             </span>
                         </div>
                     ))
                 ) : (
                    <div className="text-center py-4 border border-dashed border-slate-800 rounded-xl">
                        <p className="text-xs text-slate-600">No gift ideas yet.</p>
                    </div>
                 )}
             </div>
        </div>
    );
}
