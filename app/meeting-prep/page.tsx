"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Video,
  AlertCircle,
  CheckCircle2,
  Settings,
  RefreshCw,
  ExternalLink,
  User,
  Info,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  fetchUpcomingEvents,
  getCalendarSyncStatus,
  formatEventTimeRange,
  getTimeUntilEvent,
  requestCalendarPermission,
  type CalendarEvent,
  type CalendarSyncStatus,
} from "@/lib/calendar/calendarIntegration";
import {
  matchAttendeesToPersons,
  getTodaysMeetings,
  sortMeetingPrepsByTime,
  getPersonContextSummary,
  type MeetingPrep,
} from "@/lib/calendar/meetingMatcher";

// Helper function to get initials
const getInitials = (firstName: string, lastName: string | null): string => {
  if (!firstName) return "";
  const firstInitial = firstName.trim()[0]?.toUpperCase() || "";
  const lastInitial = lastName?.trim()[0]?.toUpperCase() || "";
  return (firstInitial + lastInitial) || firstName.substring(0, 2).toUpperCase();
};

// Helper function to get gradient
const getGradient = (name: string): string => {
  const gradients = [
    "from-purple-500 to-blue-500",
    "from-green-500 to-blue-500",
    "from-orange-500 to-yellow-500",
    "from-cyan-500 to-green-500",
    "from-pink-500 to-red-500",
    "from-indigo-500 to-purple-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
};

export default function MeetingPrepPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<CalendarSyncStatus | null>(null);
  const [meetingPreps, setMeetingPreps] = useState<MeetingPrep[]>([]);
  const [todaysMeetings, setTodaysMeetings] = useState<MeetingPrep[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMeetingPrep();
  }, []);

  const loadMeetingPrep = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check calendar sync status
      const status = await getCalendarSyncStatus();
      setSyncStatus(status);

      if (!status.enabled || !status.hasPermission) {
        setIsLoading(false);
        return;
      }

      // Fetch upcoming events (placeholder - would use actual token)
      // For demo, we'll show empty state
      const events: CalendarEvent[] = [];

      if (events.length === 0) {
        setMeetingPreps([]);
        setTodaysMeetings([]);
        setIsLoading(false);
        return;
      }

      // Match attendees to persons
      const preps = await Promise.all(
        events.map(event => matchAttendeesToPersons(event))
      );

      const sorted = sortMeetingPrepsByTime(preps);
      setMeetingPreps(sorted);

      const today = getTodaysMeetings(sorted);
      setTodaysMeetings(today);
    } catch (err: any) {
      console.error("Error loading meeting prep:", err);
      setError(err.message || "Failed to load meeting prep data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectCalendar = async (provider: 'google' | 'microsoft') => {
    setIsConnecting(true);
    setError(null);

    try {
      const result = await requestCalendarPermission(provider);

      if (result.granted) {
        // Reload meeting prep
        await loadMeetingPrep();
      } else {
        setError(result.userMessage || "Failed to connect calendar");
      }
    } catch (err: any) {
      setError("An error occurred while connecting your calendar");
    } finally {
      setIsConnecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 animate-pulse text-purple-600" />
          <span className="text-gray-600 dark:text-gray-400">
            Loading meeting prep...
          </span>
        </div>
      </div>
    );
  }

  // Calendar not connected
  if (!syncStatus?.enabled || !syncStatus?.hasPermission) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 pb-16 md:pb-0">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto w-full px-4 py-6 space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Calendar className="h-8 w-8 text-purple-600" />
                Meeting Prep
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Get relationship context before every meeting
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <Card className="border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-red-900 dark:text-red-200 mb-1">
                        Error
                      </h3>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {error}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Connect Calendar Card */}
            <Card className="border-2 border-purple-200 dark:border-purple-800">
              <CardContent className="pt-6 space-y-6">
                <div className="text-center space-y-4">
                  <div className="inline-flex h-20 w-20 rounded-full bg-purple-100 dark:bg-purple-900/30 items-center justify-center">
                    <Calendar className="h-10 w-10 text-purple-600" />
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Connect Your Calendar
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                      Get relationship context for every meeting attendee. Know who you're
                      meeting with before the call starts.
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-4 pt-4">
                    <Button
                      onClick={() => handleConnectCalendar('google')}
                      disabled={isConnecting}
                      className="bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300"
                      size="lg"
                    >
                      {isConnecting ? (
                        <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      ) : (
                        <Calendar className="h-5 w-5 mr-2" />
                      )}
                      Connect Google Calendar
                    </Button>

                    <Button
                      onClick={() => handleConnectCalendar('microsoft')}
                      disabled={isConnecting}
                      variant="outline"
                      size="lg"
                    >
                      {isConnecting ? (
                        <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      ) : (
                        <Calendar className="h-5 w-5 mr-2" />
                      )}
                      Connect Microsoft
                    </Button>
                  </div>
                </div>

                {/* Features */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-center">
                    What You'll Get
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center space-y-2">
                      <div className="inline-flex h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      </div>
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                        Auto-Match Contacts
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Automatically match meeting attendees to your contacts
                      </p>
                    </div>

                    <div className="text-center space-y-2">
                      <div className="inline-flex h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center">
                        <Info className="h-6 w-6 text-blue-600" />
                      </div>
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                        Relationship Context
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        See how you met, last interaction, and key details
                      </p>
                    </div>

                    <div className="text-center space-y-2">
                      <div className="inline-flex h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 items-center justify-center">
                        <Clock className="h-6 w-6 text-purple-600" />
                      </div>
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                        30-Min Reminders
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Get prep notifications 30 minutes before meetings
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-200">
                      Privacy & Security
                    </h3>
                    <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
                      <li>We only read your calendar events - never modify them</li>
                      <li>Calendar data is processed in real-time, not stored</li>
                      <li>You can disconnect anytime in settings</li>
                      <li>OAuth tokens are encrypted and secure</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Calendar connected but no meetings
  if (meetingPreps.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 pb-16 md:pb-0">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto w-full px-4 py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <Calendar className="h-8 w-8 text-purple-600" />
                  Meeting Prep
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  No upcoming meetings in the next 7 days
                </p>
              </div>
              <Button
                onClick={loadMeetingPrep}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {/* Empty State */}
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  All Clear!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  You have no upcoming meetings in the next week.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Show meetings with prep data
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 pb-16 md:pb-0">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto w-full px-4 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Calendar className="h-8 w-8 text-purple-600" />
                Meeting Prep
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {todaysMeetings.length} meeting{todaysMeetings.length !== 1 ? 's' : ''} today
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={loadMeetingPrep}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Link href="/settings/calendar">
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Today's Meetings */}
          {todaysMeetings.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Today
              </h2>
              {todaysMeetings.map((prep) => (
                <MeetingPrepCard key={prep.event.id} prep={prep} router={router} />
              ))}
            </div>
          )}

          {/* Upcoming Meetings */}
          {meetingPreps.length > todaysMeetings.length && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Upcoming
              </h2>
              {meetingPreps
                .filter(prep => !todaysMeetings.includes(prep))
                .map((prep) => (
                  <MeetingPrepCard key={prep.event.id} prep={prep} router={router} />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Meeting Prep Card Component
function MeetingPrepCard({ prep, router }: { prep: MeetingPrep; router: any }) {
  const { event, persons, unmatchedAttendees, isUpcoming, minutesUntilMeeting } = prep;

  const urgencyColor = minutesUntilMeeting <= 30 && minutesUntilMeeting > 0
    ? "border-orange-300 dark:border-orange-700"
    : "border-gray-200 dark:border-gray-700";

  return (
    <Card className={cn("transition-all", urgencyColor)}>
      <CardContent className="p-6 space-y-4">
        {/* Event Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {event.title}
            </h3>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatEventTimeRange(event.start, event.end)}
              </span>
              {event.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {event.location}
                </span>
              )}
              {event.meetingLink && (
                <a
                  href={event.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-purple-600 hover:text-purple-700"
                >
                  <Video className="h-4 w-4" />
                  Join
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
          {isUpcoming && (
            <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 whitespace-nowrap">
              {getTimeUntilEvent(event.start)}
            </Badge>
          )}
        </div>

        {/* Known Contacts */}
        {persons.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="h-4 w-4" />
              Known Contacts ({persons.length})
            </h4>
            <div className="space-y-3">
              {persons.map((person) => (
                <div
                  key={person.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => router.push(`/contacts/${person.id}`)}
                >
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={person.photo_url || undefined} />
                    <AvatarFallback
                      className={cn(
                        "bg-gradient-to-br text-white font-semibold text-sm",
                        getGradient(person.name)
                      )}
                    >
                      {getInitials(person.first_name, person.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {person.first_name} {person.last_name || ""}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {getPersonContextSummary(person)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unmatched Attendees */}
        {unmatchedAttendees.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <User className="h-4 w-4" />
              Other Attendees ({unmatchedAttendees.length})
            </h4>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              {unmatchedAttendees.map((attendee, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span>•</span>
                  <span>{attendee.name || attendee.email}</span>
                  {attendee.name && attendee.email && (
                    <span className="text-xs text-gray-500">({attendee.email})</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
