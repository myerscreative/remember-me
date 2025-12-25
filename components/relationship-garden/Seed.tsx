'use client';

import React from 'react';

interface SeedProps {
  color: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
  onMouseMove?: (e: React.MouseEvent) => void;
  isHighlighted?: boolean;
}

export default function Seed({ 
  color, 
  size = 5,
  className = '',
  style, 
  onClick, 
  onMouseEnter,
  onMouseLeave,
  onMouseMove,
  isHighlighted = false,
}: SeedProps) {
  return (
    <div 
      className={`cursor-pointer transition-all duration-200 ${className}`}
      style={{
        ...style,
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        boxShadow: isHighlighted 
          ? `0 0 8px 3px ${color}80, 0 0 16px 6px ${color}40`
          : `0 1px 2px rgba(0,0,0,0.3)`,
        transform: isHighlighted ? 'scale(1.8)' : 'scale(1)',
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseMove={onMouseMove}
    />
  );
}

// Helper function to get relationship level based on days
export function getRelationshipLevel(days: number): string {
  if (days <= 7) return 'Inner Circle';
  if (days <= 14) return 'Close Friend';
  if (days <= 45) return 'Steady Friend';
  if (days <= 120) return 'Acquaintance';
  return 'Distant';
}
