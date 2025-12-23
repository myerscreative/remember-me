import OpenAI from 'openai';
import { buildConversationStarterPrompt, ContactContext } from './prompts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class ConversationStarterGenerator {
  /**
   * Generate personalized conversation starters using GPT-4
   */
  static async generateStarters(context: ContactContext): Promise<string[]> {
    try {
      const prompt = buildConversationStarterPrompt(context);

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that generates natural, warm conversation starters for professional and personal relationships. 
            
Your questions should:
- Reference specific details the person has shared
- Show genuine interest in their life and goals
- Be open-ended and invite detailed responses
- Feel personal and thoughtful, not generic
- Build rapport and deepen the relationship

Always prioritize "What Matters to Them" when crafting questions - this shows you really listen and care.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 400,
      });

      const content = response.choices[0].message.content || '';
      
      // Parse the response into individual starters
      const starters = this.parseStarters(content);

      // Validate we got 4 starters
      if (starters.length < 4) {
        console.warn('AI generated fewer than 4 starters, using fallbacks');
        return [...starters, ...this.getFallbackStarters(context)].slice(0, 4);
      }

      return starters.slice(0, 4);
    } catch (error: any) {
      console.error('Error generating conversation starters:', error);
      
      // Return fallback starters if AI fails
      return this.getFallbackStarters(context);
    }
  }

  /**
   * Parse AI response into individual starters
   */
  private static parseStarters(content: string): string[] {
    // Split by newlines and filter out empty lines
    const lines = content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // Remove numbering if present (1., 1), etc.)
    const starters = lines
      .map((line) => {
        // Remove numbering like "1.", "1)", "1 -", etc.
        const cleaned = line.replace(/^\d+[\.):\-]\s*/, '');
        // Remove quotes if present
        return cleaned.replace(/^["']|["']$/g, '');
      })
      .filter((line) => {
        // Filter out lines that don't look like questions or statements
        return line.length > 10 && (line.includes('?') || line.length > 20);
      });

    return starters;
  }

  /**
   * Fallback starters if AI fails or returns insufficient results
   */
  private static getFallbackStarters(context: ContactContext): string[] {
    const starters: string[] = [];

    // Use What Matters to Them
    if (context.whatMattersToThem && context.whatMattersToThem.length > 0) {
      const firstMatter = context.whatMattersToThem[0];
      starters.push(`How's ${firstMatter.toLowerCase()}?`);
    }

    // Use interests
    if (context.interests && context.interests.length > 0) {
      const firstInterest = context.interests[0];
      starters.push(`Are you still into ${firstInterest}?`);
    }

    // Use last contact
    if (context.lastContact?.notes) {
      starters.push(`Last time we talked about ${context.lastContact.notes.toLowerCase()}. How's that going?`);
    }

    // Generic but personalized
    starters.push(`How have things been since we last talked?`);
    starters.push(`What have you been working on lately?`);

    return starters;
  }

  /**
   * Generate starters for a batch of contacts (for efficiency)
   */
  static async generateBatch(contexts: ContactContext[]): Promise<Map<string, string[]>> {
    const results = new Map<string, string[]>();

    // Generate starters for each contact
    // Note: You might want to add rate limiting here
    for (const context of contexts) {
      try {
        const starters = await this.generateStarters(context);
        results.set(context.name, starters);
      } catch (error) {
        console.error(`Failed to generate starters for ${context.name}:`, error);
        results.set(context.name, this.getFallbackStarters(context));
      }
    }

    return results;
  }
}
