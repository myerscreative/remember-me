export type HealthStatus = 'NURTURED' | 'DRIFTING' | 'NEGLECTED';

interface HealthConfig {
  driftingDays: number;
  neglectedDays: number;
}

export const getRelationshipHealth = (
  createdAt: Date,
  lastContacted: Date | null,
  config: HealthConfig = { driftingDays: 14, neglectedDays: 30 }
): { status: HealthStatus; daysSince: number } => {
  const referenceDate = lastContacted ?? createdAt;
  const now = new Date();

  const diffTime = Math.abs(now.getTime() - referenceDate.getTime());
  const daysSince = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (daysSince >= config.neglectedDays) return { status: 'NEGLECTED', daysSince };
  if (daysSince >= config.driftingDays) return { status: 'DRIFTING', daysSince };

  return { status: 'NURTURED', daysSince };
};
