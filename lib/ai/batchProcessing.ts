// Batch AI Processing Utilities for ReMember Me
// Used to process multiple contacts with AI (e.g., generate summaries for imported contacts)

import { createClient } from "@/lib/supabase/client";
import type { Person } from "@/types/database.types";

export interface BatchProcessResult {
  success: boolean;
  personId: string;
  personName: string;
  summary?: string;
  error?: string;
}

export interface BatchProcessProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  currentContact?: string;
  isComplete: boolean;
}

/**
 * Generate summaries for multiple contacts in batches
 * Includes rate limiting and error handling
 */
export async function batchGenerateSummaries(
  persons: Person[],
  onProgress?: (progress: BatchProcessProgress) => void,
  delayMs: number = 1000 // Rate limiting: 1 second between requests
): Promise<BatchProcessResult[]> {
  const results: BatchProcessResult[] = [];
  const progress: BatchProcessProgress = {
    total: persons.length,
    processed: 0,
    successful: 0,
    failed: 0,
    isComplete: false,
  };

  for (const person of persons) {
    // Update current contact
    progress.currentContact = person.name || `${person.first_name} ${person.last_name || ''}`.trim();

    if (onProgress) {
      onProgress({ ...progress });
    }

    try {
      // Generate summary via API
      const summary = await generateSummaryForPerson(person);

      if (summary) {
        // Update person in database
        const supabase = await createClient();
        const { error: updateError } = await (supabase as any)
          .from('persons')
          .update({
            relationship_summary: summary,
            has_context: true, // Mark as having context now
          })
          .eq('id', person.id);

        if (updateError) {
          throw new Error(`Failed to update database: ${updateError.message}`);
        }

        results.push({
          success: true,
          personId: person.id,
          personName: progress.currentContact,
          summary,
        });

        progress.successful++;
      } else {
        throw new Error("No summary generated");
      }
    } catch (error: any) {
      console.error(`Error processing ${progress.currentContact}:`, error);

      results.push({
        success: false,
        personId: person.id,
        personName: progress.currentContact,
        error: error?.message || "Unknown error",
      });

      progress.failed++;
    }

    progress.processed++;

    // Rate limiting: wait between requests to avoid API limits
    if (progress.processed < persons.length) {
      await sleep(delayMs);
    }
  }

  progress.isComplete = true;
  progress.currentContact = undefined;

  if (onProgress) {
    onProgress({ ...progress });
  }

  return results;
}

/**
 * Generate summary for a single person
 */
export async function generateSummaryForPerson(person: Person): Promise<string | null> {
  try {
    const response = await fetch('/api/generate-summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: person.name,
        firstName: person.first_name,
        lastName: person.last_name,
        email: person.email,
        phone: person.phone,
        whereMet: person.where_met,
        whoIntroduced: person.who_introduced,
        notes: person.notes,
        birthday: person.birthday,
        existingSummary: person.relationship_summary,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate summary');
    }

    const data = await response.json();
    return data.summary;
  } catch (error: any) {
    console.error('Error calling generate-summary API:', error);
    throw error;
  }
}

/**
 * Get contacts that need AI processing
 * (imported contacts without context, or contacts missing summaries)
 */
export async function getContactsNeedingAI(
  options: {
    importedOnly?: boolean;
    withoutSummaryOnly?: boolean;
    limit?: number;
  } = {}
): Promise<Person[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  let query = (supabase as any)
    .from('persons')
    .select('*')
    .eq('user_id', user.id)
    .or('archive_status.is.null,archive_status.eq.false');

  if (options.importedOnly) {
    query = query.eq('imported', true).eq('has_context', false);
  }

  if (options.withoutSummaryOnly) {
    query = query.or('relationship_summary.is.null,relationship_summary.eq.');
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  query = query.order('name', { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching contacts needing AI:', error);
    return [];
  }

  return data || [];
}

/**
 * Estimate cost for batch processing
 * Based on OpenAI pricing: ~$0.0001 per request for gpt-4o-mini
 */
export function estimateBatchCost(contactCount: number): {
  estimatedCost: number;
  estimatedTime: number; // in seconds
  costPerContact: number;
} {
  const costPerContact = 0.0001; // Approximate cost per summary generation
  const timePerContact = 2; // Approximate time in seconds (1s API + 1s delay)

  return {
    estimatedCost: contactCount * costPerContact,
    estimatedTime: contactCount * timePerContact,
    costPerContact,
  };
}

/**
 * Sleep utility for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Split contacts into smaller batches for processing
 */
export function createBatches<T>(items: T[], batchSize: number): T[][] {
  const batches: T[][] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  return batches;
}

/**
 * Validate if person has enough context to generate a summary
 */
export function hasEnoughContextForSummary(person: Person): boolean {
  // Need at least one of: where_met, who_introduced, notes, or email domain
  return !!(
    person.where_met ||
    person.who_introduced ||
    person.notes ||
    person.email
  );
}

/**
 * Get summary of what will be processed
 */
export async function getBatchProcessingSummary(): Promise<{
  total: number;
  withEnoughContext: number;
  needMoreContext: number;
  estimatedCost: number;
  estimatedTime: number;
}> {
  const contacts = await getContactsNeedingAI({ importedOnly: true });

  const withEnoughContext = contacts.filter(hasEnoughContextForSummary);
  const needMoreContext = contacts.filter(c => !hasEnoughContextForSummary(c));

  const estimate = estimateBatchCost(withEnoughContext.length);

  return {
    total: contacts.length,
    withEnoughContext: withEnoughContext.length,
    needMoreContext: needMoreContext.length,
    estimatedCost: estimate.estimatedCost,
    estimatedTime: estimate.estimatedTime,
  };
}
