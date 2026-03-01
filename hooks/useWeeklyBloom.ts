"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { startOfWeek, format } from "date-fns";

export interface WeeklyBloom {
  id: string;
  user_id: string;
  week_date: string;
  status: 'ready' | 'stagnant';
  highlight_contact_id: string | null;
  is_viewed: boolean;
  highlight_contact?: {
    name: string;
  };
}

/**
 * useWeeklyBloom Hook
 * Handles fetching the current week's recap status and marking it as viewed.
 */
export function useWeeklyBloom() {
  const [bloom, setBloom] = useState<WeeklyBloom | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBloom = useCallback(async () => {
    const supabase = createClient();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      // Sunday of the current week
      const sunday = startOfWeek(now, { weekStartsOn: 0 });
      const weekDateStr = format(sunday, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('weekly_blooms')
        .select('*, highlight_contact:persons(name)')
        .eq('user_id', user.id)
        .eq('week_date', weekDateStr)
        .maybeSingle();

      if (error) {
        console.error("Supabase error fetching bloom:", error);
        return;
      }
      
      setBloom(data as any);
    } catch (err) {
      console.error("Error in useWeeklyBloom:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsViewed = useCallback(async () => {
    if (!bloom || bloom.is_viewed) return;
    
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('weekly_blooms')
        .update({ is_viewed: true })
        .eq('id', bloom.id);

      if (error) throw error;
      setBloom(prev => prev ? { ...prev, is_viewed: true } : null);
    } catch (err) {
      console.error("Error marking bloom as viewed:", err);
    }
  }, [bloom]);

  useEffect(() => {
    fetchBloom();
  }, [fetchBloom]);

  return {
    bloom,
    isLoading,
    markAsViewed,
    refresh: fetchBloom
  };
}
