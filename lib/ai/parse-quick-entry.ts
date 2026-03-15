import OpenAI from "openai";

let openaiInstance: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiInstance;
}

export interface ParseQuickEntryResult {
  where_met: string | null;
  why_stay_in_contact: string | null;
  interests: string[];
  confidence: "high" | "medium" | "low";
}

/**
 * Parses a quick narrative note into structured fields.
 * Returns null/empty for fields where extraction is uncertain.
 */
export async function parseQuickEntryNarrative(
  text: string
): Promise<ParseQuickEntryResult> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      where_met: null,
      why_stay_in_contact: null,
      interests: [],
      confidence: "low",
    };
  }

  const completion = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You extract structured contact info from short narrative notes about a person.

Extract ONLY what is clearly stated or strongly implied. If unsure, leave null or empty.

Return JSON in this exact format:
{
  "where_met": string | null,   // Where they met: place, event, or context (e.g. "coffee shop", "SXSW 2024", "through Sarah")
  "why_stay_in_contact": string | null,  // Why the user wants to stay in touch: value, reason, or connection (e.g. "potential design collaboration", "shared hiking group")
  "interests": string[],         // Hobbies, passions, topics they care about (e.g. ["hiking", "design", "coffee"])
  "confidence": "high" | "medium" | "low"  // How confident you are in the extraction overall
}

Rules:
- interests: Use short lowercase tags. Max 5-8 items. No duplicates.
- where_met: One concise phrase. No full sentences.
- why_stay_in_contact: One concise phrase. Focus on relationship value.
- If the note is vague or contains no extractable info, use null/[] and confidence "low".`,
      },
      { role: "user", content: text },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    return {
      where_met: null,
      why_stay_in_contact: null,
      interests: [],
      confidence: "low",
    };
  }

  const parsed = JSON.parse(raw);
  const interests = Array.isArray(parsed.interests)
    ? parsed.interests
        .filter((i: unknown) => typeof i === "string" && (i as string).trim())
        .map((i: string) => (i as string).trim())
        .slice(0, 10)
    : [];

  return {
    where_met: parsed.where_met?.trim() || null,
    why_stay_in_contact: parsed.why_stay_in_contact?.trim() || null,
    interests,
    confidence:
      parsed.confidence === "high" || parsed.confidence === "medium"
        ? parsed.confidence
        : "low",
  };
}
