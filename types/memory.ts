export type RelationshipStatus = 'Nurtured' | 'Drifting' | 'Neglected';

export interface SharedMemoryCard {
  id: string;
  contactName: string;
  initials: string;
  status: RelationshipStatus;
  statusLabel: string; // e.g., "BLOOMING", "WILTING", "DRY"
  content: string;
  isQuickLog: boolean;
  timestamp: Date;
}
