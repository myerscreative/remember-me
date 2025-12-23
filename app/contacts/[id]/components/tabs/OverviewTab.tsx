'use client';

import { StoryGrid } from '@/app/contacts/[id]/components/StoryGrid';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Plus, Tag } from 'lucide-react';

// Minimal Contact type for typing
interface Contact {
  id: string;
  story: any;
  tags?: string[];
  interests?: string[];
  [key: string]: any;
}

interface OverviewTabProps {
  contact: Contact;
}

export function OverviewTab({ contact }: OverviewTabProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* HERO: The Story with container and header */}
      <section>
        <div className="bg-[#fafafa] border border-[#e5e7eb] rounded-2xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[1.25rem] font-semibold text-[#111827]">📖 The Story</h2>
            <button className="bg-white text-[#6366f1] border border-[#e5e7eb] rounded-[0.5rem] px-3 py-1 text-sm font-medium hover:bg-gray-100">Edit</button>
          </div>
          <StoryGrid contactId={contact.id} story={contact.story} />
        </div>
      </section>

      {/* Memory Prompt */}
      <section>
        <div className="bg-white border-2 border-dashed border-[#d1d5db] rounded-[0.875rem] p-5 flex items-center justify-between hover:border-[#6366f1] transition-colors mb-8">
          <span className="text-[#9ca3af] text-lg">✨ Add important info to your memory</span>
          <button className="text-[#9ca3af] text-2xl">+</button>
        </div>
      </section>

      {/* Tags & Interests Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tags Section */}
        <div className="bg-white dark:bg-[#252931] border border-gray-100 dark:border-[#3a3f4b] rounded-2xl p-6 min-h-[200px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <Tag className="w-4 h-4" /> Tags
            </h3>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-indigo-600">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {contact.tags && contact.tags.length > 0 ? (
              contact.tags.map((tag: string, i: number) => (
                <Badge key={i} className="bg-[#f3f4f6] text-[#4b5563] rounded-[0.5rem] px-3.5 py-1.5 text-[0.8125rem] font-medium">{tag}</Badge>
              ))
            ) : (
              <p className="text-sm text-gray-400 italic">No tags added yet.</p>
            )}
          </div>
        </div>

        {/* Interests Section */}
        <div className="bg-white dark:bg-[#252931] border border-gray-100 dark:border-[#3a3f4b] rounded-2xl p-6 min-h-[200px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Interests
            </h3>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-indigo-600">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {contact.interests && contact.interests.length > 0 ? (
              contact.interests.map((interest: string, i: number) => (
                <Badge key={i} className="bg-[#f3f4f6] text-[#4b5563] rounded-[0.5rem] px-3.5 py-1.5 text-[0.8125rem] font-medium">{interest}</Badge>
              ))
            ) : (
              <p className="text-sm text-gray-400 italic">No interests added yet.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
