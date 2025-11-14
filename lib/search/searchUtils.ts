// Fast Search Utilities using Phase 1 Full-Text Search

import { createClient } from "@/lib/supabase/client";
import type { Person } from "@/types/database.types";

export interface SearchResult extends Person {
  match_field?: string;
  match_type?: string;
  relevance?: number;
}

export interface SearchOptions {
  limit?: number;
  includeArchived?: boolean;
  hasContext?: boolean | null;
  imported?: boolean | null;
  contactImportance?: 'high' | 'medium' | 'low' | null;
}

/**
 * Primary search function using full-text search (GIN index)
 * This is the fastest method for most queries
 */
export async function searchPersonsFullText(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  try {
    // Use the full-text search function we created in Phase 1
    const { data, error } = await supabase.rpc('search_persons_fulltext', {
      p_user_id: user.id,
      search_query: query.trim(),
    });

    if (error) {
      console.error('Full-text search error:', error);
      // Fall back to basic search
      return await searchPersonsBasic(query, options);
    }

    // Apply additional filters
    let results = data || [];

    if (!options.includeArchived) {
      results = results.filter((r: any) => !r.archive_status);
    }

    if (options.hasContext !== null && options.hasContext !== undefined) {
      results = results.filter((r: any) => r.has_context === options.hasContext);
    }

    if (options.imported !== null && options.imported !== undefined) {
      results = results.filter((r: any) => r.imported === options.imported);
    }

    if (options.contactImportance) {
      results = results.filter((r: any) => r.contact_importance === options.contactImportance);
    }

    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  } catch (error) {
    console.error('Search error:', error);
    return await searchPersonsBasic(query, options);
  }
}

/**
 * Basic search fallback using ILIKE (slower but more compatible)
 */
export async function searchPersonsBasic(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const searchTerm = `%${query.trim()}%`;

  let queryBuilder = supabase
    .from('persons')
    .select('*')
    .eq('user_id', user.id);

  // Search across multiple fields
  queryBuilder = queryBuilder.or(
    `name.ilike.${searchTerm},` +
    `email.ilike.${searchTerm},` +
    `phone.ilike.${searchTerm},` +
    `where_met.ilike.${searchTerm},` +
    `who_introduced.ilike.${searchTerm},` +
    `relationship_summary.ilike.${searchTerm},` +
    `notes.ilike.${searchTerm}`
  );

  // Apply filters
  if (!options.includeArchived) {
    queryBuilder = queryBuilder.or('archive_status.is.null,archive_status.eq.false');
  }

  if (options.hasContext !== null && options.hasContext !== undefined) {
    queryBuilder = queryBuilder.eq('has_context', options.hasContext);
  }

  if (options.imported !== null && options.imported !== undefined) {
    queryBuilder = queryBuilder.eq('imported', options.imported);
  }

  if (options.contactImportance) {
    queryBuilder = queryBuilder.eq('contact_importance', options.contactImportance);
  }

  if (options.limit) {
    queryBuilder = queryBuilder.limit(options.limit);
  }

  queryBuilder = queryBuilder.order('name', { ascending: true });

  const { data, error } = await queryBuilder;

  if (error) {
    console.error('Basic search error:', error);
    return [];
  }

  return data || [];
}

/**
 * Search for contacts needing attention (uses Phase 1 function)
 */
export async function searchContactsNeedingAttention(
  daysThreshold: number = 30
): Promise<any[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  try {
    const { data, error } = await supabase.rpc('get_contacts_needing_attention', {
      p_user_id: user.id,
      days_threshold: daysThreshold,
    });

    if (error) {
      console.error('Contacts needing attention error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

/**
 * Get recent contacts (last interaction)
 */
export async function getRecentContacts(limit: number = 10): Promise<Person[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('persons')
    .select('*')
    .eq('user_id', user.id)
    .or('archive_status.is.null,archive_status.eq.false')
    .order('last_interaction_date', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    console.error('Recent contacts error:', error);
    return [];
  }

  return data || [];
}

/**
 * Get contacts by importance
 */
export async function getContactsByImportance(
  importance: 'high' | 'medium' | 'low',
  limit?: number
): Promise<Person[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  let queryBuilder = supabase
    .from('persons')
    .select('*')
    .eq('user_id', user.id)
    .eq('contact_importance', importance)
    .or('archive_status.is.null,archive_status.eq.false')
    .order('last_interaction_date', { ascending: false, nullsFirst: false });

  if (limit) {
    queryBuilder = queryBuilder.limit(limit);
  }

  const { data, error } = await queryBuilder;

  if (error) {
    console.error('Contacts by importance error:', error);
    return [];
  }

  return data || [];
}

/**
 * Get imported contacts without context
 */
export async function getImportedWithoutContext(limit?: number): Promise<Person[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  let queryBuilder = supabase
    .from('persons')
    .select('*')
    .eq('user_id', user.id)
    .eq('imported', true)
    .eq('has_context', false)
    .or('archive_status.is.null,archive_status.eq.false')
    .order('name', { ascending: true });

  if (limit) {
    queryBuilder = queryBuilder.limit(limit);
  }

  const { data, error } = await queryBuilder;

  if (error) {
    console.error('Imported without context error:', error);
    return [];
  }

  return data || [];
}

/**
 * Debounce utility for search input
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Highlight matching text in search results
 */
export function highlightMatch(text: string, query: string): string {
  if (!text || !query) return text || '';

  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract snippet around match
 */
export function extractSnippet(
  text: string,
  query: string,
  contextLength: number = 50
): string {
  if (!text || !query) return text || '';

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) {
    return text.substring(0, contextLength * 2) + (text.length > contextLength * 2 ? '...' : '');
  }

  const start = Math.max(0, index - contextLength);
  const end = Math.min(text.length, index + query.length + contextLength);

  let snippet = text.substring(start, end);

  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';

  return snippet;
}
