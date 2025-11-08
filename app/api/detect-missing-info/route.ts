import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

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
          content: `You are a helpful assistant that analyzes contact information text to identify incomplete or missing details that should be filled in.

For ${context} context, detect:
- FAMILY: Missing names of children, spouse, family members when quantities are mentioned (e.g., "two children" without names, "married" without spouse name)
- PROFESSION: Missing specific job titles, company names, achievements, or career details when general descriptions are given
- INTERESTS: Missing specific details about hobbies, activities, or interests when vague mentions appear

Return ONLY valid JSON in this exact format:
{
  "missingInfo": [
    {
      "type": "children_names" | "spouse_name" | "job_title" | "company_name" | "interest_details" | "other",
      "prompt": "A friendly, actionable prompt asking the user to add the missing information",
      "suggestion": "Example or suggestion of what information should be added"
    }
  ]
}

If no missing information is detected, return: { "missingInfo": [] }

Be specific and actionable. The prompt should help users understand exactly what information is missing and why it would be valuable to add.`,
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

  } catch (error) {
    console.error("Detection error:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    
    // Return empty array on error so UI doesn't break
    return NextResponse.json({ missingInfo: [], error: error instanceof Error ? error.message : "Unknown error" });
  }
}

