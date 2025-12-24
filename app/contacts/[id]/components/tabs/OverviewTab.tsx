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
        <div className="bg-gradient-to-br from-[#fafafa] to-white dark:from-[#252931] dark:to-[#1a1d24] border border-[#e5e7eb] dark:border-[#374151] rounded-2xl p-8 mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[1.25rem] font-semibold text-[#111827] dark:text-white flex items-center gap-2">
              <span className="text-2xl">📖</span> The Story
            </h2>
            <button className="bg-white dark:bg-[#1f2937] text-[#6366f1] dark:text-indigo-400 border border-[#e5e7eb] dark:border-[#374151] rounded-[0.5rem] px-3 py-1 text-sm font-medium hover:bg-gray-50 dark:hover:bg-[#374151] transition-colors shadow-sm">Edit</button>
          </div>
          <StoryGrid contactId={contact.id} story={contact.story} />
        </div>
      </section>

      {/* Memory Prompt */}
      <section>
        <div className="group bg-white dark:bg-[#252931]/50 border-2 border-dashed border-[#d1d5db] dark:border-[#374151] rounded-[0.875rem] p-5 flex items-center justify-between hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-all duration-300 cursor-pointer mb-8">
          <span className="text-[#9ca3af] dark:text-gray-400 text-lg group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">✨ Add important info to your memory</span>
          <button className="text-[#9ca3af] dark:text-gray-500 text-2xl group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">+</button>
        </div>
      </section>

      {/* Tags & Interests Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tags Section */}
        <div className="bg-white dark:bg-[#252931] border border-gray-100 dark:border-[#3a3f4b] rounded-2xl p-6 min-h-[200px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-2">
              <Tag className="w-4 h-4 text-teal-500 dark:text-teal-400" /> Tags
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
            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500 dark:text-purple-400" /> Interests
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
