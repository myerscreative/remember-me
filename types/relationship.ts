export type HealthStatus = 'NURTURED' | 'WARNING' | 'NEGLECTED';

export interface RelationshipHealth {
  lastContactDate: Date;
  targetContactDate: Date;
  status: HealthStatus;
}

export const getHealthStatus = (targetDate: Date): HealthStatus => {
  const now = new Date();
  const diffInMs = targetDate.getTime() - now.getTime();
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

  if (diffInMs < 0) return 'NEGLECTED'; // Red: Time has passed
  if (diffInDays <= 5) return 'WARNING'; // Yellow: Within 5-day window
  return 'NURTURED'; // Green: More than 5 days out
};
