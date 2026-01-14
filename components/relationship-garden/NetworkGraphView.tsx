'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useTheme } from '@/app/providers/theme-provider';

// Types passed from parent
interface GraphContact {
  dbId: string;
  name: string;
  days: number;
  initials: string;
  company?: string | null;
  interests?: string[] | null;
  tags?: string[];
  photo_url?: string | null;
}

interface NetworkGraphProps {
  contacts: GraphContact[];
  relationships: any[]; // Raw DB relationships
  onNodeClick: (id: string) => void;
}

export default function NetworkGraphView({ contacts, relationships, onNodeClick }: NetworkGraphProps) {
  const { resolvedTheme } = useTheme();
  const fgRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ w: 800, h: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Resize handler
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Process Data into Nodes and Links
  const graphData = useMemo(() => {
    const nodes = contacts.map(c => {
       // Health score 0-100. 0 days = 100 health. 100 days = 0 health.
       const health = Math.max(10, 100 - c.days); 
       
       // Normalize to a smaller range for lighter, more delicate nodes (8-15 instead of 20-40)
       const normalizedSize = 8 + (health / 100) * 7;
       
       // Color based on tribe (simplistic for now)
       let color = '#94a3b8'; // slate-400 default
       if (c.tags && c.tags.length > 0) {
          const t = c.tags[0].toLowerCase();
          if (t.includes('investor')) color = '#eab308'; // gold
          else if (t.includes('startup') || t.includes('tech')) color = '#3b82f6'; // blue
          else if (t.includes('friend')) color = '#22c55e'; // green
          else if (t.includes('family')) color = '#ec4899'; // pink
       }

       return {
         id: c.dbId,
         name: c.name,
         val: normalizedSize, // size (normalized to 8-15 range for lighter appearance)
         color: color,
         contact: c
       };
    });

    const links: any[] = [];
    const addedLinks = new Set<string>();

    const addLink = (a: string, b: string, type: string) => {
        const id1 = a < b ? a : b;
        const id2 = a < b ? b : a;
        const key = `${id1}-${id2}`;
        if (!addedLinks.has(key)) {
            addedLinks.add(key);
            links.push({ source: a, target: b, type });
        }
    };

    // 1. Database Relationships
    relationships.forEach(rel => {
        // Find if both nodes exist in our current filtered subset
        const fromId = rel.from_person_id;
        const toId = rel.to_person_id;
        
        const hasA = nodes.find(n => n.id === fromId);
        const hasB = nodes.find(n => n.id === toId);
        if (hasA && hasB) {
            addLink(fromId, toId, 'manual');
        }
    });

    // 2. Company Matches
    for (let i = 0; i < contacts.length; i++) {
        for (let j = i + 1; j < contacts.length; j++) {
            const c1 = contacts[i];
            const c2 = contacts[j];
            
            // Company Match
            if (c1.company && c2.company && c1.company === c2.company) {
                 addLink(c1.dbId, c2.dbId, 'company');
            }
        }
    }

    return { nodes, links };
  }, [contacts, relationships]);

  const isDark = resolvedTheme === 'dark';

  return (
    <div ref={containerRef} className="w-full h-full">
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.w}
        height={dimensions.h}
        graphData={graphData}
        backgroundColor={isDark ? '#0f172a' : '#f8fafc'} // slate-900 or slate-50
        nodeLabel="name"
        nodeRelSize={4} // relative size based on 'val' (reduced from 6 for lighter appearance)
        linkColor={(link: any) => {
            if (link.type === 'manual') return isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)';
            if (link.type === 'company') return 'rgba(148, 163, 184, 0.2)'; // slate-400 with transparency
            return 'rgba(203, 213, 225, 0.15)';
        }}
        linkWidth={(link: any) => link.type === 'manual' ? 1.5 : 0.8}
        onNodeClick={(node: any) => {
            onNodeClick(node.id);
            // Center view?
            fgRef.current?.centerAt(node.x, node.y, 1000);
            fgRef.current?.zoom(4, 1000);
        }}
        // Custom painting for nicer nodes
        nodeCanvasObject={(node: any, ctx, globalScale) => {
            const label = node.name;
            const fontSize = 12/globalScale;
            
            // Draw circle with lighter appearance
            const r = Math.sqrt(Math.max(0, node.val || 1)) * 0.8; // Reduced scale factor from 1.5 to 0.8
            ctx.beginPath();
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
            
            // Add transparency to color for lighter appearance
            const hexToRgba = (hex: string, alpha: number) => {
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            };
            
            ctx.fillStyle = hexToRgba(node.color, 0.8); // 80% opacity for lighter look
            ctx.fill();

            // Text
            if (globalScale > 1.5) { // Only show text when zoomed in a bit
                ctx.font = `${fontSize}px Sans-Serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
                ctx.fillText(label, node.x, node.y + r + fontSize);
            }
        }}
        cooldownTicks={100}
      />
      
      {/* Overlay Legend or Stats */}
      <div className="absolute bottom-4 left-4 p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/10 text-xs text-white pointer-events-none">
         <div className="font-bold mb-2">Network Graph</div>
         <div>Nodes: {graphData.nodes.length}</div>
         <div>Links: {graphData.links.length}</div>
         <div className="mt-2 text-[10px] opacity-70">
            Drag to move • Scroll to zoom
         </div>
      </div>
    </div>
  );
}
