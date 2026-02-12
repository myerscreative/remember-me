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

export interface PredictiveAuditContext {
  contactName: string;
  userDraft: string;
  last3Memories: string[];
  healthStatus: string;
  successfulHooks?: string[];
}

export interface PredictiveAuditResult {
  resonance_score: number;
  primary_friction_point: string;
  suggested_tweak: string;
}

export class PreSendAuditor {
  static async performAudit(context: PredictiveAuditContext): Promise<PredictiveAuditResult> {
    try {
      const response = await getOpenAI().chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `System Role: Senior Social Architect & Predictive Linguist.

Objective: Perform a pre-flight "Friction Audit" on the drafted message for a contact.

Evaluation Criteria (The PSPF Engine):
1. Context Density (C): Does the message reference specific shared memories?
2. Recipient Burden (B): Does the CTA require high cognitive effort?
3. Relationship Phase (P): Is the tone appropriate for their current state (Nurtured vs. Neglected)?
4. Learning Ledger Boost: If the message high similarity to a "Successful" hook (provided in context), boost the Resonance Score significantly.

Resonance Score Formula: R = (C * P) / B (Internalized logic)

JSON Output Format:
{
  "resonance_score": (0-100),
  "primary_friction_point": "e.g., High burden CTA",
  "suggested_tweak": "One sentence to improve the score immediately"
}`,
          },
          {
            role: 'user',
            content: `The Contact: ${context.contactName}
Draft Message: "${context.userDraft}"
Shared Memories: ${context.last3Memories.join(' | ')}
Relationship Health: ${context.healthStatus}
${context.successfulHooks?.length ? `Successful Historical Hooks (Boost if similar): ${context.successfulHooks.join(' | ')}` : ''}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5,
      });

      const content = response.choices[0].message.content || '{}';
      return JSON.parse(content) as PredictiveAuditResult;
    } catch (error) {
      console.error('Error performing predictive audit:', error);
      throw error;
    }
  }
}
