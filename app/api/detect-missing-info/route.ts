import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { authenticateRequest } from "@/lib/supabase/auth";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface DetectRequest {
  text: string;
  context: "Profession" | "Family" | "Interests";
  contactName: string;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error: authError } = await authenticateRequest(request);
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

    const body: DetectRequest = await request.json();
    const { text, context, contactName } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ missingInfo: [] });
    }

    // Use AI to detect incomplete information
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that analyzes contact information text to identify TRULY incomplete or missing details that should be filled in.

IMPORTANT: Only flag information that is explicitly incomplete or contradictory, NOT information that could simply be "more detailed". The goal is to catch genuinely missing data, not to push for excessive detail.

For ${context} context, detect ONLY these specific cases:
- FAMILY: Missing names when quantities are explicitly mentioned (e.g., "has two children" or "married" WITHOUT any names at all, "three kids" without any names)
- PROFESSION: Missing critical details when they're referenced but not provided (e.g., "works at" without company name, "recently changed jobs to" without specifying where)
- INTERESTS: Missing specific items when vague placeholders are used (e.g., "enjoys several hobbies" without listing any, "likes sports" with no specific sports mentioned)

DO NOT flag:
- Profession titles that are already specific (e.g., "CEO", "Software Engineer", "Product Manager" are complete enough)
- Company names or descriptions that are already mentioned (even if brief)
- Information that exists but could theoretically be expanded
- General interest descriptions that include at least one specific thing

Return ONLY valid JSON in this exact format:
{
  "missingInfo": [
    {
      "type": "children_names" | "spouse_name" | "job_title" | "company_name" | "interest_details" | "other",
      "prompt": "A friendly, actionable prompt asking the user to add the missing information. IMPORTANT: Always use the contact's first name in the prompt to personalize it (e.g., 'Please specify Sarah's job title' instead of 'Please specify the job title')",
      "suggestion": "Example or suggestion of what information should be added"
    }
  ]
}

If no missing information is detected, return: { "missingInfo": [] }

Be conservative - only flag truly incomplete information, not opportunities for more detail. ALWAYS personalize prompts with the contact's first name.`,
        },
        {
          role: "user",
          content: `Analyze this ${context} information for "${contactName}":\n\n${text}\n\nIdentify any incomplete information that should be filled in.`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const responseContent = completion.choices[0]?.message?.content;
    
    if (!responseContent) {
      return NextResponse.json({ missingInfo: [] });
    }

    const parsedData = JSON.parse(responseContent);

    return NextResponse.json({
      missingInfo: parsedData.missingInfo || [],
    });

  } catch (error: unknown) {
    console.error("Detection error:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }

    // Return empty array on error so UI doesn't break
    return NextResponse.json({ missingInfo: [], error: error instanceof Error ? error.message : "Unknown error" });
  }
}

