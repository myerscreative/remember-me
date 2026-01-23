'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X, Loader2, Save, Heart, Star, Calendar } from 'lucide-react';
import { updateFamilyMembers } from '@/app/actions/update-family-members';
import toast from 'react-hot-toast';

interface FamilyMember {
  name: string;
  relationship: string;
  birthday?: string;
  hobbies?: string;
  interests?: string;
}

interface EditFamilyMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactId: string;
  familyMembers: FamilyMember[];
  memberIndex: number | null; // null if adding new
  onSuccess?: (updatedMembers: FamilyMember[]) => void;
}

export function EditFamilyMemberModal({ 
  isOpen, 
  onClose, 
  contactId, 
  familyMembers,
  memberIndex,
  onSuccess
}: EditFamilyMemberModalProps) {
  const [formData, setFormData] = useState<FamilyMember>({
    name: '',
    relationship: '',
    birthday: '',
    hobbies: '',
    interests: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (memberIndex !== null && familyMembers[memberIndex]) {
      setFormData({
        name: familyMembers[memberIndex].name || '',
        relationship: familyMembers[memberIndex].relationship || '',
        birthday: familyMembers[memberIndex].birthday || '',
        hobbies: familyMembers[memberIndex].hobbies || '',
        interests: familyMembers[memberIndex].interests || ''
      });
    } else {
      setFormData({
        name: '',
        relationship: '',
        birthday: '',
        hobbies: '',
        interests: ''
      });
    }
  }, [memberIndex, familyMembers, isOpen]);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.relationship.trim()) {
      toast.error('Name and relationship are required');
      return;
    }

    setIsSaving(true);
    try {
      const updatedMembers = [...familyMembers];
      if (memberIndex !== null) {
        updatedMembers[memberIndex] = formData;
      } else {
        updatedMembers.push(formData);
      }

      const result = await updateFamilyMembers(contactId, updatedMembers);
      if (result.success) {
        console.log('Saved family members:', updatedMembers);
        toast.success(memberIndex !== null ? 'Member updated' : 'Member added');
        if (onSuccess) onSuccess(updatedMembers);
        onClose();
      } else {
        toast.error(result.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Error saving family member:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-[#1a1d24] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-[#2d333b]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            {memberIndex !== null ? 'Edit' : 'Add'} Family Member
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
            <Input
              placeholder="Full name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Relationship</label>
            <Input
              placeholder="e.g. Son, Spouse, Partner"
              value={formData.relationship}
              onChange={(e) => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              Birthday
            </label>
            <Input
              type="text"
              placeholder="MM/DD/YYYY or just MM/DD"
              value={formData.birthday}
              onChange={(e) => setFormData(prev => ({ ...prev, birthday: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              Hobbies
            </label>
            <Textarea
              placeholder="What do they like to do?"
              value={formData.hobbies}
              onChange={(e) => setFormData(prev => ({ ...prev, hobbies: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              Interests
            </label>
            <Textarea
              placeholder="Topics they're passionate about"
              value={formData.interests}
              onChange={(e) => setFormData(prev => ({ ...prev, interests: e.target.value }))}
              rows={2}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 border-t border-gray-100 dark:border-[#2d333b]">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {memberIndex !== null ? 'Update' : 'Add'} Member
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
