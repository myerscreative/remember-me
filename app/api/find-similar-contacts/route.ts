import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface SimilarContactsRequest {
  userId: string;
  contactData: {
    company?: string | null;
    jobTitle?: string | null;
    interests?: string[] | null;
    skills?: string[] | null;
    tags?: string[] | null;
    whereMet?: string | null;
    whatInteresting?: string | null;
  };
  excludeContactId?: string;
}

interface SimilarContact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  company?: string | null;
  job_title?: string | null;
  interests?: string[];
  tags?: any[];
  similarity_score: number;
  similarity_reasons: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: SimilarContactsRequest = await request.json();
    const { userId, contactData, excludeContactId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch all contacts for the user with their tags
    let query = (supabase as any)
      .from("persons")
      .select(`
        id,
        name,
        email,
        phone,
        photo_url,
        interests,
        where_met,
        what_found_interesting
      `)
      .eq("user_id", userId);

    if (excludeContactId) {
      query = query.neq("id", excludeContactId);
    }

    const { data: contacts, error } = await query;

    if (error) {
      console.error("Error fetching contacts:", error);
      return NextResponse.json(
        { error: "Failed to fetch contacts" },
        { status: 500 }
      );
    }

    if (!contacts || contacts.length === 0) {
      return NextResponse.json({ similarContacts: [] });
    }

    // Calculate similarity scores
    const similarContacts: SimilarContact[] = [];

    for (const contact of contacts) {
      const reasons: string[] = [];
      let score = 0;

      // Check for company match
      if (contactData.company && contact.where_met) {
        const companyLower = contactData.company.toLowerCase();
        const whereMet = contact.where_met.toLowerCase();
        if (whereMet.includes(companyLower) || whereMet.includes("company") || whereMet.includes("work")) {
          reasons.push(`Works at similar company or met at work-related event`);
          score += 20;
        }
      }

      // Check for interests overlap
      if (contactData.interests && Array.isArray(contact.interests) && contact.interests.length > 0) {
        const matchingInterests = contactData.interests.filter(interest =>
          contact.interests.some((ci: string) =>
            ci.toLowerCase().includes(interest.toLowerCase()) ||
            interest.toLowerCase().includes(ci.toLowerCase())
          )
        );

        if (matchingInterests.length > 0) {
          reasons.push(`Shares interests: ${matchingInterests.join(", ")}`);
          score += matchingInterests.length * 15;
        }
      }

      // Check for skills overlap (in what_found_interesting)
      if (contactData.skills && contact.what_found_interesting) {
        const matchingSkills = contactData.skills.filter(skill =>
          contact.what_found_interesting?.toLowerCase().includes(skill.toLowerCase())
        );

        if (matchingSkills.length > 0) {
          reasons.push(`Similar skills/expertise: ${matchingSkills.join(", ")}`);
          score += matchingSkills.length * 15;
        }
      }

      // Check for location/event overlap
      if (contactData.whereMet && contact.where_met) {
        const whereMet1 = contactData.whereMet.toLowerCase();
        const whereMet2 = contact.where_met.toLowerCase();

        // Extract common words (excluding common words like "at", "the", etc.)
        const commonWords = ["the", "at", "in", "on", "a", "an", "and", "or"];
        const words1 = whereMet1.split(/\s+/).filter((w: string) => w.length > 3 && !commonWords.includes(w));
        const words2 = whereMet2.split(/\s+/).filter((w: string) => w.length > 3 && !commonWords.includes(w));

        const overlap = words1.filter((w: string) => words2.some((w2: string) => w2.includes(w) || w.includes(w2)));

        if (overlap.length > 0) {
          reasons.push(`Met at similar location/event`);
          score += overlap.length * 10;
        }
      }

      // Only include contacts with meaningful similarity
      if (score >= 15 && reasons.length > 0) {
        similarContacts.push({
          id: contact.id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          photo_url: contact.photo_url,
          interests: contact.interests,
          similarity_score: Math.min(score, 100), // Cap at 100
          similarity_reasons: reasons,
        });
      }
    }

    // Sort by similarity score (highest first)
    similarContacts.sort((a, b) => b.similarity_score - a.similarity_score);

    // Limit to top 5 most similar
    const topSimilar = similarContacts.slice(0, 5);

    // If we have similar contacts, use AI to generate a natural summary
    if (topSimilar.length > 0 && process.env.OPENAI_API_KEY) {
      for (const similar of topSimilar) {
        try {
          const summaryCompletion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "You are a helpful assistant that summarizes why two contacts are similar. Be concise (1-2 sentences).",
              },
              {
                role: "user",
                content: `Summarize why these contacts might be related:\nReasons: ${similar.similarity_reasons.join("; ")}`,
              },
            ],
            temperature: 0.5,
            max_tokens: 100,
          });

          const summary = summaryCompletion.choices[0]?.message?.content;
          if (summary) {
            (similar as any).summary = summary.trim();
          }
        } catch (error) {
          console.error("Error generating summary:", error);
          // Continue without summary
        }
      }
    }

    return NextResponse.json({
      similarContacts: topSimilar,
      totalFound: similarContacts.length
    });

  } catch (error) {
    console.error("Similar contacts error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to find similar contacts" },
      { status: 500 }
    );
  }
}
