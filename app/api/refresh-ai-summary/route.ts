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
    const { contactId } = body;

    if (!contactId) {
      return NextResponse.json(
        { error: "Contact ID is required" },
        { status: 400 }
      );
    }

    // Fetch complete contact data
    const { data: person, error: personError } = await (supabase as any)
      .from("persons")
      .select("*")
      .eq("id", contactId)
      .eq("user_id", user.id)
      .single();

    if (personError || !person) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    // Type assertion for person - Supabase returns any, but we know the shape
    const typedPerson = person as any;

    // Fetch shared memories
    const { data: sharedMemories } = await (supabase as any)
      .from("shared_memories")
      .select("content, created_at")
      .eq("person_id", contactId)
      .order('created_at', { ascending: false });

    // Build comprehensive context for AI
    const personName = typedPerson.name || `${typedPerson.first_name || ''} ${typedPerson.last_name || ''}`.trim() || 'this person';

    const contextParts: string[] = [];
    contextParts.push(`Name: ${personName}`);

    if (typedPerson.email) contextParts.push(`Email: ${typedPerson.email}`);
    if (typedPerson.phone) contextParts.push(`Phone: ${typedPerson.phone}`);
    if (typedPerson.company) contextParts.push(`Company: ${typedPerson.company}`);
    if (typedPerson.job_title) contextParts.push(`Job Title: ${typedPerson.job_title}`);
    if (typedPerson.where_met) contextParts.push(`Where We Met: ${typedPerson.where_met}`);
    if (typedPerson.why_stay_in_contact) contextParts.push(`Why We Stay in Contact: ${typedPerson.why_stay_in_contact}`);
    if (typedPerson.most_important_to_them) contextParts.push(`What's Important to Them: ${typedPerson.most_important_to_them}`);
    if (typedPerson.birthday) contextParts.push(`Birthday: ${typedPerson.birthday}`);

    if (typedPerson.interests && typedPerson.interests.length > 0) {
      contextParts.push(`Interests: ${typedPerson.interests.join(', ')}`);
    }

    if (typedPerson.family_members && typedPerson.family_members.length > 0) {
      const familyInfo = typedPerson.family_members.map((m: any) =>
        `${m.name} (${m.relationship || 'family member'})`
      ).join(', ');
      contextParts.push(`Family: ${familyInfo}`);
    }

    if (typedPerson.deep_lore) {
      contextParts.push(`Previous Notes: ${typedPerson.deep_lore}`);
    }

    if (sharedMemories && sharedMemories.length > 0) {
      const memoriesText = sharedMemories.slice(0, 5).map((m: any) => m.content).join('\n- ');
      contextParts.push(`Recent Memories:\n- ${memoriesText}`);
    }

    const context = contextParts.join('\n');

    // Generate three-tier AI summary
    const systemPrompt = `You generate human-memory summaries for a relationship-memory app.

Your job is to help the user instantly remember:
1) who this person is
2) how they know them
3) why the relationship matters

Rules:
- Do NOT invent facts.
- If something is missing, omit it.
- Avoid generic praise and LinkedIn tone.
- Use concrete anchors (where met, role, family basics, standout hobby/value).
- Output must be valid JSON only (no markdown, no commentary).

Generate the following three summaries for the person described below.

1) Micro Summary (Quick Glance)

Purpose: Instant recognition
Rules:
- 1 sentence only
- 15–25 words
- Include: name + relationship/context + 1 memorable anchor
- No adjectives unless concrete

Example:
Bryan Clay — faith-driven entrepreneur you met in Washington; family-first, outdoorsy, and someone you respect and stay in touch with.

2) Default Summary (Everyday)

Purpose: Fast emotional + contextual recall
Rules:
- 2–4 sentences
- 50–75 words (hard max 85)
- No headings
- Use plain, human language (not LinkedIn tone)
- Required order:
  1. Identity / role
  2. How you know them (where/how met)
  3. 1–2 concrete anchors (family, work focus, hobby, values)
  4. Why they matter / why you keep in touch

Example:
Bryan Clay is a faith-driven entrepreneur and family man you met in Washington. He runs his own business, values health and fitness, and is deeply committed to his wife and two daughters. You admire the balance he maintains between work, family, and faith, and you stay connected as both friends and respected business peers.

3) Full Summary (Deep Context)

Purpose: Full relationship understanding
Rules:
- 150–220 words (max 260)
- May use short paragraphs or headings
- Warm, reflective, but still factual
- Expand on meaning, not just details

Example structure (not required wording):
- Snapshot
- Relationship Context
- Key Details
- Why They Matter

OUTPUT FORMAT (STRICT):
Return valid JSON only:
{
  "summary_micro": "",
  "summary_default": "",
  "summary_full": ""
}`;

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `PERSON DATA:\n\n${context}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: "json_object" },
    });

    const aiResponse = completion.choices[0]?.message?.content?.trim();

    if (!aiResponse) {
      return NextResponse.json(
        { error: "Failed to generate AI summary" },
        { status: 500 }
      );
    }

    // Parse the JSON response
    let summaries;
    try {
      summaries = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return NextResponse.json(
        { error: "Failed to parse AI summary response" },
        { status: 500 }
      );
    }

    // Validate that we have all three summaries
    if (!summaries.summary_micro || !summaries.summary_default || !summaries.summary_full) {
      return NextResponse.json(
        { error: "AI did not generate all required summaries" },
        { status: 500 }
      );
    }

    // Update the person record with the default summary
    // (Store in relationship_summary field - the primary summary field used throughout the app)
    const { error: updateError } = await (supabase as any)
      .from("persons")
      .update({
        relationship_summary: summaries.summary_default,
        updated_at: new Date().toISOString()
      })
      .eq("id", contactId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating AI summary:", updateError);
      return NextResponse.json(
        { error: "Failed to save AI summary" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      summary: summaries.summary_default, // Primary summary for backward compatibility
      summary_micro: summaries.summary_micro,
      summary_default: summaries.summary_default,
      summary_full: summaries.summary_full,
      usage: completion.usage,
    });
  } catch (error: any) {
    console.error("Error refreshing AI summary:", error);

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
      { error: error?.message || "Failed to refresh AI summary" },
      { status: 500 }
    );
  }
}
