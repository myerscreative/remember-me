'use client';

import { useState } from 'react';
import { Heart, MessageCircle, Target, Sparkles } from 'lucide-react';
import { updateStoryFields } from '@/app/actions/story-actions';
import { toast } from 'react-hot-toast';

interface ValuesTabProps {
  contact: any;
}

export default function ValuesTab({ contact }: ValuesTabProps) {
  const [coreValues, setCoreValues] = useState<string[]>(contact.core_values || []);
  const [communicationStyle, setCommunicationStyle] = useState(contact.communication_style || '');
  const [personalityNotes, setPersonalityNotes] = useState(contact.personality_notes || '');
  const [valuesPersonality, setValuesPersonality] = useState(contact.values_personality || '');

  const handleBlur = async (field: string, value: any) => {
    const result = await updateStoryFields(contact.id, { [field]: value });
    if (result.success) {
      toast.success('Saved!', { duration: 1000 });
    } else {
      toast.error('Failed to save');
    }
  };

  const commonValues = [
    'Security', 'Freedom', 'Recognition', 'Contribution',
    'Growth', 'Family', 'Achievement', 'Authenticity',
    'Innovation', 'Stability', 'Adventure', 'Connection'
  ];

  const toggleValue = (value: string) => {
    const newValues = coreValues.includes(value)
      ? coreValues.filter(v => v !== value)
      : [...coreValues, value];
    setCoreValues(newValues);
    handleBlur('core_values', newValues);
  };

  return (
    <div className="flex flex-col gap-8 pb-20 text-slate-200">
      
      {/* AI-Generated Values & Personality Summary */}
      {valuesPersonality && (
        <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border border-purple-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="text-purple-400" size={16} />
            <label className="text-purple-400 text-xs font-black uppercase tracking-[0.2em]">
              AI Insights
            </label>
          </div>
          <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{valuesPersonality}</p>
        </div>
      )}

      {/* Core Values */}
      <div className="group">
        <label className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <Heart size={14} className="text-pink-500" /> Core Values
        </label>
        <p className="text-slate-400 text-sm mb-4">What seems most important to them</p>
        
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
        <label className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <MessageCircle size={14} className="text-blue-500" /> Communication Style
        </label>
        <p className="text-slate-400 text-sm mb-4">How they prefer to communicate and make decisions</p>
        
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
        <label className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <Target size={14} className="text-green-500" /> Personality & Motivations
        </label>
        <p className="text-slate-400 text-sm mb-4">Decision-making style, motivations, sensitivities</p>
        
        <textarea
          placeholder="What drives them? How do they make decisions? Any sensitivities to be aware of?"
          className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all min-h-[150px] resize-none leading-relaxed"
          value={personalityNotes}
          onChange={(e) => setPersonalityNotes(e.target.value)}
          onBlur={() => handleBlur('personality_notes', personalityNotes)}
        />
      </div>

      {/* Helper Text */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-4 text-sm text-slate-400">
        <p className="font-semibold text-slate-300 mb-2">💡 Why this matters</p>
        <p>Understanding someone's values and communication style helps you:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
          <li>Communicate more effectively</li>
          <li>Avoid misunderstandings</li>
          <li>Build stronger rapport</li>
          <li>Make better decisions together</li>
        </ul>
      </div>
    </div>
  );
}
