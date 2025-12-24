import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { authenticateRequest } from "@/lib/supabase/auth";

// Lazy initialization to prevent build-time errors
let openaiInstance: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiInstance;
}

interface ParseRequest {
  transcript: string;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { error: authError } = await authenticateRequest(request);
    if (authError) {
      return authError;
    }

    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const body: ParseRequest = await request.json();
    const { transcript } = body;

    if (!transcript || !transcript.trim()) {
      return NextResponse.json(
        { error: "No transcript provided" },
        { status: 400 }
      );
    }

    // Use GPT-4 to parse the transcript into structured data
    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini", // Using gpt-4o-mini for cost efficiency, can upgrade to gpt-4 if needed
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that extracts structured contact information from spoken transcripts. 
Extract the following information if mentioned:
- Name (full name)
- Email address
- Phone number
- LinkedIn profile URL or username
- Where they met (location/event)
- Who introduced them (person's name)
- First impression (immediate impression when first meeting)
- Memorable moment (what made the first conversation/meeting memorable)
- Why stay in contact (reason/value)
- What's interesting about them
- What's important to them (their priorities/values/goals)
- Family members: Extract names, relationships, and any extra details mentioned like their birthday, hobbies, or specific interests (e.g., "wife Sarah who loves tennis and has a birthday on June 1st").
- Interests (passions, hobbies, things they enjoy like "Golf", "Cooking", "Lake", "Wakeboarding")
- Tags (comma-separated, based on context like "Friend", "Work", "Investor", etc.)
- Misc: Any other information that doesn't fit into the above categories (random facts, anecdotes, personal details, etc.)

Return ONLY valid JSON in this exact format (use null for missing fields, empty array for familyMembers if none):
{
  "name": string | null,
  "email": string | null,
  "phone": string | null,
  "linkedin": string | null,
  "whereMet": string | null,
  "introducedBy": string | null,
  "firstImpression": string | null,
  "memorableMoment": string | null,
  "whyStayInContact": string | null,
  "whatInteresting": string | null,
  "whatsImportant": string | null,
  "familyMembers": [{"name": string, "relationship": string, "birthday": string | null, "hobbies": string | null, "interests": string | null}] | null,
  "interests": string | null,
  "tags": string | null,
  "misc": string | null
}

For familyMembers, extract ALL family members mentioned with their relationships. Relationship examples: "spouse", "child", "son", "daughter", "partner", "parent", "sibling", etc.

For misc, include any interesting details, anecdotes, or information that doesn't fit into structured fields but is worth remembering.`,
        },
        {
          role: "user",
          content: `Extract contact information from this transcript:\n\n${transcript}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // Lower temperature for more consistent extraction
    });

    const responseContent = completion.choices[0]?.message?.content;
    
    if (!responseContent) {
      throw new Error("No response from AI");
    }

    const parsedData = JSON.parse(responseContent);

    // Clean and format the data
    const cleanedData = {
      name: parsedData.name?.trim() || null,
      email: parsedData.email?.trim() || null,
      phone: parsedData.phone?.trim() || null,
      linkedin: parsedData.linkedin?.trim() || null,
      whereMet: parsedData.whereMet?.trim() || null,
      introducedBy: parsedData.introducedBy?.trim() || null,
      firstImpression: parsedData.firstImpression?.trim() || null,
      memorableMoment: parsedData.memorableMoment?.trim() || null,
      whyStayInContact: parsedData.whyStayInContact?.trim() || null,
      whatInteresting: parsedData.whatInteresting?.trim() || null,
      whatsImportant: parsedData.whatsImportant?.trim() || null,
      familyMembers: Array.isArray(parsedData.familyMembers) 
        ? parsedData.familyMembers.filter((fm: any) => fm?.name && fm?.relationship)
            .map((fm: any) => ({
              name: fm.name?.trim(),
              relationship: fm.relationship?.trim(),
              birthday: fm.birthday?.trim() || null,
              hobbies: fm.hobbies?.trim() || null,
              interests: fm.interests?.trim() || null,
            }))
        : null,
      interests: parsedData.interests?.trim() || null,
      tags: parsedData.tags?.trim() || null,
      misc: parsedData.misc?.trim() || null,
    };

    return NextResponse.json(cleanedData);

  } catch (error: unknown) {
    console.error("Parsing error:", error);

    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `OpenAI API error: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to parse transcript" },
      { status: 500 }
    );
  }
}

