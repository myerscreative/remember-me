import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

export const runtime = 'edge';

// Lazy initialization
let openaiInstance: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing OPENAI_API_KEY environment variable");
    }
    openaiInstance = new OpenAI({ apiKey });
  }
  return openaiInstance;
}

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
        .select('name, birthday, custom_anniversary')
        .eq('archived', false);

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
        checkDate(p.custom_anniversary, 'Anniversary');
    });

    // 5. AI Summary for "New Intelligence"
    let newIntelligence = [];
    if (contextNotes.length > 0) {
        const systemPrompt = `You are an intelligence analyst for a relationship CRM.
Goal: Identify the 3 most significant 'Context' updates from this week's logs.
Input: A list of raw notes from interactions.
Output: A JSON array of 3 strings. Each string should be: "Name: [Summary of update]".
Criteria: Focus on life events, projects, career changes, or strong personal details. Ignore generic "caught up" notes.`;

        const completion = await getOpenAI().chat.completions.create({
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
            try {
                // Expecting JSON { "updates": [...] } or similar based on loose instruction, 
                // but "json_object" requires the prompt to say "JSON".
                // Let's parse whatever valid JSON it returns.
                const parsed = JSON.parse(content);
                // Handle various likely key names
                newIntelligence = parsed.updates || parsed.intelligence || parsed.summary || [];
                // If it's an object with keys, extract values
                if (!Array.isArray(newIntelligence)) {
                    newIntelligence = Object.values(newIntelligence);
                }
            } catch (e) {
                console.error("Failed to parse AI response", e);
                // Fallback: just take the top 3 raw notes if parsing fails? 
                // Or return empty.
            }
        }
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
