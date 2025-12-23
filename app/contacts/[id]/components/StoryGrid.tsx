'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Heart, Star, Edit2, Plus, Save, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface StoryGridProps {
  contactId: string;
  story: {
    whereWeMet?: string;
    whyStayInContact?: string;
    whatsImportant?: string;
  };
}

export function StoryGrid({ contactId, story }: StoryGridProps) {
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [localStory, setLocalStory] = useState({
    whereWeMet: story?.whereWeMet || '',
    whyStayInContact: story?.whyStayInContact || '',
    whatsImportant: story?.whatsImportant || ''
  });

  const handleEdit = (field: string, currentValue: string) => {
    setEditingCard(field);
    setEditValue(currentValue);
  };

  const handleCancel = () => {
    setEditingCard(null);
    setEditValue('');
  };

  const handleSave = async (field: string) => {
    setIsSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const updateData: any = {};
      if (field === 'whereWeMet') updateData.where_met = editValue;
      if (field === 'whyStayInContact') updateData.why_stay_in_contact = editValue;
      if (field === 'whatsImportant') updateData.most_important_to_them = editValue;

      const { error } = await (supabase as any)
        .from('persons')
        .update(updateData)
        .eq('id', contactId)
        .eq('user_id', user.id);

      if (error) throw error;

      setLocalStory(prev => ({ ...prev, [field]: editValue }));
      setEditingCard(null);
      toast.success('Updated successfully');
    } catch (error) {
      console.error('Error saving story:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const renderCard = (
    title: string,
    icon: React.ReactNode,
    field: 'whereWeMet' | 'whyStayInContact' | 'whatsImportant',
    value: string,
    placeholder: string
  ) => {
    const isEditing = editingCard === field;
    const isEmpty = !value || value.trim() === '';

    return (
      <div className="group relative flex flex-col h-full bg-white dark:bg-[#252931] border border-[#f3f4f6] rounded-[0.875rem] shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[#9ca3af]">{title}</span>
          </div>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-indigo-600"
              onClick={() => handleEdit(field, value)}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <div className="px-5 pb-5 flex-1">
          {isEditing ? (
            <div className="space-y-3 mt-1">
              <Textarea
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                placeholder={placeholder}
                className="min-h-[120px] text-sm resize-none bg-gray-50 dark:bg-[#1a1d24] border-gray-200 dark:border-gray-700 focus:border-indigo-500/50 focus:ring-indigo-500/20"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="h-8 text-xs text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSave(field)}
                  disabled={isSaving}
                  className="h-8 text-xs bg-indigo-500 hover:bg-indigo-600 text-white border-0"
                >
                  {isSaving ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Save className="h-3 w-3 mr-1.5" />}
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={`text-[15px] leading-relaxed cursor-pointer pb-1 ${isEmpty ? 'text-gray-400 dark:text-gray-500 italic py-4 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-lg flex items-center justify-center gap-2 hover:border-indigo-200 dark:hover:border-indigo-200' : 'text-gray-900 dark:text-gray-100'}`}
              onClick={() => handleEdit(field, value)}
            >
              {isEmpty ? (
                <>
                  <Plus className="h-4 w-4" />
                  <span className="text-sm not-italic">{placeholder}</span>
                </>
              ) : (
                <div className="whitespace-pre-wrap">{value}</div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {renderCard(
        'Where We Met',
        <MapPin className="w-4 h-4 text-gray-400 group-hover:text-indigo-400 transition-colors" />, 
        'whereWeMet',
        localStory.whereWeMet,
        'Add where you met'
      )}
      {renderCard(
        'Why Stay in Contact',
        <Heart className="w-4 h-4 text-gray-400 group-hover:text-rose-400 transition-colors" />, 
        'whyStayInContact',
        localStory.whyStayInContact,
        'Add why this matters'
      )}
      {renderCard(
        'What Matters to Them',
        <Star className="w-4 h-4 text-gray-400 group-hover:text-amber-400 transition-colors" />, 
        'whatsImportant',
        localStory.whatsImportant,
        "Add what's important"
      )}
    </div>
  );
}
