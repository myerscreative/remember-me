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

    const { personName, context, history, mutualConnections, nextGoal } = await request.json();

    const systemPrompt = `You are a helpful relationship assistant.
Goal: Based on the provided Context and History for ${personName}, generate a natural reach-out script.
Tone: Casual, warm, authentic. Not "salesy".
Length: Short message (SMS/Email style), max 2 sentences.
Special Instruction: If mutual connections are listed, you MUST start the message by mentioning one of them to create a warm intro. Example: "Hey ${personName}, I was just catching up with [Mutual Name] and your name came up!"
CRITICAL RULE: If a 'Next Goal / Strategy' is provided below, you MUST use it as the primary topic or call-to-action. Do not use generic openers if a specific goal is present.
Output: Just the script text. No quotes.`;

    const userContext = `
    Contact Name: ${personName}
    
    Next Goal / Strategy (HIGHEST PRIORITY):
    ${nextGoal || "None set."}
    
    Mutual Connections (Warm Intro Opportunities):
    ${mutualConnections && mutualConnections.length > 0 ? mutualConnections.join(', ') : "None"}

    Context (Notes/Interests):
    ${context || "No specific context available."}
    
    History (Last Interactions):
    ${history && history.length > 0 
      ? history.map((l: any) => `- [${l.date}] ${l.type}: ${l.notes}`).join('\n') 
      : "No recent interaction history."}
    `;

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContext }
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    const script = completion.choices[0]?.message?.content?.trim();

    return NextResponse.json({ script });

  } catch (error: any) {
    console.error("Error generating script:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate script" }, 
      { status: 500 }
    );
  }
}
