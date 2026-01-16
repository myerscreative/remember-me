'use client';

import React, { useState, useEffect } from 'react';

interface WateringAnimationProps {
  isActive: boolean;
  position: { x: number; y: number };
  onComplete?: () => void;
}

export default function WateringAnimation({
  isActive,
  position,
  onComplete,
}: WateringAnimationProps) {
  const [phase, setPhase] = useState<'idle' | 'watering' | 'growing' | 'complete'>('idle');

  useEffect(() => {
    if (isActive && phase === 'idle') {
      setPhase('watering');
      
      // Transition through phases
      const wateringTimer = setTimeout(() => setPhase('growing'), 800);
      const growingTimer = setTimeout(() => {
        setPhase('complete');
        onComplete?.();
      }, 1600);
      const resetTimer = setTimeout(() => setPhase('idle'), 2200);
      
      return () => {
        clearTimeout(wateringTimer);
        clearTimeout(growingTimer);
        clearTimeout(resetTimer);
      };
    }
  }, [isActive, phase, onComplete]);

  if (phase === 'idle') return null;

  return (
    <g style={{ transform: `translate(${position.x}px, ${position.y}px)` }}>
      {/* Water droplets */}
      {phase === 'watering' && (
        <>
          <WaterDroplet delay={0} offsetX={-5} />
          <WaterDroplet delay={100} offsetX={0} />
          <WaterDroplet delay={200} offsetX={5} />
        </>
      )}
      
      {/* Growth effect */}
      {phase === 'growing' && (
        <g className="animate-pulse">
          <circle
            r="20"
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            opacity="0.6"
            className="animate-ping"
          />
          <circle
            r="30"
            fill="none"
            stroke="#10b981"
            strokeWidth="1"
            opacity="0.3"
            className="animate-ping"
            style={{ animationDelay: '100ms' }}
          />
        </g>
      )}
      
      {/* Sparkle effect on complete */}
      {phase === 'complete' && (
        <>
          <Sparkle x={-15} y={-10} delay={0} />
          <Sparkle x={12} y={-15} delay={50} />
          <Sparkle x={-8} y={-20} delay={100} />
          <Sparkle x={10} y={-8} delay={150} />
        </>
      )}
    </g>
  );
}

interface WaterDropletProps {
  delay: number;
  offsetX: number;
}

function WaterDroplet({ delay, offsetX }: WaterDropletProps) {
  return (
    <g 
      style={{ 
        animation: 'droplet 0.6s ease-in forwards',
        animationDelay: `${delay}ms`,
        opacity: 0,
      }}
    >
      <style>
        {`
          @keyframes droplet {
            0% {
              transform: translateY(-30px) translateX(${offsetX}px);
              opacity: 1;
            }
            100% {
              transform: translateY(0px) translateX(${offsetX}px);
              opacity: 0;
            }
          }
        `}
      </style>
      <ellipse
        cx={offsetX}
        cy={-15}
        rx="3"
        ry="5"
        fill="#60a5fa"
      />
    </g>
  );
}

interface SparkleProps {
  x: number;
  y: number;
  delay: number;
}

function Sparkle({ x, y, delay }: SparkleProps) {
  return (
    <g
      style={{
        animation: 'sparkle 0.5s ease-out forwards',
        animationDelay: `${delay}ms`,
        opacity: 0,
      }}
    >
      <style>
        {`
          @keyframes sparkle {
            0% {
              transform: scale(0) translate(${x}px, ${y}px);
              opacity: 1;
            }
            50% {
              transform: scale(1.2) translate(${x}px, ${y}px);
              opacity: 1;
            }
            100% {
              transform: scale(0) translate(${x}px, ${y}px);
              opacity: 0;
            }
          }
        `}
      </style>
      <text
        x={x}
        y={y}
        fontSize="12"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#fbbf24"
      >
        ✨
      </text>
    </g>
  );
}

// Simpler CSS-based watering animation for broader compatibility
export function WateringEffect({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 flex justify-center">
        <div className="w-1 h-8 bg-linear-to-b from-blue-400 to-transparent rounded-full animate-bounce" />
      </div>
      <div className="absolute inset-0 flex justify-center gap-1 mt-2">
        <div 
          className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" 
          style={{ animationDelay: '0ms' }} 
        />
        <div 
          className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" 
          style={{ animationDelay: '100ms' }} 
        />
        <div 
          className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" 
          style={{ animationDelay: '200ms' }} 
        />
      </div>
    </div>
  );
}
