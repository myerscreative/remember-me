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

interface ParseVoiceRequest {
  transcript: string;
  userId: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const body: ParseVoiceRequest = await request.json();
    const { transcript, userId } = body;

    if (!transcript || !transcript.trim()) {
      return NextResponse.json(
        { error: "No transcript provided" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    // Step 1: Determine intent (new contact or update)
    const intentCompletion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are analyzing voice input to determine user intent.
Determine if the user wants to:
1. "new" - Add a new contact
2. "update" - Update an existing contact

Look for phrases like:
- New: "I met someone", "new contact", "add contact", "remember this person"
- Update: "update [name]", "add to [name]'s profile", "remember that [name]", "[name] told me"

Return ONLY valid JSON:
{
  "intent": "new" | "update",
  "contactName": string | null,
  "confidence": number
}

contactName should be the person's name if mentioned for updates, or null for new contacts.
confidence is 0-1 representing how certain you are.`,
        },
        {
          role: "user",
          content: `Analyze this transcript:\n\n${transcript}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const intentResponse = intentCompletion.choices[0]?.message?.content;
    if (!intentResponse) {
      throw new Error("No response from AI for intent detection");
    }

    const intent = JSON.parse(intentResponse);

    // Step 2: If update, search for matching contact
    let matchedContact = null;
    if (intent.intent === "update" && intent.contactName) {
      const supabase = await createClient();

      // Search for contact by name
      const { data: contacts, error } = await (supabase as any)
        .from("persons")
        .select("*")
        .eq("user_id", userId)
        .ilike("name", `%${intent.contactName}%`)
        .limit(5);

      if (error) {
        console.error("Error searching contacts:", error);
      } else if (contacts && contacts.length > 0) {
        // If multiple matches, return them for user to choose
        matchedContact = contacts.length === 1 ? contacts[0] : {
          multiple: true,
          matches: contacts.map((c: any) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone
          }))
        };
      }
    }

    // Step 3: Parse the contact information
    const parseCompletion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that extracts structured contact information from spoken transcripts.

${intent.intent === "update" ? "The user is UPDATING an existing contact. Extract only the NEW information being added." : "The user is adding a NEW contact. Extract all mentioned information."}

Extract the following information if mentioned:
- Name (full name) - only if mentioned
- Email address
- Phone number
- LinkedIn profile URL or username
- Company/Organization
- Job Title/Role
- Where they met (location/event)
- When they met (date/timeframe)
- Who introduced them (person's name)
- Why stay in contact (reason/value)
- What's interesting about them (profession, background, achievements)
- What's important to them (their priorities/values/goals)
- Interests (hobbies, passions, topics they care about)
- Skills (professional skills, expertise)
- Family members: Extract names and relationships
- Birthday/Age
- Notes: Any additional context, anecdotes, or details
- Tags (based on context like "Friend", "Work", "Investor", "Startup", etc.)

Return ONLY valid JSON in this exact format:
{
  "name": string | null,
  "email": string | null,
  "phone": string | null,
  "linkedin": string | null,
  "company": string | null,
  "jobTitle": string | null,
  "whereMet": string | null,
  "whenMet": string | null,
  "introducedBy": string | null,
  "whyStayInContact": string | null,
  "whatInteresting": string | null,
  "whatsImportant": string | null,
  "interests": string[] | null,
  "skills": string[] | null,
  "familyMembers": [{"name": string, "relationship": string}] | null,
  "birthday": string | null,
  "notes": string | null,
  "tags": string[] | null
}

Extract interests and skills as arrays. For tags, infer from context (e.g., mentions work → "Work", mentions investing → "Investor").`,
        },
        {
          role: "user",
          content: `Extract contact information from this transcript:\n\n${transcript}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const parseResponse = parseCompletion.choices[0]?.message?.content;
    if (!parseResponse) {
      throw new Error("No response from AI for parsing");
    }

    const parsedData = JSON.parse(parseResponse);

    // Step 4: Identify missing critical fields
    const missingFields: string[] = [];
    const criticalFields = ["name", "email", "phone"];

    for (const field of criticalFields) {
      if (!parsedData[field] && intent.intent === "new") {
        missingFields.push(field);
      }
    }

    // Clean and format the data
    const cleanedData = {
      name: parsedData.name?.trim() || null,
      email: parsedData.email?.trim() || null,
      phone: parsedData.phone?.trim() || null,
      linkedin: parsedData.linkedin?.trim() || null,
      company: parsedData.company?.trim() || null,
      jobTitle: parsedData.jobTitle?.trim() || null,
      whereMet: parsedData.whereMet?.trim() || null,
      whenMet: parsedData.whenMet?.trim() || null,
      introducedBy: parsedData.introducedBy?.trim() || null,
      whyStayInContact: parsedData.whyStayInContact?.trim() || null,
      whatInteresting: parsedData.whatInteresting?.trim() || null,
      whatsImportant: parsedData.whatsImportant?.trim() || null,
      interests: Array.isArray(parsedData.interests) ? parsedData.interests.filter((i: any) => i?.trim()) : null,
      skills: Array.isArray(parsedData.skills) ? parsedData.skills.filter((s: any) => s?.trim()) : null,
      familyMembers: Array.isArray(parsedData.familyMembers)
        ? parsedData.familyMembers.filter((fm: any) => fm?.name && fm?.relationship)
        : null,
      birthday: parsedData.birthday?.trim() || null,
      notes: parsedData.notes?.trim() || null,
      tags: Array.isArray(parsedData.tags) ? parsedData.tags.filter((t: any) => t?.trim()) : null,
    };

    return NextResponse.json({
      intent: intent.intent,
      confidence: intent.confidence,
      matchedContact,
      parsedData: cleanedData,
      missingFields,
      originalTranscript: transcript
    });

  } catch (error) {
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
