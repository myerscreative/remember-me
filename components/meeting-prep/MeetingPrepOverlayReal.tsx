"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  X,
  ArrowLeft,
  MapPin,
  Clock,
  Video,
  Phone,
  MessageSquare,
  Users,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { MatchedMeeting } from "@/lib/matching/types";
import type { Database } from "@/types/database.types";

type Person = Database['public']['Tables']['persons']['Row'];

interface MeetingPrepOverlayRealProps {
  meetingId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MeetingPrepOverlayReal({ meetingId, isOpen, onClose }: MeetingPrepOverlayRealProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [meeting, setMeeting] = useState<MatchedMeeting | null>(null);
  const [contact, setContact] = useState<Person | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationStarters, setConversationStarters] = useState<string[]>([]);
  const [isGeneratingStarters, setIsGeneratingStarters] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch meeting and contact data when overlay opens
  const fetchData = useCallback(async () => {
    if (!meetingId || !session?.accessToken) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch matched meetings to find the one we need
      const meetingRes = await fetch('/api/calendar/matched-events?days=7');
      const meetingData = await meetingRes.json();

      if (!meetingRes.ok) {
        throw new Error(meetingData.error || 'Failed to fetch meeting');
      }

      const foundMeeting = meetingData.meetings?.find(
        (m: MatchedMeeting) => m.calendarEvent.id === meetingId
      );

      if (!foundMeeting) {
        throw new Error('Meeting not found');
      }

      setMeeting(foundMeeting);

      // If we have a matched contact, fetch their full details
      if (foundMeeting.primaryContact?.id) {
        const contactRes = await fetch(`/api/contacts/${foundMeeting.primaryContact.id}`);
        if (contactRes.ok) {
          const contactData = await contactRes.json();
          setContact(contactData);
        }
      }
    } catch (err: unknown) {
      console.error('Error fetching meeting data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load meeting');
    } finally {
      setIsLoading(false);
    }
  }, [meetingId, session]);

  useEffect(() => {
    if (isOpen && meetingId) {
      fetchData();
    }
  }, [isOpen, meetingId, fetchData]);

  // Generate conversation starters
  const generateStarters = useCallback(async () => {
    if (!contact || !meeting) return;

    setIsGeneratingStarters(true);
    try {
      const response = await fetch('/api/ai/generate-starters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactContext: {
            name: contact.name,
            whereWeMet: contact.where_met,
            whenWeMet: contact.when_met,
            whyStayInContact: contact.why_stay_in_contact,
            whatMattersToThem: contact.most_important_to_them,
            interests: contact.interests,
            lastContact: contact.last_contact,
            meetingTitle: meeting.calendarEvent.summary,
          },
        }),
      });

      const data = await response.json();
      if (response.ok && data.starters) {
        setConversationStarters(data.starters);
      } else {
        // Fallback starters
        setConversationStarters([
          `How have things been since we last connected?`,
          `What have you been working on lately?`,
          `Any updates since we last talked?`,
        ]);
      }
    } catch {
      setConversationStarters([
        `How have things been since we last connected?`,
        `What have you been working on lately?`,
      ]);
    } finally {
      setIsGeneratingStarters(false);
    }
  }, [contact, meeting]);

  useEffect(() => {
    if (contact && meeting && conversationStarters.length === 0) {
      generateStarters();
    }
  }, [contact, meeting, conversationStarters.length, generateStarters]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  // Helper functions
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const formatTime = (dateString: string) => {
    if (!mounted) return '--:--';
    return new Date(dateString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const getTimeUntil = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (diff < 0) return 'Started';
    if (hours < 1) return `In ${minutes} minutes`;
    if (hours < 24) return `In ${hours} hours`;
    const days = Math.floor(hours / 24);
    return `In ${days} ${days === 1 ? 'day' : 'days'}`;
  };

  const getDaysAgo = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  // Loading state
  if (isLoading) {
    return (
      <div
        className="fixed inset-0 z-[2000] bg-black/50 overflow-y-auto backdrop-blur-sm flex items-center justify-center"
        onClick={onClose}
      >
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 flex flex-col items-center">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading meeting details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !meeting) {
    return (
      <div
        className="fixed inset-0 z-[2000] bg-black/50 overflow-y-auto backdrop-blur-sm flex items-center justify-center"
        onClick={onClose}
      >
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 text-center max-w-md mx-4">
          <p className="text-red-500 mb-4">{error || 'Meeting not found'}</p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  const event = meeting.calendarEvent;
  const primaryContact = meeting.primaryContact;
  const displayName = contact?.name || primaryContact?.name || 'Unknown';
  const locationIsVideo = event.location?.toLowerCase().includes("zoom") ||
    event.location?.toLowerCase().includes("video") ||
    event.location?.toLowerCase().includes("meet") ||
    !!event.hangoutLink;

  return (
    <div
      className="fixed inset-0 z-[2000] bg-black/50 overflow-y-auto backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-[800px] mx-auto min-h-screen md:min-h-0 md:my-8 bg-white dark:bg-gray-900 md:rounded-3xl shadow-2xl overflow-hidden flex flex-col">

        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-4 md:px-8 md:py-6 flex justify-between items-center shadow-sm">
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <h1 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Meeting Prep
          </h1>

          <button
            onClick={onClose}
            className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Meeting Info Banner */}
        <div className="px-8 py-8 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-800 border-b-2 border-indigo-500 flex gap-6 items-center">
          {contact?.photo_url || primaryContact?.photo ? (
            <img
              src={contact?.photo_url || primaryContact?.photo || ''}
              alt={displayName}
              className="w-20 h-20 rounded-full object-cover shadow-lg"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-indigo-500 text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-indigo-500/30">
              {getInitials(displayName)}
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Meeting with {displayName}
            </h2>
            <div className="flex flex-wrap gap-4 text-gray-600 dark:text-gray-300 font-medium text-sm md:text-base mb-3">
              <span className="flex items-center gap-1.5" suppressHydrationWarning>
                {formatTime(event.start.dateTime)}
              </span>
              <span className="flex items-center gap-1.5" suppressHydrationWarning>
                <Clock className="w-4 h-4" /> {getTimeUntil(event.start.dateTime)}
              </span>
              <span className="flex items-center gap-1.5">
                {locationIsVideo ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                {event.location || 'Video Call'}
              </span>
            </div>
            {event.hangoutLink && (
              <a
                href={event.hangoutLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-semibold text-sm transition-transform hover:translate-x-1"
              >
                Join Meeting <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Quick Context Bar */}
        <div className="flex flex-wrap gap-4 px-8 py-6 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
          {contact?.last_interaction_date && (
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 font-medium shadow-sm">
              <MessageSquare className="w-4 h-4 text-gray-400" />
              <span>Last spoke: {getDaysAgo(contact.last_interaction_date)} days ago</span>
            </div>
          )}
          {meeting.matchedContacts.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 font-medium shadow-sm">
              <Users className="w-4 h-4 text-gray-400" />
              <span>{meeting.matchedContacts.length} contact{meeting.matchedContacts.length !== 1 ? 's' : ''} matched</span>
            </div>
          )}
          {contact?.importance && (
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 font-medium shadow-sm capitalize">
              {contact.importance} priority
            </div>
          )}
        </div>

        {/* The Story - only show if we have contact details */}
        {contact && (contact.where_met || contact.why_stay_in_contact || contact.most_important_to_them) && (
          <div className="px-8 py-8 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              The Story
            </h3>

            <div className="grid gap-6">
              {/* Where We Met */}
              {contact.where_met && (
                <div className="flex gap-4 p-5 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <div className="text-2xl mt-1">📍</div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Where We Met</h4>
                    <p className="text-base text-gray-900 dark:text-white mb-1 font-medium">
                      {contact.where_met}
                      {contact.when_met && ` - ${contact.when_met}`}
                    </p>
                    {contact.who_introduced && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 italic">Introduced by {contact.who_introduced}</p>
                    )}
                  </div>
                </div>
              )}

              {/* What Found Interesting */}
              {contact.what_found_interesting && (
                <div className="flex gap-4 p-5 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <div className="text-2xl mt-1">💭</div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">What I Found Interesting</h4>
                    <p className="text-gray-700 dark:text-gray-300">{contact.what_found_interesting}</p>
                  </div>
                </div>
              )}

              {/* Why Stay in Contact */}
              {contact.why_stay_in_contact && (
                <div className="flex gap-4 p-5 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <div className="text-2xl mt-1">❤️</div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Why Stay in Contact</h4>
                    <p className="text-gray-900 dark:text-gray-200">{contact.why_stay_in_contact}</p>
                  </div>
                </div>
              )}

              {/* What Matters to Them */}
              {contact.most_important_to_them && (
                <div className="flex gap-4 p-5 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <div className="text-2xl mt-1">⭐</div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">What Matters to Them</h4>
                    <p className="text-gray-700 dark:text-gray-300">{contact.most_important_to_them}</p>
                  </div>
                </div>
              )}

              {/* Interests */}
              {contact.interests && contact.interests.length > 0 && (
                <div className="flex gap-4 p-5 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <div className="text-2xl mt-1">🎯</div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Interests</h4>
                    <div className="flex flex-wrap gap-2">
                      {contact.interests.map((interest, i) => (
                        <span key={i} className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Last Contact */}
        {contact?.last_interaction_date && (
          <div className="px-8 py-8 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              Last Contact
            </h3>
            <div className="p-5 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-400 dark:border-emerald-600 rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-600 rounded-lg text-emerald-800 dark:text-emerald-400 text-sm font-bold">
                  {contact.last_contact_method === 'phone' ? <Phone className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                  <span className="capitalize">{contact.last_contact_method || 'Contact'}</span>
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 font-medium text-sm">
                  {getDaysAgo(contact.last_interaction_date)} days ago
                </span>
              </div>
              {contact.notes && (
                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl text-emerald-900 dark:text-emerald-300 italic border border-emerald-100 dark:border-emerald-700">
                  &quot;{contact.notes}&quot;
                </div>
              )}
            </div>
          </div>
        )}

        {/* Conversation Starters */}
        <div className="px-8 py-8 mx-8 my-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-2 border-amber-300 dark:border-amber-600 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Conversation Starters
            </h3>
            <button
              onClick={generateStarters}
              disabled={isGeneratingStarters}
              className="px-3 py-1 text-sm bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {isGeneratingStarters ? 'Generating...' : 'Regenerate'}
            </button>
          </div>

          {isGeneratingStarters ? (
            <div className="py-8 text-center flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Generating personalized questions...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {conversationStarters.map((starter, i) => (
                <div key={i} className="flex gap-4 items-start p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-amber-100 dark:border-amber-700">
                  <span className="shrink-0 w-8 h-8 flex items-center justify-center bg-amber-400 text-white font-bold rounded-full">
                    {i + 1}
                  </span>
                  <p className="text-gray-900 dark:text-gray-100 pt-1 text-lg">{starter}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-8 flex gap-4 flex-wrap bg-gray-50 dark:bg-gray-800">
          {contact?.id && (
            <Button
              onClick={() => {
                onClose();
                router.push(`/contacts/${contact.id}`);
              }}
              className="flex-1 min-w-[200px] h-12 text-base font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50"
            >
              View Full Profile
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 min-w-[200px] h-12 text-base font-semibold bg-white dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
