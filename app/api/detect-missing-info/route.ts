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

interface DetectRequest {
  text: string;
  context: "Profession" | "Family" | "Interests";
  contactName: string;
  familyMembers?: Array<{ name: string; relationship: string }>;
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
    const { text, context, contactName, familyMembers } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ missingInfo: [] });
    }

    // For Family context, check if family members have already been added
    let additionalContext = "";
    if (context === "Family" && familyMembers && familyMembers.length > 0) {
      const childrenCount = familyMembers.filter(fm => 
        fm.relationship.toLowerCase().includes('child') || 
        fm.relationship.toLowerCase().includes('son') || 
        fm.relationship.toLowerCase().includes('daughter')
      ).length;
      
      const spouseCount = familyMembers.filter(fm => 
        fm.relationship.toLowerCase().includes('spouse') || 
        fm.relationship.toLowerCase().includes('wife') || 
        fm.relationship.toLowerCase().includes('husband') || 
        fm.relationship.toLowerCase().includes('partner')
      ).length;

      additionalContext = `\n\nIMPORTANT CONTEXT: This contact already has ${familyMembers.length} family member(s) added in the structured family members list`;
      if (childrenCount > 0) {
        additionalContext += `, including ${childrenCount} child/children`;
      }
      if (spouseCount > 0) {
        additionalContext += `, including ${spouseCount} spouse/partner`;
      }
      additionalContext += `. DO NOT suggest adding children's names or spouse names if they are already captured in the structured family members list. Only suggest if the text explicitly mentions family members that are NOT in the structured list.`;
    }

    // Use AI to detect incomplete information
    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that analyzes contact information text to identify TRULY incomplete or missing details that should be filled in.

IMPORTANT: Only flag information that is explicitly incomplete or contradictory, NOT information that could simply be "more detailed". The goal is to catch genuinely missing data, not to push for excessive detail.

For ${context} context, detect ONLY these specific cases:
- FAMILY: Missing names when quantities are explicitly mentioned (e.g., "has two children" or "married" WITHOUT any names at all, "three kids" without any names) - BUT ONLY if those family members are not already captured in the structured family members list
- PROFESSION: Missing critical details when they're referenced but not provided (e.g., "works at" without company name, "recently changed jobs to" without specifying where)
- INTERESTS: Missing specific items when vague placeholders are used (e.g., "enjoys several hobbies" without listing any, "likes sports" with no specific sports mentioned)

DO NOT flag:
- Profession titles that are already specific (e.g., "CEO", "Software Engineer", "Product Manager" are complete enough)
- Company names or descriptions that are already mentioned (even if brief)
- Information that exists but could theoretically be expanded
- General interest descriptions that include at least one specific thing
- Family member names that are already in the structured family members list (will be provided in context)

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
          content: `Analyze this ${context} information for "${contactName}":\n\n${text}${additionalContext}\n\nIdentify any incomplete information that should be filled in.`,
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

