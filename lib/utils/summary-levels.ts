/**
 * Summary level utilities for managing three-tier AI summaries
 */

export type SummaryLevel = 'micro' | 'default' | 'full';

export interface ContactWithSummaries {
  summary_micro?: string | null;
  summary_default?: string | null;
  summary_full?: string | null;
  summary_level_override?: SummaryLevel | null;
  relationship_summary?: string | null;
}

export interface UserSettings {
  summary_level_default?: SummaryLevel | null;
}

/**
 * Compute the effective summary level for a contact
 * @param contact - Contact with potential summary_level_override
 * @param userSettings - User settings with summary_level_default
 * @returns The effective summary level to use
 */
export function getEffectiveSummaryLevel(
  contact: ContactWithSummaries,
  userSettings?: UserSettings
): SummaryLevel {
  // Per-contact override takes precedence
  if (contact.summary_level_override) {
    return contact.summary_level_override;
  }

  // Fall back to user's default setting
  if (userSettings?.summary_level_default) {
    return userSettings.summary_level_default;
  }

  // Final fallback to 'default' level
  return 'default';
}

/**
 * Get the summary text at the specified level
 * @param contact - Contact with summary fields
 * @param level - The summary level to retrieve
 * @returns The summary text, falling back to relationship_summary if needed
 */
export function getSummaryAtLevel(
  contact: ContactWithSummaries,
  level: SummaryLevel
): string | null {
  switch (level) {
    case 'micro':
      return contact.summary_micro || contact.relationship_summary || null;
    case 'default':
      return contact.summary_default || contact.relationship_summary || null;
    case 'full':
      return contact.summary_full || contact.relationship_summary || null;
    default:
      return contact.relationship_summary || null;
  }
}

/**
 * Get the effective summary for a contact based on user settings
 * Combines getEffectiveSummaryLevel and getSummaryAtLevel
 * @param contact - Contact with summary fields
 * @param userSettings - User settings with summary_level_default
 * @returns The summary text to display
 */
export function getEffectiveSummary(
  contact: ContactWithSummaries,
  userSettings?: UserSettings
): string | null {
  const level = getEffectiveSummaryLevel(contact, userSettings);
  return getSummaryAtLevel(contact, level);
}

/**
 * Always returns micro summary for list views
 * @param contact - Contact with summary fields
 * @returns The micro summary or fallback
 */
export function getMicroSummaryForList(
  contact: ContactWithSummaries
): string | null {
  return getSummaryAtLevel(contact, 'micro');
}
