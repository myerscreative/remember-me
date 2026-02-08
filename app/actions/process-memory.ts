'use server';

import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import type { Person } from '@/types/database.types';
import { extractSixBlocks } from '@/lib/six-block-extraction';
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ SECURITY: Validation schema for memory processing
const processMemorySchema = z.object({
  contactId: z.string().uuid("Invalid contact ID format"),
  text: z.string().trim().min(1, "Text cannot be empty").max(10000, "Text too long"),
  autoSave: z.boolean().optional().default(true),
});

export async function processMemory(contactId: string, text: string, autoSave = true) {
  try {
    // ✅ SECURITY: Validate inputs
    const validationResult = processMemorySchema.safeParse({ contactId, text, autoSave });
    
    if (!validationResult.success) {
      return { 
        success: false, 
        error: `Invalid input: ${validationResult.error.issues.map(i => i.message).join(", ")}` 
      };
    }

    const { contactId: validatedContactId, text: validatedText, autoSave: validatedAutoSave } = validationResult.data;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // 1. Fetch person data for context and current state
    const { data: personData, error: fetchError } = await supabase
        .from('persons')
        .select('*')
        .eq('id', validatedContactId)
        .eq('user_id', user.id)
        .single();
        
    if (fetchError || !personData) {
        return { success: false, error: 'Person not found' };
    }

    // Explicit cast to fix TypeScript 'never' inference
    const person = personData as unknown as Person;
    const personName = person.name || `${person.first_name || ''} ${person.last_name || ''}`.trim() || 'this person';

    // 2. Analyze text with OpenAI
    const prompt = `
      ROLE
      You are the Personal Relationship Intelligence Engine for the app "Remember Me."
      Your job is to take unstructured, free-form human input (brain dumps, spoken thoughts, fragmented memories, emotional impressions) about a person and transform it into a clear, organized, meaningful profile.

      CORE PRINCIPLE
      Humans think in stories and impressions, not databases.
      You must accept chaos as output and produce clarity as output.
      Do not simply summarize. Parse, interpret, classify, and structure the information.

      CRITICAL: The person's name is "${personName}". Always use this EXACT spelling when referring to them in the synopsis. Do not change, shorten, or modify this name in any way.

      INPUT STYLE
      The user may speak freely, jump between topics, repeat themselves, or mix facts with impressions. Treat all input as intentional and valuable.

      "BRAIN DUMP" PROCESSING LOGIC
      1. Extract Facts: Identify names, dates, or specific life updates (e.g., 'Sarah started a new job').
      2. Categorize: Route data to Story (Career, Values), Family (Relationships, Household), or Shared Memories (Timeline updates).
      3. Update Health: If the tone is high-value (e.g., 'We had a deep talk', 'We reconnected after years', 'It was a very meaningful conversation'), trigger a +5 boost to the Health Score.

      OUTPUT OBJECTIVE
      Transform the input into a high-level AI synopsis (human, not robotic), clearly grouped and labeled categories, and actionable memory anchors.
      Nothing should feel like a "ball of string." Everything must have meaning and place.

      REQUIRED STRUCTURE FOR "SYNOPSIS" FIELD (Use markdown formatting for headers):
      
      ### Person Snapshot
      Write a short, natural paragraph answering: Who is this person? Why do they matter? What defines them at a glance? (Tone: warm, perceptive, human)
      IMPORTANT: Use the name "${personName}" exactly as provided.

      ### Relationship Context
      Identify and classify the relationship (Family, Friend, Work, etc.). Include how they know each other and depth of relationship.

      ### Key Roles & Identities
      Extract meaningful roles (Parent, Professional, Social role). Do not invent facts. Format as bullet points if multiple.

      ### Personal Interests & Passions
      Group interests into Hobbies, Intellectual, Values, Lifestyle. Capture patterns.

      ### Personality & Communication Style
      Identify temperament and communication preferences.

      ### Important Facts & Details
      Extract concrete details (Family members, Dates, Locations, Career). Format as bullet points.

      ### Relationship Notes
      Why the user wants to remember this person.

      
      JSON EXTRACTION RULES:
      In addition to the text synopsis above, strictly extract specific data points into the following categories for database storage:

      1. FAMILY: Use this when family members or close friends are mentioned. 
         Data Format: { name: string, relationship: string, birthday?: string, hobbies?: string, interests?: string }.
      
      2. INTEREST: Use this for hobbies, sports, likes, or topics of interest.
         Data Format: { value: string }.
          
      3. WHERE_WE_MET: Use this for origin stories or meeting locations.
         Data Format: { value: string }.

      4. BUSINESS: Use this for career, job titles, or company names.
         Data Format: { job_title: string, company: string }.

      5. CURRENT_CHALLENGES: Use this for challenges, struggles, or difficulties they're facing.
         Data Format: { value: string }.

      6. GOALS_ASPIRATIONS: Use this for goals, dreams, aspirations, or what they're working toward.
         Data Format: { value: string }.

      7. HEALTH_BOOST: If the conversation tone is high-value or deep, specify the boost amount.
         Data Format: { value: number } (e.g., 5).

      8. SYNOPSIS: The FULL formatted markdown text based on the "REQUIRED STRUCTURE" sections above.
         IMPORTANT: Pass the entire multi-paragraph markdown string as the value here. This will be the high-quality snapshot shown to the user.
         Data Format: { value: string }.
      
      Return JSON: { "extractions": [ { "category": "...", "data": ... }, ... ] }
      
      Input Text: "${validatedText}"
    `;

    // Run both extractions in parallel for efficiency
    const [legacyResponse, sixBlockData] = await Promise.all([
      openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
      extractSixBlocks(validatedText) // New 6-block extraction
    ]);

    const content = legacyResponse.choices[0].message.content;
    const result = JSON.parse(content || '{}');
    const extractions = result.extractions || [];

    if (extractions.length === 0) {
        // Fallback to basic story if nothing extracted
        extractions.push({ category: "SYNOPSIS", data: { value: validatedText } });
    }


    const fieldsUpdated: string[] = [];
    const currentFamily = (Array.isArray(person.family_members) ? person.family_members : []) as any[];
    let currentInterests = (Array.isArray(person.interests) ? person.interests : []) as string[];
    let health_boost: number = person.health_boost || 0;
    let where_met: string | null = person.where_met;
    let deep_lore: string | null = person.deep_lore;
    let relationship_summary: string | null = person.relationship_summary;
    let company: string | null = person.company;
    let job_title: string | null = person.job_title;
    let most_important_to_them: string | null = person.most_important_to_them;
    let current_challenges: string | null = person.current_challenges;
    let goals_aspirations: string | null = person.goals_aspirations;

    // 3. Process extractions
    for (const item of extractions) {
        const { category, data } = item;
        
        switch (category) {
            case 'FAMILY':
                const existingIndex = currentFamily.findIndex((m: any) => m.name?.toLowerCase() === data.name?.toLowerCase());
                
                if (data.action === 'update' && existingIndex !== -1) {
                    // Update existing family member with new information
                    currentFamily[existingIndex] = {
                        ...currentFamily[existingIndex],
                        ...data,
                        action: undefined // Remove action field before saving
                    };
                    fieldsUpdated.push('Family (Updated)');
                } else if (existingIndex === -1) {
                    // Add new family member
                    const { action: _, ...memberData } = data; // Remove action field
                    currentFamily.push(memberData);
                    fieldsUpdated.push('Family (Added)');
                }
                break;
            case 'INTEREST':
                if (data.action === 'remove') {
                    // Remove interest
                    currentInterests = currentInterests.filter(i => i.toLowerCase() !== data.value?.toLowerCase());
                    fieldsUpdated.push('Interests (Removed)');
                } else if (data.value && !currentInterests.some(i => i.toLowerCase() === data.value.toLowerCase())) {
                    // Add new interest
                    currentInterests.push(data.value);
                    fieldsUpdated.push('Interests (Added)');
                }
                break;
            case 'WHERE_WE_MET':
                where_met = data.value;
                fieldsUpdated.push('Where We Met');
                break;
            case 'BUSINESS':
                if (data.company) {
                    company = data.company;
                    fieldsUpdated.push('Company');
                }
                if (data.job_title) {
                    job_title = data.job_title;
                    fieldsUpdated.push('Job Title');
                }
                break;
            case 'PRIORITIES':
            case 'WHAT_MATTERS':
                most_important_to_them = data.value;
                fieldsUpdated.push('Priorities');
                break;
            case 'CURRENT_CHALLENGES':
                current_challenges = data.value;
                fieldsUpdated.push('Challenges');
                break;
            case 'GOALS_ASPIRATIONS':
                goals_aspirations = data.value;
                fieldsUpdated.push('Goals');
                break;
            case 'SYNOPSIS':
            case 'STORY': // Handle legacy or fallback
                // relationship_summary is the LATEST high-quality summary
                relationship_summary = data.value;
                
                // Append this new narrative to existing deep_lore to preserve history
                const newStory = data.value;
                deep_lore = deep_lore ? `${deep_lore}\n\n${newStory}` : newStory;
                fieldsUpdated.push('Summary');
                break;
            case 'HEALTH_BOOST':
                if (typeof data.value === 'number') {
                    health_boost += data.value;
                    fieldsUpdated.push('Health Score');
                }
                break;
        }
    }

    if (fieldsUpdated.length === 0) {
        return { success: true, field: 'No changes', value: '', extracted: null };
    }

    // Build extractedData with only the fields that were actually updated
    // This prevents null/unchanged values from overwriting previously extracted values during merge
    const extractedData: any = {
        // Always include family and interests as they accumulate across memories
        family_members: currentFamily,
        interests: currentInterests,
    };

    // Only include fields that were actually extracted/updated in this pass
    const fieldMap: Record<string, any> = {
        'Where We Met': { where_met },
        'Company': { company },
        'Job Title': { job_title },
        'Priorities': { most_important_to_them },
        'Challenges': { current_challenges },
        'Goals': { goals_aspirations },
        'Summary': { deep_lore, relationship_summary },
        'Health Score': { health_boost },
    };

    for (const field of fieldsUpdated) {
        // Check if this field has a mapping
        if (fieldMap[field]) {
            Object.assign(extractedData, fieldMap[field]);
        }
    }

    // Always include 6-Block structured data if it has content
    if (sixBlockData.identity_context) extractedData.identity_context = sixBlockData.identity_context;
    if (sixBlockData.family_personal) extractedData.family_personal = sixBlockData.family_personal;
    if (sixBlockData.career_craft) extractedData.career_craft = sixBlockData.career_craft;
    if (sixBlockData.interests_hobbies) extractedData.interests_hobbies = sixBlockData.interests_hobbies;
    if (sixBlockData.values_personality) extractedData.values_personality = sixBlockData.values_personality;
    if (sixBlockData.history_touchpoints) extractedData.history_touchpoints = sixBlockData.history_touchpoints;
    if (sixBlockData.mutual_value_introductions) extractedData.mutual_value_introductions = sixBlockData.mutual_value_introductions;

    // Only save to database if validatedAutoSave is true
    if (validatedAutoSave) {
        // 4. Update Person
        const { error } = await (supabase as any)
            .from('persons')
            .update(extractedData)
            .eq('id', validatedContactId)
            .eq('user_id', user.id); // CRITICAL: Must filter by user_id for RLS

        if (error) {
            console.error('Error updating person:', error);
            throw error;
        }
    }

    return { 
        success: true, 
        field: fieldsUpdated.join(', '), 
        value: extractions.map((e: any) => e.data.value || e.data.name).join(', '),
        extracted: extractedData
    };

  } catch (error) {
    console.error('Error processing memory:', error);
    return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process memory' 
    };
  }
}
