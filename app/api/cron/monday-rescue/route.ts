import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Force dynamic to avoid static generation attempts and build errors
export const dynamic = 'force-dynamic';

interface RescueTask {
  user_id: string;
  contact_id: string;
  suggested_hook: string;
  relationship_value_score: number;
}

interface CronSummary {
  userId: string;
  rescues: number;
}

export async function GET(req: NextRequest) {
  // Use service role for admin access across all users
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // 1. Basic security check (use a secret token in production)
  const authHeader = req.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // 2. Get all active users
    const { data: userStats, error: usersError } = await supabaseAdmin
      .from('user_stats')
      .select('user_id');

    if (usersError) throw usersError;

    const summary: CronSummary[] = [];

    for (const stat of userStats || []) {
      const userId = stat.user_id;

      // 3. Find top 5 drifting contacts for this user
      const { data: contacts, error: contactsError } = await supabaseAdmin
        .from('persons')
        .select(`
          id, 
          name, 
          last_interaction_date, 
          target_frequency_days, 
          importance,
          relationship_value,
          shared_memories(content)
        `)
        .eq('user_id', userId)
        .or('archived.eq.false,archived.is.null,archive_status.eq.false,archive_status.is.null');

      if (contactsError) continue;

      const now = new Date();
      const drifting = contacts.filter((contact: any) => {
        const importance = contact.importance || 'medium';
        const target = contact.target_frequency_days || (importance === 'high' ? 14 : importance === 'low' ? 90 : 30);
        if (!contact.last_interaction_date) return false;
        
        const lastDate = new Date(contact.last_interaction_date);
        const daysSince = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return daysSince >= (target + 5) && daysSince <= target * 1.5;
      });

      // Sort by relationship value + memory density
      const top5 = drifting
        .sort((a: any, b: any) => (b.relationship_value || 0) - (a.relationship_value || 0))
        .slice(0, 5);

      if (top5.length === 0) continue;

      const rescues: RescueTask[] = [];
      for (const contact of top5) {
        const memories = contact.shared_memories?.map((m: any) => m.content).join('; ') || "";
        
        let hook = "Just thinking of you! Hope you're having a great start to the week.";
        
        if (memories) {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'You are the Anti-Gravity Relationship Rescue AI. Generate a "Low-Stakes Recall" prompt. Short, casual, references a shared memory, ZERO BURDEN to reply to. No generic questions.'
                    },
                    {
                        role: 'user',
                        content: `Contact: ${contact.name}. Relevant Memories: ${memories}. Generate one short social hook.`
                    }
                ],
                max_tokens: 60
            });
            hook = response.choices[0].message.content?.replace(/^["']|["']$/g, '') || hook;
        }

        rescues.push({
          user_id: userId,
          contact_id: contact.id,
          suggested_hook: hook,
          relationship_value_score: contact.relationship_value || 50,
          // DB default will handle week_date normalization
        });
      }

      const { error: upsertError } = await supabaseAdmin
        .from('weekly_rescues')
        .upsert(rescues, { onConflict: 'user_id,contact_id,week_date' });

      if (upsertError) console.error(`Failed to upsert rescues for ${userId}`, upsertError);
      
      summary.push({ userId, rescues: rescues.length });
    }

    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    console.error("Monday Rescue Cron Failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
