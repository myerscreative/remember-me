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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { logs, personName } = await request.json();

    if (!logs || !Array.isArray(logs) || logs.length === 0) {
       return NextResponse.json({ status: "No history found." });
    }

    const systemPrompt = `You are a relationship assistant.
Goal: Summarize the last 5 interactions with a person into a single, actionable 20-word history summary.
Output: Just the status text. No quotes. No "Status:".
Tone: Insightful, concise, present tense.
Example: "Reconnected over coffee; they are excited about the new job but stressed about moving."`;

    const userContext = `
    Person: ${personName}
    Recent History:
    ${logs.map((l: any) => `- [${l.date}] (${l.type}): ${l.notes || "No notes"}`).join('\n')}
    `;

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContext }
      ],
      temperature: 0.5,
      max_tokens: 60,
    });

    const status = completion.choices[0]?.message?.content?.trim();

    return NextResponse.json({ status });

  } catch (error: any) {
    console.error("Error generating status:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate status" }, 
      { status: 500 }
    );
  }
}
