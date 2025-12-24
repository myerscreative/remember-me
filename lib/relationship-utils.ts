// Relationship utility functions and constants
// Shared between client and server

import type { RelationshipRole } from '@/types/database.types';

// Inverse relationship mapping for bi-directional display
const INVERSE_RELATIONSHIPS: Record<RelationshipRole, RelationshipRole> = {
  parent: 'child',
  child: 'parent',
  spouse: 'spouse',
  partner: 'partner',
  sibling: 'sibling',
  friend: 'friend',
  colleague: 'colleague',
  other: 'other',
};

export function getInverseRelationship(role: RelationshipRole): RelationshipRole {
  return INVERSE_RELATIONSHIPS[role];
}

// Relationship labels for display
export const RELATIONSHIP_LABELS: Record<RelationshipRole, string> = {
  parent: 'Parent',
  child: 'Child',
  spouse: 'Spouse',
  partner: 'Partner',
  sibling: 'Sibling',
  friend: 'Friend',
  colleague: 'Colleague',
  other: 'Other',
};
