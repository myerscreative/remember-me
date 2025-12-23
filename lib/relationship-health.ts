// Relationship Health Utilities
// Calculates health based on target frequency (cadence-based system)

export type HealthStatus = 'BLOOMING' | 'NOURISHED' | 'THIRSTY' | 'FADING';

export interface RelationshipHealth {
  status: HealthStatus;
  color: string;
  ratio: number;  // 0 = just contacted, 1 = at target, 2+ = overdue
  daysSince: number;
  targetDays: number;
}

/**
 * Calculate relationship health based on ratio of days since contact / target frequency
 * 
 * @param lastDate - Last interaction date (string or Date)
 * @param targetDays - User's desired contact frequency in days (default 30)
 * @returns Health status with color, ratio, and metadata
 */
export function getRelationshipHealth(
  lastDate: string | Date | null, 
  targetDays: number = 30
): RelationshipHealth {
  // Handle never contacted case
  if (!lastDate) {
    return {
      status: 'FADING',
      color: '#f97316',
      ratio: 999,
      daysSince: 999,
      targetDays
    };
  }

  const lastDateObj = typeof lastDate === 'string' ? new Date(lastDate) : lastDate;
  const daysSince = Math.floor((Date.now() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24));
  const ratio = daysSince / targetDays;

  // Health thresholds based on ratio
  if (ratio <= 0.5) {
    // Within first half of target period - blooming/thriving
    return {
      status: 'BLOOMING',
      color: '#22c55e',  // green-500
      ratio,
      daysSince,
      targetDays
    };
  }
  
  if (ratio <= 1.0) {
    // Within target period but past halfway
    return {
      status: 'NOURISHED',
      color: '#84cc16',  // lime-500
      ratio,
      daysSince,
      targetDays
    };
  }
  
  if (ratio <= 1.5) {
    // Past target but within 50% grace period
    return {
      status: 'THIRSTY',
      color: '#eab308',  // yellow-500
      ratio,
      daysSince,
      targetDays
    };
  }
  
  // Significantly overdue
  return {
    status: 'FADING',
    color: '#f97316',  // orange-500
    ratio,
    daysSince,
    targetDays
  };
}

/**
 * Get position for Fibonacci spiral with health-based ring placement
 * 
 * @param index - Contact index (for angle calculation)
 * @param healthRatio - 0-2+ ratio from getRelationshipHealth
 * @param maxRadius - Maximum radius of the garden
 * @returns x, y coordinates and rotation angle
 */
export function getPhyllotaxisPosition(
  index: number, 
  healthRatio: number, 
  maxRadius: number
): { x: number; y: number; rotation: number } {
  const goldenAngle = 137.508 * (Math.PI / 180);
  
  // Clamp ratio to prevent leaves going too far out
  const clampedRatio = Math.min(healthRatio, 2);
  
  // Radius is primarily driven by health ratio (ring effect)
  // Small sqrt(index) offset prevents overlap within same health tier
  const r = (clampedRatio * maxRadius * 0.4) + (Math.sqrt(index) * 5);
  const theta = index * goldenAngle;
  
  return {
    x: r * Math.cos(theta),
    y: r * Math.sin(theta),
    rotation: (theta * 180 / Math.PI) + 90
  };
}

// Interaction types for logging
export type InteractionType = 'call' | 'text' | 'email' | 'in-person' | 'social' | 'other';

export const INTERACTION_TYPES: { value: InteractionType; label: string; emoji: string }[] = [
  { value: 'call', label: 'Phone Call', emoji: '📞' },
  { value: 'text', label: 'Text/Message', emoji: '💬' },
  { value: 'email', label: 'Email', emoji: '📧' },
  { value: 'in-person', label: 'In Person', emoji: '🤝' },
  { value: 'social', label: 'Social Media', emoji: '📱' },
  { value: 'other', label: 'Other', emoji: '✨' },
];

// Target frequency presets
export const FREQUENCY_PRESETS = [
  { days: 7, label: 'Weekly' },
  { days: 14, label: 'Bi-weekly' },
  { days: 30, label: 'Monthly' },
  { days: 60, label: 'Every 2 months' },
  { days: 90, label: 'Quarterly' },
  { days: 180, label: 'Twice a year' },
  { days: 365, label: 'Yearly' },
];
