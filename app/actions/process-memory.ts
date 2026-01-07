'use server';

import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import type { Person } from '@/types/database.types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function processMemory(contactId: string, text: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // 1. Analyze text with OpenAI
    const prompt = `
      Analyze the following text about a person and extract relevant information into supported categories.
      
      Text: "${text}"
      
      Support Categories:
      1. FAMILY: Use this when family members or close friends are mentioned. 
         Data Format: { name: string, relationship: string, birthday?: string, hobbies?: string, interests?: string }.
      
      2. INTEREST: Use this for hobbies, sports, likes, or topics of interest.
         Data Format: { value: string }.
         
      3. WHERE_WE_MET: Use this for origin stories or meeting locations.
         Data Format: { value: string }.
         
      4. SYNOPSIS: A comprehensive, narrative paragraph that summarizes EVERYTHING meaningful from the text (history, friends, interests, where we met) into a cohesive story about the person.
         Data Format: { value: string }.
         Example: "You met Emmy in Japan when she was 3. She is passionate about tennis and plays the violin. She has a close friend named Sarah."
      
      Return JSON: { "extractions": [ { "category": "...", "data": ... }, ... ] }
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    const extractions = result.extractions || [];

    if (extractions.length === 0) {
        // Fallback to basic story if nothing extracted
        extractions.push({ category: "SYNOPSIS", data: { value: text } });
    }

    const fieldsUpdated: string[] = [];

    // 2. Fetch current person data
    const { data: personData, error: fetchError } = await supabase
        .from('persons')
        .select('*')
        .eq('id', contactId)
        .eq('user_id', user.id)
        .single();
        
    if (fetchError || !personData) throw new Error("Person not found");
    
    // Explicit cast to fix TypeScript 'never' inference
    const person = personData as unknown as Person;

    let currentFamily: any[] = Array.isArray(person.family_members) ? person.family_members : [];
    let currentInterests: string[] = Array.isArray(person.interests) ? person.interests : [];
    let where_met: string | null = person.where_met;
    let deep_lore: string | null = person.deep_lore;

    // 3. Process extractions
    for (const item of extractions) {
        const { category, data } = item;
        
        switch (category) {
            case 'FAMILY':
                // Check if member already exists (simple name check)
                const exists = currentFamily.some((m: any) => m.name?.toLowerCase() === data.name?.toLowerCase());
                if (!exists) {
                    currentFamily.push(data);
                    fieldsUpdated.push('Family');
                }
                break;
            case 'INTEREST':
                if (data.value && !currentInterests.includes(data.value)) {
                    currentInterests.push(data.value);
                    fieldsUpdated.push('Interests');
                }
                break;
            case 'WHERE_WE_MET':
                where_met = data.value;
                fieldsUpdated.push('Where We Met');
                break;
            case 'SYNOPSIS': 
            case 'STORY': // Handle legacy or fallback
                // Append this new narrative to existing deep_lore to preserve history, 
                // but if deep_lore is empty, just set it.
                // We add a double newline for paragraph separation.
                const newStory = data.value;
                deep_lore = deep_lore ? `${deep_lore}\n\n${newStory}` : newStory;
                fieldsUpdated.push('Story');
                break;
        }
    }

    if (fieldsUpdated.length === 0) {
        return { success: true, field: 'No changes', value: '' };
    }

    // 4. Update Person
    const { error } = await (supabase as any)
        .from('persons')
        .update({
            family_members: currentFamily,
            interests: currentInterests,
            where_met: where_met,
            deep_lore: deep_lore,
        })
        .eq('id', contactId)
        .eq('user_id', user.id); // CRITICAL: Must filter by user_id for RLS

    if (error) {
        console.error('Error updating person:', error);
        throw error;
    }

    return { 
        success: true, 
        field: fieldsUpdated.join(', '), 
        value: extractions.map((e: any) => e.data.value || e.data.name).join(', ') 
    };

  } catch (error) {
    console.error('Error processing memory:', error);
    return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process memory' 
    };
  }
}
