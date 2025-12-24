import React, { useMemo } from 'react';

interface LeafProps {
  color: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
  onMouseMove?: (e: React.MouseEvent) => void;
  initials?: string;
  scale?: number;
}

// Helper to darken color for gradient/stroke
function adjustBrightness(color: string, percent: number) {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
  return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

export default function Leaf({ 
  color, 
  className, 
  style, 
  onClick, 
  onMouseEnter,
  onMouseLeave,
  onMouseMove,
  initials,
  scale = 1
}: LeafProps) {
  const darker = useMemo(() => adjustBrightness(color, -20), [color]);
  const darkest = useMemo(() => adjustBrightness(color, -40), [color]);
  const gradientId = `grad-${color.replace('#', '')}`;

  return (
    <div 
      className={`absolute cursor-pointer origin-center transition-all duration-500 ease-in-out hover:z-50 leaf-container ${className || ''}`}
      style={{
        ...style,
        width: Math.max(44, 42 * scale),
        height: Math.max(44, 48 * scale),
        padding: '4px', // Extra touch area
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseMove={onMouseMove}
    >
      <svg 
        viewBox="0 0 42 48" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm hover:drop-shadow-lg transition-all"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={darker} stopOpacity="1" />
          </linearGradient>
        </defs>
        {/* Round part at bottom (toward center), pointy at top (outward) */}
        <path
          d="M 21 46 C 14 42, 6 36, 4 24 C 4 14, 9 6, 21 2 C 33 6, 38 14, 38 24 C 36 36, 28 42, 21 46 Z"
          fill={`url(#${gradientId})`}
          stroke={darkest}
          strokeWidth="0.5"
        />
        {/* Vein from bottom to top */}
        <path
          d="M 21 43 L 21 6"
          stroke={darkest}
          strokeWidth="0.7"
          fill="none"
          opacity="0.25"
        />
      </svg>
      {initials && (
        <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold text-white drop-shadow-md pointer-events-none select-none tracking-wide"
            style={{ fontSize: `${10 * scale}px` }} 
        >
          {initials}
        </div>
      )}
    </div>
  );
}
