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

    // Generate comprehensive AI summary
    const systemPrompt = `You are the Personal Relationship Intelligence Engine for the app "Remember Me."

Your task is to create a comprehensive, natural-sounding AI summary of a contact based on all available information.

CRITICAL INSTRUCTIONS:
1. The summary MUST be between 75-200 words
2. Use the person's name "${personName}" exactly as provided - do not change, shorten, or modify it
3. Write in a warm, human, perceptive tone - not robotic
4. Organize the summary with clear markdown headers (###) for different sections
5. Include the most meaningful and memorable details that help the user remember this person
6. Focus on: who they are, their role/profession, relationship context, personality traits, interests, and why they matter

REQUIRED STRUCTURE (Use markdown formatting):

### Person Snapshot
A short, natural paragraph: Who is this person? Why do they matter? What defines them at a glance?

### Relationship Context
How do you know each other? What's the nature and depth of the relationship?

### Key Details
Important facts: career, interests, family, personality traits, communication style

### Why They Matter
Why the user values this relationship and wants to stay connected

Guidelines:
- Be specific and meaningful, not generic
- Capture personality and essence, not just facts
- Make it personal and memorable
- Use past tense for how you met, present tense for current state
- If information is limited, work with what you have and don't invent details

Return ONLY the formatted markdown summary, nothing else.`;

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Generate a comprehensive AI summary from this contact information:\n\n${context}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiSummary = completion.choices[0]?.message?.content?.trim();

    if (!aiSummary) {
      return NextResponse.json(
        { error: "Failed to generate AI summary" },
        { status: 500 }
      );
    }

    // Update the person record with the new AI summary
    const { error: updateError } = await (supabase as any)
      .from("persons")
      .update({
        relationship_summary: aiSummary,
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
      summary: aiSummary,
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
