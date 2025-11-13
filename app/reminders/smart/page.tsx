"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageCircle,
  Calendar,
  Filter,
  ArrowLeft,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  getSmartReminders,
  getReminderStats,
  markAsReachedOut,
  snoozeReminder,
  getUrgencyColor,
  formatDaysAgo,
  type ReminderContact,
  type ReminderStats,
} from "@/lib/reminders/reminderUtils";

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

type FilterType = 'all' | 'high' | 'medium' | 'low';

export default function SmartRemindersPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [reminders, setReminders] = useState<ReminderContact[]>([]);
  const [filteredReminders, setFilteredReminders] = useState<ReminderContact[]>([]);
  const [stats, setStats] = useState<ReminderStats | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadReminders();
  }, []);

  useEffect(() => {
    // Filter reminders based on active filter
    if (activeFilter === 'all') {
      setFilteredReminders(reminders);
    } else {
      setFilteredReminders(reminders.filter(r => r.urgency === activeFilter));
    }
  }, [activeFilter, reminders]);

  const loadReminders = async () => {
    setIsLoading(true);

    try {
      const [remindersData, statsData] = await Promise.all([
        getSmartReminders(),
        getReminderStats(),
      ]);

      setReminders(remindersData);
      setFilteredReminders(remindersData);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading reminders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsReachedOut = async (personId: string) => {
    setProcessingIds(prev => new Set(prev).add(personId));

    try {
      const success = await markAsReachedOut(personId);

      if (success) {
        // Remove from reminders list
        setReminders(prev => prev.filter(r => r.id !== personId));
      }
    } catch (error) {
      console.error("Error marking as reached out:", error);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(personId);
        return next;
      });
    }
  };

  const handleSnooze = async (personId: string, days: number) => {
    setProcessingIds(prev => new Set(prev).add(personId));

    try {
      const success = await snoozeReminder(personId, days);

      if (success) {
        // Remove from reminders list
        setReminders(prev => prev.filter(r => r.id !== personId));
      }
    } catch (error) {
      console.error("Error snoozing reminder:", error);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(personId);
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 animate-pulse text-yellow-600" />
          <span className="text-gray-600 dark:text-gray-400">
            Loading smart reminders...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 pb-16 md:pb-0">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto w-full px-4 py-6 space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Link href="/reminders">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Bell className="h-8 w-8 text-yellow-600" />
                Smart Reminders
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 pl-14">
              AI-powered suggestions for who to reach out to
            </p>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {stats.totalReminders}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Total
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                      {stats.highUrgency}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      High
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                      {stats.mediumUrgency}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Medium
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {stats.lowUrgency}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Low
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Filter:
            </span>
            <Button
              variant={activeFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('all')}
              className={cn(
                activeFilter === 'all' && 'bg-purple-600 hover:bg-purple-700'
              )}
            >
              All ({reminders.length})
            </Button>
            <Button
              variant={activeFilter === 'high' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('high')}
              className={cn(
                activeFilter === 'high' && 'bg-red-600 hover:bg-red-700'
              )}
            >
              High ({stats?.highUrgency || 0})
            </Button>
            <Button
              variant={activeFilter === 'medium' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('medium')}
              className={cn(
                activeFilter === 'medium' && 'bg-yellow-600 hover:bg-yellow-700'
              )}
            >
              Medium ({stats?.mediumUrgency || 0})
            </Button>
            <Button
              variant={activeFilter === 'low' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('low')}
              className={cn(
                activeFilter === 'low' && 'bg-blue-600 hover:bg-blue-700'
              )}
            >
              Low ({stats?.lowUrgency || 0})
            </Button>
          </div>

          {/* Reminders List */}
          {filteredReminders.length > 0 ? (
            <div className="space-y-4">
              {filteredReminders.map((reminder) => {
                const isProcessing = processingIds.has(reminder.id);
                const urgencyColors = getUrgencyColor(reminder.urgency);

                return (
                  <Card
                    key={reminder.id}
                    className={cn(
                      "border-2 transition-all",
                      urgencyColors.border
                    )}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <Avatar
                          className="h-14 w-14 flex-shrink-0 cursor-pointer"
                          onClick={() => router.push(`/contacts/${reminder.id}`)}
                        >
                          <AvatarImage src={reminder.photo_url || undefined} />
                          <AvatarFallback
                            className={cn(
                              "bg-gradient-to-br text-white font-semibold",
                              getGradient(reminder.name)
                            )}
                          >
                            {getInitials(reminder.first_name, reminder.last_name)}
                          </AvatarFallback>
                        </Avatar>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-3">
                          {/* Name and Urgency */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h3
                                className="text-lg font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-purple-600 dark:hover:text-purple-400"
                                onClick={() => router.push(`/contacts/${reminder.id}`)}
                              >
                                {reminder.first_name} {reminder.last_name || ""}
                              </h3>
                              {reminder.relationship_summary && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {reminder.relationship_summary}
                                </p>
                              )}
                            </div>
                            <Badge
                              className={cn(
                                urgencyColors.bg,
                                urgencyColors.text,
                                "capitalize font-semibold"
                              )}
                            >
                              {reminder.urgency}
                            </Badge>
                          </div>

                          {/* Reason and Time */}
                          <div className={cn(
                            "rounded-lg p-3",
                            urgencyColors.bg
                          )}>
                            <div className="flex items-start gap-2">
                              <AlertCircle className={cn("h-5 w-5 flex-shrink-0 mt-0.5", urgencyColors.text)} />
                              <div>
                                <p className={cn("text-sm font-medium", urgencyColors.text)}>
                                  {reminder.reminderReason}
                                </p>
                                <p className={cn("text-xs mt-1", urgencyColors.text)}>
                                  Last contact: {formatDaysAgo(reminder.daysSinceContact)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Suggested Action */}
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <MessageCircle className="h-4 w-4" />
                            <span>Suggested: {reminder.suggestedAction}</span>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Button
                              onClick={() => handleMarkAsReachedOut(reminder.id)}
                              disabled={isProcessing}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Reached Out
                            </Button>
                            <Button
                              onClick={() => router.push(`/contacts/${reminder.id}`)}
                              variant="outline"
                              size="sm"
                            >
                              View Contact
                            </Button>
                            <Button
                              onClick={() => handleSnooze(reminder.id, 7)}
                              disabled={isProcessing}
                              variant="ghost"
                              size="sm"
                            >
                              <Clock className="h-4 w-4 mr-2" />
                              Snooze 7d
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  All caught up!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {activeFilter === 'all'
                    ? "No pending follow-ups. Great job staying connected!"
                    : `No ${activeFilter} urgency reminders.`}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Info Card */}
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-200">
                    How Smart Reminders Work
                  </h3>
                  <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
                    <li>High priority: Reminder after 14+ days</li>
                    <li>Medium priority: Reminder after 21+ days</li>
                    <li>Other contacts: Reminder after 30+ days</li>
                    <li>Urgency increases the longer you wait</li>
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
