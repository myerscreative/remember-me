import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { startOfWeek, subDays, format } from 'date-fns';

export const dynamic = 'force-dynamic';

/**
 * Weekly Bloom Cron Job
 * Triggered every Sunday morning at 9:00 AM (local user time logic placeholder)
 * Condition: Trigger if any activity in past 7 days, else stagnant nudge.
 */
export async function GET(req: NextRequest) {
  // Use service role for admin access
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Basic security check (use CRON_SECRET if available)
  const authHeader = req.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // 1. Get all users who have stats (active users)
    const { data: userStats, error: usersError } = await supabaseAdmin
      .from('user_stats')
      .select('user_id');

    if (usersError) throw usersError;

    const summary: Array<{ userId: string; status: 'ready' | 'stagnant'; highlightContactId: string | null }> = [];
    const now = new Date();
    // Sunday of this week
    const sunday = startOfWeek(now, { weekStartsOn: 0 });
    const weekDateStr = format(sunday, 'yyyy-MM-dd');
    const sevenDaysAgo = subDays(now, 7);

    for (const stat of userStats || []) {
      const userId = stat.user_id;

      // 2. Check for interactions in the last 7 days
      const { data: interactions } = await supabaseAdmin
        .from('interactions')
        .select('person_id, interaction_date')
        .eq('user_id', userId)
        .gte('created_at', sevenDaysAgo.toISOString()) // Using created_at for reliability on when it was logged
        .order('created_at', { ascending: false });

      // 3. Check for shared memories in the last 7 days
      const { data: memories } = await supabaseAdmin
        .from('shared_memories')
        .select('person_id, created_at')
        .eq('user_id', userId)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      const hasActivity = (interactions && interactions.length > 0) || (memories && memories.length > 0);
      
      const status: 'ready' | 'stagnant' = (interactions?.length || memories?.length) ? 'ready' : 'stagnant';
      let highlightContactId = null;

      if (hasActivity) {
        // Preference: contact with a memory, then most recent interaction
        if (memories && memories.length > 0) {
          highlightContactId = memories[0].person_id;
        } else if (interactions && interactions.length > 0) {
          highlightContactId = interactions[0].person_id;
        }
      }

      // 4. Upsert the weekly bloom record
      const { error: upsertError } = await supabaseAdmin
        .from('weekly_blooms')
        .upsert({
          user_id: userId,
          week_date: weekDateStr,
          status,
          highlight_contact_id: highlightContactId,
          is_viewed: false
        }, { onConflict: 'user_id,week_date' });

      if (upsertError) {
        console.error(`Failed to upsert bloom for ${userId}:`, upsertError);
        continue;
      }

      summary.push({ userId, status, highlightContactId });
    }

    return NextResponse.json({ 
      success: true, 
      week: weekDateStr,
      processed_count: summary.length 
    });

  } catch (error: any) {
    console.error("Weekly Bloom Cron Failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
