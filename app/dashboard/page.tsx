"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ErrorFallback } from "@/components/error-fallback";
import {
  Users,
  TrendingUp,
  AlertCircle,
  Star,
  Zap,
  Activity,
  RefreshCw,
  Heart,
  TrendingDown,
  ChevronRight,
  Droplets,
  Smartphone,
  LayoutDashboard,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DailyPracticeWidget } from '@/components/dashboard/DailyPracticeWidget';
import GardenLeafWidget from '@/components/dashboard/GardenLeafWidget';
import { DailyBriefingCard } from '@/components/DailyBriefingCard';
import { getDailyBriefing, type DailyBriefing } from '@/app/actions/get-daily-briefing';
import LogGroupInteractionModal from "@/components/LogGroupInteractionModal";
import { cn } from "@/lib/utils";
import { autoMapTribes } from "@/app/actions/auto-map-tribes";
import { MilestoneRadar } from "@/components/MilestoneRadar";
import { TriageMode } from "@/components/dashboard/TriageMode";
import {
  getDashboardStats,
  getContactsNeedingAttention,
  getTribeHealth,
  getRelationshipHealth,
  getTopContacts,
  type DashboardStats,
  type TribeHealth,
  type RelationshipHealth,
  type TopContact,
} from "@/lib/dashboard/dashboardUtils";
import { createClient } from "@/lib/supabase/client";
import { getInitials, getGradient } from "@/lib/utils/contact-helpers";

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [needingAttention, setNeedingAttention] = useState<any[]>([]);
  const [tribeHealth, setTribeHealth] = useState<TribeHealth[]>([]);
  const [relationshipHealth, setRelationshipHealth] = useState<RelationshipHealth | null>(null);
  const [topContacts, setTopContacts] = useState<TopContact[]>([]);
  const [allContacts, setAllContacts] = useState<any[]>([]);
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  
  // Modal State
  const [selectedTribe, setSelectedTribe] = useState<TribeHealth | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTriageActive, setIsTriageActive] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [
        statsResult,
        attentionResult,
        tribesResult,
        healthResult,
        topResult,
        briefingResult
      ] = await Promise.all([
        getDashboardStats(),
        getContactsNeedingAttention(30),
        getTribeHealth(),
        getRelationshipHealth(),
        getTopContacts(5),
        getDailyBriefing(),
      ]);

      // Fetch all contacts for the TreeWidget (using a simpler select)
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: contacts } = await (supabase as any)
          .from('persons')
          .select('id, name, last_interaction_date, person_tags(tags(name))')
          .eq('user_id', user.id);
        
        if (contacts) {
          setAllContacts(contacts.map((c: any) => ({
            id: c.id,
            name: c.name,
            lastContact: c.last_interaction_date,
            tags: c.person_tags?.map((pt: any) => pt.tags?.name).filter(Boolean) || []
          })));
        }
      }

      // Check for critical errors
      if (statsResult.error) throw statsResult.error;
      
      if (attentionResult.error) console.error("Error fetching attention list:", attentionResult.error);

      setStats(statsResult.data);
      setNeedingAttention((attentionResult.data || []).slice(0, 5));
      setTribeHealth(tribesResult.data || []);
      setRelationshipHealth(healthResult.data);
      setTopContacts(topResult.data || []);
      setBriefing(briefingResult.data);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setError(error instanceof Error ? error : new Error("Failed to load dashboard data"));
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <ErrorFallback 
          error={error} 
          reset={loadDashboardData}
          title="Dashboard unavailable"
          message="We couldn't load your dashboard data. Please check your connection and try again."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-16 md:pb-0">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full px-4 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Activity className="h-8 w-8 text-purple-600" />
                Relationship Health
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track and maintain your most important relationships
              </p>
            </div>
            
            {/* Triage Toggle - Mobile Only */}
            <div className="md:hidden">
              <Button
                onClick={() => setIsTriageActive(!isTriageActive)}
                variant={isTriageActive ? "default" : "outline"}
                size="sm"
                className={cn(
                  "rounded-full font-bold uppercase tracking-tighter text-[10px] h-9 px-4 gap-2",
                  isTriageActive ? "bg-orange-600 hover:bg-orange-700" : "border-orange-200 text-orange-600"
                )}
              >
                {isTriageActive ? (
                  <>
                    <LayoutDashboard className="h-4 w-4" />
                    Standard
                  </>
                ) : (
                  <>
                    <Smartphone className="h-4 w-4" />
                    Triage
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Conditional View Rendering */}
          {isTriageActive ? (
            <TriageMode 
              contacts={needingAttention.map(c => ({
                id: c.id,
                name: c.name,
                first_name: c.first_name,
                last_name: c.last_name,
                photo_url: c.photo_url,
                days_since_contact: Math.floor((Date.now() - new Date(c.last_interaction_date).getTime()) / (1000 * 60 * 60 * 24)),
                importance: c.importance
              }))} 
              onActionComplete={() => {
                setIsTriageActive(false);
                loadDashboardData();
              }}
            />
          ) : (
            <>
              {/* Daily Practice Challenge */}
              <DailyPracticeWidget />

              {/* Morning Briefing */}
              {briefing && <DailyBriefingCard briefing={briefing} onActionComplete={loadDashboardData} />}

              {/* Main Content Grid with Sidebar */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column (8 units) */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Contacts</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.totalContacts || 0}</p>
                          </div>
                          <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Users className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{stats?.recentlyAdded || 0} added this month</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">High Priority</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.highPriority || 0}</p>
                          </div>
                          <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <Star className="h-6 w-6 text-red-600" />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Requires attention</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-purple-600" />
                        Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <Button onClick={() => router.push("/contacts/new")} className="w-full bg-purple-600 hover:bg-purple-700 font-bold">
                          <Users className="h-4 w-4 mr-2" /> Add New
                        </Button>
                        <Button onClick={() => router.push("/import")} variant="outline" className="w-full font-bold">
                          <TrendingUp className="h-4 w-4 mr-2" /> Import
                        </Button>
                        <Button onClick={() => router.push("/ai-batch")} variant="outline" className="w-full font-bold">
                          <Zap className="h-4 w-4 mr-2" /> AI Batch
                        </Button>
                        <Button
                          onClick={async () => {
                            const loadingToast = toast.loading("Igniting real data...");
                            const res = await autoMapTribes();
                            toast.dismiss(loadingToast);
                            if (res.success) {
                              toast.success(`Ignition Success! ${res.count} contacts mapped.`);
                              loadDashboardData();
                            } else {
                              toast.error(res.error || "Ignition failed");
                            }
                          }}
                          variant="outline"
                          className="w-full border-orange-500 text-orange-500 hover:bg-orange-500/10 font-bold"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" /> Ignition
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Needing Attention List */}
                  {needingAttention.length > 0 && (
                    <Card className="border-orange-200 dark:border-orange-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                          <AlertCircle className="h-5 w-5" />
                          Needs Nurture
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {needingAttention.map((contact) => (
                            <div
                              key={contact.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                              onClick={() => router.push(`/contacts/${contact.id}`)}
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={contact.photo_url || undefined} />
                                  <AvatarFallback className={cn("bg-linear-to-br text-white font-semibold", getGradient(contact.name || ""))}>
                                    {getInitials(contact.first_name, contact.last_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-semibold">{contact.name}</p>
                                  <p className="text-xs text-gray-500">{contact.days_since_contact} days since contact</p>
                                </div>
                              </div>
                              <Badge variant="secondary" className="bg-orange-100 text-orange-700">{contact.days_since_contact}d</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Relationship Health Breakdown */}
                  {relationshipHealth && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-tight">Blooming</p>
                              <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300">{relationshipHealth.healthy}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                              <Heart className="h-5 w-5 text-emerald-600" fill="currentColor" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-amber-600 dark:text-amber-400 font-bold uppercase tracking-tight">Warning</p>
                              <p className="text-3xl font-black text-amber-700 dark:text-amber-300">{relationshipHealth.warning}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                              <AlertCircle className="h-5 w-5 text-amber-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-rose-600 dark:text-rose-400 font-bold uppercase tracking-tight">Thirsty</p>
                              <p className="text-3xl font-black text-rose-700 dark:text-rose-300">{relationshipHealth.needsAttention}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                              <TrendingDown className="h-5 w-5 text-rose-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Top Contacts Section */}
                  {topContacts.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Star className="h-5 w-5 text-amber-500" fill="currentColor" />
                          Momentum Leaders
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {topContacts.map((contact) => (
                            <div
                              key={contact.id}
                              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                              onClick={() => router.push(`/contacts/${contact.id}`)}
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={contact.photoUrl || undefined} />
                                  <AvatarFallback className={cn("bg-linear-to-br text-white font-semibold", getGradient(contact.name || ""))}>
                                    {getInitials(contact.firstName, contact.lastName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-semibold">{contact.name}</p>
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs text-gray-500">{contact.interactionCount} Interactions</p>
                                    {contact.contactImportance === 'high' && (
                                      <Badge className="h-4 px-1.5 text-[8px] bg-red-100 text-red-700 border-red-200">HIGH</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                </div>

                {/* Right Column (Sidebar) */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Tribe Health Sidebar Widget */}
                  <Card className="bg-sidebar border-border shadow-none rounded-none">
                    <CardHeader className="border-b border-[#1E293B] pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-[#38BDF8] flex items-center gap-2 uppercase font-black tracking-tighter text-sm">
                          <Droplets className="h-4 w-4" />
                          Tribe Health
                        </CardTitle>
                        <Badge className="bg-[#38BDF8] text-[#0F172A] font-black rounded-none">THIRSTY</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 px-0">
                      <div className="divide-y divide-[#1E293B]">
                        {[
                          ...tribeHealth.filter(t => ["NASA", "Basketball", "Japan"].includes(t.name)),
                          ...tribeHealth.filter(t => !["NASA", "Basketball", "Japan"].includes(t.name))
                        ].slice(0, 5).map((tribe) => (
                          <div key={tribe.name} className="p-4 flex items-center justify-between group hover:bg-[#1E293B]/50 transition-colors">
                            <div>
                              <p className="text-white font-black uppercase tracking-tight">{tribe.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-slate-500 font-bold uppercase">{tribe.count} members</span>
                                <span className="text-[10px] text-[#38BDF8] font-black uppercase">
                                  {tribe.maxDaysSince > 0 ? `${tribe.maxDaysSince}d overdue` : 'FRESH'}
                                </span>
                              </div>
                            </div>
                            <button 
                              onClick={() => {
                                setSelectedTribe(tribe);
                                setIsModalOpen(true);
                              }}
                              className="h-10 w-10 bg-[#1E293B] group-hover:bg-[#38BDF8] group-hover:text-[#0F172A] flex items-center justify-center transition-all border border-[#334155] rounded-none"
                            >
                              <Droplets className="h-5 w-5" />
                            </button>
                          </div>
                        ))}
                        {tribeHealth.length === 0 && (
                          <div className="p-8 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">
                            Tribe data loading...
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <MilestoneRadar />

                  {/* Garden Visualization Widget */}
                  <GardenLeafWidget contacts={allContacts} />

                  {/* System Status Card */}
                  <Card className="bg-card border-border rounded-none shadow-none text-card-foreground">
                    <CardContent className="p-6 space-y-4">
                      <h4 className="font-black uppercase tracking-tighter text-sm">System Status</h4>
                      <p className="text-xs text-slate-400 leading-relaxed font-bold">
                        STABILITY: <span className="text-green-500">OPTIMAL</span><br/>
                        ACTION LOOP: <span className="text-[#38BDF8]">READY</span>
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <LogGroupInteractionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadDashboardData}
        tribeName={selectedTribe?.name || ""}
        contacts={selectedTribe?.contacts || []}
      />
    </div>
  );
}
