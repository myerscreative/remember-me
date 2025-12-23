import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

// Lazy initialization to prevent build-time errors
let openaiInstance: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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
    const {
      name,
      firstName,
      lastName,
      email,
      phone,
      whereMet,
      whoIntroduced,
      notes,
      birthday,
      existingSummary,
    } = body;

    // Validate required fields
    if (!name && !firstName) {
      return NextResponse.json(
        { error: "At least a name or first name is required" },
        { status: 400 }
      );
    }

    // Build context for GPT-4
    const contextParts: string[] = [];

    if (name || (firstName && lastName)) {
      contextParts.push(`Contact: ${name || `${firstName} ${lastName || ''}`.trim()}`);
    }

    if (email) {
      contextParts.push(`Email: ${email}`);
    }

    if (phone) {
      contextParts.push(`Phone: ${phone}`);
    }

    if (whereMet) {
      contextParts.push(`Where we met: ${whereMet}`);
    }

    if (whoIntroduced) {
      contextParts.push(`Who introduced us: ${whoIntroduced}`);
    }

    if (birthday) {
      contextParts.push(`Birthday: ${birthday}`);
    }

    if (notes) {
      contextParts.push(`Notes: ${notes}`);
    }

    if (existingSummary) {
      contextParts.push(`Existing summary: ${existingSummary}`);
    }

    const context = contextParts.join('\n');

    // Generate summary using GPT-4
    const systemPrompt = `You are a relationship summarizer for a contact management app called ReMember Me.

Your task is to create a concise, natural-sounding one-line summary of the relationship between the user and this contact.

Guidelines:
1. Keep it to ONE sentence (max 15 words)
2. Focus on the most important context: where/how they met, their role, or what they do
3. Make it personal and memorable (helps the user remember who this person is)
4. Avoid generic phrases like "a person I know"
5. Use past tense for where you met, present tense for what they do
6. If there's a mutual connection, mention it
7. Prioritize information in this order: role/profession → where met → mutual connection → other context

Good examples:
- "Software engineer at Google who I met at TechCrunch Disrupt 2024"
- "Designer friend from college, now working on sustainable tech projects"
- "Investor introduced by Sarah, interested in AI startups"
- "Product manager passionate about AI UX, connected through LinkedIn"
- "Former colleague from Tesla, expert in autonomous vehicle systems"

Bad examples (too vague):
- "A person I know from work"
- "Someone I met at a conference"
- "Friend of a friend"

If there's very little information, focus on what you have:
- Only name and email: "Contact from [email domain]"
- Only where met: "Met at [location/event]"
- Only who introduced: "Introduced by [person]"

Return ONLY the summary sentence, nothing else.`;

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Generate a relationship summary from this contact information:\n\n${context}`,
        },
      ],
      temperature: 0.7, // Slightly creative but consistent
      max_tokens: 100, // One sentence should be plenty
    });

    const summary = completion.choices[0]?.message?.content?.trim();

    if (!summary) {
      return NextResponse.json(
        { error: "Failed to generate summary" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      summary,
      usage: completion.usage,
    });
  } catch (error: any) {
    console.error("Error generating summary:", error);

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
      { error: error?.message || "Failed to generate summary" },
      { status: 500 }
    );
  }
}
