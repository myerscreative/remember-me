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

import { Gift as GiftIcon, ShoppingBag, CheckCircle, Circle, Plus, Loader2, Heart, MessageCircle, Target, Sparkles, Handshake, ArrowLeftRight, Users, Lightbulb } from 'lucide-react';
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
  const [challenges, setChallenges] = useState((contact as any).current_challenges || '');
  const [aspirations, setAspirations] = useState((contact as any).goals_aspirations || '');

  // Values fields
  const [coreValues, setCoreValues] = useState<string[]>((contact as any).core_values || []);
  const [communicationStyle, setCommunicationStyle] = useState((contact as any).communication_style || '');
  const [personalityNotes, setPersonalityNotes] = useState((contact as any).personality_notes || '');
  const [valuesPersonality, setValuesPersonality] = useState((contact as any).values_personality || '');

  // Mutual Value field
  const [mutualValueIntroductions, setMutualValueIntroductions] = useState((contact as any).mutual_value_introductions || '');

  // Memory Input State
  const [newMemory, setNewMemory] = useState('');
  const [isAddingMemory, setIsAddingMemory] = useState(false);
  const [isExpandedMemoryInput, setIsExpandedMemoryInput] = useState(false);

  console.log('🔍 [DEBUG] StoryTab - Company:', (contact as any).company, 'Job Title:', (contact as any).job_title);
  console.log('🔍 [DEBUG] StoryTab - Full contact keys:', Object.keys(contact));

  // Auto-Save Handlers
  const handleBlur = async (field: string, value: any) => {
    const update: Record<string, any> = {};
    if (field === 'where_met') update.where_met = value;
    if (field === 'why_stay_in_contact') update.why_stay_in_contact = value;
    if (field === 'most_important_to_them') update.most_important_to_them = value;
    if (field === 'company') update.company = value;
    if (field === 'job_title') update.job_title = value;
    if (field === 'current_challenges') update.current_challenges = value;
    if (field === 'goals_aspirations') update.goals_aspirations = value;
    if (field === 'core_values') update.core_values = value;
    if (field === 'communication_style') update.communication_style = value;
    if (field === 'personality_notes') update.personality_notes = value;
    if (field === 'mutual_value_introductions') update.mutual_value_introductions = value;

    const result = await updateStoryFields(contact.id, update);
    if (!result.success) {
      toast.error("Failed to save");
    } else {
      // Notify user that AI summary is being generated
      toast.success("Saved! AI summary updating in background...", { duration: 2000 });
    }
  };

  const toggleValue = (value: string) => {
    const newValues = coreValues.includes(value)
      ? coreValues.filter(v => v !== value)
      : [...coreValues, value];
    setCoreValues(newValues);
    handleBlur('core_values', newValues);
  };

  const commonValues = [
    'Security', 'Freedom', 'Recognition', 'Contribution',
    'Growth', 'Family', 'Achievement', 'Authenticity',
    'Innovation', 'Stability', 'Adventure', 'Connection'
  ];

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
          How We Met
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
          Why We Stay Connected
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
          What Matters to Them
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

      {/* SECTION: CURRENT CHALLENGES */}
      <div className="group">
        <label className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em] mb-2 block">
          💪 Current Challenges
        </label>
        <textarea 
          placeholder="Current challenges, obstacles, what they're navigating right now..."
          className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[100px] resize-none leading-relaxed"
          value={challenges}
          onChange={(e) => setChallenges(e.target.value)}
          onBlur={() => handleBlur('current_challenges', challenges)}
        />
      </div>

      {/* SECTION: GOALS & ASPIRATIONS */}
      <div className="group">
        <label className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em] mb-2 block">
          ✨ Goals & Aspirations
        </label>
        <textarea
          placeholder="Goals, dreams, aspirations, what drives them forward..."
          className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[100px] resize-none leading-relaxed"
          value={aspirations}
          onChange={(e) => setAspirations(e.target.value)}
          onBlur={() => handleBlur('goals_aspirations', aspirations)}
        />
      </div>

      {/* AI-Generated Values & Personality Summary */}
      {valuesPersonality && (
        <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border border-purple-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="text-purple-400" size={16} />
            <label className="text-purple-400 text-xs font-black uppercase tracking-[0.2em]">
              AI Insights - Values & Personality
            </label>
          </div>
          <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{valuesPersonality}</p>
        </div>
      )}

      {/* Core Values */}
      <div className="group">
        <label className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
          <Heart size={14} className="text-pink-500" /> Core Values
        </label>
        <p className="text-slate-400 text-sm mb-3">What seems most important to them</p>

        <div className="flex flex-wrap gap-2">
          {commonValues.map(value => (
            <button
              key={value}
              onClick={() => toggleValue(value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                coreValues.includes(value)
                  ? 'bg-indigo-600 text-white border-2 border-indigo-400'
                  : 'bg-slate-900 text-slate-400 border-2 border-slate-800 hover:border-indigo-500/50'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {/* Communication Style */}
      <div className="group">
        <label className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
          <MessageCircle size={14} className="text-blue-500" /> Communication Style
        </label>
        <p className="text-slate-400 text-sm mb-3">How they prefer to communicate and make decisions</p>

        <div className="flex gap-3">
          {['Direct', 'Cautious', 'Relational', 'Analytical'].map(style => (
            <button
              key={style}
              onClick={() => {
                setCommunicationStyle(style);
                handleBlur('communication_style', style);
              }}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                communicationStyle === style
                  ? 'bg-blue-600 text-white border-2 border-blue-400'
                  : 'bg-slate-900 text-slate-400 border-2 border-slate-800 hover:border-blue-500/50'
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      {/* Personality & Motivations */}
      <div className="group">
        <label className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
          <Target size={14} className="text-green-500" /> Personality & Motivations
        </label>
        <p className="text-slate-400 text-sm mb-3">Decision-making style, motivations, sensitivities</p>

        <textarea
          placeholder="What drives them? How do they make decisions? Any sensitivities to be aware of?"
          className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[120px] resize-none leading-relaxed"
          value={personalityNotes}
          onChange={(e) => setPersonalityNotes(e.target.value)}
          onBlur={() => handleBlur('personality_notes', personalityNotes)}
        />
      </div>

      {/* Mutual Value Section */}
      <div className="group">
        <label className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
          <Handshake size={14} className="text-green-500" /> Mutual Value & Collaboration
        </label>
        <p className="text-slate-400 text-sm mb-3">How you can help each other, introductions, and collaboration opportunities</p>

        <textarea
          placeholder="How can you help them? How can they help you? Potential introductions and collaboration opportunities..."
          className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[150px] resize-none leading-relaxed"
          value={mutualValueIntroductions}
          onChange={(e) => setMutualValueIntroductions(e.target.value)}
          onBlur={() => handleBlur('mutual_value_introductions', mutualValueIntroductions)}
        />
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
