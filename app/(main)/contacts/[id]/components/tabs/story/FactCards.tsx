'use client';

import { useState } from 'react';
import { Plus, Briefcase, Users, Target, Star, MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ContactFact } from '@/lib/story/story-data';
import { QuickFactDialog } from './QuickFactDialog';
import { deleteContactFact } from '@/app/actions/contact-facts';
import toast from 'react-hot-toast';

interface FactCardsProps {
  facts: ContactFact[];
  contactId: string;
  onFactAdded?: () => void;
}

const categoryConfig: Record<string, {
  icon: typeof Briefcase;
  label: string;
  bgClass: string;
  iconClass: string;
}> = {
  career: {
    icon: Briefcase,
    label: 'Career',
    bgClass: 'bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900',
    iconClass: 'text-blue-500',
  },
  family: {
    icon: Users,
    label: 'Family',
    bgClass: 'bg-pink-50 dark:bg-pink-950/30 border-pink-100 dark:border-pink-900',
    iconClass: 'text-pink-500',
  },
  goal: {
    icon: Target,
    label: 'Goals',
    bgClass: 'bg-purple-50 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900',
    iconClass: 'text-purple-500',
  },
  interest: {
    icon: Star,
    label: 'Interests',
    bgClass: 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900',
    iconClass: 'text-amber-500',
  },
  general: {
    icon: MoreHorizontal,
    label: 'General',
    bgClass: 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700',
    iconClass: 'text-gray-500',
  },
};

export function FactCards({ facts, contactId, onFactAdded }: FactCardsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (factId: string) => {
    setDeletingId(factId);
    const result = await deleteContactFact(factId, contactId);
    if (result.success) {
      toast.success('Fact removed');
      onFactAdded?.();
    } else {
      toast.error('Failed to remove fact');
    }
    setDeletingId(null);
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          📌 Key Facts
        </h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setDialogOpen(true)}
          className="h-7 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Fact
        </Button>
      </div>

      {facts.length === 0 ? (
        <div 
          onClick={() => setDialogOpen(true)}
          className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-colors"
        >
          <p className="text-gray-400 text-sm">
            Add important details about this person
          </p>
          <p className="text-gray-300 text-xs mt-1">
            Spouse name, favorite coffee, career goals...
          </p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {facts.map((fact) => {
            const config = categoryConfig[fact.category] || categoryConfig.general;
            const Icon = config.icon;
            
            return (
              <div 
                key={fact.id}
                className={cn(
                  'shrink-0 w-64 rounded-xl border p-4 relative group',
                  config.bgClass
                )}
              >
                <button
                  onClick={() => handleDelete(fact.id)}
                  disabled={deletingId === fact.id}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
                
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={cn('w-4 h-4', config.iconClass)} />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {config.label}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 font-serif">
                  {fact.content}
                </p>
              </div>
            );
          })}
          
          {/* Add more card */}
          <div 
            onClick={() => setDialogOpen(true)}
            className="shrink-0 w-32 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-colors min-h-[100px]"
          >
            <Plus className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      )}

      <QuickFactDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        contactId={contactId}
        onSuccess={() => {
          setDialogOpen(false);
          onFactAdded?.();
        }}
      />
    </div>
  );
}
