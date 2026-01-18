/**
 * 6-Block AI Extraction System
 * 
 * This module handles AI extraction of brain dumps into the 6 Core Information Blocks:
 * 1. Identity & Context
 * 2. Family & Personal Life
 * 3. Career & Craft
 * 4. Interests & Hobbies
 * 5. Values, Motivations & Personality
 * 6. History & Touchpoints
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface SixBlockExtraction {
  identity_context: string;
  family_personal: string;
  career_craft: string;
  interests_hobbies: string;
  values_personality: string;
  history_touchpoints: string;
}

const SIX_BLOCK_SYSTEM_PROMPT = `You are the information-structuring engine for an app called "Remember Me."

Purpose:
This app helps users remember people deeply and accurately — not just contact info, but context, meaning, and relationship relevance.

Input:
Users will provide a free-form spoken or written "brain dump" about a person. The input may be unstructured, emotional, incomplete, or out of order.

Your task:
Parse the input and organize all information into the following fixed information blocks.
Do NOT invent information.
If data is missing, leave the field empty.
Use natural, concise sentences (not bullet fragments).

Information Blocks:

1. Identity & Context
- Who this person is
- Where/how the user met them
- Relationship type
- Why the user wants to remember or stay in touch

2. Family & Personal Life
- Spouse/partner (if mentioned)
- Children (names/ages if mentioned)
- Important family dynamics or life stage

3. Career & Craft
- Current role or business
- Industry
- Career background or trajectory
- Goals, challenges, or frustrations mentioned

4. Interests & Hobbies
- Hobbies
- Passions
- Activities they enjoy
- Topics they light up about

5. Values, Motivations & Personality
- What seems important to them
- Decision-making style
- Communication style
- Motivations or sensitivities (only if implied or stated)

6. History & Touchpoints
- Past interactions with the user
- Important conversations
- Commitments, promises, or follow-ups
- Shared experiences

Output Format:
Return a structured JSON object using the following schema:

{
  "identity_context": "",
  "family_personal": "",
  "career_craft": "",
  "interests_hobbies": "",
  "values_personality": "",
  "history_touchpoints": ""
}

Additional Rules:
- Preserve emotional tone where relevant.
- Do not repeat the same information across blocks.
- Keep each block concise but meaningful.
- Prioritize human memory value over data completeness.`;

export async function extractSixBlocks(brainDump: string): Promise<SixBlockExtraction> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SIX_BLOCK_SYSTEM_PROMPT },
        { role: 'user', content: brainDump }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content in AI response');
    }

    const parsed = JSON.parse(content) as SixBlockExtraction;
    
    // Validate structure
    const requiredKeys: (keyof SixBlockExtraction)[] = [
      'identity_context',
      'family_personal',
      'career_craft',
      'interests_hobbies',
      'values_personality',
      'history_touchpoints'
    ];

    for (const key of requiredKeys) {
      if (!(key in parsed)) {
        parsed[key] = '';
      }
    }

    return parsed;
  } catch (error) {
    console.error('Error extracting 6 blocks:', error);
    throw error;
  }
}

/**
 * Merge new extraction with existing data
 * Preserves existing information and adds new details
 */
export function mergeSixBlocks(
  existing: Partial<SixBlockExtraction>,
  newData: SixBlockExtraction
): SixBlockExtraction {
  const merged: SixBlockExtraction = {
    identity_context: '',
    family_personal: '',
    career_craft: '',
    interests_hobbies: '',
    values_personality: '',
    history_touchpoints: ''
  };

  const keys: (keyof SixBlockExtraction)[] = [
    'identity_context',
    'family_personal',
    'career_craft',
    'interests_hobbies',
    'values_personality',
    'history_touchpoints'
  ];

  for (const key of keys) {
    const existingText = existing[key] || '';
    const newText = newData[key] || '';

    if (!existingText) {
      merged[key] = newText;
    } else if (!newText) {
      merged[key] = existingText;
    } else {
      // Both exist - append new info
      merged[key] = `${existingText}\n\n${newText}`;
    }
  }

  return merged;
}
