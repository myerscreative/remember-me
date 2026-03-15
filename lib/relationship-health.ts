
/**
 * Logic to determine Relationship Health based on "Intention over Automation"
 */
export type HealthStatus = 'nurtured' | 'drifting' | 'neglected';

interface HealthCalculatorProps {
  lastContactDate: Date | string | null;
  createdAt?: Date | string | null;
  cadenceDays: number; // e.g., 30
}

function toValidDate(input: Date | string | null | undefined): Date | null {
  if (!input) return null;
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getHealthBaselineDate(
  lastContactDate: Date | string | null | undefined,
  createdAt?: Date | string | null
): Date | null {
  const last = toValidDate(lastContactDate);
  const created = toValidDate(createdAt);

  if (last && created) {
    return last.getTime() >= created.getTime() ? last : created;
  }

  return last || created || null;
}

export const getRelationshipHealth = ({
  lastContactDate,
  createdAt,
  cadenceDays,
}: HealthCalculatorProps): HealthStatus => {
  const baselineDate = getHealthBaselineDate(lastContactDate, createdAt);
  if (!baselineDate) return 'neglected';

  const now = new Date();
  
  // Calculate difference in days
  const diffInMs = now.getTime() - baselineDate.getTime();
  const daysSinceLastContact = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  // 1. Nurtured: Within the cadence window
  if (daysSinceLastContact < cadenceDays) {
    return 'nurtured';
  }

  // 2. Drifting: Missed the window, but within a 50% "grace period"
  const gracePeriod = cadenceDays * 1.5;
  if (daysSinceLastContact < gracePeriod) {
    return 'drifting';
  }

  // 3. Neglected: Beyond the grace period
  return 'neglected';
};

// UI Mapping for Anti-Gravity/Tailwind
export const healthColorMap = {
  nurtured: {
    border: 'border-green-500',
    bg: 'bg-green-500/10',
    text: 'text-green-500',
    label: 'Nurtured',
    shadow: 'shadow-green-500/20'
  },
  drifting: {
    border: 'border-orange-500',
    bg: 'bg-orange-500/10',
    text: 'text-orange-500',
    label: 'Drifting',
    shadow: 'shadow-orange-500/20'
  },
  neglected: {
    border: 'border-red-500',
    bg: 'bg-red-500/10',
    text: 'text-red-500',
    label: 'Neglected',
    shadow: 'shadow-red-500/20'
  }
};

/**
 * Detailed health calculation for components needing metadata (daysSince, ratio, etc.)
 * Adapts new logic to legacy object structure where needed.
 */
export function getDetailedRelationshipHealth(
  lastContactDate: string | Date | null,
  targetDays: number = 30,
  createdAt?: string | Date | null
): { status: HealthStatus; daysSince: number; color: string; label: string } {
  const baselineDate = getHealthBaselineDate(lastContactDate, createdAt);
  const now = new Date();
  const daysSince = baselineDate
    ? Math.floor((now.getTime() - baselineDate.getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  const status = getRelationshipHealth({
    lastContactDate,
    createdAt,
    cadenceDays: targetDays,
  });
  const styles = healthColorMap[status];

  return {
    status,
    daysSince,
    color: styles.bg.replace('/10', ''), // Approximation for legacy color usage (e.g. dots) which often expect solid colors
    label: styles.label
  };
}

// Legacy / Garden Utils (Preserving for phyllotaxis if needed, but updated types might be needed eventually)
export type OldHealthStatus = 'BLOOMING' | 'NOURISHED' | 'THIRSTY' | 'FADING';

export interface RelationshipHealth {
  status: OldHealthStatus; // Keeping legacy status for now to avoid breaking other files if they use it
  color: string;
  ratio: number;  // 0 = just contacted, 1 = at target, 2+ = overdue
  daysSince: number;
  targetDays: number;
}

// ... (keep existing getMyGardenHealth etc if they exist, or just the getPhyllotaxisPosition)

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

export const FREQUENCY_PRESETS = [
    { days: 7, label: 'Weekly' },
    { days: 14, label: 'Bi-weekly' },
    { days: 30, label: 'Monthly' },
    { days: 60, label: 'Every 2 months' },
    { days: 90, label: 'Quarterly' },
    { days: 180, label: 'Twice a year' },
    { days: 365, label: 'Yearly' },
];
