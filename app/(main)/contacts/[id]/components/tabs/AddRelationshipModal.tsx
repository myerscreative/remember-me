'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Search, Loader2, Check } from 'lucide-react';
import { 
  searchContactsForLinking, 
  createRelationship 
} from '@/app/actions/relationships';
import { RELATIONSHIP_LABELS } from '@/lib/relationship-utils';
import type { RelationshipRole } from '@/types/database.types';

interface AddRelationshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactId: string;
  contactName: string;
  onSuccess: () => void;
}

const RELATIONSHIP_OPTIONS: RelationshipRole[] = [
  'spouse', 'partner', 'parent', 'child', 'sibling', 'friend', 'colleague', 'other'
];

export function AddRelationshipModal({ 
  isOpen, 
  onClose, 
  contactId, 
  contactName,
  onSuccess 
}: AddRelationshipModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; photo_url: string | null }>>([]);
  const [selectedContact, setSelectedContact] = useState<{ id: string; name: string; photo_url: string | null } | null>(null);
  const [relationshipType, setRelationshipType] = useState<RelationshipRole>('friend');
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const result = await searchContactsForLinking(contactId, searchQuery);
      if (result.success) {
        setSearchResults(result.contacts);
      }
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, contactId]);

  const handleCreate = async () => {
    if (!selectedContact) return;

    setIsCreating(true);
    const result = await createRelationship(
      contactId,
      selectedContact.id,
      relationshipType
    );

    if (result.success) {
      onSuccess();
      handleClose();
    } else {
      alert(result.error || 'Failed to create relationship');
    }
    setIsCreating(false);
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedContact(null);
    setRelationshipType('friend');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-[#1a1d24] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-[#2d333b]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Add Relationship
          </h2>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search contacts to link..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-indigo-500" />
            )}
          </div>

          {/* Search results */}
          {searchResults.length > 0 && !selectedContact && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {searchResults.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => {
                    setSelectedContact(contact);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[#252931] transition-colors text-left"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={contact.photo_url || undefined} />
                    <AvatarFallback className="bg-indigo-100 text-indigo-600">
                      {contact.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {contact.name}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Selected contact */}
          {selectedContact && (
            <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedContact.photo_url || undefined} />
                <AvatarFallback className="bg-indigo-100 text-indigo-600">
                  {selectedContact.name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedContact.name}
                </p>
                <p className="text-sm text-gray-500">Selected</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSelectedContact(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Relationship type selector */}
          {selectedContact && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Relationship to {contactName}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {RELATIONSHIP_OPTIONS.map((type) => (
                  <button
                    key={type}
                    onClick={() => setRelationshipType(type)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      relationshipType === type
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-[#252931] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2d333b]'
                    }`}
                  >
                    {RELATIONSHIP_LABELS[type]}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {selectedContact.name} is {contactName}'s {RELATIONSHIP_LABELS[relationshipType].toLowerCase()}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 border-t border-gray-100 dark:border-[#2d333b]">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={!selectedContact || isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Add Relationship
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
