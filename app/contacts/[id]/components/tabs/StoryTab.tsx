'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { Gift as GiftIcon, ShoppingBag, CheckCircle, Circle, Plus, Loader2, Heart, MessageCircle, Target, Sparkles, Handshake, Edit2, Check, X } from 'lucide-react';
import { addGiftIdea, toggleGiftStatus, type GiftIdea } from '@/app/actions/gift-actions';
import { updateStoryFields } from '@/app/actions/story-actions';

interface StoryTabProps {
  contact: any;
}

export function StoryTab({ contact }: StoryTabProps) {
  // Track which section is being edited
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // Local state for editing
  const [editValues, setEditValues] = useState<Record<string, any>>({});

  // Values fields
  const [coreValues, setCoreValues] = useState<string[]>(contact.core_values || []);
  const [communicationStyle, setCommunicationStyle] = useState(contact.communication_style || '');

  const commonValues = [
    'Security', 'Freedom', 'Recognition', 'Contribution',
    'Growth', 'Family', 'Achievement', 'Authenticity',
    'Innovation', 'Stability', 'Adventure', 'Connection'
  ];

  const startEdit = (section: string, currentValue: any) => {
    setEditingSection(section);
    setEditValues({ [section]: currentValue });
  };

  const cancelEdit = () => {
    setEditingSection(null);
    setEditValues({});
  };

  const saveEdit = async (field: string) => {
    const value = editValues[editingSection!];
    const update: Record<string, any> = { [field]: value };

    const result = await updateStoryFields(contact.id, update);
    if (!result.success) {
      toast.error("Failed to save");
    } else {
      toast.success("Saved!", { duration: 1500 });
      setEditingSection(null);
      setEditValues({});
      // Update the contact object
      (contact as any)[field] = value;
    }
  };

  const toggleValue = async (value: string) => {
    const newValues = coreValues.includes(value)
      ? coreValues.filter(v => v !== value)
      : [...coreValues, value];
    setCoreValues(newValues);

    const result = await updateStoryFields(contact.id, { core_values: newValues });
    if (result.success) {
      toast.success("Saved!", { duration: 1000 });
    }
  };

  const updateCommunicationStyle = async (style: string) => {
    setCommunicationStyle(style);
    const result = await updateStoryFields(contact.id, { communication_style: style });
    if (result.success) {
      toast.success("Saved!", { duration: 1000 });
    }
  };

  return (
    <div className="flex flex-col gap-3 pb-20 text-slate-200">

      {/* HOW WE MET */}
      <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-3">
        <DisplaySection
          emoji="📍"
          title="HOW WE MET"
          content={contact.where_met}
          isEditing={editingSection === 'where_met'}
          editValue={editValues['where_met']}
          onEdit={() => startEdit('where_met', contact.where_met || '')}
          onCancel={cancelEdit}
          onSave={() => saveEdit('where_met')}
          onChange={(val) => setEditValues({ where_met: val })}
          placeholder="Where did you meet? What was your first impression?"
        />
      </div>

      {/* WHY WE STAY CONNECTED */}
      <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-3">
        <DisplaySection
          emoji="💭"
          title="WHY WE STAY CONNECTED"
          content={contact.why_stay_in_contact}
          isEditing={editingSection === 'why_stay_in_contact'}
          editValue={editValues['why_stay_in_contact']}
          onEdit={() => startEdit('why_stay_in_contact', contact.why_stay_in_contact || '')}
          onCancel={cancelEdit}
          onSave={() => saveEdit('why_stay_in_contact')}
          onChange={(val) => setEditValues({ why_stay_in_contact: val })}
          placeholder="Why do we stay in touch? What value does this connection bring?"
        />
      </div>

      {/* WHAT MATTERS TO THEM */}
      <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-3">
        <DisplaySection
          emoji="💎"
          title="WHAT MATTERS TO THEM"
          content={contact.most_important_to_them}
          isEditing={editingSection === 'most_important_to_them'}
          editValue={editValues['most_important_to_them']}
          onEdit={() => startEdit('most_important_to_them', contact.most_important_to_them || '')}
          onCancel={cancelEdit}
          onSave={() => saveEdit('most_important_to_them')}
          onChange={(val) => setEditValues({ most_important_to_them: val })}
          placeholder="What are they working on? Family, business, hobbies, health, faith..."
          multiline
        />
      </div>

      {/* CAREER & BUSINESS */}
      <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-3">
        <label className="text-indigo-400 text-xs font-black uppercase tracking-[0.15em] mb-2 block">
          💼 CAREER & BUSINESS
        </label>
        {(contact.job_title || contact.company) ? (
          <p className="text-slate-300 text-sm leading-relaxed">
            {contact.job_title && <span className="font-medium">{contact.job_title}</span>}
            {contact.job_title && contact.company && <span className="text-slate-500"> at </span>}
            {contact.company && <span>{contact.company}</span>}
          </p>
        ) : (
          <p className="text-slate-500 text-sm italic">Not set</p>
        )}
      </div>

      {/* CHALLENGES */}
      {contact.current_challenges && (
        <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-3">
          <DisplaySection
            emoji="💪"
            title="CURRENT CHALLENGES"
            content={contact.current_challenges}
            isEditing={editingSection === 'current_challenges'}
            editValue={editValues['current_challenges']}
            onEdit={() => startEdit('current_challenges', contact.current_challenges || '')}
            onCancel={cancelEdit}
            onSave={() => saveEdit('current_challenges')}
            onChange={(val) => setEditValues({ current_challenges: val })}
            placeholder="Current challenges, obstacles, what they're navigating..."
            multiline
          />
        </div>
      )}

      {/* GOALS & ASPIRATIONS */}
      {contact.goals_aspirations && (
        <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-3">
          <DisplaySection
            emoji="✨"
            title="GOALS & ASPIRATIONS"
            content={contact.goals_aspirations}
            isEditing={editingSection === 'goals_aspirations'}
            editValue={editValues['goals_aspirations']}
            onEdit={() => startEdit('goals_aspirations', contact.goals_aspirations || '')}
            onCancel={cancelEdit}
            onSave={() => saveEdit('goals_aspirations')}
            onChange={(val) => setEditValues({ goals_aspirations: val })}
            placeholder="Goals, dreams, aspirations, what drives them forward..."
            multiline
          />
        </div>
      )}

      {/* CORE VALUES */}
      {coreValues.length > 0 && (
        <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-3">
          <label className="text-indigo-400 text-xs font-black uppercase tracking-[0.15em] mb-2 flex items-center gap-2">
            <Heart size={13} className="text-pink-500" /> CORE VALUES
          </label>
          <div className="flex flex-wrap gap-2">
            {coreValues.map(value => (
              <span key={value} className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-600/20 text-indigo-300 border border-indigo-500/30">
                {value}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* COMMUNICATION STYLE */}
      {communicationStyle && (
        <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-3">
          <label className="text-indigo-400 text-xs font-black uppercase tracking-[0.15em] mb-2 flex items-center gap-2">
            <MessageCircle size={13} className="text-blue-500" /> COMMUNICATION STYLE
          </label>
          <p className="text-slate-300 text-sm">{communicationStyle}</p>
        </div>
      )}

      {/* PERSONALITY & MOTIVATIONS */}
      {contact.personality_notes && (
        <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-3">
          <DisplaySection
            emoji="🎯"
            title="PERSONALITY & MOTIVATIONS"
            content={contact.personality_notes}
            isEditing={editingSection === 'personality_notes'}
            editValue={editValues['personality_notes']}
            onEdit={() => startEdit('personality_notes', contact.personality_notes || '')}
            onCancel={cancelEdit}
            onSave={() => saveEdit('personality_notes')}
            onChange={(val) => setEditValues({ personality_notes: val })}
            placeholder="What drives them? How do they make decisions?"
            multiline
          />
        </div>
      )}

      {/* MUTUAL VALUE */}
      {contact.mutual_value_introductions && (
        <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-3">
          <DisplaySection
            emoji="🤝"
            title="MUTUAL VALUE & COLLABORATION"
            content={contact.mutual_value_introductions}
            isEditing={editingSection === 'mutual_value_introductions'}
            editValue={editValues['mutual_value_introductions']}
            onEdit={() => startEdit('mutual_value_introductions', contact.mutual_value_introductions || '')}
            onCancel={cancelEdit}
            onSave={() => saveEdit('mutual_value_introductions')}
            onChange={(val) => setEditValues({ mutual_value_introductions: val })}
            placeholder="How you can help each other, introductions, collaboration opportunities..."
            multiline
          />
        </div>
      )}

      {/* GIFT VAULT */}
      <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-3">
        <label className="text-indigo-400 text-xs font-black uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
          <GiftIcon className="w-3 h-3" /> GIFT VAULT
        </label>
        <GiftVault contactId={contact.id} initialGifts={contact.gift_ideas || []} />
      </div>
    </div>
  );
}

// Display Section Component
interface DisplaySectionProps {
  emoji: string;
  title: string;
  content?: string;
  isEditing: boolean;
  editValue: string;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}

function DisplaySection({
  emoji,
  title,
  content,
  isEditing,
  editValue,
  onEdit,
  onCancel,
  onSave,
  onChange,
  placeholder,
  multiline = false
}: DisplaySectionProps) {
  if (isEditing) {
    return (
      <div className="group">
        <label className="text-indigo-400 text-xs font-black uppercase tracking-[0.15em] mb-2 block">
          {emoji} {title}
        </label>
        {multiline ? (
          <textarea
            value={editValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-slate-900/30 border border-indigo-500/50 rounded-xl p-3.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-all min-h-[100px] resize-none leading-relaxed"
            autoFocus
          />
        ) : (
          <input
            type="text"
            value={editValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-slate-900/30 border border-indigo-500/50 rounded-lg p-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
            autoFocus
          />
        )}
        <div className="flex gap-2 mt-2">
          <button
            onClick={onSave}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors"
          >
            <Check size={14} /> Save
          </button>
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
          >
            <X size={14} /> Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative">
      <label className="text-indigo-400 text-xs font-black uppercase tracking-[0.15em] mb-1 block">
        {emoji} {title}
      </label>
      {content ? (
        <div className="relative">
          <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap pr-8">{content}</p>
          <button
            onClick={onEdit}
            className="absolute top-0 right-0 p-1 text-slate-500 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Edit"
          >
            <Edit2 size={14} />
          </button>
        </div>
      ) : (
        <button
          onClick={onEdit}
          className="text-slate-500 hover:text-indigo-400 text-sm italic transition-colors"
        >
          + Add {title.toLowerCase()}
        </button>
      )}
    </div>
  );
}

// Gift Vault Component
function GiftVault({ contactId, initialGifts }: { contactId: string, initialGifts: GiftIdea[] }) {
    const [gifts, setGifts] = useState<GiftIdea[]>(initialGifts);
    const [newGift, setNewGift] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleAdd = async () => {
        if (!newGift.trim()) return;
        setIsAdding(true);
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
            setGifts(gifts);
        } else {
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
        <div className="space-y-3">
             <div className="flex gap-2">
                 <input
                    className="flex-1 bg-slate-900/30 border border-slate-800/50 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/70 transition-all"
                    placeholder="Add a gift idea..."
                    value={newGift}
                    onChange={(e) => setNewGift(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                 />
                 <button
                    onClick={handleAdd}
                    disabled={!newGift.trim() || isAdding}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg transition-colors disabled:opacity-50"
                 >
                    {isAdding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                 </button>
             </div>

             <div className="space-y-2">
                 {gifts.length > 0 ? (
                     gifts.map((gift) => (
                         <div key={gift.id} className="flex items-center justify-between p-2.5 bg-slate-900/30 border border-slate-800/50 rounded-lg group hover:border-slate-700/50 transition-colors">
                             <div className="flex items-center gap-2.5">
                                 <button onClick={() => handleToggle(gift.id, gift.status)} className="text-slate-500 hover:text-indigo-400 transition-colors">
                                     {gift.status === 'idea' && <Circle size={16} />}
                                     {gift.status === 'purchased' && <ShoppingBag size={16} className="text-emerald-500" />}
                                     {gift.status === 'given' && <CheckCircle size={16} className="text-slate-600" />}
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
                    <div className="text-center py-3 border border-dashed border-slate-800/50 rounded-lg">
                        <p className="text-xs text-slate-600">No gift ideas yet.</p>
                    </div>
                 )}
             </div>
        </div>
    );
}
