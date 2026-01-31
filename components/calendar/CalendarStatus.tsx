'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, RefreshCw, Video, Users, Clock } from 'lucide-react';
import { CalendarEvent } from '@/lib/calendar/types';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function CalendarStatus() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [checkingStatus, setCheckingStatus] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);

  // Track mount state to avoid hydration mismatch with date formatting
  useEffect(() => {
    setMounted(true);
  }, []);

  const checkConnection = useCallback(async () => {
    if (!session?.user) return;
    
    setCheckingStatus(true);
    try {
      const response = await fetch('/api/calendar/status');
      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.connected);
      }
    } catch (err) {
      console.error('Error checking calendar status:', err);
    } finally {
      setCheckingStatus(false);
    }
  }, [session]);

  const fetchEvents = useCallback(async () => {
    if (!session?.user) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/calendar/events');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch events');
      }
      
      setEvents(data.events || []);
    } catch (err) {
      console.error('Error loading calendar:', err);
      setError(err instanceof Error ? err.message : 'Could not load calendar events');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      checkConnection();
    }
  }, [session, checkConnection]);

  // Re-fetch events when connection status changes to true
  useEffect(() => {
    if (isConnected) {
      fetchEvents();
    }
  }, [isConnected, fetchEvents]);

  const handleConnect = async () => {
    // Redirect to Google OAuth for calendar permission
    window.location.href = '/api/auth/google';
  };

  const formatEventTime = (dateString: string) => {
    if (!mounted) return '--:--';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getEventDate = (dateString: string) => {
    if (!mounted) return '';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (!session) return null;

  if (checkingStatus) {
     return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden mb-6 p-8 flex justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        </div>
     );
  }

  if (!isConnected) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden mb-6">
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Connect Your Calendar
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
            Enable automatic meeting prep by connecting your Google Calendar.
          </p>
          <Button onClick={handleConnect} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            Connect Google Calendar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden mb-6">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
        <div className="flex items-center gap-2">
          <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-2 rounded-lg">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Calendar Connected</h3>
            <div className="flex items-center gap-1.5">
              <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">Sync Active</p>
            </div>
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchEvents} 
          disabled={loading}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Content */}
      <div className="p-4">
        {error ? (
          <div className="text-center py-4 text-red-500 text-sm bg-red-50 dark:bg-red-900/10 rounded-lg">
            {error}
            <button onClick={fetchEvents} className="ml-2 underline hover:no-underline font-medium">Try again</button>
          </div>
        ) : loading && events.length === 0 ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No upcoming meetings found.</p>
            <p className="text-xs mt-1">Enjoy your free time! 🎉</p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
              Next {Math.min(events.length, 5)} Events
            </p>
            
            {events.slice(0, 5).map((event) => (
              <div 
                key={event.id} 
                className="group flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700"
              >
                <div className="shrink-0 w-14 text-center">
                  <span className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                    {getEventDate(event.start.dateTime)}
                  </span>
                  <span className="block text-sm font-semibold text-gray-900 dark:text-gray-200">
                    {formatEventTime(event.start.dateTime)}
                  </span>
                </div>
                
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {event.summary}
                  </h4>
                  
                  <div className="flex items-center gap-3 mt-1">
                    {event.hangoutLink && (
                      <a 
                        href={event.hangoutLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        title="Join Video Call"
                      >
                        <Video className="w-3 h-3" />
                        Join
                      </a>
                    )}
                    
                    {event.attendees && event.attendees.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400" title={`${event.attendees.length} attendees`}>
                        <Users className="w-3 h-3" />
                        {event.attendees.length}
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3" />
                      {Math.round((new Date(event.end.dateTime).getTime() - new Date(event.start.dateTime).getTime()) / 60000)}m
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
