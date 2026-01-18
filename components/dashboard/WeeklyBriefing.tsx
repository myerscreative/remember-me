'use client';

import React, { useEffect, useState } from 'react';
import { getWeeklySummary, WeeklySummary } from '@/lib/dashboard/getWeeklySummary';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, Activity, Sprout } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitialsFromFullName } from '@/lib/utils/contact-helpers';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function WeeklyBriefing() {
  const [summaries, setSummaries] = useState<WeeklySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data } = await getWeeklySummary();
      setSummaries(data || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <Card className="border-slate-200 shadow-sm animate-pulse">
        <CardContent className="p-6 h-32 flex items-center justify-center">
            <div className="flex items-center gap-2 text-slate-400">
                <Sparkles className="w-4 h-4 animate-spin"/>
                <span className="text-sm font-medium">Analyzing weekly context...</span>
            </div>
        </CardContent>
      </Card>
    );
  }

  if (summaries.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            Recent Shared Memories & Garden Shifts
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {summaries.slice(0, 4).map((summary) => (
          <Card key={summary.person_id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-slate-100">
                        <AvatarImage src={summary.photo_url || undefined} />
                        <AvatarFallback className="bg-slate-100 text-slate-600 font-bold">
                            {getInitialsFromFullName(summary.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h4 className="font-bold text-slate-900 text-sm">{summary.name}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                summary.current_health === 'blooming' ? "bg-green-500" :
                                summary.current_health === 'nourished' ? "bg-lime-500" :
                                summary.current_health === 'thirsty' ? "bg-amber-500" : "bg-orange-500"
                            )} />
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                                {summary.current_health}
                            </span>
                        </div>
                    </div>
                </div>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-slate-400 hover:text-indigo-600"
                    onClick={() => router.push(`/contacts/${summary.person_id}`)}
                >
                    <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              {summary.notes.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <p className="text-xs text-slate-600 line-clamp-2 italic">
                          "{summary.notes[0]}"
                      </p>
                      {summary.notes.length > 1 && (
                          <p className="text-[10px] text-slate-400 mt-1 font-medium">
                              +{summary.notes.length - 1} more notes
                          </p>
                      )}
                  </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
