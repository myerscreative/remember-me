'use client';

import React, { useState, useMemo } from 'react';
import { ContactHealth, TreeHealthStatus, ContactCategory, TreeDimensions, HEALTH_COLORS } from '../types';
import { 
  DEFAULT_TREE_DIMENSIONS, 
  positionContactsOnTree, 
  getTreeTrunkPath, 
  getTreeBranchPaths,
  getBranchRegions,
} from '../utils/positionUtils';
import { getSeasonalColors, getCurrentSeason } from '../utils/treeHealthUtils';
import TreeLeaf from './TreeLeaf';
import WateringAnimation from './WateringAnimation';

interface RelationshipTreeProps {
  contacts: ContactHealth[];
  dimensions?: TreeDimensions;
  onContactClick?: (contact: ContactHealth) => void;
  onContactHover?: (contact: ContactHealth | null) => void;
  selectedContactId?: string;
  healthFilter?: TreeHealthStatus[];
  categoryFilter?: ContactCategory[];
  showLabels?: boolean;
  className?: string;
}

export default function RelationshipTree({
  contacts,
  dimensions = DEFAULT_TREE_DIMENSIONS,
  onContactClick,
  onContactHover,
  selectedContactId,
  healthFilter = [],
  categoryFilter = [],
  showLabels = true,
  className = '',
}: RelationshipTreeProps) {
  const [wateringContact, setWateringContact] = useState<string | null>(null);
  const [hoveredContact, setHoveredContact] = useState<ContactHealth | null>(null);
  
  const { bg: seasonBg } = getSeasonalColors();
  const season = getCurrentSeason();

  // Position contacts on the tree
  const positionedContacts = useMemo(() => {
    return positionContactsOnTree(contacts, dimensions);
  }, [contacts, dimensions]);

  // Apply filters
  const filteredContacts = useMemo(() => {
    let filtered = positionedContacts;
    
    if (healthFilter.length > 0) {
      filtered = filtered.filter(c => healthFilter.includes(c.healthStatus));
    }
    
    if (categoryFilter.length > 0) {
      filtered = filtered.filter(c => categoryFilter.includes(c.category));
    }
    
    return filtered;
  }, [positionedContacts, healthFilter, categoryFilter]);

  // Get branch regions for labels
  const branchRegions = useMemo(() => getBranchRegions(dimensions), [dimensions]);

  const handleContactClick = (contact: ContactHealth) => {
    setWateringContact(contact.contactId);
    onContactClick?.(contact);
  };

  const handleContactHover = (contact: ContactHealth | null) => {
    setHoveredContact(contact);
    onContactHover?.(contact);
  };

  const handleWateringComplete = () => {
    setWateringContact(null);
  };

  // Get trunk and branch paths
  const trunkPath = getTreeTrunkPath(dimensions);
  const branchPaths = getTreeBranchPaths();

  return (
    <div 
      className={`relative ${className}`}
      style={{ backgroundColor: seasonBg }}
    >
      {/* Season indicator */}
      <div className="absolute top-4 right-4 px-3 py-1.5 bg-white/70 backdrop-blur-sm rounded-full text-sm font-medium text-gray-600 shadow-sm z-10">
        {season === 'spring' && '🌸 Spring'}
        {season === 'summer' && '☀️ Summer'}
        {season === 'fall' && '🍂 Fall'}
        {season === 'winter' && '❄️ Winter'}
      </div>

      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="mx-auto"
        style={{ maxWidth: '100%', height: 'auto' }}
      >
        {/* Definitions for Filters and Gradients */}
        <defs>
          <linearGradient id="sky-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={season === 'winter' ? '#e0e7ff' : '#dbeafe'} />
            <stop offset="100%" stopColor={seasonBg} />
          </linearGradient>
          
          <linearGradient id="trunk-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B4513" />
            <stop offset="50%" stopColor="#A0522D" />
            <stop offset="100%" stopColor="#8B4513" />
          </linearGradient>
          
          <radialGradient id="ground-shadow" cx="50%" cy="50%" r="50%">
             <stop offset="0%" stopColor="rgba(0,0,0,0.2)" />
             <stop offset="80%" stopColor="rgba(0,0,0,0.05)" />
             <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>

          {/* Leaf Drop Shadow */}
          <filter id="leaf-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* Sky background */}
        <rect 
          width={dimensions.width} 
          height={dimensions.height} 
          fill="url(#sky-gradient)" 
        />

        {/* Ground Shadow - The "Anchor" */}
        <ellipse
          cx={dimensions.width / 2}
          cy={dimensions.height - 10}
          rx={dimensions.width * 0.3}
          ry={15}
          fill="url(#ground-shadow)"
        />

        {/* Tree Trunk */}
        <path
          d={trunkPath}
          fill="url(#trunk-gradient)"
          stroke="#5D4037"
          strokeWidth="2"
        />

        {/* Tree Branches - 7 Major branches */}
        <g stroke="#8B4513" strokeWidth="8" fill="none" strokeLinecap="round">
           {branchPaths.map((path, index) => (
             <path key={index} d={path} />
           ))}
        </g>

        {/* Branch region labels */}
        {showLabels && Object.entries(branchRegions).map(([category, region]) => (
          <g key={category} opacity={0.6} style={{ pointerEvents: 'none' }}>
            <text
              x={region.centerX}
              y={region.centerY - 50} 
              textAnchor="middle"
              fontSize="12"
              fontWeight="600"
              fill="#8B4513"
              style={{ textShadow: '0 1px 2px rgba(255,255,255,0.8)' }}
            >
              {region.label}
            </text>
          </g>
        ))}

        {/* Leaves (contacts) - Rendered last to pop */}
        <g className="leaves">
          {filteredContacts.map(contact => (
            <TreeLeaf
              key={contact.contactId}
              contact={contact}
              onClick={handleContactClick}
              onHover={handleContactHover}
              isSelected={contact.contactId === selectedContactId}
              showTooltip={true}
            />
          ))}
        </g>

        {/* Watering animation */}
        {wateringContact && (
          <WateringAnimation
            isActive={true}
            position={
              filteredContacts.find(c => c.contactId === wateringContact)?.position || 
              { x: dimensions.width / 2, y: dimensions.height / 2 }
            }
            onComplete={handleWateringComplete}
          />
        )}
      </svg>
    </div>
  );
}
