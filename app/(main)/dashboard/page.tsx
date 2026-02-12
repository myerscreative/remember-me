"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorFallback } from "@/components/error-fallback";
import {
  Users,
  TrendingUp,
  Zap,
  Activity,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DailyPracticeWidget } from '@/components/dashboard/DailyPracticeWidget';
import { GardenPreview } from '@/components/dashboard/GardenPreview';
import { NeedsNurtureList } from "@/components/dashboard/NeedsNurtureList";
import { getDailyBriefing } from '@/app/actions/get-daily-briefing';
import LogGroupInteractionModal from "@/components/LogGroupInteractionModal";
import { cn } from "@/lib/utils";
import { autoMapTribes } from "@/app/actions/auto-map-tribes";
import { MilestoneRadar } from "@/components/MilestoneRadar";
import { CriticalNudges } from "@/components/dashboard/CriticalNudges";
import { SocialForecast } from "@/components/dashboard/SocialForecast";
import { WeeklyBriefing } from "@/components/dashboard/WeeklyBriefing";
import { TriageMode } from "@/components/dashboard/TriageMode";
import {
  getDashboardStats,
  getContactsNeedingAttention,
  getTribeHealth,
  getRelationshipHealth,
  type DashboardStats,
  type TribeHealth,
  type RelationshipHealth,
} from "@/lib/dashboard/dashboardUtils";
import { createClient } from "@/lib/supabase/client";
import { getAllMapContacts } from "@/app/actions/dashboard-map";

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [needingAttention, setNeedingAttention] = useState<any[]>([]);
  const [tribeHealth, setTribeHealth] = useState<TribeHealth[]>([]);
  const [relationshipHealth, setRelationshipHealth] = useState<RelationshipHealth | null>(null);
  const [allContacts, setAllContacts] = useState<any[]>([]);
  
  const [user, setUser] = useState<any>(null);
  const [selectedTribe, setSelectedTribe] = useState<TribeHealth | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTriageActive, setIsTriageActive] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

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
        ,
        briefingResult,
        mapResult
      ] = await Promise.all([
        getDashboardStats(),
        getContactsNeedingAttention(30),
        getTribeHealth(),
        getRelationshipHealth(),
        Promise.resolve({ data: [] }),
        getDailyBriefing(),
        getAllMapContacts() // Server-side Force Sync
      ]);

      // Set Map Data directly from server results
      if (mapResult.data) {
         setAllContacts(mapResult.data);
      }
      
      
      if (mapResult.error) {
          console.error("Map Sync Error:", mapResult.error);
          toast.error(`Map Sync Failed: ${mapResult.error}`);
      }

      // Check for critical errors
      if (statsResult.error) throw statsResult.error;
      
      if (attentionResult.error) console.error("Error fetching attention list:", attentionResult.error);

      setStats(statsResult.data);
      setNeedingAttention((attentionResult.data || []).slice(0, 10)); // Top 10 for list
      setTribeHealth(tribesResult.data || []);
      setRelationshipHealth(healthResult.data);

      // Generate Narrative if briefing exists (lightweight fetch)
      if (briefingResult?.data) {
          // Optional: Fetch narrative here if we want it on dashboard too, 
          // but for now let's keep it on the Briefing page to save tokens/load time 
          // unless user explicitly asked for it on Dashboard.
          // User asked for "Narrative Briefing... show up in here in the full thing". 
          // Usually that means the dedicated page.
      }

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
    <div className="flex flex-col min-h-screen bg-transparent pb-32 overflow-x-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1600px] mx-auto w-full px-3 md:px-4 py-4 md:py-6 space-y-4 md:space-y-6">
          
            {/* Mobile Header (Simplified) */}
            <div className="flex md:hidden items-center justify-between mb-3">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-600" />
                    Dashboard
                </h1>
                <Button
                    onClick={() => setIsTriageActive(!isTriageActive)}
                    variant={isTriageActive ? "default" : "outline"}
                    size="sm"
                    className={cn(
                        "rounded-full font-bold uppercase tracking-tighter text-[10px] h-7 px-2.5 gap-1.5",
                        isTriageActive ? "bg-orange-600" : "border-orange-200 text-orange-600"
                    )}
                >
                    {isTriageActive ? "Exit" : "Triage"}
                </Button>
            </div>

          {/* Triage View Override */}
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
              {/* Welcome Greeting */}
              <div className="space-y-1 mb-2 px-1">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Welcome back to your Garden, {user?.user_metadata?.full_name?.split(' ')[0] || user?.user_metadata?.name?.split(' ')[0] || 'Friend'}.
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    You have <span className="font-bold text-purple-600 dark:text-purple-400">{stats?.imported || 0} Seeds</span> ready to be planted 
                    and <span className="font-bold text-orange-600 dark:text-orange-400">{(relationshipHealth?.warning || 0) + (relationshipHealth?.needsAttention || 0)} connections</span> that could use some water.
                </p>
              </div>

              {/* Social Forecast (North Star) */}
              <div className="mb-4">
                  <SocialForecast />
              </div>
              
              {/* MAIN 3-COLUMN GRID */}
              <div className="flex flex-col lg:grid lg:grid-cols-[250px_1fr_350px] gap-6 items-start">

              {/* COLUMN 1: SIDEBAR RAIL (250px) - Hidden on Mobile */}
              <div className="hidden lg:block space-y-6 lg:sticky lg:top-6">

                 {/* Quick Actions */}
                 <div className="space-y-2">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Actions</h3>
                    <div className="space-y-2">
                        <Button onClick={() => router.push("/contacts/new")} className="w-full justify-start bg-purple-600 hover:bg-purple-700 font-bold shadow-sm">
                          <Users className="h-4 w-4 mr-3" /> Add Contact
                        </Button>
                        <Button onClick={() => router.push("/briefing")} variant="outline" className="w-full justify-start font-bold text-purple-700 border-purple-200 hover:bg-purple-50">
                          <Sparkles className="h-4 w-4 mr-3" /> Daily Briefing
                        </Button>
                        <Button onClick={() => router.push("/import")} variant="ghost" className="w-full justify-start text-slate-600 dark:text-slate-400 font-medium">
                          <TrendingUp className="h-4 w-4 mr-3" /> Import Data
                        </Button>
                        <Button onClick={() => router.push("/ai-batch")} variant="ghost" className="w-full justify-start text-slate-600 dark:text-slate-400 font-medium">
                          <Zap className="h-4 w-4 mr-3" /> AI Batch
                        </Button>
                    </div>
                 </div>

                 {/* Stats Summary */}
                 <div className="space-y-2">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Overview</h3>
                    <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-none">
                        <CardContent className="p-4 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-slate-500">Total</span>
                                <span className="text-lg font-bold text-slate-900 dark:text-white">{stats?.totalContacts || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-slate-500">Context</span>
                                <span className="text-lg font-bold text-slate-700 dark:text-slate-300">{stats?.withContext || 0}</span>
                            </div>
                        </CardContent>
                    </Card>
                 </div>

                 {/* Ignition (Bottom of rail) */}
                 <Button
                    onClick={async () => {
                        const loadingToast = toast.loading("Igniting data...");
                        const res = await autoMapTribes();
                        toast.dismiss(loadingToast);
                        if (res.success) {
                            toast.success(`Mapped ${res.count} contacts.`);
                            loadDashboardData();
                        } else {
                            toast.error("Ignition failed");
                        }
                    }}
                    variant="outline"
                    className="w-full border-dashed border-slate-300 text-slate-400 text-xs uppercase tracking-widest hover:text-orange-500 hover:border-orange-500 transition-colors"
                >
                    <RefreshCw className="h-3 w-3 mr-2" /> Ignite
                </Button>

              </div>

              {/* COLUMN 2: MAIN CENTER (Auto) */}
              <div className="space-y-6 min-w-0 w-full">

                  {/* Mobile Quick Stats - Only visible on mobile */}
                  <div className="lg:hidden grid grid-cols-2 gap-3">
                      <Card className="bg-linear-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
                          <CardContent className="p-3 text-center">
                              <div className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">Total</div>
                              <div className="text-2xl font-black text-purple-900 dark:text-purple-100">{stats?.totalContacts || 0}</div>
                          </CardContent>
                      </Card>
                      <Card className="bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                          <CardContent className="p-3 text-center">
                              <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Context</div>
                              <div className="text-2xl font-black text-blue-900 dark:text-blue-100">{stats?.withContext || 0}</div>
                          </CardContent>
                      </Card>
                  </div>

                  {/* Critical Drifters (Urgent) */}
                  <CriticalNudges />

                  {/* Daily Practice */}
                  <DailyPracticeWidget />

                  {/* Weekly Briefing (Automated Context Summary) */}
                  <WeeklyBriefing />



                  {/* Needs Nurture List (Redesigned & Compact with Filter) */}
                  <NeedsNurtureList contacts={needingAttention} />



              </div>

              {/* COLUMN 3: DATA RIGHT (350px) - Hidden on Mobile, Shows below main content */}
              <div className="space-y-4 lg:sticky lg:top-6 w-full lg:w-auto">
                 
                 {/* Relationship Health Card (Map + Stats) */}
                 <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                     {/* Garden Preview - Click to view full garden */}

                     <GardenPreview contacts={allContacts} />
                     
                     {/* Stats Footer */}
                     {relationshipHealth && (
                          <div className="flex border-t border-border divide-x divide-border bg-muted/50 backdrop-blur-sm">
                              <div className="flex-1 py-2 text-center group cursor-default hover:bg-white/5 transition-colors">
                                  <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-0.5">Nurtured</div>
                                  <div className="text-lg font-black text-foreground">{relationshipHealth.healthy}</div>
                              </div>
                              <div className="flex-1 py-2 text-center group cursor-default hover:bg-white/5 transition-colors">
                                  <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-0.5">Drifting</div>
                                  <div className="text-lg font-black text-foreground">{relationshipHealth.warning}</div>
                              </div>
                              <div className="flex-1 py-2 text-center group cursor-default hover:bg-white/5 transition-colors">
                                  <div className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-0.5">Neglected</div>
                                  <div className="text-lg font-black text-foreground">{relationshipHealth.needsAttention}</div>
                              </div>
                          </div>
                     )}
                 </div>

                 {/* Milestone Radar (Conditional) */}
                 <div className="bg-white dark:bg-card rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <MilestoneRadar />
                 </div>

                 {/* Tribe Health (Conditional) */}
                 {tribeHealth.length > 0 && (
                     <div className="bg-white dark:bg-card rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tribes</h3>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                             {tribeHealth.slice(0, 5).map(t => (
                                 <div key={t.name} className="px-3 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer" onClick={() => { setSelectedTribe(t); setIsModalOpen(true); }}>
                                     <div className="flex items-center gap-2">
                                         {t.isThirsty && <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />}
                                         <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{t.name}</span>
                                     </div>
                                     <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-sm", t.isThirsty ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500")}>
                                         {t.maxDaysSince}d
                                     </span>
                                 </div>
                             ))}
                        </div>
                     </div>
                 )}

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
