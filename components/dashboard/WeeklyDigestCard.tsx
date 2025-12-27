"use client";

import React, { useState, useEffect } from 'react';
import { Sparkles, Trophy, Calendar, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WeeklyRecapData {
    newIntelligence: string[];
    momentumLeaders: { name: string; count: number }[];
    upcomingMilestones: { name: string; type: string; date: string }[];
}

export function WeeklyDigestCard() {
    const [data, setData] = useState<WeeklyRecapData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    const generateRecap = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/generate-weekly-recap', { method: 'POST' });
            if (res.ok) {
                const json = await res.json();
                setData(json);
            } else {
                throw new Error(`API Error: ${res.status}`);
            }
        } catch (e) {
            console.error("Failed to load weekly recap", e);
            setError(true);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        generateRecap();
    }, []);

    // Placeholder skeleton
    if (isLoading) {
        return (
            <div className="w-full bg-[#0F172A]/90 border border-indigo-500/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden animate-pulse min-h-[300px]">
                <div className="h-6 w-1/3 bg-slate-800 rounded mb-6" />
                <div className="space-y-4">
                    <div className="h-20 bg-slate-800/50 rounded-xl" />
                    <div className="h-20 bg-slate-800/50 rounded-xl" />
                    <div className="h-20 bg-slate-800/50 rounded-xl" />
                </div>
            </div>
        );
    }

    if (error) {
         return (
             <div className="w-full bg-[#0F172A]/90 border border-red-500/30 rounded-2xl p-6 text-center">
                  <p className="text-red-400 text-sm font-medium mb-2">Could not Generate Recap</p>
                  <Button variant="outline" size="sm" onClick={generateRecap} className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                      Try Again
                  </Button>
             </div>
         );
    }

    if (!data) return null;

    const hasContent = data.newIntelligence.length > 0 || data.momentumLeaders.length > 0 || data.upcomingMilestones.length > 0;

    if (!hasContent) {
        return (
            <div className="w-full bg-[#0F172A]/90 border border-dashed border-slate-700/50 rounded-2xl p-6 text-center">
                 <p className="text-slate-500 text-sm">Not enough activity this week for a recap. Go log some connections! 🌱</p>
            </div>
        );
    }

    return (
        <div className="w-full bg-[#0F172A]/90 border border-indigo-500/20 rounded-2xl p-0 shadow-2xl relative overflow-hidden group">
            {/* Header Stage */}
            <div className="p-5 border-b border-indigo-500/10 bg-gradient-to-r from-[#1E1B4B] to-[#0F172A] relative">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={generateRecap} className="h-6 w-6 text-indigo-400 hover:text-white">
                        <RefreshCw className="h-3 w-3" />
                    </Button>
                </div>
                <div className="flex items-center gap-2 mb-1">
                     <Sparkles className="h-4 w-4 text-indigo-400" />
                     <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Weekly Relationship Recap</h2>
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">Your Weekly Pulse 📊</h3>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-800/50">
                
                {/* 1. New Intelligence */}
                <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> New Intelligence
                    </h4>
                    {data.newIntelligence.length > 0 ? (
                        <ul className="space-y-3">
                            {data.newIntelligence.map((item, idx) => (
                                <li key={idx} className="text-sm text-slate-300 leading-relaxed bg-slate-900/30 p-2 rounded-lg border border-slate-800/50">
                                    {item.replace(/^.*?: /, (match) => match)} {/* Strip name prefix if redundant or style it */}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-xs text-slate-600 italic">No major context updates found.</p>
                    )}
                </div>

                {/* 2. Momentum Leaders */}
                <div className="space-y-3 pt-4 md:pt-0 pl-0 md:pl-4">
                     <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Trophy className="h-3 w-3 text-amber-400" /> Momentum Leaders
                    </h4>
                    {data.momentumLeaders.length > 0 ? (
                        <div className="space-y-2">
                            {data.momentumLeaders.map((leader, idx) => (
                                <div key={idx} className="flex items-center justify-between group/item">
                                    <span className="text-sm font-semibold text-slate-200">{leader.name}</span>
                                    <span className="text-xs font-medium text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                                        +{leader.count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-600 italic">No interactions yet.</p>
                    )}
                </div>

                {/* 3. Milestone Preview */}
                <div className="space-y-3 pt-4 md:pt-0 pl-0 md:pl-4">
                     <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-pink-400" /> Next 7 Days
                    </h4>
                    {data.upcomingMilestones.length > 0 ? (
                        <div className="space-y-2">
                            {data.upcomingMilestones.map((milestone, idx) => (
                                <div key={idx} className="flex flex-col bg-slate-900/30 p-2 rounded-lg border border-slate-800/50">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className="text-sm font-semibold text-slate-200">{milestone.name}</span>
                                        <span className="text-[10px] text-slate-500">{milestone.date}</span>
                                    </div>
                                    <span className={cn(
                                        "text-[10px] uppercase font-bold tracking-wider w-fit px-1 rounded",
                                        milestone.type === 'Birthday' ? "text-pink-400 bg-pink-500/10" : "text-blue-400 bg-blue-500/10"
                                    )}>
                                        {milestone.type}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-600 italic">No upcoming milestones.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
