"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Star,
  Zap,
  Activity,
  Heart,
  MessageCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  getDashboardStats,
  getInteractionStats,
  getRelationshipHealth,
  getTopContacts,
  getContactsNeedingAttention,
  formatDaysSince,
  type DashboardStats,
  type InteractionStats,
  type RelationshipHealth,
  type TopContact,
} from "@/lib/dashboard/dashboardUtils";

// Helper function to get initials
const getInitials = (firstName: string, lastName: string | null): string => {
  if (!firstName) return "";
  const firstInitial = firstName.trim()[0]?.toUpperCase() || "";
  const lastInitial = lastName?.trim()[0]?.toUpperCase() || "";
  return (firstInitial + lastInitial) || firstName.substring(0, 2).toUpperCase();
};

// Helper function to get gradient color
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

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [interactionStats, setInteractionStats] = useState<InteractionStats | null>(null);
  const [relationshipHealth, setRelationshipHealth] = useState<RelationshipHealth | null>(null);
  const [topContacts, setTopContacts] = useState<TopContact[]>([]);
  const [needingAttention, setNeedingAttention] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);

    try {
      const [statsData, interactionData, healthData, topData, attentionData] = await Promise.all([
        getDashboardStats(),
        getInteractionStats(),
        getRelationshipHealth(),
        getTopContacts(5),
        getContactsNeedingAttention(30),
      ]);

      setStats(statsData);
      setInteractionStats(interactionData);
      setRelationshipHealth(healthData);
      setTopContacts(topData);
      setNeedingAttention(attentionData.slice(0, 5)); // Limit to 5
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 animate-pulse text-purple-600" />
          <span className="text-gray-600 dark:text-gray-400">
            Loading dashboard...
          </span>
        </div>
      </div>
    );
  }

  const contextPercentage = stats
    ? Math.round((stats.withContext / stats.totalContacts) * 100) || 0
    : 0;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 pb-16 md:pb-0">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full px-4 py-6 space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Activity className="h-8 w-8 text-purple-600" />
              Relationship Health Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track and maintain your most important relationships
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Contacts */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Total Contacts
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {stats?.totalContacts || 0}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {stats?.recentlyAdded || 0} added this month
                </p>
              </CardContent>
            </Card>

            {/* High Priority */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      High Priority
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {stats?.highPriority || 0}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <Star className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {stats?.mediumPriority || 0} medium, {stats?.lowPriority || 0} low
                </p>
              </CardContent>
            </Card>

            {/* Needing Attention */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Need Attention
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {stats?.needingAttention || 0}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  30+ days since last contact
                </p>
              </CardContent>
            </Card>

            {/* Context Added */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      With Context
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {contextPercentage}%
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {stats?.withContext || 0} of {stats?.totalContacts || 0} contacts
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Relationship Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-purple-600" />
                  Relationship Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {relationshipHealth && (
                  <>
                    {/* Healthy */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Healthy (≤30 days)
                        </span>
                        <span className="font-semibold text-green-600">
                          {relationshipHealth.healthy}
                        </span>
                      </div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all duration-500"
                          style={{
                            width: `${
                              (relationshipHealth.healthy /
                                (relationshipHealth.healthy +
                                  relationshipHealth.warning +
                                  relationshipHealth.needsAttention +
                                  relationshipHealth.noData || 1)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Warning */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Warning (30-60 days)
                        </span>
                        <span className="font-semibold text-yellow-600">
                          {relationshipHealth.warning}
                        </span>
                      </div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-500 transition-all duration-500"
                          style={{
                            width: `${
                              (relationshipHealth.warning /
                                (relationshipHealth.healthy +
                                  relationshipHealth.warning +
                                  relationshipHealth.needsAttention +
                                  relationshipHealth.noData || 1)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Needs Attention */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Needs Attention (60+ days)
                        </span>
                        <span className="font-semibold text-red-600">
                          {relationshipHealth.needsAttention}
                        </span>
                      </div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 transition-all duration-500"
                          style={{
                            width: `${
                              (relationshipHealth.needsAttention /
                                (relationshipHealth.healthy +
                                  relationshipHealth.warning +
                                  relationshipHealth.needsAttention +
                                  relationshipHealth.noData || 1)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* No Data */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          No Interaction Data
                        </span>
                        <span className="font-semibold text-gray-600">
                          {relationshipHealth.noData}
                        </span>
                      </div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gray-400 transition-all duration-500"
                          style={{
                            width: `${
                              (relationshipHealth.noData /
                                (relationshipHealth.healthy +
                                  relationshipHealth.warning +
                                  relationshipHealth.needsAttention +
                                  relationshipHealth.noData || 1)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Interaction Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-purple-600" />
                  Interaction Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {interactionStats && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                          This Week
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {interactionStats.contactsThisWeek}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                          This Month
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {interactionStats.contactsThisMonth}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                          This Year
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {interactionStats.contactsThisYear}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                          Avg Interactions
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {interactionStats.avgInteractionCount}
                        </p>
                      </div>
                    </div>

                    {interactionStats.contactsWithNoInteractions > 0 && (
                      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
                        <p className="text-sm text-orange-800 dark:text-orange-200">
                          <AlertCircle className="h-4 w-4 inline mr-2" />
                          {interactionStats.contactsWithNoInteractions} contacts have no
                          recorded interactions
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Contacts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  Top Contacts
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/")}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {topContacts.length > 0 ? (
                <div className="space-y-3">
                  {topContacts.map((contact, index) => (
                    <div
                      key={contact.id}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                      onClick={() => router.push(`/contacts/${contact.id}`)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-lg font-bold text-gray-400 w-6">
                          #{index + 1}
                        </span>
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={contact.photoUrl || undefined} />
                          <AvatarFallback
                            className={cn(
                              "bg-gradient-to-br text-white font-semibold text-sm",
                              getGradient(contact.name)
                            )}
                          >
                            {getInitials(contact.firstName, contact.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">
                            {contact.firstName} {contact.lastName || ""}
                          </p>
                          {contact.relationshipSummary && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {contact.relationshipSummary}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {contact.interactionCount} interactions
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDaysSince(contact.lastInteractionDate)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No interaction data available yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Contacts Needing Attention */}
          {needingAttention.length > 0 && (
            <Card className="border-orange-200 dark:border-orange-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                  <Clock className="h-5 w-5" />
                  Contacts Needing Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {needingAttention.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                      onClick={() => router.push(`/contacts/${contact.id}`)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={contact.photo_url || undefined} />
                          <AvatarFallback
                            className={cn(
                              "bg-gradient-to-br text-white font-semibold text-sm",
                              getGradient(contact.name || "")
                            )}
                          >
                            {getInitials(contact.first_name, contact.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {contact.name || `${contact.first_name} ${contact.last_name || ""}`}
                          </p>
                          {contact.relationship_summary && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                              {contact.relationship_summary}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                          {contact.days_since_contact} days
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button
                  onClick={() => router.push("/contacts/new")}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Add New Contact
                </Button>
                <Button
                  onClick={() => router.push("/import")}
                  variant="outline"
                  className="w-full"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Import Contacts
                </Button>
                <Button
                  onClick={() => router.push("/ai-batch")}
                  variant="outline"
                  className="w-full"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  AI Batch Process
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
