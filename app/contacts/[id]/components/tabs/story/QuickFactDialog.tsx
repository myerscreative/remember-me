'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Briefcase, Users, Target, Star, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { addContactFact } from '@/app/actions/contact-facts';
import toast from 'react-hot-toast';

interface QuickFactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  onSuccess: () => void;
}

const categories = [
  { value: 'career', label: 'Career', icon: Briefcase, color: 'text-blue-500' },
  { value: 'family', label: 'Family', icon: Users, color: 'text-pink-500' },
  { value: 'goal', label: 'Goals', icon: Target, color: 'text-purple-500' },
  { value: 'interest', label: 'Interests', icon: Star, color: 'text-amber-500' },
  { value: 'general', label: 'General', icon: MoreHorizontal, color: 'text-gray-500' },
] as const;

type CategoryValue = typeof categories[number]['value'];

export function QuickFactDialog({ open, onOpenChange, contactId, onSuccess }: QuickFactDialogProps) {
  const [category, setCategory] = useState<CategoryValue>('general');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('Please enter a fact');
      return;
    }

    setIsSubmitting(true);
    const result = await addContactFact({
      contactId,
      category,
      content: content.trim(),
    });

    if (result.success) {
      toast.success('Fact added!');
      setContent('');
      setCategory('general');
      onSuccess();
    } else {
      toast.error(result.error || 'Failed to add fact');
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add a Key Fact</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Category picker */}
          <div>
            <label className="text-sm font-medium text-gray-500 mb-2 block">Category</label>
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                      isSelected
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 ring-2 ring-indigo-500'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200'
                    )}
                  >
                    <Icon className={cn('w-3.5 h-3.5', isSelected ? 'text-indigo-600' : cat.color)} />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content input */}
          <div>
            <label className="text-sm font-medium text-gray-500 mb-2 block">What should you remember?</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="e.g., Just started a new job at NASA..."
              className="min-h-[100px] resize-none font-serif text-gray-700 dark:text-gray-300"
              autoFocus
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || !content.trim()}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isSubmitting ? 'Adding...' : 'Add Fact'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
