// Relationship Tree Types

export type TreeHealthStatus = 'healthy' | 'warning' | 'dying' | 'dormant';

export type ContactCategory = 'work' | 'family' | 'friends' | 'clients' | 'networking';

export interface Position {
  x: number;
  y: number;
}

export interface ContactHealth {
  contactId: string;
  name: string;
  initials: string;
  photoUrl?: string | null;
  lastContactDate: Date | null;
  daysAgo: number | null;
  healthStatus: TreeHealthStatus;
  category: ContactCategory;
  position: Position;
  email?: string | null;
  phone?: string | null;
  sharedMemory?: string; // AI Synopsis or last meaningful note
  isAnniversary?: boolean;
}

export interface TreeStats {
  total: number;
  healthy: number;
  warning: number;
  dying: number;
  dormant: number;
  healthScore: number; // 0-100
}

export interface BranchRegion {
  centerX: number;
  centerY: number;
  radius: number;
  label: string;
}

export interface TreeDimensions {
  width: number;
  height: number;
  trunkHeight: number;
  canopyHeight: number;
}

// Health status to color mapping
export const HEALTH_COLORS: Record<TreeHealthStatus, string> = {
  healthy: '#22c55e',  // Vibrant Green
  warning: '#fbbf24',  // Vibrant Yellow/Amber
  dying: '#f97316',    // Vibrant Orange
  dormant: '#78350f',  // Deep Brown
};

// Health status labels and emojis
export const HEALTH_LABELS: Record<TreeHealthStatus, { label: string; emoji: string }> = {
  healthy: { label: 'Healthy', emoji: '🍃' },
  warning: { label: 'Needs Attention', emoji: '🍂' },
  dying: { label: 'At Risk', emoji: '🟤' },
  dormant: { label: 'Dormant', emoji: '⚫' },
};

// Category configuration for branch positioning
export const CATEGORY_CONFIG: Record<ContactCategory, { label: string; emoji: string }> = {
  work: { label: 'Work', emoji: '🏢' },
  family: { label: 'Family', emoji: '👨‍👩‍👧' },
  friends: { label: 'Friends', emoji: '👥' },
  clients: { label: 'Clients', emoji: '💼' },
  networking: { label: 'Networking', emoji: '🤝' },
};
