'use client';

import { useState, useEffect, useCallback } from 'react';
import { PulseHeader } from './story/PulseHeader';
import { FactCards } from './story/FactCards';
import { StoryTimeline } from './story/StoryTimeline';
import { getContactFacts, getStoryTimeline, type ContactFact, type TimelineItem } from '@/lib/story/story-data';

interface Contact {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  last_contact_date?: string | null;
  last_interaction_date?: string | null;
  target_contact_days?: number;
  [key: string]: unknown;
}

interface StoryTabProps {
  contact: Contact;
}

export function StoryTab({ contact }: StoryTabProps) {
  const [facts, setFacts] = useState<ContactFact[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  const lastContactDate = contact.last_interaction_date || contact.last_contact_date || null;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [factsData, timelineData] = await Promise.all([
        getContactFacts(contact.id),
        getStoryTimeline(contact.id),
      ]);
      setFacts(factsData);
      setTimeline(timelineData);
    } catch (error) {
      console.error('Error loading story data:', error);
    } finally {
      setLoading(false);
    }
  }, [contact.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
        <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full" />
              <div className="flex-1 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Pulse Header - Garden Status */}
      <PulseHeader 
        lastContactDate={lastContactDate}
        targetDays={contact.target_contact_days || 30}
      />

      {/* Pinned Facts */}
      <FactCards 
        facts={facts}
        contactId={contact.id}
        onFactAdded={loadData}
      />

      {/* Timeline */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
          📜 The Story
        </h3>
        <StoryTimeline items={timeline} />
      </div>
    </div>
  );
}
