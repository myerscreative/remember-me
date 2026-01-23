'use client';

import { useState } from 'react';
import { X, Edit2, Check } from 'lucide-react';

interface FamilyMember {
  name: string;
  relationship: string;
  birthday?: string;
  notes?: string;
}

interface ExtractedChanges {
  company?: string;
  job_title?: string;
  most_important_to_them?: string;
  current_challenges?: string;
  goals_aspirations?: string;
  family_members?: FamilyMember[];
  interests?: string[];
  where_met?: string;
}

interface ReviewChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  changes: ExtractedChanges;
  onAccept: (editedChanges: ExtractedChanges) => Promise<void>;
}

export function ReviewChangesModal({ isOpen, onClose, changes, onAccept }: ReviewChangesModalProps) {
  const [editedChanges, setEditedChanges] = useState<ExtractedChanges>(changes);
  const [isAccepting, setIsAccepting] = useState(false);

  if (!isOpen) return null;

  const hasChanges = Object.keys(changes).some(key => {
    const value = changes[key as keyof ExtractedChanges];
    return value && (Array.isArray(value) ? value.length > 0 : true);
  });

  const handleAccept = async () => {
    setIsAccepting(true);
    await onAccept(editedChanges);
    setIsAccepting(false);
  };

  const updateField = (field: keyof ExtractedChanges, value: any) => {
    setEditedChanges(prev => ({ ...prev, [field]: value }));
  };

  const updateFamilyMember = (index: number, field: keyof FamilyMember, value: string) => {
    const newMembers = [...(editedChanges.family_members || [])];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setEditedChanges(prev => ({ ...prev, family_members: newMembers }));
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1f2e] rounded-2xl border border-slate-700 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              🤖 Review AI Extracted Changes
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Review and edit the information before saving
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!hasChanges && (
            <div className="text-center py-12 text-slate-400">
              No changes detected from the brain dumps.
            </div>
          )}

          {/* Career & Business */}
          {(changes.company || changes.job_title) && (
            <div className="space-y-3">
              <h3 className="text-indigo-400 text-xs font-black uppercase tracking-wider">
                💼 Career & Business
              </h3>
              <div className="space-y-3">
                {changes.company && (
                  <div className="bg-slate-900/50 rounded-lg p-3 border-2 border-green-500/30">
                    <label className="text-xs text-slate-400 mb-1.5 block">Company</label>
                    <input
                      type="text"
                      value={editedChanges.company || ''}
                      onChange={(e) => updateField('company', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
                {changes.job_title && (
                  <div className="bg-slate-900/50 rounded-lg p-3 border-2 border-green-500/30">
                    <label className="text-xs text-slate-400 mb-1.5 block">Job Title</label>
                    <input
                      type="text"
                      value={editedChanges.job_title || ''}
                      onChange={(e) => updateField('job_title', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Family Members */}
          {changes.family_members && changes.family_members.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-indigo-400 text-xs font-black uppercase tracking-wider">
                👥 Family
              </h3>
              <div className="space-y-3">
                {editedChanges.family_members?.map((member, idx) => (
                  <div key={idx} className="bg-slate-900/50 rounded-lg p-3 border-2 border-green-500/30 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">Name</label>
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) => updateFamilyMember(idx, 'name', e.target.value)}
                          className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">Relationship</label>
                        <input
                          type="text"
                          value={member.relationship}
                          onChange={(e) => updateFamilyMember(idx, 'relationship', e.target.value)}
                          className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Priorities */}
          {changes.most_important_to_them && (
            <div className="space-y-3">
              <h3 className="text-indigo-400 text-xs font-black uppercase tracking-wider">
                ⭐ Current Priorities & Hobbies
              </h3>
              <div className="bg-slate-900/50 rounded-lg p-3 border-2 border-green-500/30">
                <textarea
                  value={editedChanges.most_important_to_them || ''}
                  onChange={(e) => updateField('most_important_to_them', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500 min-h-[80px] resize-none"
                />
              </div>
            </div>
          )}

          {/* Challenges */}
          {changes.current_challenges && (
            <div className="space-y-3">
              <h3 className="text-indigo-400 text-xs font-black uppercase tracking-wider">
                💪 What They're Working Through
              </h3>
              <div className="bg-slate-900/50 rounded-lg p-3 border-2 border-green-500/30">
                <textarea
                  value={editedChanges.current_challenges || ''}
                  onChange={(e) => updateField('current_challenges', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500 min-h-[80px] resize-none"
                />
              </div>
            </div>
          )}

          {/* Goals */}
          {changes.goals_aspirations && (
            <div className="space-y-3">
              <h3 className="text-indigo-400 text-xs font-black uppercase tracking-wider">
                ✨ What They're Working Toward
              </h3>
              <div className="bg-slate-900/50 rounded-lg p-3 border-2 border-green-500/30">
                <textarea
                  value={editedChanges.goals_aspirations || ''}
                  onChange={(e) => updateField('goals_aspirations', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500 min-h-[80px] resize-none"
                />
              </div>
            </div>
          )}

          {/* Interests */}
          {changes.interests && changes.interests.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-indigo-400 text-xs font-black uppercase tracking-wider">
                🎯 Interests
              </h3>
              <div className="bg-slate-900/50 rounded-lg p-3 border-2 border-green-500/30">
                <div className="flex flex-wrap gap-2">
                  {editedChanges.interests?.map((interest, idx) => (
                    <span key={idx} className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Where Met */}
          {changes.where_met && (
            <div className="space-y-3">
              <h3 className="text-indigo-400 text-xs font-black uppercase tracking-wider">
                📍 Where We Met
              </h3>
              <div className="bg-slate-900/50 rounded-lg p-3 border-2 border-green-500/30">
                <input
                  type="text"
                  value={editedChanges.where_met || ''}
                  onChange={(e) => updateField('where_met', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAccept}
            disabled={isAccepting || !hasChanges}
            className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
          >
            {isAccepting ? (
              <>Processing...</>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Accept All Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
