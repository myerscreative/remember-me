"use client";

import React, { useState, useEffect } from 'react';
import { Sparkles, Trophy, Calendar, RefreshCw, Loader2, X } from "lucide-react";
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

    if (isLoading) {
        return (
            <div className="bg-card w-full h-48 rounded-xl border border-border flex flex-col items-center justify-center p-6 space-y-3 animate-pulse">
                <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Generating weekly recap...</span>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="bg-card w-full h-auto min-h-[160px] rounded-xl border border-border flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="space-y-1">
                    <p className="text-sm font-bold text-red-500">Could not generate recap</p>
                    <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
                        {typeof error === 'string' ? error : "No data available for this week."}
                    </p>
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={generateRecap}
                    className="bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 border-0 text-xs font-bold uppercase tracking-wider"
                >
                    <RefreshCw className="h-3 w-3 mr-2" /> Try Again
                </Button>
            </div>
        );
    }

    const hasContent = data.newIntelligence.length > 0 || data.momentumLeaders.length > 0 || data.upcomingMilestones.length > 0;

    if (!hasContent) {
        return (
            <div className="w-full bg-card border border-dashed border-border rounded-2xl p-6 text-center">
                 <p className="text-muted-foreground text-sm">Not enough activity this week for a recap. Go log some connections! 🌱</p>
            </div>
        );
    }

    return (
        <div className="relative group">
            <div className="absolute -inset-0.5 bg-linear-to-r from-indigo-500 to-purple-600 rounded-xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
            <div className="relative bg-card rounded-xl border border-border overflow-hidden">
                
            {/* Header */}
            <div className="px-5 py-4 border-b border-border flex justify-between items-start bg-muted/5">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                         <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                         <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Weekly Recap</span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground tracking-tight">Your Weekly Pulse 📊</h3>
                </div>

                <Button variant="ghost" size="icon" onClick={() => setData(null)} className="h-6 w-6 text-muted-foreground hover:text-foreground">
                    <X className="h-3 w-3" />
                </Button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x divide-border">
                
                {/* 1. New Intelligence */}
                <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> New Intelligence
                    </h4>
                    {data.newIntelligence.length > 0 ? (
                        <ul className="space-y-3">
                            {data.newIntelligence.map((item, idx) => (
                                <li key={idx} className="text-sm text-muted-foreground leading-relaxed bg-muted/50 p-2 rounded-lg border border-border">
                                    {item.replace(/^.*?: /, (match) => match)} {/* Strip name prefix if redundant or style it */}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-xs text-muted-foreground italic">No major context updates found.</p>
                    )}
                </div>

                {/* 2. Milestone Preview (Moved to col 2) */}
                <div className="space-y-3 pt-4 md:pt-0 pl-0 md:pl-4">
                     <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-pink-400" /> Next 7 Days
                    </h4>
                    {data.upcomingMilestones.length > 0 ? (
                        <div className="space-y-2">
                            {data.upcomingMilestones.map((milestone, idx) => (
                                <div key={idx} className="flex flex-col bg-muted/50 p-2 rounded-lg border border-border">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className="text-sm font-semibold text-foreground">{milestone.name}</span>
                                        <span className="text-[10px] text-muted-foreground">{milestone.date}</span>
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
                        <p className="text-xs text-muted-foreground italic">No upcoming milestones.</p>
                    )}
                </div>
            </div>
            </div>
        </div>
    );
}
