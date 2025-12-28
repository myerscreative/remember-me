import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";


// Remove edge runtime to ensure broad compatibility
// export const runtime = 'edge';

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Calculate Date Range (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString();
    
    // Next 7 Days (for milestones)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    // 2. Fetch Weekly Interactions
    const { data: interactions, error: interactionsError } = await supabase
        .from('interactions')
        .select(`
            *,
            persons ( name )
        `)
        .gte('created_at', sevenDaysAgoStr)
        .order('created_at', { ascending: false });

    if (interactionsError) throw interactionsError;

    // 3. Process Momentum (Group by Person)
    const momentumMap: Record<string, { name: string, count: number }> = {};
    const contextNotes: string[] = [];

    interactions?.forEach((interaction: any) => {
        const personName = interaction.persons?.name || 'Unknown';
        
        // Momentum
        if (!momentumMap[personName]) {
            momentumMap[personName] = { name: personName, count: 0 };
        }
        momentumMap[personName].count += 1;

        // Collect Context
        if (interaction.notes) {
            contextNotes.push(`[${personName}]: ${interaction.notes}`);
        }
    });

    const momentumLeaders = Object.values(momentumMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

    // 4. Fetch Upcoming Milestones (Birthdays/Anniversaries)
    const { data: persons, error: personsError } = await supabase
        .from('persons')
        .select('name, birthday')
        .or('archive_status.is.null,archive_status.eq.false');

    if (personsError) throw personsError;

    const upcomingMilestones: { name: string; type: string; date: string }[] = [];
    
    (persons as any[])?.forEach((p) => {
        const checkDate = (dateStr: string | null, type: string) => {
            if (!dateStr) return;
            const date = new Date(dateStr);
            const thisYear = new Date().getFullYear();
            const targetDate = new Date(thisYear, date.getMonth(), date.getDate());
            
            const now = new Date();
            // simple Next 7 Days check
            if (targetDate < new Date(now.setHours(0,0,0,0))) {
                targetDate.setFullYear(thisYear + 1);
            }
            
            const diffTime = targetDate.getTime() - new Date().getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            
            if (diffDays >= 0 && diffDays <= 7) {
                upcomingMilestones.push({
                    name: p.name,
                    type,
                    date: targetDate.toLocaleDateString("en-US", { month: 'short', day: 'numeric' })
                });
            }
        };

        checkDate(p.birthday, 'Birthday');
        // Note: custom_anniversary column not yet deployed
    });

    // 5. AI Summary for "New Intelligence"
    let newIntelligence: string[] = [];
    const apiKey = process.env.OPENAI_API_KEY;

    if (contextNotes.length > 0 && apiKey) {
        try {
            const openai = new OpenAI({ apiKey });
            const systemPrompt = `You are an intelligence analyst for a relationship CRM.
Goal: Identify the 3 most significant 'Context' updates from this week's logs.
Input: A list of raw notes from interactions.
Output: A JSON array of 3 strings. Each string should be: "Name: [Summary of update]".
Criteria: Focus on life events, projects, career changes, or strong personal details. Ignore generic "caught up" notes.`;

            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: contextNotes.join('\n') }
                ],
                response_format: { type: "json_object" },
                temperature: 0.5,
            });

            const content = completion.choices[0]?.message?.content;
            if (content) {
                const parsed = JSON.parse(content);
                let updates = parsed.updates || parsed.intelligence || parsed.summary || [];
                if (!Array.isArray(updates)) {
                    updates = Object.values(updates);
                }
                newIntelligence = updates;
            }
        } catch (e) {
            console.error("AI Generation Failed (Non-fatal warning):", e);
            // Non-fatal, just fallback to empty text
        }
    } else if (!apiKey) {
        console.warn("Skipping AI Recap: Missing OPENAI_API_KEY");
    }

    return NextResponse.json({
        momentumLeaders,
        newIntelligence: newIntelligence.slice(0, 3),
        upcomingMilestones
    });

  } catch (error: any) {
    console.error("Error generating weekly recap:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate recap" }, 
      { status: 500 }
    );
  }
}
