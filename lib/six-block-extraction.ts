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
  mutual_value_introductions: string;
  // Open Loop Detection
  open_loop: boolean;
  loop_direction: 'outbound' | 'inbound' | 'mutual' | '';
  loop_confidence: 'explicit' | 'implied' | '';
  suggested_reminder: string;
}

const SIX_BLOCK_SYSTEM_PROMPT = `You are the relationship-intelligence engine for an app called "Remember Me."

Purpose:
This app helps users remember people AND act on relationship opportunities (introductions, assistance, collaboration) without being intrusive or transactional.

Input:
Users provide free-form spoken or written notes about a person. Information may be emotional, partial, or out of order.

Your task:
1. Parse and organize information into structured blocks.
2. Detect mutual value, introductions, or assistance opportunities.
3. Track open loops and determine when reminders should occur.
4. Keep opportunity-related information invisible unless relevant.

Do NOT invent information.
If something is not stated or clearly implied, leave it empty.
Preserve natural language.

--------------------------------------------------
INFORMATION BLOCKS
--------------------------------------------------

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

7. Mutual Value & Introductions
- Ways the user can help this person
- Ways this person can help the user
- Introductions discussed or promised
- Collaboration or assistance opportunities
- Any open loops related to mutual benefit

--------------------------------------------------
OPEN LOOP DETECTION
--------------------------------------------------

If the input includes language such as:
- "I can introduce…"
- "He said he would introduce me to…"
- "Let me connect you with…"
- "We should connect…"
- "Happy to help with…"

Then mark:
- open_loop = true
- loop_direction = outbound | inbound | mutual
- loop_confidence = explicit | implied

--------------------------------------------------
REMINDER LOGIC
--------------------------------------------------

Create a reminder ONLY if open_loop = true.

Default reminder timing:
- 7 days after the last recorded interaction
OR
- Next logged interaction, whichever comes first

Reminder tone must be gentle and optional.

Examples:
- "You mentioned introducing [Name] to someone — want to do that now?"
- "[Name] offered to introduce you to someone. You may want to follow up."
- "You and [Name] discussed helping each other — this may be a good time to reconnect."

Automatically close the reminder if:
- A new interaction references the introduction
- The user marks it as handled
- The relationship becomes dormant
- A newer opportunity replaces it

--------------------------------------------------
OUTPUT FORMAT
--------------------------------------------------

Return a structured JSON object:

{
  "identity_context": "",
  "family_personal": "",
  "career_craft": "",
  "interests_hobbies": "",
  "values_personality": "",
  "history_touchpoints": "",
  "mutual_value_introductions": "",
  "open_loop": false,
  "loop_direction": "",
  "loop_confidence": "",
  "suggested_reminder": ""
}

Additional Rules:
- Do not repeat information across blocks.
- Prioritize human memory value over completeness.
- Avoid corporate or CRM-style language.
- This app is about relationships, not transactions.`;

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
      'history_touchpoints',
      'mutual_value_introductions',
      'open_loop',
      'loop_direction',
      'loop_confidence',
      'suggested_reminder'
    ];

    for (const key of requiredKeys) {
      if (!(key in parsed)) {
        // Set defaults for missing fields
        if (key === 'open_loop') {
          parsed[key] = false;
        } else {
          parsed[key] = '';
        }
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
    history_touchpoints: '',
    mutual_value_introductions: '',
    open_loop: false,
    loop_direction: '',
    loop_confidence: '',
    suggested_reminder: ''
  };

  const keys: (keyof SixBlockExtraction)[] = [
    'identity_context',
    'family_personal',
    'career_craft',
    'interests_hobbies',
    'values_personality',
    'history_touchpoints',
    'mutual_value_introductions'
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
