'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { MatchedMeeting, MatchingResult } from '@/lib/matching/types';

export function MatchedEventsList() {
  const { data: session } = useSession();
  const [meetings, setMeetings] = useState<MatchedMeeting[]>([]);
  const [stats, setStats] = useState<MatchingResult['stats'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMatchedEvents = useCallback(async () => {
    if (!session?.accessToken) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/calendar/matched-events?days=7');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch matched events');
      }

      setMeetings(data.meetings);
      setStats(data.stats);
    } catch (err: any) {
      console.error('Error fetching matched events:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session?.accessToken) {
      fetchMatchedEvents();
    }
  }, [session, fetchMatchedEvents]);

  if (!session) {
    return null;
  }

  // Only show if we have matches or stats
  if (!isLoading && !stats && meetings.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">🎯 Meetings with Contacts</h3>
        <button
          onClick={fetchMatchedEvents}
          disabled={isLoading}
          className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.matched}</p>
            <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">Matched</p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.highConfidence}</p>
            <p className="text-xs text-green-600 dark:text-green-300 mt-1">High Confidence</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
            <p className="text-2xl font-bold text-gray-700 dark:text-gray-400">{stats.unmatched}</p>
            <p className="text-xs text-gray-600 dark:text-gray-500 mt-1">Unmatched</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400">⚠️ {error}</p>
        </div>
      )}

      {isLoading && meetings.length === 0 ? (
        <div className="py-8 text-center">
          <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Finding meetings with your contacts...</p>
        </div>
      ) : (
        <>
          {meetings.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">📭 No meetings matched to contacts</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                Calendar events with attendees in your contacts will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {meetings.map((meeting) => (
                <div
                  key={meeting.calendarEvent.id}
                  className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-200 dark:border-indigo-800 rounded-lg"
                >
                  {/* Meeting Title */}
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {meeting.calendarEvent.summary || 'Untitled Meeting'}
                    </h4>
                    <span className={`
                      px-2 py-1 text-xs font-medium rounded-full
                      ${meeting.confidence === 'high' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
                      ${meeting.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
                      ${meeting.confidence === 'low' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : ''}
                    `}>
                      {meeting.confidence}
                    </span>
                  </div>

                  {/* Time */}
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    📅 {new Date(meeting.calendarEvent.start.dateTime).toLocaleString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>

                  {/* Matched Contacts */}
                  {meeting.matchedContacts.length > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-indigo-100 dark:border-indigo-900">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Matched Contact{meeting.matchedContacts.length > 1 ? 's' : ''}:
                        </p>
                        {meeting.matchedContacts.map((contact) => (
                          <div key={contact.id} className="flex items-center gap-2 mt-1">
                            {contact.photo ? (
                              <img 
                                src={contact.photo} 
                                alt={contact.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold">
                                {contact.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{contact.name}</p>
                              {contact.role && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">{contact.role}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition">
                        Prep Now →
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
