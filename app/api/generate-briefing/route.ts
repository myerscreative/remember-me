import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

// Lazy initialization to prevent build-time errors
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
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { milestones, thirstyTribes, priorityNurtures, user_name } = body;

    // Build context for GPT-4
    const systemPrompt = `You are a warm, professional, yet personal relationship assistant for ReMember Me.
Your goal is to provide a "Morning Briefing" that feels like a personal assistant or a daily podcast host giving an update on key relationships.

Tone:
- Warm, encouraging, and personal.
- NOT robotic or listy.
- Use natural transitions between topics.
- Keep it under 200 words total.
- Use emojis sparingly but effectively (🌱, 🎂, ✨).

Structure:
1. Greeting: "Good morning [Name]!" or similar.
2. Milestones (Birthdays/Anniversaries): Mention them with excitement. Suggest reaching out.
3. Thirsty Tribes: Mention groups that need attention (e.g., "The [Group] crew hasn't heard from you in a while...").
4. Priority Nurtures: Mention 1-2 key people fading from the garden. Give a brief reason to reconnect (e.g., "It's been over 4 months since you spoke to [Name]").
5. Closing: A short reliable closing sentiment about building connection.

Input Data Format:
- Milestones: Array of { contactName, label, daysRemaining }
- Thirsty Tribes: Array of { name, daysSinceContact }
- Priority Nurtures: Array of { name, lastContactDate, daysSince }

If any list is empty, skip that section naturally. If everything is empty, just give a short "Your garden is thriving! specific happy message."

Return ONLY the narrative text. Do not include markdown headers like ## or **. Just paragraphs.`;

    const userContext = `
    User Name: ${user_name || "Friend"}
    
    Data:
    Milestones: ${JSON.stringify(milestones)}
    Thirsty Tribes: ${JSON.stringify(thirstyTribes)}
    Priority Nurtures: ${JSON.stringify(priorityNurtures)}
    `;

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userContext,
        },
      ],
      temperature: 0.7,
      max_tokens: 350,
    });

    const narrative = completion.choices[0]?.message?.content?.trim();

    if (!narrative) {
      return NextResponse.json(
        { error: "Failed to generate briefing" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      narrative,
      usage: completion.usage,
    });

  } catch (error: any) {
    console.error("Error generating briefing:", error);

    // Handle OpenAI API errors
    if (error?.status === 401) {
      return NextResponse.json(
        { error: "Invalid OpenAI API key. Please check your OPENAI_API_KEY environment variable." },
        { status: 500 }
      );
    }

    if (error?.status === 429) {
      return NextResponse.json(
        { error: "OpenAI API rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: error?.message || "Failed to generate briefing" },
      { status: 500 }
    );
  }
}
