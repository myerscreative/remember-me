'use client';

import { useState } from 'react';
import { Handshake, ArrowLeftRight, Users, Lightbulb, Sparkles } from 'lucide-react';
import { updateStoryFields } from '@/app/actions/story-actions';
import { toast } from 'react-hot-toast';
import { AudioInputButton } from '@/components/audio-input-button';

interface MutualValueTabProps {
  contact: any;
}

export default function MutualValueTab({ contact }: MutualValueTabProps) {
  const [mutualValueIntroductions, setMutualValueIntroductions] = useState(
    contact.mutual_value_introductions || ''
  );

  const handleBlur = async () => {
    const result = await updateStoryFields(contact.id, { 
      mutual_value_introductions: mutualValueIntroductions 
    });
    if (result.success) {
      toast.success('Saved!', { duration: 1000 });
    } else {
      toast.error('Failed to save');
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-20 text-slate-200">
      
      {/* AI-Generated Mutual Value Summary */}
      {mutualValueIntroductions && (
        <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="text-green-400" size={16} />
            <label className="text-green-400 text-xs font-black uppercase tracking-[0.2em]">
              AI Insights
            </label>
          </div>
          <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{mutualValueIntroductions}</p>
        </div>
      )}

      {/* How I Can Help Them */}
      <div className="group">
        <label className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
          <Handshake size={14} className="text-blue-500" /> How I Can Help Them
        </label>
        <p className="text-slate-400 text-sm mb-4">Ways you can provide value or assistance</p>
        
        <div className="relative">
          <textarea
            placeholder="What can you offer? Introductions, expertise, resources, connections..."
            className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-4 pr-12 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all min-h-[120px] resize-none leading-relaxed"
            value={mutualValueIntroductions.split('\n\n')[0] || ''}
            onChange={(e) => {
              const parts = mutualValueIntroductions.split('\n\n');
              parts[0] = e.target.value;
              setMutualValueIntroductions(parts.join('\n\n'));
            }}
            onBlur={handleBlur}
          />
          <div className="absolute right-2 bottom-4">
            <AudioInputButton 
              onTranscript={(text) => {
                const parts = mutualValueIntroductions.split('\n\n');
                parts[0] = parts[0] ? `${parts[0]} ${text}` : text;
                const newValue = parts.join('\n\n');
                setMutualValueIntroductions(newValue);
                updateStoryFields(contact.id, { mutual_value_introductions: newValue });
              }}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* How They Can Help Me */}
      <div className="group">
        <label className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
          <ArrowLeftRight size={14} className="text-purple-500" /> How They Can Help Me
        </label>
        <p className="text-slate-400 text-sm mb-4">Ways they can provide value or assistance</p>
        
        <div className="relative">
          <textarea
            placeholder="What can they offer? Their expertise, network, resources, insights..."
            className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-4 pr-12 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all min-h-[120px] resize-none leading-relaxed"
            value={mutualValueIntroductions.split('\n\n')[1] || ''}
            onChange={(e) => {
              const parts = mutualValueIntroductions.split('\n\n');
              parts[1] = e.target.value;
              setMutualValueIntroductions(parts.join('\n\n'));
            }}
            onBlur={handleBlur}
          />
          <div className="absolute right-2 bottom-4">
            <AudioInputButton 
              onTranscript={(text) => {
                const parts = mutualValueIntroductions.split('\n\n');
                parts[1] = parts[1] ? `${parts[1]} ${text}` : text;
                const newValue = parts.join('\n\n');
                setMutualValueIntroductions(newValue);
                updateStoryFields(contact.id, { mutual_value_introductions: newValue });
              }}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Introductions & Connections */}
      <div className="group">
        <label className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
          <Users size={14} className="text-cyan-500" /> Introductions & Connections
        </label>
        <p className="text-slate-400 text-sm mb-4">People to introduce, connections to make</p>
        
        <div className="relative">
          <textarea
            placeholder="Who should you introduce them to? Who did you promise to connect them with?"
            className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-4 pr-12 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all min-h-[120px] resize-none leading-relaxed"
            value={mutualValueIntroductions.split('\n\n')[2] || ''}
            onChange={(e) => {
              const parts = mutualValueIntroductions.split('\n\n');
              parts[2] = e.target.value;
              setMutualValueIntroductions(parts.join('\n\n'));
            }}
            onBlur={handleBlur}
          />
          <div className="absolute right-2 bottom-4">
            <AudioInputButton 
              onTranscript={(text) => {
                const parts = mutualValueIntroductions.split('\n\n');
                parts[2] = parts[2] ? `${parts[2]} ${text}` : text;
                const newValue = parts.join('\n\n');
                setMutualValueIntroductions(newValue);
                updateStoryFields(contact.id, { mutual_value_introductions: newValue });
              }}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Collaboration Opportunities */}
      <div className="group">
        <label className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
          <Lightbulb size={14} className="text-yellow-500" /> Collaboration Opportunities
        </label>
        <p className="text-slate-400 text-sm mb-4">Projects, partnerships, or ways to work together</p>
        
        <div className="relative">
          <textarea
            placeholder="What could you build together? Business opportunities, creative projects, shared goals..."
            className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-4 pr-12 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all min-h-[120px] resize-none leading-relaxed"
            value={mutualValueIntroductions.split('\n\n')[3] || ''}
            onChange={(e) => {
              const parts = mutualValueIntroductions.split('\n\n');
              parts[3] = e.target.value;
              setMutualValueIntroductions(parts.join('\n\n'));
            }}
            onBlur={handleBlur}
          />
          <div className="absolute right-2 bottom-4">
            <AudioInputButton 
              onTranscript={(text) => {
                const parts = mutualValueIntroductions.split('\n\n');
                parts[3] = parts[3] ? `${parts[3]} ${text}` : text;
                const newValue = parts.join('\n\n');
                setMutualValueIntroductions(newValue);
                updateStoryFields(contact.id, { mutual_value_introductions: newValue });
              }}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Helper Text */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-4 text-sm text-slate-400">
        <p className="font-semibold text-slate-300 mb-2">💡 Why this matters</p>
        <p>Tracking mutual value helps you:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
          <li>Remember promises and commitments</li>
          <li>Identify collaboration opportunities</li>
          <li>Build reciprocal, valuable relationships</li>
          <li>Follow through on introductions</li>
        </ul>
      </div>
    </div>
  );
}
