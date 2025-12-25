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
      Analyze the following text about a person and categorize it.
      
      Text: "${text}"
      
      Rules:
      1. If it describes a location where people met or an origin story, category is "WHERE_WE_MET". Value is the location/origin.
      2. If it describes a hobby, interest, sport, or like, category is "INTEREST". Value is the specific interest (noun).
      3. Otherwise, category is "STORY". Value is the full text.
      
      Return JSON: { "category": "...", "value": "..." }
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    const { category, value } = result;

    if (!category || !value) {
      return { success: false, error: 'Failed to analyze text' };
    }

    // 2. Routing Logic
    let fieldUpdated = '';

    // Note: TypeScript type inference issue with Supabase client - using @ts-expect-error pragmas
    // The Database types are correctly defined but the client chain returns 'never' incorrectly
    if (category === 'WHERE_WE_MET') {
      const { error } = await supabase
        .from('persons')
        // @ts-expect-error - Supabase type inference issue with chained queries
        .update({ where_met: value })
        .eq('id', contactId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      fieldUpdated = 'Where We Met';
    } 
    else if (category === 'INTEREST') {
      // Fetch current interests first to append
      const { data: person } = await supabase
        .from('persons')
        .select('interests')
        .eq('id', contactId)
        .single() as { data: Pick<Person, 'interests'> | null; error: unknown };
        
      const currentInterests = person?.interests || [];
      // Avoid duplicates
      const newInterests = currentInterests.includes(value) 
        ? currentInterests 
        : [...currentInterests, value];

      const { error } = await supabase
        .from('persons')
        // @ts-expect-error - Supabase type inference issue with chained queries
        .update({ interests: newInterests })
        .eq('id', contactId)
        .eq('user_id', user.id);

      if (error) throw error;
      fieldUpdated = 'Interests';
    } 
    else {
      // Default to "Points of Interest" (what_found_interesting)
      // We should probably append to it if it exists, or just overwrite?
      // "Add it as a new note" implies appending.
      
      const { data: person } = await supabase
        .from('persons')
        .select('what_found_interesting')
        .eq('id', contactId)
        .single() as { data: Pick<Person, 'what_found_interesting'> | null; error: unknown };

      const currentNotes = person?.what_found_interesting || '';
      const newNotes = currentNotes ? `${currentNotes}\n\n${value}` : value;

      const { error } = await supabase
        .from('persons')
        // @ts-expect-error - Supabase type inference issue with chained queries
        .update({ what_found_interesting: newNotes })
        .eq('id', contactId)
        .eq('user_id', user.id);

      if (error) throw error;
      fieldUpdated = 'Points of Interest';
    }

    return { success: true, field: fieldUpdated, value };

  } catch (error) {
    console.error('Error processing memory:', error);
    return { success: false, error: 'Failed to process memory' };
  }
}
