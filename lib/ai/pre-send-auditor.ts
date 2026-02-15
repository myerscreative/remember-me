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
            content: `System Role: Strategic Connection Guide.

Objective: Analyze a drafted message to ensure it is impactful, clear, and builds relationship equity.

Evaluation Criteria:
1. Context Clarity: Does it reference shared history or recent interactions?
2. Connection Utility: Is the intent clear and easy to engage with?
3. Relationship Stage: Does the tone match the current health of the connection?
4. Lore Equity: Does this add valuable data to the relationship ledger?

Output Format (JSON):
{
  "resonance_score": 0-100,
  "primary_friction_point": "Concise area for improvement (e.g., Needs more context)",
  "suggested_tweak": "A punchy, specific one-sentence improvement"
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
