'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

// Import shared types and utilities
import { 
  ContactHealth, 
  TreeStats, 
  HEALTH_COLORS,
  ContactCategory,
} from '@/app/relationship-tree/types';
import { 
  calculateDaysSince, 
  calculateTreeHealth, 
  calculateTreeStats,
  getHealthScoreMessage,
} from '@/app/relationship-tree/utils/treeHealthUtils';

interface TreeWidgetProps {
  contacts?: ContactData[];
  className?: string;
}

// Simplified contact data for the widget
interface ContactData {
  id: string;
  name: string;
  lastContact?: string | null;
  tags?: string[];
}

// Transform contacts to tree format
function transformToTreeContacts(contacts: ContactData[]): ContactHealth[] {
  return contacts.map(contact => {
    const daysAgo = calculateDaysSince(contact.lastContact);
    const healthStatus = calculateTreeHealth(daysAgo);
    
    // Infer category from tags
    let category: ContactCategory = 'friends';
    const tagStr = contact.tags?.join(' ').toLowerCase() || '';
    if (tagStr.includes('work')) category = 'work';
    else if (tagStr.includes('family')) category = 'family';
    else if (tagStr.includes('client')) category = 'clients';
    else if (tagStr.includes('network') || tagStr.includes('mentor')) category = 'networking';
    
    const initials = contact.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    
    return {
      contactId: contact.id,
      name: contact.name,
      initials,
      photoUrl: null,
      lastContactDate: contact.lastContact ? new Date(contact.lastContact) : null,
      daysAgo,
      healthStatus,
      category,
      position: { x: 0, y: 0 },
    };
  });
}

// Demo mock data
const DEMO_CONTACTS: ContactData[] = [
  { id: '1', name: 'Sarah Chen', lastContact: '2024-12-15', tags: ['Work'] },
  { id: '2', name: 'Mike Johnson', lastContact: '2024-11-20', tags: ['Work'] },
  { id: '3', name: 'Emma Davis', lastContact: '2024-12-10', tags: ['Friend'] },
  { id: '4', name: 'Tom Hall', lastContact: '2024-09-15', tags: ['Mentor'] },
  { id: '5', name: 'Alex Kim', lastContact: '2024-12-01', tags: ['Friend'] },
  { id: '6', name: 'David Wilson', lastContact: '2024-12-14', tags: ['Client'] },
  { id: '7', name: 'Lisa Martinez', lastContact: '2024-10-05', tags: ['Work'] },
  { id: '8', name: 'James Brown', lastContact: '2024-12-17', tags: ['Family'] },
];

export default function TreeWidget({ contacts = DEMO_CONTACTS, className = '' }: TreeWidgetProps) {
  // Calculate tree data
  const treeContacts = useMemo(() => transformToTreeContacts(contacts), [contacts]);
  const stats = useMemo(() => calculateTreeStats(treeContacts), [treeContacts]);
  const { emoji } = getHealthScoreMessage(stats.healthScore);
  
  // Count needing attention
  const needingAttention = stats.warning + stats.dying + stats.dormant;

  return (
    <Link 
      href="/garden"
      className={`block bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl border border-green-200 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.01] overflow-hidden ${className}`}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍃</span>
            <h3 className="text-lg font-semibold text-gray-800">Relationship Garden</h3>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
        
        {/* Mini Tree Visualization */}
        <div className="relative h-24 mb-4 flex items-center justify-center">
          <MiniTree stats={stats} />
        </div>
        
        {/* Health Score */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-600">Tree Health</span>
          <div className="flex items-center gap-2">
            <span className="text-lg">{emoji}</span>
            <span className="font-bold text-xl text-gray-800">{stats.healthScore}</span>
            <span className="text-sm text-gray-400">/100</span>
          </div>
        </div>
        
        {/* Stats row */}
        <div className="flex justify-between gap-2 mb-3">
          <StatBadge color={HEALTH_COLORS.healthy} count={stats.healthy} />
          <StatBadge color={HEALTH_COLORS.warning} count={stats.warning} />
          <StatBadge color={HEALTH_COLORS.dying} count={stats.dying} />
          <StatBadge color={HEALTH_COLORS.dormant} count={stats.dormant} />
        </div>
        
        {/* Alert */}
        {needingAttention > 0 && (
          <div className="bg-white/60 rounded-lg p-2.5 text-center">
            <p className="text-sm text-amber-700">
              ⚠️ <span className="font-medium">{needingAttention} relationships</span> need attention
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}

function StatBadge({ color, count }: { color: string; count: number }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/60 rounded-full">
      <div 
        className="w-3 h-3 rounded-full" 
        style={{ backgroundColor: color }}
      />
      <span className="text-sm font-medium text-gray-700">{count}</span>
    </div>
  );
}

function MiniTree({ stats }: { stats: TreeStats }) {
  const total = stats.total || 1;
  
  // Calculate proportions for mini leaves
  const leaves: { color: string; count: number }[] = [
    { color: HEALTH_COLORS.healthy, count: stats.healthy },
    { color: HEALTH_COLORS.warning, count: stats.warning },
    { color: HEALTH_COLORS.dying, count: stats.dying },
    { color: HEALTH_COLORS.dormant, count: stats.dormant },
  ];

  // Generate leaf positions for mini tree
  const leafPositions: { x: number; y: number; color: string }[] = [];
  let leafIndex = 0;
  
  leaves.forEach(({ color, count }) => {
    for (let i = 0; i < Math.min(count, 8); i++) {
      const angle = (leafIndex / Math.min(total, 20)) * Math.PI * 2;
      const radius = 25 + (leafIndex % 3) * 10;
      leafPositions.push({
        x: 50 + radius * Math.cos(angle - Math.PI / 2),
        y: 35 + radius * Math.sin(angle - Math.PI / 2) * 0.7,
        color,
      });
      leafIndex++;
    }
  });

  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      {/* Trunk */}
      <path
        d="M 48 60 Q 48 75 45 95 L 55 95 Q 52 75 52 60 Z"
        fill="#8B4513"
      />
      
      {/* Canopy background */}
      <ellipse
        cx="50"
        cy="35"
        rx="40"
        ry="30"
        fill="#10b981"
        opacity="0.15"
      />
      
      {/* Leaves */}
      {leafPositions.slice(0, 15).map((leaf, i) => (
        <circle
          key={i}
          cx={leaf.x}
          cy={leaf.y}
          r="5"
          fill={leaf.color}
          opacity="0.9"
        />
      ))}
    </svg>
  );
}
