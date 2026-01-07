'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowLeft, Loader2, Download } from 'lucide-react';
import { DailyBriefingCard } from '@/components/DailyBriefingCard';
import { getDailyBriefing, type DailyBriefing } from '@/app/actions/get-daily-briefing';
import { ErrorFallback } from '@/components/error-fallback';

export default function BriefingPage() {
  const router = useRouter();
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadBriefing();
  }, []);

  const loadBriefing = async () => {
    setIsLoading(true);
    try {
      // Pass expanded: true to get the full list (Next 7 days milestones, top 10 nurtures)
      const { data, error } = await getDailyBriefing({ expanded: true });
      if (error) throw new Error(error);
      setBriefing(data);

      // Generate narrative if data exists
      if (data) {
        generateNarrative(data);
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNarrative = async (data: DailyBriefing) => {
    setIsGeneratingNarrative(true);
    try {
      const response = await fetch('/api/generate-briefing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          milestones: data.milestones,
          thirstyTribes: data.thirstyTribes,
          priorityNurtures: data.priorityNurtures,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to generate narrative');
      
      const result = await response.json();
      setNarrative(result.narrative);
    } catch (err) {
      console.error("Narrative generation failed:", err);
      // Don't block whole page, just show standard list
    } finally {
      setIsGeneratingNarrative(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          <span className="text-gray-600 dark:text-gray-400">Loading your briefing...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
         <ErrorFallback error={error} reset={loadBriefing} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16 md:pb-0">
      <div className="max-w-3xl mx-auto w-full px-3 md:px-4 py-4 md:py-6 space-y-4 md:space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3 md:gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 md:h-10 md:w-10">
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
            Daily Briefing
          </h1>
        </div>

        {/* AI Narrative Card */}
        <Card className="border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-900/10">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-purple-700 dark:text-purple-300">
                    <Sparkles className="h-5 w-5" />
                    Relationship Intelligence
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isGeneratingNarrative ? (
                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 animate-pulse">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Synthesizing your personal briefing...</span>
                    </div>
                ) : narrative ? (
                    <div className="prose dark:prose-invert prose-purple max-w-none text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                        {narrative}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 italic">Narrative unavailable. Check your connection or API key.</p>
                )}
            </CardContent>
        </Card>

        {/* Content */}
        {briefing ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider font-bold">
                    Action Items
                </p>
                <Badge variant="outline">{briefing.milestones.length + briefing.thirstyTribes.length + briefing.priorityNurtures.length} Total</Badge>
            </div>
            
            <DailyBriefingCard briefing={briefing} onActionComplete={loadBriefing} />
            
            {(briefing.milestones.length === 0 && briefing.thirstyTribes.length === 0 && briefing.priorityNurtures.length === 0) && (
                <Card className="border-dashed">
                    <CardContent className="pt-6 text-center text-gray-500">
                        <p>All caught up! You are a relationship superhero. 🦸‍♂️</p>
                        <Button variant="link" onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
                    </CardContent>
                </Card>
            )}
          </div>
        ) : (
            <div className="text-center text-gray-500">No briefing data available.</div>
        )}
      </div>
    </div>
  );
}
