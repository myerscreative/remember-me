'use client';

import React, { useState } from 'react';
import { ContactHealth, TreeHealthStatus, HEALTH_COLORS, HEALTH_LABELS } from '../types';
import { formatRelativeTime, getLeafGradientColors } from '../utils/treeHealthUtils';

interface TreeLeafProps {
  contact: ContactHealth;
  onClick?: (contact: ContactHealth) => void;
  onHover?: (contact: ContactHealth | null) => void;
  isSelected?: boolean;
  showTooltip?: boolean;
}

export default function TreeLeaf({
  contact,
  onClick,
  onHover,
  isSelected = false,
  showTooltip = true,
}: TreeLeafProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Make leaf size dynamic based on interaction
  const [randomRotation] = useState(() => Math.random() * 360);
  const [randomScale] = useState(() => 0.8 + Math.random() * 0.4);
  
  const color = HEALTH_COLORS[contact.healthStatus];

  const handleMouseEnter = () => {
    setIsHovered(true);
    onHover?.(contact);
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
    onHover?.(null);
  };
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(contact);
  };

  return (
    <g
      className="cursor-pointer transition-all duration-300"
      style={{
        transform: `translate(${contact.position.x}px, ${contact.position.y}px)`,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Drop Shadow Filter defined globally in Tree, applied here */}
      <g 
        filter="url(#leaf-shadow)"
        style={{
          transform: isHovered 
            ? `scale(1.5) rotate(${randomRotation}deg)` 
            : `scale(${randomScale}) rotate(${randomRotation}deg)`,
          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Actual Leaf Shape Path */}
        <path
          d="M 0 -12 C 6 -8, 10 -4, 10 4 C 10 10, 6 12, 0 12 C -6 12, -10 10, -10 4 C -10 -4, -6 -8, 0 -12 Z"
          fill={color}
          stroke="rgba(0,0,0,0.1)"
          strokeWidth="0.5"
        />
        
        {/* Leaf Vein */}
        <path
          d="M 0 -10 L 0 10"
          stroke="rgba(0,0,0,0.2)"
          strokeWidth="0.5"
          fill="none"
        />

        {/* Selection Glow Ring */}
        {isSelected && (
          <circle
            r="16"
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
            strokeDasharray="4 2"
            className="animate-spin"
            style={{ animationDuration: '8s' }}
          />
        )}

        {/* Anniversary Gold Ring */}
        {contact.isAnniversary && !isSelected && (
          <circle
            r="16"
            fill="none"
            stroke="#fbbf24" 
            strokeWidth="1.5"
            className="animate-pulse"
            style={{ filter: 'drop-shadow(0 0 2px #f59e0b)' }}
          />
        )}
      </g>

      {/* Initials (only visible on hover or if very large) */}
      {(isHovered || isSelected) && (
        <g className="animate-in fade-in zoom-in duration-200" style={{ transform: 'translate(0, -25px)' }}>
          <rect x="-14" y="-10" width="28" height="20" rx="4" fill="white" opacity="0.9" />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="10"
            fontWeight="bold"
            fill="#374151"
            className="pointer-events-none select-none"
          >
            {contact.initials}
          </text>
        </g>
      )}

      {/* Tooltip */}
      {showTooltip && isHovered && (
        <g className="pointer-events-none z-50">
          <foreignObject x="-80" y="-80" width="160" height="60">
             <div className="bg-white rounded-lg shadow-xl border border-gray-100 p-2 text-center transform -translate-y-2">
               <p className="text-xs font-bold text-gray-800 leading-tight">{contact.name}</p>
                <p className="text-[10px] text-gray-500">{formatRelativeTime(contact.daysAgo)}</p>
               
               {/* Quick Briefing: AI Synopsis or Status */}
               {contact.sharedMemory ? (
                 <p className="text-[9px] text-indigo-600 mt-1 italic leading-relaxed px-1 border-t border-indigo-50 pt-1 line-clamp-3">
                   "{contact.sharedMemory}"
                 </p>
               ) : (
                 <div className="flex items-center justify-center gap-1 mt-1">
                   <span className="text-[10px]">
                      {HEALTH_LABELS[contact.healthStatus].emoji} {HEALTH_LABELS[contact.healthStatus].label}
                   </span>
                 </div>
               )}
               {/* Arrow */}
               <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45 border-b border-r border-gray-100"></div>
             </div>
          </foreignObject>
        </g>
      )}
    </g>
  );
}
