'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Share2, 
  TrendingUp, 
  Activity, 
  ShieldAlert,
  ChevronRight,
  Info
} from 'lucide-react';
import { getCommunityVitalSigns, CommunityVitalSigns } from '@/services/adminAnalytics';
import PulseChart from './components/PulseChart';
import BridgeVelocityChart from './components/BridgeVelocityChart';
import SkillCloud from './components/SkillCloud';
import ConnectorLeaderboard from './components/ConnectorLeaderboard';
import { useSocialFriction } from '@/hooks/useSocialFriction';
import { PivotCard } from './components/PivotCard';
import { BridgeVelocityInfo } from './components/BridgeVelocityInfo';
import { SocialForecast } from '@/components/dashboard/SocialForecast';
import { LearningLedgerSection } from '@/components/learning-ledger-section';
import { DriftRescue } from '@/components/dashboard/DriftRescue';
import { MondayRescueSlot } from '@/components/dashboard/MondayRescueSlot';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetDescription
} from "@/components/ui/sheet";
import { Brain } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';

export default function AdminDashboardPage() {
  const [data, setData] = useState<CommunityVitalSigns | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastOutreach, setLastOutreach] = useState<{ content: string; contactId: string } | undefined>(undefined);
  const [isPivotOpen, setIsPivotOpen] = useState(false);

  const { alert, dismissAlert } = useSocialFriction(data?.bridgeActivity || { requests: [], approvals: [] }, lastOutreach);

  useEffect(() => {
    if (alert?.active && !isPivotOpen) {
      toast(() => (
        <div className="flex items-center gap-4 bg-slate-50 p-1">
          <div className="flex flex-col">
            <p className="text-xs font-black text-rose-600 uppercase tracking-widest leading-none mb-1">Friction Alert</p>
            <p className="text-[10px] text-slate-500 font-bold">{alert.data.score}</p>
          </div>
          <button 
            onClick={() => {
              setIsPivotOpen(true);
              dismissAlert();
            }}
            className="px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors"
          >
            View Pivot
          </button>
        </div>
      ), {
        duration: 10000,
        position: 'bottom-center',
        style: {
          borderRadius: '16px',
          background: '#f8fafc',
          color: '#0f172a',
          border: '1px solid #e2e8f0',
          padding: '12px'
        }
      });
    }
  }, [alert, isPivotOpen, dismissAlert]);

  useEffect(() => {
    async function loadData() {
      try {
        const signs = await getCommunityVitalSigns();
        setData(signs);

        // Fetch last interaction for friction analysis
        const supabase = createClient();
        const { data: interaction } = await supabase
          .from('interactions')
          .select('notes, person_id')
          .order('date', { ascending: false })
          .limit(1)
          .single();
        
        if (interaction) {
          setLastOutreach({
            content: (interaction as any).notes || "",
            contactId: (interaction as any).person_id
          });
        }
      } catch (error) {
        console.error('Failed to load community signs:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Aggregating Vital Signs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-32">
      {/* Header Section */}
      <header className="px-6 pt-8 pb-12 bg-linear-to-b from-slate-800 to-slate-900 border-b border-slate-700/50">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-black rounded uppercase tracking-widest border border-emerald-500/20">
              Admin Alpha
            </span>
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              • Private Command Center
            </span>
          </div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-black text-white">Community Command</h1>
            
            <div className="flex items-center gap-3">
              <DriftRescue />
              <Sheet>
                <SheetTrigger asChild>
                  <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 rounded-full transition-all group">
                    <Brain className="h-5 w-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hidden sm:inline">Ledger Insights</span>
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-xl bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 overflow-y-auto">
                  <SheetHeader className="mb-8">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <Brain className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <SheetTitle className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Learning Ledger</SheetTitle>
                    </div>
                    <SheetDescription className="text-slate-500 font-medium">
                      AI-driven insights from your outreach performance and response resonance.
                    </SheetDescription>
                  </SheetHeader>
                  <LearningLedgerSection />
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <MondayRescueSlot />

          {/* Social Forecast (North Star) */}
          <div className="mb-8">
            <SocialForecast />
          </div>
          
          {/* Top Level Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard 
              label="Network Density" 
              value={`${data.networkDensity.toFixed(1)}%`}
              change="Verified"
              positive={true}
              icon={<Users className="h-4 w-4" />}
            />
            <StatCard 
              label="Bridge Velocity" 
              value={data.referralVelocity.toString()}
              change="Avg/Mo"
              positive={true}
              icon={<Share2 className="h-4 w-4" />}
              info={<BridgeVelocityInfo />}
            />
            <StatCard 
              label="Pulse Score" 
              value={`${Math.round(data.pulseScore)}%`}
              change="Real-time"
              positive={true}
              icon={<Activity className="h-4 w-4" />}
            />
            <StatCard 
              label="Active Nodes" 
              value={data.activeUsers.toString()}
              change={`of ${data.totalUsers}`}
              positive={true}
              icon={<TrendingUp className="h-4 w-4" />}
            />
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="max-w-6xl mx-auto px-6 -mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Pulse & Health */}
          <div className="lg:col-span-1 space-y-6">
            <PulseChart score={data.pulseScore} />
            
            <div className="p-6 bg-slate-800 rounded-2xl border border-slate-700/50 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Garden Health</h3>
                <Info className="h-4 w-4 text-slate-600" />
              </div>
              <div className="space-y-6">
                <HealthBar label="Nurtured" value={data.gardenHealth.nurtured} color="bg-emerald-500" />
                <HealthBar label="Drifting" value={data.gardenHealth.drifting} color="bg-amber-500" />
                <HealthBar label="Neglected" value={data.gardenHealth.neglected} color="bg-rose-500" />
              </div>
              <div className="mt-8 p-4 bg-orange-500/10 rounded-xl border border-orange-500/20 flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-orange-400 mb-1">Attention Required</p>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {Math.round(data.gardenHealth.neglected)}% of your garden is neglected. Focus on re-engaging your core network.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Velocity & Skills */}
          <div className="lg:col-span-2 space-y-6">
            <BridgeVelocityChart data={data.bridgeActivity} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <SkillCloud skills={data.skillCloud} />
               <ConnectorLeaderboard connectors={data.topConnectors} />
            </div>

            {/* Bottom Actions */}
            <div className="p-6 bg-emerald-500 rounded-2xl shadow-xl shadow-emerald-500/10 flex items-center justify-between group cursor-pointer hover:bg-emerald-400 transition-colors">
              <div>
                <h3 className="text-xl font-black text-slate-900">Host a Connection Blitz</h3>
                <p className="text-sm font-medium text-slate-900/70">Boost network density by 15% with a prompted referral event.</p>
              </div>
              <div className="w-12 h-12 bg-slate-900/10 rounded-full flex items-center justify-center group-hover:bg-slate-900/20 transition-colors">
                <ChevronRight className="h-6 w-6 text-slate-900" />
              </div>
            </div>
          </div>

        </div>
      </main>

      <PivotCard 
        isOpen={isPivotOpen}
        onOpenChange={setIsPivotOpen}
        contactId={alert?.data.contactId || lastOutreach?.contactId || ""}
        originalHook={alert?.data.originalHook || lastOutreach?.content || ""}
        frictionScore={alert?.data.score || "72% Resonance"}
      />
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ReactNode;
  info?: React.ReactNode;
}

function StatCard({ label, value, change, positive, icon, info }: StatCardProps) {
  return (
    <div className="p-4 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:bg-slate-800 transition-colors">
      <div className="flex items-center gap-2 mb-2 text-slate-500">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
        {info}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-black text-white">{value}</span>
        <span className={`text-[10px] font-bold ${positive ? 'text-emerald-400' : 'text-orange-400'}`}>
          {change}
        </span>
      </div>
    </div>
  );
}

interface HealthBarProps {
  label: string;
  value: number;
  color: string;
}

function HealthBar({ label, value, color }: HealthBarProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5 px-1">
        <span className="text-xs font-bold text-slate-300">{label}</span>
        <span className="text-[10px] font-bold text-slate-500">{Math.round(value)}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full ${color} rounded-full`}
        />
      </div>
    </div>
  );
}
