import OpenAI from 'openai';

let openaiInstance: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiInstance;
}

export interface PivotAuditContext {
  contactName: string;
  originalHook: string;
  sharedMemories: string[];
  relationshipHealth: string;
}

export interface PivotAuditResult {
  diagnosis: string;
  optionA: {
    title: string;
    content: string;
  };
  optionB: {
    title: string;
    content: string;
  };
}

export class SocialFrictionAuditor {
  static async refineAsset(context: PivotAuditContext): Promise<PivotAuditResult> {
    try {
      const response = await getOpenAI().chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `System Role: Senior Relationship Strategist & Social Architect.

Objective: Audit a failed reach-out attempt and provide a "Human-First" pivot that reduces social friction and increases the likelihood of a response.

Instructions:
1. Identify the "I" Problem, Generic Burden, or Outdated Context.
2. Generate two distinct alternatives: 
   - Option A (The Pivot): A short, punchy 'Value-Drop' (interesting link/resource tied to their interests).
   - Option B (The Long-Game): A 'Low-Stakes Recall' (brief, no-reply-needed comment on shared memory).

Output Format:
Diagnosis: [One sentence]
Option A Title: [Short title]
Option A Content: [Message]
Option B Title: [Short title]
Option B Content: [Message]`,
          },
          {
            role: 'user',
            content: `The Contact: ${context.contactName}
Last Sent/Drafted Hook: "${context.originalHook}"
Shared Memory Context: ${context.sharedMemories.join(' | ')}
Relationship Health: ${context.relationshipHealth}`,
          },
        ],
        temperature: 0.7,
      });

      const content = response.choices[0].message.content || '';
      return this.parseResponse(content);
    } catch (error) {
      console.error('Error auditing social friction:', error);
      throw error;
    }
  }

  private static parseResponse(content: string): PivotAuditResult {
    const lines = content.split('\n');
    const result: PivotAuditResult = {
      diagnosis: '',
      optionA: { title: '', content: '' },
      optionB: { title: '', content: '' },
    };

    lines.forEach(line => {
      if (line.startsWith('Diagnosis:')) result.diagnosis = line.replace('Diagnosis:', '').trim();
      if (line.startsWith('Option A Title:')) result.optionA.title = line.replace('Option A Title:', '').trim();
      if (line.startsWith('Option A Content:')) result.optionA.content = line.replace('Option A Content:', '').trim();
      if (line.startsWith('Option B Title:')) result.optionB.title = line.replace('Option B Title:', '').trim();
      if (line.startsWith('Option B Content:')) result.optionB.content = line.replace('Option B Content:', '').trim();
    });

    return result;
  }
}
