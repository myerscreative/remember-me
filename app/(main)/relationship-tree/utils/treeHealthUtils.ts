// Tree Health Calculation Utilities

import { TreeHealthStatus, TreeStats, ContactHealth, HEALTH_COLORS } from '../types';

/**
 * Calculate days since a given date
 */
export function calculateDaysSince(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(targetDate.getTime())) return null;
  
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - targetDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Calculate tree health status based on days since last contact
 * 
 * Health thresholds:
 * - Healthy: ≤7 days
 * - Warning: 8-21 days
 * - Dying: 22-90 days
 * - Dormant: 90+ days or never contacted
 */
export function calculateTreeHealth(daysAgo: number | null): TreeHealthStatus {
  if (daysAgo === null) return 'dormant';
  if (daysAgo <= 7) return 'healthy';
  if (daysAgo <= 21) return 'warning';
  if (daysAgo <= 90) return 'dying';
  return 'dormant';
}

/**
 * Get the color for a given health status
 */
export function getLeafColor(status: TreeHealthStatus): string {
  return HEALTH_COLORS[status];
}

/**
 * Get a gradient color for smoother transitions between health states
 */
export function getLeafGradientColors(status: TreeHealthStatus): { start: string; end: string } {
  switch (status) {
    case 'healthy':
      return { start: '#4ade80', end: '#16a34a' }; // Vibrant Green gradient
    case 'warning':
      return { start: '#fcd34d', end: '#d97706' }; // Vibrant Amber gradient
    case 'dying':
      return { start: '#fbbf24', end: '#ea580c' }; // Vibrant Orange gradient
    case 'dormant':
      return { start: '#a8a29e', end: '#78350f' }; // Brown/Wood gradient
  }
}

/**
 * Calculate aggregate tree statistics from contacts
 */
export function calculateTreeStats(contacts: ContactHealth[]): TreeStats {
  const stats: TreeStats = {
    total: contacts.length,
    healthy: 0,
    warning: 0,
    dying: 0,
    dormant: 0,
    healthScore: 0,
  };

  if (contacts.length === 0) {
    return stats;
  }

  // Count by health status
  contacts.forEach(contact => {
    switch (contact.healthStatus) {
      case 'healthy':
        stats.healthy++;
        break;
      case 'warning':
        stats.warning++;
        break;
      case 'dying':
        stats.dying++;
        break;
      case 'dormant':
        stats.dormant++;
        break;
    }
  });

  // Calculate health score (weighted average)
  // Healthy = 100, Warning = 60, Dying = 30, Dormant = 0
  const weightedSum = 
    stats.healthy * 100 +
    stats.warning * 60 +
    stats.dying * 30 +
    stats.dormant * 0;
  
  stats.healthScore = Math.round(weightedSum / stats.total);

  return stats;
}

/**
 * Get a descriptive message based on health score
 */
export function getHealthScoreMessage(score: number): { message: string; emoji: string } {
  if (score >= 90) {
    return { message: 'Your tree is thriving! 🌳', emoji: '🌟' };
  } else if (score >= 70) {
    return { message: 'Your tree is healthy! Keep it up!', emoji: '✨' };
  } else if (score >= 50) {
    return { message: 'Some relationships need attention', emoji: '💧' };
  } else if (score >= 30) {
    return { message: 'Your tree needs care!', emoji: '⚠️' };
  } else {
    return { message: 'Time to water your relationships!', emoji: '🚨' };
  }
}

/**
 * Get relative time string for display
 */
export function formatRelativeTime(daysAgo: number | null): string {
  if (daysAgo === null) return 'Never contacted';
  if (daysAgo === 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';
  if (daysAgo < 7) return `${daysAgo} days ago`;
  if (daysAgo < 14) return 'Last week';
  if (daysAgo < 21) return '2 weeks ago';
  if (daysAgo < 28) return '3 weeks ago';
  if (daysAgo < 60) return 'About a month ago';
  if (daysAgo < 90) return '2-3 months ago';
  if (daysAgo < 180) return '3-6 months ago';
  if (daysAgo < 365) return '6-12 months ago';
  return 'Over a year ago';
}

/**
 * Get current season for tree background variation
 */
export function getCurrentSeason(): 'spring' | 'summer' | 'fall' | 'winter' {
  const month = new Date().getMonth(); // 0-11
  
  if (month >= 2 && month <= 4) return 'spring';   // Mar-May
  if (month >= 5 && month <= 7) return 'summer';   // Jun-Aug
  if (month >= 8 && month <= 10) return 'fall';    // Sep-Nov
  return 'winter';                                  // Dec-Feb
}

/**
 * Get seasonal background colors
 */
export function getSeasonalColors(): { bg: string; accent: string } {
  const season = getCurrentSeason();
  
  switch (season) {
    case 'spring':
      return { bg: '#fef3c7', accent: '#fbbf24' }; // Warm yellow
    case 'summer':
      return { bg: '#d1fae5', accent: '#34d399' }; // Fresh green
    case 'fall':
      return { bg: '#fed7aa', accent: '#f97316' }; // Orange fall
    case 'winter':
      return { bg: '#e0e7ff', accent: '#818cf8' }; // Cool purple
  }
}
