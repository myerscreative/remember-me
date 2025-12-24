'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Loader2, Users, Check } from 'lucide-react';
import { logGroupInteraction } from '@/app/actions/log-group-interaction';
import { INTERACTION_TYPES, type InteractionType } from '@/lib/relationship-health';
import type { LinkedContact } from '@/types/database.types';

interface GroupInteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: LinkedContact[];
  currentContactId: string;
  currentContactName: string;
  onSuccess: () => void;
}

export function GroupInteractionModal({ 
  isOpen, 
  onClose,
  contacts,
  currentContactId,
  currentContactName,
  onSuccess 
}: GroupInteractionModalProps) {
  // Pre-select all family members + current contact
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    const set = new Set<string>([currentContactId]);
    contacts.forEach(c => set.add(c.id));
    return set;
  });
  const [interactionType, setInteractionType] = useState<InteractionType>('in-person');
  const [note, setNote] = useState('');
  const [isLogging, setIsLogging] = useState(false);

  const toggleContact = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      // Don't allow deselecting all
      if (newSet.size > 1) {
        newSet.delete(id);
      }
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) return;

    setIsLogging(true);
    const result = await logGroupInteraction({
      contactIds: Array.from(selectedIds),
      type: interactionType,
      note: note.trim() || undefined,
    });

    if (result.success) {
      onSuccess();
      handleClose();
    } else {
      alert(result.error || 'Failed to log interaction');
    }
    setIsLogging(false);
  };

  const handleClose = () => {
    // Reset state for next open
    setSelectedIds(new Set([currentContactId, ...contacts.map(c => c.id)]));
    setInteractionType('in-person');
    setNote('');
    onClose();
  };

  if (!isOpen) return null;

  // All contacts including current
  const allContacts = [
    { id: currentContactId, name: currentContactName, photo_url: null, first_name: currentContactName.split(' ')[0] },
    ...contacts.map(c => ({ id: c.id, name: c.name, photo_url: c.photo_url, first_name: c.first_name }))
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-[#1a1d24] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-[#2d333b] flex-shrink-0">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Log Group Interaction
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content - scrollable */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Instructions */}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Log an interaction that updates all selected contacts at once (e.g., family dinner, group call).
          </p>

          {/* Contact selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Select People ({selectedIds.size} selected)
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {allContacts.map((contact) => {
                const isSelected = selectedIds.has(contact.id);
                return (
                  <button
                    key={contact.id}
                    onClick={() => toggleContact(contact.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-400'
                        : 'bg-gray-50 dark:bg-[#252931] border-2 border-transparent hover:bg-gray-100 dark:hover:bg-[#2d333b]'
                    }`}
                  >
                    <Avatar className="h-7 w-7 flex-shrink-0">
                      <AvatarImage src={contact.photo_url || undefined} />
                      <AvatarFallback className="bg-indigo-100 text-indigo-600 text-xs">
                        {contact.first_name?.[0] || contact.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                      {contact.first_name || contact.name.split(' ')[0]}
                    </span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-indigo-600 ml-auto flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interaction type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Interaction Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {INTERACTION_TYPES.map(({ value, label, emoji }) => (
                <button
                  key={value}
                  onClick={() => setInteractionType(value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    interactionType === value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-[#252931] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2d333b]'
                  }`}
                >
                  {emoji} {label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Note (optional)
            </label>
            <Textarea
              placeholder="What did you do together?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 border-t border-gray-100 dark:border-[#2d333b] flex-shrink-0">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={selectedIds.size === 0 || isLogging}
          >
            {isLogging ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Logging...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Log for {selectedIds.size} People
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
