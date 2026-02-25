"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sun, 
  Cloud, 
  CloudLightning, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSocialForecast, ForecastData } from "@/app/actions/get-social-forecast";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export function SocialForecast() {
  const router = useRouter();
  const [data, setData] = useState<ForecastData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchForecast();
  }, []);

  const fetchForecast = async () => {
    setIsLoading(true);
    try {
      const { data: forecast, error } = await getSocialForecast();
      if (error) throw error;
      setData(forecast);
    } catch (error) {
      console.error("Forecast Error:", error);
      toast.error("Failed to load social forecast");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 animate-pulse">
        <CardContent className="p-6 h-24 flex items-center justify-center">
            <RefreshCw className="h-5 w-5 text-slate-400 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { weatherState, forecastedHealth, currentHealth, decayCount, atRiskContacts } = data;
  const delta = forecastedHealth - currentHealth;

  const config = {
    sunny: {
      icon: Sun,
      color: "text-amber-500",
      bg: "bg-linear-to-br from-blue-500/10 via-cyan-400/5 to-transparent",
      border: "border-blue-200/50 dark:border-blue-800/50",
      text: "Conditions are prime for growth.",
      advice: "Keep blooming! Your network is expanding naturally."
    },
    overcast: {
      icon: Cloud,
      color: "text-slate-400",
      bg: "bg-linear-to-br from-slate-400/10 via-gray-300/5 to-transparent",
      border: "border-slate-200 dark:border-slate-800",
      text: "You are in maintenance mode.",
      advice: "You are replacing decay with new seeds. Stay consistent."
    },
    stormy: {
      icon: CloudLightning,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-linear-to-br from-indigo-600/10 via-slate-700/5 to-transparent shadow-indigo-500/5",
      border: "border-indigo-200/50 dark:border-indigo-800/50",
      text: "Infrastructure is at risk.",
      advice: "Decay is outpacing growth. Time for course correction."
    }
  }[weatherState];

  const Icon = config.icon;

  return (
    <Card 
      className={cn(
        "relative w-full overflow-hidden transition-all duration-500 border glassmorphism",
        config.bg,
        config.border
      )}
    >
      <CardContent className="p-0">
        <div 
          className="p-5 md:p-6 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-2xl bg-white/50 dark:bg-black/20 backdrop-blur-md shadow-sm border border-white/20", config.color)}>
                 <Icon className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  Social Forecast
                  {weatherState === 'stormy' && <AlertTriangle className="h-3 w-3 text-red-500" />}
                </h3>
                <p className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  In 30 days, your Nurtured core will be <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-800/80 shadow-xs mx-1", delta >= 0 ? "text-emerald-600" : "text-red-600")}>{forecastedHealth}</span> contacts.
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Net Trajectory: <span className={delta >= 0 ? "text-emerald-500" : "text-red-500"}>{delta > 0 ? "+" : ""}{delta} contacts</span>
                </p>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
                <div className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="px-5 pb-6 pt-0 border-t border-slate-100 dark:border-slate-800"
            >
              <div className="mt-4 space-y-6">
                {/* Math Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-white/30 dark:bg-slate-800/30 border border-white/20">
                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Current</div>
                        <div className="text-xl font-black text-slate-700 dark:text-slate-200">{currentHealth}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <div className="text-[10px] uppercase font-bold text-emerald-600/70 mb-1">New Gen</div>
                        <div className="text-xl font-black text-emerald-600">+{data.velocityResonance}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                        <div className="text-[10px] uppercase font-bold text-red-600/70 mb-1">Decay</div>
                        <div className="text-xl font-black text-red-600">-{decayCount}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                        <div className="text-[10px] uppercase font-bold text-indigo-600/70 mb-1">Target</div>
                        <div className="text-xl font-black text-indigo-600">{forecastedHealth}</div>
                    </div>
                </div>

                {/* At Risk List */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">At-Risk Core Contacts (30d)</h4>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-sm">{atRiskContacts.length} at risk</span>
                    </div>
                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                        {atRiskContacts.map(contact => (
                            <div 
                                key={contact.id}
                                onClick={() => router.push(`/contacts/${contact.id}`)}
                                className="flex items-center justify-between p-2.5 rounded-lg bg-white/40 dark:bg-slate-900/40 border border-white/20 hover:border-indigo-400 group transition-all cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "h-2 w-2 rounded-full",
                                        contact.daysUntilDecay < 7 ? "bg-red-500 animate-pulse" : 
                                        contact.daysUntilDecay < 14 ? "bg-orange-500" : "bg-amber-400"
                                    )} />
                                    <div>
                                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">{contact.name}</div>
                                        <div className="text-[10px] font-medium text-slate-400 italic">Expected decay in {contact.daysUntilDecay} days</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                     <span className={cn(
                                         "text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter shadow-xs",
                                         contact.importance === 'high' ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"
                                     )}>
                                         {contact.importance}
                                     </span>
                                     <ArrowRight className="h-3 w-3 text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Course Correction CTA */}
                {weatherState === 'stormy' && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-indigo-600 rounded-xl p-5 text-white shadow-xl shadow-indigo-500/20"
                    >
                        <h4 className="text-sm font-black uppercase tracking-tighter mb-1">Course Correction Required</h4>
                        <p className="text-xs text-indigo-100 mb-4 font-medium leading-relaxed opacity-90">
                            Your network is currently in a state of entropy. To shift the forecast back to Sunny, you need to initiate 3 new high-resonance connections today.
                        </p>
                        <Button 
                            onClick={() => router.push("/triage")}
                            className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-bold border-none"
                        >
                            View Nurture List
                        </Button>
                    </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
