"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import Link from "next/link";
import {
  Users,
  MessageCircle,
  CheckCircle2,
  TrendingUp,
  Lightbulb,
  Phone,
  UserPlus,
  Calendar,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Person, Interaction } from "@/types/database.types";
import { ConnectionDiscoverySection } from "@/components/connection-discovery-section";
import { RelationshipPatternsSection } from "@/components/relationship-patterns-section";
import { ErrorFallback } from "@/components/error-fallback";
import { CommunicationActivityChart } from "@/components/communication-activity-chart";
import { LearningLedgerSection } from "@/components/learning-ledger-section";
import { motion } from "framer-motion";

// Types
interface InsightsSummary {
  totalContacts: number;
  totalContactsChange: number;
  activeThisWeek: number;
  activeThisWeekChange: number;
  remindersCompleted: number;
  remindersCompletedChange: number;
  networkGrowth: number;
  networkGrowthChange: number;
}

interface CommunicationActivity {
  date: string;
  interactions: number;
}

interface RelationshipHealth {
  id: string;
  name: string;
  avatar: string | null;
  lastContact: number; // days ago
  healthScore: number; // 0-100
}

interface TopConnection {
  id: string;
  name: string;
  avatar: string | null;
  interactionCount: number;
}

interface UpcomingReminder {
  id: string;
  date: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

interface DecayingRelationship {
  person_id: string;
  name: string;
  last_contact_days: number;
  interaction_count: number;
  decay_severity: "mild" | "moderate" | "severe";
}

export default function InsightsPage() {
  const [timeRange, setTimeRange] = useState("30");
  const [activeTab, setActiveTab] = useState<"overview" | "ledger">("overview");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<InsightsSummary>({
    totalContacts: 0,
    totalContactsChange: 0,
    activeThisWeek: 0,
    activeThisWeekChange: 0,
    remindersCompleted: 0,
    remindersCompletedChange: 0,
    networkGrowth: 0,
    networkGrowthChange: 0,
  });
  const [activity, setActivity] = useState<CommunicationActivity[]>([]);
  const [healthList, setHealthList] = useState<RelationshipHealth[]>([]);
  const [topConnections, setTopConnections] = useState<TopConnection[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<UpcomingReminder[]>([]);
  const [insightMessage, setInsightMessage] = useState<string>("");
  const [decayingRelationships, setDecayingRelationships] = useState<DecayingRelationship[]>([]);
  const [error, setError] = useState<Error | null>(null);


  // Load data
  useEffect(() => {
    async function loadInsights() {
      // Reset error state
      setError(null);
      
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        const days = parseInt(timeRange);
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        const previousPeriodStart = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);

        // Parallel fetch: Persons, Interactions AND Decay Alerts
        const [personsRes, interactionsRes, decayRes] = await Promise.all([
          supabase.from("persons").select("*").eq("user_id", user.id).or("archived.eq.false,archived.is.null"),
          supabase.from("interactions").select("*").eq("user_id", user.id),
          fetch(`/api/decay-alerts?days=${Math.max(days, 180)}`).then(res => res.ok ? res.json() : { relationships: [] })
        ]);

        const allPersons = (personsRes.data || []) as Person[];
        const allInteractions = (interactionsRes.data || []) as Interaction[];

        // 1. Calculate summary stats
        const totalContacts = allPersons.length;
        
        // Contacts added in current period
        const currentPeriodContacts = allPersons.filter(p => 
          new Date(p.created_at) >= startDate
        ).length;
        
        // Contacts added in previous period
        const previousPeriodContacts = allPersons.filter(p => {
          const created = new Date(p.created_at);
          return created >= previousPeriodStart && created < startDate;
        }).length;

        const networkGrowthChange = previousPeriodContacts > 0 
          ? ((currentPeriodContacts - previousPeriodContacts) / previousPeriodContacts) * 100 
          : currentPeriodContacts > 0 ? 100 : 0;

        // Active this week (last 7 days)
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        
        const activeThisWeekIds = new Set(
          allInteractions
            .filter(i => new Date(i.date) >= weekAgo)
            .map(i => i.person_id)
        );
        const activeThisWeek = activeThisWeekIds.size;

        const activePreviousWeek = new Set(
          allInteractions
            .filter(i => {
              const date = new Date(i.date);
              return date >= twoWeeksAgo && date < weekAgo;
            })
            .map(i => i.person_id)
        ).size;

        const activeThisWeekChange = activePreviousWeek > 0
          ? ((activeThisWeek - activePreviousWeek) / activePreviousWeek) * 100
          : activeThisWeek > 0 ? 100 : 0;

        // Reminders completed
        const remindersCompleted = allPersons.filter(p => {
          if (!p.follow_up_reminder) return false;
          const reminderDate = new Date(p.follow_up_reminder);
          return reminderDate < now && reminderDate >= startDate;
        }).length;

        const remindersCompletedPrevious = allPersons.filter(p => {
          if (!p.follow_up_reminder) return false;
          const reminderDate = new Date(p.follow_up_reminder);
          return reminderDate < startDate && reminderDate >= previousPeriodStart;
        }).length;

        const remindersCompletedChange = remindersCompletedPrevious > 0
          ? ((remindersCompleted - remindersCompletedPrevious) / remindersCompletedPrevious) * 100
          : remindersCompleted > 0 ? 100 : 0;

        setSummary({
          totalContacts,
          totalContactsChange: networkGrowthChange,
          activeThisWeek,
          activeThisWeekChange,
          remindersCompleted,
          remindersCompletedChange,
          networkGrowth: currentPeriodContacts,
          networkGrowthChange,
        });

        // 2. Calculate relationship health
        const healthData: RelationshipHealth[] = allPersons.map(p => {
          const lastDate = p.last_interaction_date || p.last_contact || p.created_at;
          const daysSinceContact = Math.floor((now.getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
          
          // Calculate health score (0-100)
          const target = p.target_frequency_days || 30;
          let healthScore = 100;
          
          if (daysSinceContact > target * 3) healthScore = 0;
          else if (daysSinceContact > target * 2) healthScore = 30;
          else if (daysSinceContact > target) healthScore = 60;
          else healthScore = Math.max(0, 100 - (daysSinceContact / target) * 40);

          return {
            id: p.id,
            name: p.name,
            avatar: p.photo_url,
            lastContact: daysSinceContact,
            healthScore: Math.round(healthScore),
          };
        })
        .filter(h => h.healthScore < 90)
        .sort((a, b) => a.healthScore - b.healthScore)
        .slice(0, 5);

        setHealthList(healthData);

        // 3. Calculate top connections
        const personInteractionCounts = new Map<string, number>();
        allInteractions.forEach(i => {
          personInteractionCounts.set(
            i.person_id,
            (personInteractionCounts.get(i.person_id) || 0) + 1
          );
        });

        const topConnectionsData: TopConnection[] = Array.from(personInteractionCounts.entries())
          .map(([personId, count]) => {
            const person = allPersons.find(p => p.id === personId);
            return person ? {
              id: person.id,
              name: person.name,
              avatar: person.photo_url,
              interactionCount: count,
            } : null;
          })
          .filter((c): c is TopConnection => c !== null)
          .sort((a, b) => b.interactionCount - a.interactionCount)
          .slice(0, 10);

        setTopConnections(topConnectionsData);

        // 4. Upcoming reminders
        const upcomingData: UpcomingReminder[] = allPersons
          .filter(p => p.follow_up_reminder && new Date(p.follow_up_reminder) >= now)
          .map(p => ({
            id: p.id,
            date: p.follow_up_reminder!,
            description: `Reach out to ${p.name}`,
            priority: 'medium' as const,
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 5);

        setUpcomingReminders(upcomingData);

        // 5. Calculate activity for chart
        const activityMap = new Map<string, number>();
        // Initialize last X days with 0
        for (let i = 0; i < days; i++) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const dateString = date.toISOString().split('T')[0];
          activityMap.set(dateString, 0);
        }

        allInteractions.forEach(i => {
          const dateString = new Date(i.date).toISOString().split('T')[0];
          if (activityMap.has(dateString)) {
            activityMap.set(dateString, (activityMap.get(dateString) || 0) + 1);
          }
        });

        const activityData: CommunicationActivity[] = Array.from(activityMap.entries())
          .map(([date, interactions]) => ({ date, interactions }))
          .sort((a, b) => a.date.localeCompare(b.date));

        setActivity(activityData);

        // 6. Process Decaying Relationships
        const decayProcessed = (decayRes.relationships || []).map((p: Person) => {
          const lastDate = (p as Person).last_interaction_date || p.last_contact || p.created_at;
          const contactDays = Math.floor((now.getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
          
          let severity: "mild" | "moderate" | "severe" = "mild";
          if (contactDays > 365) severity = "severe";
          else if (contactDays > 180) severity = "moderate";

          return {
            person_id: p.id,
            name: p.name,
            last_contact_days: contactDays,
            interaction_count: (p as Person).interaction_count || 0,
            decay_severity: severity
          };
        });
        setDecayingRelationships(decayProcessed);

        // 7. Generate insight message
        let insight = "";
        if (activeThisWeek > 5) {
          insight = "Great job! You've been active with several contacts this week. Keep up the momentum!";
        } else if (healthData.length > 0) {
          insight = `You have relationships that are starting to drift. A quick message can make a big difference!`;
        } else if (currentPeriodContacts > 0) {
          insight = "Your network is growing. Don't forget to set follow-up targets for new contacts!";
        } else {
          insight = "Consistent interaction is the key to deep relationships. Try reaching out to one person today just to say hi.";
        }
        setInsightMessage(insight);

      } catch (error) {
        console.error("Error loading insights:", error);
        setError(error instanceof Error ? error : new Error("Failed to load insights"));
      } finally {
        setLoading(false);
      }
    }

    loadInsights();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400">Loading insights...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <ErrorFallback
          error={error}
          reset={() => {
            setLoading(true);
            // Trigger a re-run of effect by toggling state or calling load directly?
            // Actually, we can just reload the page or implement a refresh trigger.
            // For now, let's use window.location.reload() for simplicity or re-mount.
            window.location.reload(); 
          }}
          title="Insights unavailable"
          message="We couldn't load your relationship insights. Please try again."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Page Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-[32px] font-semibold text-gray-900 dark:text-white">Insights</h1>
            <p className="text-base text-gray-600 dark:text-gray-400 mt-1">Your relationship analytics</p>
          </div>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="w-[180px]"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">All time</option>
          </Select>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-4 mb-8 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setActiveTab("overview")}
            className={cn(
              "pb-4 text-sm font-bold uppercase tracking-widest transition-all relative",
              activeTab === "overview" 
                ? "text-indigo-600 dark:text-indigo-400" 
                : "text-gray-400 hover:text-gray-600"
            )}
          >
            Overview
            {activeTab === "overview" && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" 
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab("ledger")}
            className={cn(
              "pb-4 text-sm font-bold uppercase tracking-widest transition-all relative",
              activeTab === "ledger" 
                ? "text-indigo-600 dark:text-indigo-400" 
                : "text-gray-400 hover:text-gray-600"
            )}
          >
            Learning Ledger
            {activeTab === "ledger" && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" 
              />
            )}
          </button>
        </div>

        {activeTab === "overview" ? (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Contacts */}
          <Card className="bg-white dark:bg-gray-800 p-6 rounded-xl border-none shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-4xl font-bold text-gray-900 dark:text-white mb-1">{summary.totalContacts}</p>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Contacts</p>
            <p className={cn(
              "text-xs font-medium",
              summary.totalContactsChange >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}>
              {summary.totalContactsChange >= 0 ? "↑" : "↓"} {Math.abs(Math.round(summary.totalContactsChange))}% from last period
            </p>
          </Card>

          {/* Active This Week */}
          <Card className="bg-white dark:bg-gray-800 p-6 rounded-xl border-none shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <MessageCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-4xl font-bold text-gray-900 dark:text-white mb-1">{summary.activeThisWeek}</p>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Active This Week</p>
            <p className={cn(
              "text-xs font-medium",
              summary.activeThisWeekChange >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}>
              {summary.activeThisWeekChange >= 0 ? "↑" : "↓"} {Math.abs(Math.round(summary.activeThisWeekChange))}% from last week
            </p>
          </Card>

          {/* Reminders Completed */}
          <Card className="bg-white dark:bg-gray-800 p-6 rounded-xl border-none shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-5 w-5 text-pink-600 dark:text-pink-400" />
            </div>
            <p className="text-4xl font-bold text-gray-900 dark:text-white mb-1">{summary.remindersCompleted}</p>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Reminders Completed</p>
            <p className={cn(
              "text-xs font-medium",
              summary.remindersCompletedChange >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}>
              {summary.remindersCompletedChange >= 0 ? "↑" : "↓"} {Math.abs(Math.round(summary.remindersCompletedChange))}% from last period
            </p>
          </Card>

          {/* Network Growth */}
          <Card className="bg-white dark:bg-gray-800 p-6 rounded-xl border-none shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
              <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-4xl font-bold text-gray-900 dark:text-white mb-1">{summary.networkGrowth}</p>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Network Growth</p>
            <p className={cn(
              "text-xs font-medium",
              summary.networkGrowthChange >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}>
              {summary.networkGrowthChange >= 0 ? "↑" : "↓"} {Math.abs(Math.round(summary.networkGrowthChange))}% growth
            </p>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Communication Activity Chart */}
            <Card className="bg-white dark:bg-gray-800 p-6 rounded-xl border-none shadow-sm">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Communication Activity</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Interactions over time</p>
              </div>
              <CommunicationActivityChart data={activity} />
            </Card>

            {/* Relationship Health */}
            <Card className="bg-white dark:bg-gray-800 p-6 rounded-xl border-none shadow-sm">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Relationship Health</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Contacts needing attention</p>
              </div>
              <div className="space-y-0">
                {healthList.length > 0 ? (
                  healthList.map((contact, index) => (
                    <div
                      key={contact.id}
                      className={cn(
                        "flex items-center gap-4 py-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer",
                        index !== healthList.length - 1 && "border-b border-gray-200 dark:border-gray-700"
                      )}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={contact.avatar || ""} />
                        <AvatarFallback className="bg-linear-to-br text-white font-semibold from-purple-500 to-blue-500">
                          {contact.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-gray-900 dark:text-white">{contact.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Last contact: {contact.lastContact} {contact.lastContact === 1 ? 'day' : 'days'} ago
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-[100px] h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                contact.healthScore <= 33 ? "bg-red-600 dark:bg-red-500" :
                                contact.healthScore <= 66 ? "bg-amber-600 dark:bg-amber-500" :
                                "bg-green-600 dark:bg-green-500"
                              )}
                              style={{ width: `${contact.healthScore}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{contact.healthScore}%</span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 text-gray-500 dark:text-gray-400">No data available</p>
                )}
              </div>
            </Card>

            {/* Decaying Relationships */}
            {decayingRelationships.length > 0 && (
              <Card className="bg-linear-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 p-6 rounded-xl border-2 border-orange-200 dark:border-orange-800 shadow-sm">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    <h2 className="text-xl font-semibold text-orange-900 dark:text-orange-100">Relationships Needing Attention</h2>
                  </div>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                    Consider reconnecting or archiving these contacts
                  </p>
                </div>
                <div className="space-y-2">
                  {decayingRelationships.slice(0, 5).map((relationship) => {
                    const getSeverityColor = (severity: string) => {
                      switch (severity) {
                        case "severe":
                          return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-red-300 dark:border-red-700";
                        case "moderate":
                          return "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 border-orange-300 dark:border-orange-700";
                        default:
                          return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700";
                      }
                    };

                    const getSeverityText = (days: number) => {
                      if (days > 365) return `${Math.floor(days / 365)} year${Math.floor(days / 365) > 1 ? 's' : ''}`;
                      if (days > 180) return `${Math.floor(days / 30)} months`;
                      return `${days} days`;
                    };

                    return (
                      <Link
                        key={relationship.person_id}
                        href={`/contacts/${relationship.person_id}`}
                        className="block"
                      >
                        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-all border-2 border-orange-200 dark:border-orange-700 hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-md cursor-pointer">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-semibold text-gray-900 dark:text-white truncate">
                                {relationship.name}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {relationship.interaction_count} interaction{relationship.interaction_count !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <Badge className={cn("text-xs font-medium", getSeverityColor(relationship.decay_severity))}>
                              {getSeverityText(relationship.last_contact_days)} ago
                            </Badge>
                            <ChevronRight className="h-5 w-5 text-orange-400" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                {decayingRelationships.length > 5 && (
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-4 text-center">
                    + {decayingRelationships.length - 5} more relationship{decayingRelationships.length - 5 > 1 ? 's' : ''} needing attention
                  </p>
                )}
              </Card>
            )}

            {/* Top Connections */}
            <Card className="bg-white dark:bg-gray-800 p-6 rounded-xl border-none shadow-sm">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Top Connections</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Your most frequent contacts</p>
              </div>
              <div className="space-y-0">
                {topConnections.length > 0 ? (
                  topConnections.map((connection, index) => {
                    const maxCount = topConnections[0]?.interactionCount || 1;
                    const percentage = (connection.interactionCount / maxCount) * 100;
                    
                    return (
                      <div
                        key={connection.id}
                        className={cn(
                          "flex items-center gap-3 py-3",
                          index !== topConnections.length - 1 && "border-b border-gray-200 dark:border-gray-700"
                        )}
                      >
                        <span className="text-base font-semibold text-gray-400 dark:text-gray-500 w-[30px]">{index + 1}.</span>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={connection.avatar || ""} />
                          <AvatarFallback className="bg-linear-to-br text-white font-semibold from-green-500 to-blue-500">
                            {connection.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[15px] font-medium text-gray-900 dark:text-white flex-1">{connection.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-[120px] h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white w-[60px] text-right">
                            {connection.interactionCount} {connection.interactionCount === 1 ? 'interaction' : 'interactions'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center py-8 text-gray-500 dark:text-gray-400">No interaction data available</p>
                )}
              </div>
            </Card>

            {/* Relationship Patterns */}
            <RelationshipPatternsSection />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="bg-white dark:bg-gray-800 p-5 rounded-xl border-none shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full h-12 justify-start gap-3 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Phone className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Reach out today</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-12 justify-start gap-3 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Add reminder</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-12 justify-start gap-3 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <UserPlus className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Update contacts</span>
                </Button>
              </div>
            </Card>

            {/* Upcoming Reminders */}
            <Card className="bg-white dark:bg-gray-800 p-5 rounded-xl border-none shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming</h2>
                {upcomingReminders.length > 0 && (
                  <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 px-2 py-0.5 text-xs">
                    {upcomingReminders.length}
                  </Badge>
                )}
              </div>
              <div className="space-y-0">
                {upcomingReminders.length > 0 ? (
                  upcomingReminders.map((reminder, index) => {
                    const reminderDate = new Date(reminder.date);
                    const today = new Date();
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    
                    const isToday = reminderDate.toDateString() === today.toDateString();
                    const isTomorrow = reminderDate.toDateString() === tomorrow.toDateString();
                    
                    let dateLabel = "";
                    let dotColor = "bg-[#9CA3AF]";
                    
                    if (isToday) {
                      dateLabel = "TODAY";
                      dotColor = "bg-[#EF4444]";
                    } else if (isTomorrow) {
                      dateLabel = "TOMORROW";
                      dotColor = "bg-[#F59E0B]";
                    } else {
                      dateLabel = reminderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
                      dotColor = "bg-[#3B82F6]";
                    }
                    
                    return (
                      <div
                        key={reminder.id}
                        className={cn(
                          "py-3",
                          index !== upcomingReminders.length - 1 && "border-b border-gray-200 dark:border-gray-700"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <div className={cn("w-2 h-2 rounded-full mt-1.5", dotColor)} />
                          <div>
                            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">{dateLabel}</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{reminder.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">No upcoming reminders</p>
                )}
              </div>
            </Card>

            {/* Insights Summary */}
            <Card className="bg-linear-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 p-5 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Lightbulb className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-blue-900 dark:text-blue-300 mb-2">💡 Insight</h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                    {insightMessage}
                  </p>
                </div>
              </div>
            </Card>

            {/* Connection Discovery */}
            <ConnectionDiscoverySection />
          </div>
        </div>
          </>
        ) : (
          <LearningLedgerSection />
        )}
      </div>
    </div>
  );
}

