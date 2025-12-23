// Tree Positioning Utilities
// Algorithm for organic leaf placement on the tree

import { Position, ContactCategory, BranchRegion, ContactHealth, TreeDimensions } from '../types';



/**
 * Default tree dimensions
 */
export const DEFAULT_TREE_DIMENSIONS: TreeDimensions = {
  width: 800,
  height: 600,
  trunkHeight: 200,
  canopyHeight: 400,
};

// Define the 7 branch clusters (tips) relative to a 800x600 coordinate system
const BRANCH_CLUSTERS = [
  { id: 'left-top', x: 330, y: 240, radius: 45, category: 'work' },
  { id: 'center-top', x: 400, y: 230, radius: 55, category: 'family' },
  { id: 'right-top', x: 470, y: 240, radius: 45, category: 'friends' },
  { id: 'left-mid', x: 320, y: 350, radius: 40, category: 'clients' },
  { id: 'right-mid', x: 480, y: 350, radius: 40, category: 'networking' },
  { id: 'left-low', x: 340, y: 410, radius: 35, category: 'work' },     // Overflow/Extra
  { id: 'right-low', x: 460, y: 410, radius: 35, category: 'friends' },  // Overflow/Extra
];

/**
 * Get branch regions - mapping categories to specific clusters for semantic layout
 */
export function getBranchRegions(dimensions: TreeDimensions): Record<ContactCategory, BranchRegion> {
  const { width } = dimensions;
  const centerX = width / 2;
  
  // Note: These are primarily for labels, the actual positioning uses the cluster array
  return {
    family: { centerX, centerY: 230, radius: 55, label: 'Family' },
    friends: { centerX: centerX + 70, centerY: 240, radius: 45, label: 'Friends' },
    work: { centerX: centerX - 70, centerY: 240, radius: 45, label: 'Work' },
    clients: { centerX: centerX - 80, centerY: 350, radius: 40, label: 'Clients' },
    networking: { centerX: centerX + 80, centerY: 350, radius: 40, label: 'Network' },
  };
}

/**
 * Calculate organic leaf position within a cluster
 */
export function calculateLeafPosition(
  index: number,
  totalInCluster: number,
  cluster: { x: number; y: number; radius: number },
  seed: number
): Position {
  const random = seededRandom(seed);
  
  // Dense packing at the center, spreading out
  const angle = (index * 2.4) + random(); // Golden angle approx + jitter
  
  // Distribution: more leaves = slightly larger radius, but kept tight
  const spreadFactor = Math.min(1.2, 0.4 + (totalInCluster / 20));
  const r = cluster.radius * Math.sqrt(random()) * spreadFactor;
  
  return {
    x: cluster.x + r * Math.cos(angle),
    y: cluster.y + r * Math.sin(angle),
  };
}

/**
 * Seeded random number generator
 */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Position all contacts on the tree using clustered layout
 */
export function positionContactsOnTree(
  contacts: ContactHealth[],
  dimensions: TreeDimensions = DEFAULT_TREE_DIMENSIONS
): ContactHealth[] {
  // Map dimensions if they differ from default (scaling)
  const scaleX = dimensions.width / 800;
  const scaleY = dimensions.height / 600;

  // Group contacts by category preference
  const byCategory: Record<string, ContactHealth[]> = {
    family: [], friends: [], work: [], clients: [], networking: []
  };
  
  contacts.forEach(c => {
    if (byCategory[c.category]) byCategory[c.category].push(c);
    else byCategory['networking'].push(c); // Default
  });

  const positionedContacts: ContactHealth[] = [];

  // Assign contacts to clusters
  // We try to respect categories, but also fill the tree nicely
  const assignedClusters = new Map<string, ContactHealth[]>();
  
  // Initialize clusters
  BRANCH_CLUSTERS.forEach(c => assignedClusters.set(c.id, []));

  // Distribution logic
  // Family -> Center Top
  byCategory.family.forEach(c => assignedClusters.get('center-top')?.push(c));
  
  // Work -> Left Top (main) then Left Low (overflow)
  byCategory.work.forEach((c, i) => {
    if (i % 2 === 0) assignedClusters.get('left-top')?.push(c);
    else assignedClusters.get('left-low')?.push(c);
  });

  // Friends -> Right Top (main) then Right Low (overflow)
  byCategory.friends.forEach((c, i) => {
    if (i % 2 === 0) assignedClusters.get('right-top')?.push(c);
    else assignedClusters.get('right-low')?.push(c);
  });

  // Clients -> Left Mid
  byCategory.clients.forEach(c => assignedClusters.get('left-mid')?.push(c));

  // Networking -> Right Mid
  byCategory.networking.forEach(c => assignedClusters.get('right-mid')?.push(c));

  // Now calculate positions for each assigned contact
  BRANCH_CLUSTERS.forEach(cluster => {
    const clusterContacts = assignedClusters.get(cluster.id) || [];
    const scaledCluster = {
      x: cluster.x * scaleX,
      y: cluster.y * scaleY,
      radius: cluster.radius * Math.min(scaleX, scaleY)
    };

    clusterContacts.forEach((contact, i) => {
      const seed = hashString(contact.contactId + i);
      const pos = calculateLeafPosition(i, clusterContacts.length, scaledCluster, seed);
      positionedContacts.push({ ...contact, position: pos });
    });
  });

  // If any unassigned (fallback), dump in center
  return positionedContacts;
}

/**
 * Get SVG path for tree trunk - Thicker and more organic
 */
export function getTreeTrunkPath(dimensions: TreeDimensions): string {
  const { width, height } = dimensions;
  const cx = width / 2;
  const bottom = height - 20;

  // Organic trunk with slight curve
  return `
    M ${cx - 25} ${bottom}
    Q ${cx - 35} ${bottom - 100}, ${cx - 15} ${height / 2 + 50}
    L ${cx + 15} ${height / 2 + 50}
    Q ${cx + 35} ${bottom - 100}, ${cx + 25} ${bottom}
    Z
  `;
}

/**
 * Get SVG paths for 7 organic branches
 */
export function getTreeBranchPaths(): string[] {
  // We use the same coordinate logic as the clusters to ensure alignment
  // Control points are tweaked for "curvy" look
  
  return [
    // 1. Center Top (Family)
    "M 400 380 Q 400 300, 400 250",
    
    // 2. Left Top (Work)
    "M 395 360 Q 360 300, 330 240",
    
    // 3. Left Mid (Clients)
    "M 390 400 Q 350 380, 320 350",
    
    // 4. Left Low (Overflow / Work)
    "M 385 440 Q 360 430, 340 410",
    
    // 5. Right Top (Friends)
    "M 405 360 Q 440 300, 470 240",
    
    // 6. Right Mid (Networking)
    "M 410 400 Q 450 380, 480 350",
    
    // 7. Right Low (Overflow / Friends)
    "M 415 440 Q 440 430, 460 410",
  ];
}


/**
 * Check if a position is within the tree canopy bounds
 */
export function isWithinCanopy(position: Position, dimensions: TreeDimensions): boolean {
  const { width, canopyHeight } = dimensions;
  const centerX = width / 2;
  
  // Simple ellipse check for tree canopy
  const normalizedX = (position.x - centerX) / (width * 0.4);
  const normalizedY = (position.y - canopyHeight * 0.4) / (canopyHeight * 0.5);
  
  return (normalizedX * normalizedX + normalizedY * normalizedY) <= 1;
}
