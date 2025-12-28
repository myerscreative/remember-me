/**
 * Centralized relationship health decay logic
 */

export type HealthStatus = 'nurtured' | 'drifting' | 'neglected';

/**
 * Calculate relationship health based on last interaction and target frequency.
 * 
 * Logic:
 * - Nurtured: contacted within target_frequency_days
 * - Drifting: contacted within 1.2 * target_frequency_days
 * - Neglected: everything else
 */
export function calculateHealthStatus(
  lastInteractionDate: string | Date | null | undefined,
  targetFrequencyDays: number | null = 30
): HealthStatus {
  const frequency = targetFrequencyDays || 30;
  
  if (!lastInteractionDate) {
    return 'neglected';
  }

  const lastDate = typeof lastInteractionDate === 'string' 
    ? new Date(lastInteractionDate) 
    : lastInteractionDate;
    
  if (isNaN(lastDate.getTime())) {
    return 'neglected';
  }

  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= frequency) {
    return 'nurtured';
  } else if (diffDays <= frequency * 1.2) {
    return 'drifting';
  } else {
    return 'neglected';
  }
}

/**
 * Legacy/Garden health status mapping helper if needed
 */
export function getGardenHealthLabel(days: number, frequency: number = 30): string {
  if (days <= frequency) return 'Blooming';
  if (days <= frequency * 1.5) return 'Nourished';
  if (days <= frequency * 2) return 'Thirsty';
  return 'Fading';
}
