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

    const { context, lastHistory } = await request.json();

    const systemPrompt = `You are a relationship assistant.
Goal: Generate a 15-word 'Context Brief'. 
Prioritize their current project or location from Context, and link it to the last topic discussed in History.
Tone: Concise, insightful, connecting dots.
Output: Just the brief text. No quotes.`;

    const userContext = `
    Context (Top Interests/Updates):
    ${context || "No specific context available."}
    
    Last History Item:
    ${lastHistory ? `[${lastHistory.date}] ${lastHistory.type}: ${lastHistory.notes}` : "No recent history."}
    `;

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContext }
      ],
      temperature: 0.5,
      max_tokens: 50,
    });

    const brief = completion.choices[0]?.message?.content?.trim();

    return NextResponse.json({ brief });

  } catch (error: any) {
    console.error("Error generating context brief:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate brief" }, 
      { status: 500 }
    );
  }
}
