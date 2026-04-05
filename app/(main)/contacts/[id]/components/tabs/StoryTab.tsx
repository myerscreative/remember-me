'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Map,
  HeartHandshake,
  BookOpen,
  Star,
  Plus,
  Pencil,
  Flame,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { updateContact } from '@/app/actions/update-contact';
import toast from 'react-hot-toast';
import { type RelationshipNarrative } from '@/types/relationship';
import { calculateHealth, type HealthStatus } from '@/lib/relationship-health';

export interface SharedMemory {
  id: string;
  date: Date;
  text: string;
  isMilestone: boolean;
  isInsideJoke?: boolean;
  imageUrl?: string;
}

export interface StoryData {
  memories: SharedMemory[];
  narrative: RelationshipNarrative;
  aiSynopsis?: string | null;
}

export type { RelationshipNarrative };

export interface NarrativeCard {
  title: string;
  icon: React.ReactNode;
  content: string | undefined | null;
  placeholder: string;
  cardColor: string;
  fieldKey: 'where_met' | 'why_stay_in_contact' | 'most_important_to_them';
}

interface StoryTabProps {
  contact: any;
  synopsis?: string | null;
}

function mapRawMemoriesToSharedMemory(raw: any[]): SharedMemory[] {
  if (!raw?.length) return [];
  return raw.map((m) => ({
    id: m.id,
    date: m.created_at ? new Date(m.created_at) : new Date(),
    text: m.content ?? '',
    isMilestone: false,
    isInsideJoke: Boolean(m.content && /inside joke/i.test(String(m.content).slice(0, 80))),
  }));
}

export function StoryTab({ contact, synopsis }: StoryTabProps) {
  const rawMemories = contact.shared_memories || contact.memories || [];
  const memories: SharedMemory[] = mapRawMemoriesToSharedMemory(rawMemories);

  // Story tab Hero always uses summary_default (2–4 sentence recall context from refresh-ai-summary)
  const aiSynopsis =
    contact.summary_default ??
    synopsis ??
    contact.ai_summary ??
    contact.relationship_summary ??
    null;

  const narrative: RelationshipNarrative = {
    origin: contact.where_met ?? null,
    purpose: contact.why_stay_in_contact ?? null,
    values: contact.most_important_to_them ?? null,
  };

  const rawLastContacted = contact.last_interaction_date || contact.last_contact || contact.last_contact_date || null;
  const healthResult = calculateHealth({
    lastContacted: rawLastContacted,
    createdAt: contact.created_at,
    cadenceDays: contact.target_frequency_days ?? 30,
  });
  const healthStatus: HealthStatus = healthResult.daysRemaining <= 0 ? 'neglected' : healthResult.daysRemaining <= 5 ? 'drifting' : 'nurtured';

  const [editingField, setEditingField] = useState<
    'where_met' | 'why_stay_in_contact' | 'most_important_to_them' | null
  >(null);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [localContent, setLocalContent] = useState({
    where_met: contact.where_met ?? '',
    why_stay_in_contact: contact.why_stay_in_contact ?? '',
    most_important_to_them: contact.most_important_to_them ?? '',
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const narrativeCards: NarrativeCard[] = [
    {
      title: 'Where we met',
      icon: <Map className="w-5 h-5" />,
      content: localContent.where_met,
      placeholder: "College? A mutual friend's wedding? The office?",
      cardColor: 'bg-purple-950/40 text-purple-100 border-border-default',
      fieldKey: 'where_met',
    },
    {
      title: 'Why stay in contact',
      icon: <HeartHandshake className="w-5 h-5 text-indigo-300" />,
      content: localContent.why_stay_in_contact,
      placeholder: 'Shared values? They always make me laugh?',
      cardColor: 'bg-indigo-950/40 text-indigo-100 border-border-default',
      fieldKey: 'why_stay_in_contact',
    },
    {
      title: 'What matters to them',
      icon: <BookOpen className="w-5 h-5 text-teal-300" />,
      content: localContent.most_important_to_them,
      placeholder: 'Their kids? Career growth? Sustainability?',
      cardColor: 'bg-teal-950/40 text-teal-100 border-border-default',
      fieldKey: 'most_important_to_them',
    },
  ];

  const saveField = useCallback(
    async (field: 'where_met' | 'why_stay_in_contact' | 'most_important_to_them', value: string) => {
      setIsSaving(true);
      try {
        const result = await updateContact(contact.id, {
          [field]: value.trim(),
        });
        if (result.success) {
          setLocalContent((prev) => ({ ...prev, [field]: value.trim() }));
          setEditingField(null);
          toast.success('Saved');
        } else {
          toast.error(result.error ?? 'Failed to save');
        }
      } catch {
        toast.error('Failed to save');
      } finally {
        setIsSaving(false);
      }
    },
    [contact.id]
  );

  const handleCardClick = (card: NarrativeCard) => {
    setEditingField(card.fieldKey);
    setEditValue(localContent[card.fieldKey] ?? '');
  };

  useEffect(() => {
    if (editingField && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [editingField]);

  const handleBlur = (field: 'where_met' | 'why_stay_in_contact' | 'most_important_to_them') => {
    const trimmed = editValue.trim();
    const current = localContent[field] ?? '';
    if (trimmed === current) {
      setEditingField(null);
      return;
    }
    saveField(field, editValue);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    field: 'where_met' | 'why_stay_in_contact' | 'most_important_to_them'
  ) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const trimmed = editValue.trim();
      const current = localContent[field] ?? '';
      if (trimmed === current) {
        setEditingField(null);
        return;
      }
      saveField(field, editValue);
    }
  };

  const heroBorderGlow =
    healthStatus === 'drifting'
      ? 'ring-2 ring-amber-400/60 dark:ring-amber-500/50'
      : healthStatus === 'neglected'
        ? 'ring-2 ring-red-400/60 dark:ring-red-500/50'
        : '';

  return (
    <div className="relative min-h-[60vh] pb-24 flex flex-col pt-2">
      {/* AI Synopsis Hero Section */}
      <div
        className={cn(
          'rounded-xl p-5 mb-6 border border-border-default',
          'bg-rm-accent-muted',
          heroBorderGlow
        )}
      >
        <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100 leading-relaxed">
          {aiSynopsis && aiSynopsis.trim().length > 0 ? (
            aiSynopsis
          ) : (
            <span className="italic text-indigo-600 dark:text-indigo-400">
              Planting Seeds… Add story details and a Shared Memory to generate your personal briefing.
            </span>
          )}
        </p>
      </div>

      {/* Narrative Foundation (3-Card Stack) */}
      <div
        id="tour-story-cards"
        className="flex flex-col gap-4 mb-10 overflow-hidden min-w-0"
      >
        {narrativeCards.map((card, idx) => {
          const isEditing = editingField === card.fieldKey;
          const isEmpty = !card.content || String(card.content).trim() === '';

          return (
            <div
              key={idx}
              role="button"
              tabIndex={0}
              onClick={() => !isEditing && handleCardClick(card)}
              onKeyDown={(e) => {
                if (!isEditing && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  handleCardClick(card);
                }
              }}
              className={cn(
                'group rounded-xl p-4 border border-border-default shadow-sm transition-colors cursor-pointer min-w-0',
                card.cardColor,
                !isEditing && 'hover:bg-subtle/50 hover:border-indigo-500/50'
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  {card.icon}
                  <h3 className="text-sm font-semibold tracking-wide uppercase opacity-90 truncate">
                    {card.title}
                  </h3>
                </div>
                {!isEditing && (
                  <Pencil className="h-4 w-4 shrink-0 opacity-0 group-hover:opacity-70 transition-opacity" />
                )}
              </div>
              {isEditing ? (
                <Textarea
                  ref={textareaRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleBlur(card.fieldKey)}
                  onKeyDown={(e) => handleKeyDown(e, card.fieldKey)}
                  placeholder={card.placeholder}
                  className={cn(
                    'w-full min-w-0 max-w-full p-0 text-base leading-relaxed resize-none',
                    'bg-transparent border-0 rounded-none shadow-none',
                    'focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none',
                    'placeholder:text-text-secondary/80',
                    'min-h-[80px] overflow-y-auto overflow-x-hidden'
                  )}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  rows={4}
                />
              ) : isEmpty ? (
                <p className="text-text-secondary italic text-sm leading-relaxed flex items-center gap-2">
                  <Plus className="h-4 w-4 shrink-0" />
                  <span>{card.placeholder}</span>
                </p>
              ) : (
                <p className="text-sm leading-relaxed opacity-95 whitespace-pre-wrap break-words">
                  {card.content}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Shared Memories Feed */}
      <div className="flex flex-col">
        <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-6 ml-2">
          Shared Memories
        </h3>

        {memories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center border border-dashed border-border-default rounded-xl bg-canvas/50">
            <p className="text-text-secondary text-sm leading-relaxed">
              The Story begins here.
              <br />
              Add a shared memory to deepen the connection.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6 border-l-2 border-border-default ml-4 pl-4 relative">
            {memories
              .sort((a, b) => b.date.getTime() - a.date.getTime())
              .map((memory) => (
                <div key={memory.id} className="relative">
                  <div
                    className={cn(
                      'absolute -left-[23px] top-4 w-3 h-3 rounded-full border-2 border-canvas z-10',
                      memory.isMilestone ? 'bg-indigo-500 scale-125' : 'bg-subtle'
                    )}
                  />

                  {memory.isMilestone && (
                    <div className="absolute -left-[45px] top-3">
                      <Star className="w-5 h-5 fill-indigo-400 text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                    </div>
                  )}

                  <div
                    className={cn(
                      'rounded-xl p-4 border border-border-default bg-canvas',
                      memory.isMilestone && 'shadow-[0_0_20px_rgba(99,102,241,0.15)] bg-canvas/90'
                    )}
                  >
                    <div className="flex items-center justify-between mb-3 gap-2">
                      <span className="text-xs font-medium text-text-secondary">
                        {memory.date.toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        {memory.isInsideJoke && (
                          <span
                            className="flex items-center gap-1 text-amber-500"
                            title="Inside joke"
                          >
                            <Flame className="w-4 h-4" />
                          </span>
                        )}
                        {memory.isMilestone && (
                          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                            Milestone
                          </span>
                        )}
                      </div>
                    </div>

                    {memory.imageUrl && (
                      <div className="mb-4 rounded-lg overflow-hidden border border-border-default">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={memory.imageUrl}
                          alt={
                            memory.text
                              ? `Story memory: ${memory.text.slice(0, 80)}${memory.text.length > 80 ? '…' : ''}`
                              : 'Story memory image'
                          }
                          className="w-full h-auto object-cover max-h-48"
                        />
                      </div>
                    )}

                    <p className="text-text-primary text-sm leading-relaxed whitespace-pre-wrap">
                      {memory.text}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Floating Action Button (FAB) */}
      <button
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-xl hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all z-50 border border-indigo-400/50 shadow-indigo-600/30"
        title="Add Memory"
        onClick={() => {
          // Placeholder for FAB interaction
        }}
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
