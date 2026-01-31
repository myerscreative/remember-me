"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Video, MapPin, ArrowRight, Coffee, RefreshCw, Users } from "lucide-react";
import { MatchedMeeting } from "@/lib/matching/types";

interface UpcomingMeetingsWidgetProps {
  onOpenPrep: (meetingId: string) => void;
}

export function UpcomingMeetingsWidget({ onOpenPrep }: UpcomingMeetingsWidgetProps) {
  const { data: session } = useSession();
  const [meetings, setMeetings] = useState<MatchedMeeting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Track mount state to avoid hydration mismatch with date formatting
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchMeetings = useCallback(async () => {
    if (!session?.accessToken) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/calendar/matched-events?days=7');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch meetings');
      }

      setMeetings(data.meetings || []);
    } catch (err: unknown) {
      console.error('Error fetching meetings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load meetings');
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session?.accessToken) {
      fetchMeetings();
    }
  }, [session, fetchMeetings]);

  const getMeetingGroup = (meeting: MatchedMeeting) => {
    const meetingDate = new Date(meeting.calendarEvent.start.dateTime);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (meetingDate.toDateString() === today.toDateString()) return "Today";
    if (meetingDate.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return "This Week";
  };

  const groupedMeetings = {
    Today: meetings.filter(m => getMeetingGroup(m) === "Today"),
    Tomorrow: meetings.filter(m => getMeetingGroup(m) === "Tomorrow"),
    ThisWeek: meetings.filter(m => getMeetingGroup(m) === "This Week")
  };

  if (!session) return null;

  if (isLoading && meetings.length === 0) {
    return (
      <section className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 mb-8 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading meetings...</span>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 mb-8 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="text-center py-8">
          <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchMeetings}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  if (meetings.length === 0) {
    return (
      <section className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 mb-8 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span>📅</span> Upcoming Meetings
          </h2>
        </div>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No upcoming meetings with contacts found</p>
          <p className="text-sm mt-2">Meetings with attendees in your contacts will appear here</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 mb-8 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <span>📅</span> Upcoming Meetings
        </h2>
        <button
          onClick={fetchMeetings}
          disabled={isLoading}
          className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {/* Today */}
        {groupedMeetings.Today.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Today</div>
            {groupedMeetings.Today.map(meeting => (
              <MeetingCard
                key={meeting.calendarEvent.id}
                meeting={meeting}
                onClick={() => onOpenPrep(meeting.calendarEvent.id)}
                mounted={mounted}
              />
            ))}
          </div>
        )}

        {/* Tomorrow */}
        {groupedMeetings.Tomorrow.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Tomorrow</div>
            {groupedMeetings.Tomorrow.map(meeting => (
              <MeetingCard
                key={meeting.calendarEvent.id}
                meeting={meeting}
                onClick={() => onOpenPrep(meeting.calendarEvent.id)}
                mounted={mounted}
              />
            ))}
          </div>
        )}

        {/* This Week */}
        {groupedMeetings.ThisWeek.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">This Week</div>
            {groupedMeetings.ThisWeek.map(meeting => (
              <MeetingCard
                key={meeting.calendarEvent.id}
                meeting={meeting}
                onClick={() => onOpenPrep(meeting.calendarEvent.id)}
                mounted={mounted}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function MeetingCard({ meeting, onClick, mounted }: { meeting: MatchedMeeting; onClick: () => void; mounted: boolean }) {
  const event = meeting.calendarEvent;
  const primaryContact = meeting.primaryContact;
  const isHighConfidence = meeting.confidence === 'high';

  const getLocationIcon = (loc?: string) => {
    if (!loc) return <Video className="w-3.5 h-3.5" />;
    if (loc.toLowerCase().includes("zoom") || loc.toLowerCase().includes("video") || loc.toLowerCase().includes("meet")) return <Video className="w-3.5 h-3.5" />;
    if (loc.toLowerCase().includes("coffee") || loc.toLowerCase().includes("starbucks")) return <Coffee className="w-3.5 h-3.5" />;
    return <MapPin className="w-3.5 h-3.5" />;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Format time only after mount to avoid hydration mismatch
  const formatTime = (dateString: string) => {
    if (!mounted) return '--:--';
    return new Date(dateString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const containerClasses = cn(
    "flex flex-col sm:flex-row gap-4 p-5 bg-gray-50 dark:bg-gray-800/50 border-2 rounded-2xl cursor-pointer transition-all hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5",
    "border-gray-200 dark:border-gray-700"
  );

  return (
    <div
      onClick={onClick}
      className={cn(containerClasses, "hover:border-indigo-500 dark:hover:border-indigo-400")}
    >
      {/* Time Column */}
      <div className="flex sm:flex-col items-start sm:items-center gap-2 sm:min-w-[100px] border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-gray-700 pb-3 sm:pb-0 pr-0 sm:pr-4">
        {isHighConfidence && (
          <span className="px-2.5 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 rounded-lg text-xs font-bold whitespace-nowrap">High Match</span>
        )}
        <span className="text-lg font-bold text-gray-900 dark:text-white" suppressHydrationWarning>
          {formatTime(event.start.dateTime)}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center gap-3">
          {primaryContact ? (
            <>
              {primaryContact.photo ? (
                <img
                  src={primaryContact.photo}
                  alt={primaryContact.name}
                  className="w-10 h-10 rounded-full object-cover shadow-md shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0">
                  {getInitials(primaryContact.name)}
                </div>
              )}
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">{primaryContact.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{event.summary || 'Meeting'}</p>
              </div>
            </>
          ) : (
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">{event.summary || 'Meeting'}</h3>
              {event.attendees && event.attendees.length > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Location */}
        {(event.location || event.hangoutLink) && (
          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 font-medium">
            {getLocationIcon(event.location)}
            {event.location || 'Video Call'}
          </div>
        )}

        {/* Matched Contacts */}
        {meeting.matchedContacts.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-md text-xs text-indigo-700 dark:text-indigo-300">
              {meeting.matchedContacts.length} contact{meeting.matchedContacts.length !== 1 ? 's' : ''} matched
            </span>
            {primaryContact?.role && (
              <span className="px-2 py-1 bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md text-xs text-gray-500 dark:text-gray-400">
                {primaryContact.role}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="flex items-center sm:self-center mt-2 sm:mt-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="w-full sm:w-auto px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all hover:scale-105 shadow-md shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2"
        >
          Prep Now <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
