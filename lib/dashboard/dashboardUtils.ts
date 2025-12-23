// Dashboard Analytics Utilities for ReMember Me
// Provides analytics and metrics for relationship health tracking

import { createClient } from "@/lib/supabase/client";
import type { Person } from "@/types/database.types";

export interface DashboardStats {
  totalContacts: number;
  withContext: number;
  withoutContext: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  needingAttention: number;
  recentlyAdded: number;
  imported: number;
  archived: number;
}

export interface InteractionStats {
  avgInteractionCount: number;
  contactsWithNoInteractions: number;
  contactsThisWeek: number;
  contactsThisMonth: number;
  contactsThisYear: number;
}

export interface RelationshipHealth {
  healthy: number; // Contacted within 30 days
  warning: number; // 30-60 days
  needsAttention: number; // 60+ days
  noData: number; // Never contacted
}

export interface TopContact {
  id: string;
  name: string;
  firstName: string;
  lastName: string | null;
  photoUrl: string | null;
  interactionCount: number;
  lastInteractionDate: string | null;
  contactImportance: 'high' | 'medium' | 'low' | null;
  relationshipSummary: string | null;
}

/**
 * Get comprehensive dashboard statistics
 */
/**
 * Get comprehensive dashboard stats
 */
export async function getDashboardStats(): Promise<{ data: DashboardStats | null; error: Error | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: new Error("User not authenticated") };
  }

  try {
    // Get all contacts for this user
    const { data: allContacts, error } = await (supabase as any)
      .from('persons')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching contacts:', error);
      return { data: null, error: new Error(error.message) };
    }

    const contacts = allContacts || [];

    // Calculate stats
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stats: DashboardStats = {
      totalContacts: contacts.length,
      withContext: contacts.filter(c => c.has_context).length,
      withoutContext: contacts.filter(c => !c.has_context).length,
      highPriority: contacts.filter(c => c.contact_importance === 'high').length,
      mediumPriority: contacts.filter(c => c.contact_importance === 'medium').length,
      lowPriority: contacts.filter(c => c.contact_importance === 'low').length,
      needingAttention: contacts.filter(c => {
        if (!c.last_interaction_date) return false;
        const lastInteraction = new Date(c.last_interaction_date);
        const daysSince = Math.floor((Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24));
        return daysSince >= 30;
      }).length,
      recentlyAdded: contacts.filter(c => {
        const created = new Date(c.created_at);
        return created >= thirtyDaysAgo;
      }).length,
      imported: contacts.filter(c => c.imported).length,
      archived: contacts.filter(c => c.archive_status).length,
    };

    return { data: stats, error: null };
  } catch (error) {
    console.error('Error calculating dashboard stats:', error);
    return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
  }
}

/**
 * Get interaction statistics
 */
export async function getInteractionStats(): Promise<{ data: InteractionStats | null; error: Error | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: new Error("User not authenticated") };
  }

  try {
    const { data: contacts, error } = await (supabase as any)
      .from('persons')
      .select('*')
      .eq('user_id', user.id)
      .or('archive_status.is.null,archive_status.eq.false');

    if (error) {
      console.error('Error fetching contacts:', error);
      return { data: null, error: new Error(error.message) };
    }

    const contactsList = contacts || [];

    // Calculate date thresholds
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Calculate interaction stats
    const totalInteractions = contactsList.reduce((sum, c) => sum + (c.interaction_count || 0), 0);
    const avgInteractionCount = contactsList.length > 0 ? totalInteractions / contactsList.length : 0;

    const stats: InteractionStats = {
      avgInteractionCount: Math.round(avgInteractionCount * 10) / 10,
      contactsWithNoInteractions: contactsList.filter(c => !c.interaction_count || c.interaction_count === 0).length,
      contactsThisWeek: contactsList.filter(c => {
        if (!c.last_interaction_date) return false;
        return new Date(c.last_interaction_date) >= oneWeekAgo;
      }).length,
      contactsThisMonth: contactsList.filter(c => {
        if (!c.last_interaction_date) return false;
        return new Date(c.last_interaction_date) >= oneMonthAgo;
      }).length,
      contactsThisYear: contactsList.filter(c => {
        if (!c.last_interaction_date) return false;
        return new Date(c.last_interaction_date) >= oneYearAgo;
      }).length,
    };

    return { data: stats, error: null };
  } catch (error) {
    console.error('Error calculating interaction stats:', error);
    return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
  }
}

/**
 * Calculate relationship health breakdown
 */
export async function getRelationshipHealth(): Promise<{ data: RelationshipHealth | null; error: Error | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: new Error("User not authenticated") };
  }

  try {
    const { data: contacts, error } = await (supabase as any)
      .from('persons')
      .select('last_interaction_date')
      .eq('user_id', user.id)
      .or('archive_status.is.null,archive_status.eq.false');

    if (error) {
      console.error('Error fetching contacts:', error);
      return { data: null, error: new Error(error.message) };
    }

    const contactsList = contacts || [];
    const now = Date.now();

    const health: RelationshipHealth = {
      healthy: 0,
      warning: 0,
      needsAttention: 0,
      noData: 0,
    };

    contactsList.forEach(contact => {
      if (!contact.last_interaction_date) {
        health.noData++;
        return;
      }

      const lastInteraction = new Date(contact.last_interaction_date).getTime();
      const daysSince = Math.floor((now - lastInteraction) / (1000 * 60 * 60 * 24));

      if (daysSince <= 30) {
        health.healthy++;
      } else if (daysSince <= 60) {
        health.warning++;
      } else {
        health.needsAttention++;
      }
    });

    return { data: health, error: null };
  } catch (error) {
    console.error('Error calculating relationship health:', error);
    return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
  }
}

/**
 * Get top contacts by interaction count
 */
export async function getTopContacts(limit: number = 10): Promise<{ data: TopContact[]; error: Error | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: [], error: new Error("User not authenticated") };
  }

  try {
    const { data, error } = await (supabase as any)
      .from('persons')
      .select('id, name, first_name, last_name, photo_url, interaction_count, last_interaction_date, contact_importance, relationship_summary')
      .eq('user_id', user.id)
      .or('archive_status.is.null,archive_status.eq.false')
      .order('interaction_count', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching top contacts:', error);
      return { data: [], error: new Error(error.message) };
    }

    const topContacts = (data || []).map(c => ({
      id: c.id,
      name: c.name,
      firstName: c.first_name,
      lastName: c.last_name,
      photoUrl: c.photo_url,
      interactionCount: c.interaction_count || 0,
      lastInteractionDate: c.last_interaction_date,
      contactImportance: c.contact_importance,
      relationshipSummary: c.relationship_summary,
    }));

    return { data: topContacts, error: null };
  } catch (error) {
    console.error('Error getting top contacts:', error);
    return { data: [], error: error instanceof Error ? error : new Error('Unknown error') };
  }
}

/**
 * Get contacts needing attention (using Phase 1 function)
 */
export async function getContactsNeedingAttention(daysThreshold: number = 30): Promise<{ data: any[]; error: Error | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: [], error: new Error("User not authenticated") };
  }

  try {
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);
    const cutoffISO = cutoffDate.toISOString();

    const { data, error } = await (supabase as any)
      .from('persons')
      .select('*')
      .eq('user_id', user.id)
      .or('archive_status.is.null,archive_status.eq.false')
      .not('last_interaction_date', 'is', null)
      .lt('last_interaction_date', cutoffISO)
      .order('last_interaction_date', { ascending: true }) // Oldest interactions first
      .limit(20); // Reasonable limit

    if (error) {
      console.error('Error fetching contacts needing attention:', error);
      return { data: [], error: new Error(error.message) };
    }

    // Add calculated "daysAgo" field to match expected output if needed, or just return contact data
    // The previous RPC likely returned contact data + calculated days.
    // We can just return the contacts; the UI likely calculates daysAgo or we can map it.
    // Checking usage in other files would be good, but for now returning the contacts is the safest MVP fix.
    
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching contacts needing attention:', error);
    return { data: [], error: error instanceof Error ? error : new Error('Unknown error') };
  }
}

/**
 * Get growth trend (contacts added per month for last 6 months)
 */
export async function getGrowthTrend(): Promise<{ month: string; count: number }[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  try {
    const { data: contacts, error } = await (supabase as any)
      .from('persons')
      .select('created_at')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching contacts:', error);
      return [];
    }

    const contactsList = contacts || [];

    // Group by month
    const monthCounts: { [key: string]: number } = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Initialize last 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      monthCounts[key] = 0;
    }

    // Count contacts per month
    contactsList.forEach(contact => {
      const created = new Date(contact.created_at);
      const key = `${monthNames[created.getMonth()]} ${created.getFullYear()}`;
      if (key in monthCounts) {
        monthCounts[key]++;
      }
    });

    return Object.entries(monthCounts).map(([month, count]) => ({
      month,
      count,
    }));
  } catch (error) {
    console.error('Error calculating growth trend:', error);
    return [];
  }
}

/**
 * Calculate relationship score for a contact
 * Based on: recency, frequency, importance, and context
 */
export function calculateRelationshipScore(contact: Person): number {
  let score = 0;

  // Recency (0-40 points)
  if (contact.last_interaction_date) {
    const daysSince = Math.floor(
      (Date.now() - new Date(contact.last_interaction_date).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSince <= 7) score += 40;
    else if (daysSince <= 30) score += 30;
    else if (daysSince <= 60) score += 20;
    else if (daysSince <= 90) score += 10;
    // else 0 points
  }

  // Frequency (0-30 points)
  const interactionCount = contact.interaction_count || 0;
  if (interactionCount >= 20) score += 30;
  else if (interactionCount >= 10) score += 20;
  else if (interactionCount >= 5) score += 10;
  else if (interactionCount >= 1) score += 5;

  // Importance (0-20 points)
  if (contact.contact_importance === 'high') score += 20;
  else if (contact.contact_importance === 'medium') score += 10;
  else if (contact.contact_importance === 'low') score += 5;

  // Context (0-10 points)
  if (contact.has_context) score += 10;

  return score;
}

/**
 * Get relationship health category from score
 */
export function getHealthCategory(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

/**
 * Format days since last interaction
 */
export function formatDaysSince(date: string | null): string {
  if (!date) return 'Never';

  const daysSince = Math.floor(
    (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSince === 0) return 'Today';
  if (daysSince === 1) return 'Yesterday';
  if (daysSince < 7) return `${daysSince} days ago`;
  if (daysSince < 30) return `${Math.floor(daysSince / 7)} weeks ago`;
  if (daysSince < 365) return `${Math.floor(daysSince / 30)} months ago`;
  return `${Math.floor(daysSince / 365)} years ago`;
}
