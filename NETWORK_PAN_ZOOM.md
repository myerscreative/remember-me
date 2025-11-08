# Network Page - Pan and Zoom Implementation

## Complete Implementation Guide

This guide provides the full pan and zoom functionality for your network visualization.

### Step 1: Add Transform State (After existing useState declarations, around line 23)

```typescript
// Add these new state variables after your existing useState declarations
const [transform, setTransform] = useState({
  x: 0,
  y: 0,
  scale: 1
});
const [isDragging, setIsDragging] = useState(false);
const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
const [lastPinchDistance, setLastPinchDistance] = useState<number | null>(null);

// Configuration constants
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 3;
const ZOOM_SENSITIVITY = 0.001;
const PINCH_SENSITIVITY = 0.01;
```

### Step 2: Add Helper Functions (Before the main component return, around line 500)

```typescript
// Calculate network boundaries for smart panning limits
const getNetworkBounds = () => {
  if (nodes.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  nodes.forEach(node => {
    const radius = getNodeRadius(node.connections.length);
    minX = Math.min(minX, node.x - radius);
    maxX = Math.max(maxX, node.x + radius);
    minY = Math.min(minY, node.y - radius);
    maxY = Math.max(maxY, node.y + radius);
  });

  // Add padding
  const padding = 200;
  return {
    minX: minX - padding,
    maxX: maxX + padding,
    minY: minY - padding,
    maxY: maxY + padding
  };
};

// Clamp pan to keep content visible
const clampTransform = (newTransform: { x: number; y: number; scale: number }) => {
  const bounds = getNetworkBounds();
  const viewWidth = containerSize.width;
  const viewHeight = containerSize.height;

  // Calculate the scaled dimensions
  const scaledWidth = viewWidth / newTransform.scale;
  const scaledHeight = viewHeight / newTransform.scale;

  // Calculate max pan values to keep content in view
  const maxX = Math.max(0, (bounds.maxX - bounds.minX) * newTransform.scale - viewWidth + 200);
  const maxY = Math.max(0, (bounds.maxY - bounds.minY) * newTransform.scale - viewHeight + 200);
  const minX = -200;
  const minY = -200;

  return {
    x: Math.max(minX, Math.min(maxX, newTransform.x)),
    y: Math.max(minY, Math.min(maxY, newTransform.y)),
    scale: newTransform.scale
  };
};

// Calculate distance between two touch points
const getTouchDistance = (touches: TouchList): number => {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
};

// Get center point of two touches
const getTouchCenter = (touches: TouchList): { x: number; y: number } => {
  return {
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2
  };
};
```

### Step 3: Add Event Handlers (After helper functions)

```typescript
// Mouse wheel zoom
const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
  e.preventDefault();
  
  if (!svgRef.current) return;
  
  const rect = svgRef.current.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  
  // Calculate zoom
  const delta = -e.deltaY * ZOOM_SENSITIVITY;
  const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, transform.scale * (1 + delta)));
  
  // Zoom toward cursor position
  const scaleRatio = newScale / transform.scale;
  const newX = mouseX - (mouseX - transform.x) * scaleRatio;
  const newY = mouseY - (mouseY - transform.y) * scaleRatio;
  
  setTransform(clampTransform({
    x: newX,
    y: newY,
    scale: newScale
  }));
};

// Mouse down - start dragging
const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
  // Only start drag on left click and not on a node
  if (e.button === 0 && e.target === e.currentTarget) {
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    e.preventDefault();
  }
};

// Mouse move - pan
const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
  if (!isDragging || !dragStart) return;
  
  const newX = e.clientX - dragStart.x;
  const newY = e.clientY - dragStart.y;
  
  setTransform(clampTransform({
    ...transform,
    x: newX,
    y: newY
  }));
};

// Mouse up - stop dragging
const handleMouseUp = () => {
  setIsDragging(false);
  setDragStart(null);
};

// Touch start
const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
  if (e.touches.length === 1) {
    // Single finger - start panning
    setIsDragging(true);
    setDragStart({ 
      x: e.touches[0].clientX - transform.x, 
      y: e.touches[0].clientY - transform.y 
    });
  } else if (e.touches.length === 2) {
    // Two fingers - start pinching
    setIsDragging(false);
    setLastPinchDistance(getTouchDistance(e.touches));
  }
};

// Touch move
const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
  e.preventDefault();
  
  if (e.touches.length === 1 && isDragging && dragStart) {
    // Single finger - pan
    const newX = e.touches[0].clientX - dragStart.x;
    const newY = e.touches[0].clientY - dragStart.y;
    
    setTransform(clampTransform({
      ...transform,
      x: newX,
      y: newY
    }));
  } else if (e.touches.length === 2 && lastPinchDistance !== null) {
    // Two fingers - pinch zoom
    if (!svgRef.current) return;
    
    const currentDistance = getTouchDistance(e.touches);
    const center = getTouchCenter(e.touches);
    const rect = svgRef.current.getBoundingClientRect();
    const centerX = center.x - rect.left;
    const centerY = center.y - rect.top;
    
    // Calculate zoom
    const delta = (currentDistance - lastPinchDistance) * PINCH_SENSITIVITY;
    const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, transform.scale * (1 + delta)));
    
    // Zoom toward pinch center
    const scaleRatio = newScale / transform.scale;
    const newX = centerX - (centerX - transform.x) * scaleRatio;
    const newY = centerY - (centerY - transform.y) * scaleRatio;
    
    setTransform(clampTransform({
      x: newX,
      y: newY,
      scale: newScale
    }));
    
    setLastPinchDistance(currentDistance);
  }
};

// Touch end
const handleTouchEnd = (e: React.TouchEvent<SVGSVGElement>) => {
  if (e.touches.length === 0) {
    setIsDragging(false);
    setDragStart(null);
    setLastPinchDistance(null);
  } else if (e.touches.length === 1) {
    // Switch back to pan mode if one finger remains
    setLastPinchDistance(null);
    setIsDragging(true);
    setDragStart({ 
      x: e.touches[0].clientX - transform.x, 
      y: e.touches[0].clientY - transform.y 
    });
  }
};

// Prevent click events when dragging
const handleNodeClick = (nodeId: string, e: React.MouseEvent | React.TouchEvent) => {
  // Only trigger click if not dragging
  if (!isDragging && !dragStart) {
    router.push(`/contacts/${nodeId}`);
  }
  e.stopPropagation();
};
```

### Step 4: Add Mouse Leave Handler (After event handlers)

```typescript
// Add global mouse up listener to handle drag ending outside SVG
useEffect(() => {
  const handleGlobalMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };
  
  window.addEventListener('mouseup', handleGlobalMouseUp);
  return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
}, []);
```

### Step 5: Reset Transform When Nodes Change (Add this useEffect)

```typescript
// Reset transform when nodes are first loaded or completely change
useEffect(() => {
  if (nodes.length > 0 && transform.scale === 1 && transform.x === 0 && transform.y === 0) {
    // Center the view on the network
    const bounds = getNetworkBounds();
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    
    setTransform({
      x: containerSize.width / 2 - centerX,
      y: containerSize.height / 2 - centerY,
      scale: 1
    });
  }
}, [nodes.length, containerSize]);
```

### Step 6: Update SVG Element (Replace your SVG element, around line 640)

```jsx
<svg
  ref={svgRef}
  width="100%"
  height="100%"
  className="absolute inset-0"
  style={{ 
    minHeight: "500px",
    cursor: isDragging ? 'grabbing' : 'grab',
    touchAction: 'none' // Prevent default touch behaviors
  }}
  onWheel={handleWheel}
  onMouseDown={handleMouseDown}
  onMouseMove={handleMouseMove}
  onMouseUp={handleMouseUp}
  onMouseLeave={handleMouseUp}
  onTouchStart={handleTouchStart}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
>
  {/* Wrap all content in a transform group */}
  <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
    {/* Draw edges */}
    {edges.map((edge, index) => {
      const fromNode = nodes.find((n) => n.id === edge.from);
      const toNode = nodes.find((n) => n.id === edge.to);

      if (!fromNode || !toNode) return null;

      return (
        <line
          key={`edge-${index}`}
          x1={fromNode.x}
          y1={fromNode.y}
          x2={toNode.x}
          y2={toNode.y}
          stroke="#e5e7eb"
          strokeWidth="1.5"
          className="pointer-events-none"
        />
      );
    })}

    {/* Central "You" node */}
    <g>
      <circle
        cx={centerX}
        cy={centerY}
        r={36}
        fill="#3b82f6"
        stroke="#2563eb"
        strokeWidth="2"
        className="cursor-pointer transition-all hover:opacity-90"
      />
      <text
        x={centerX}
        y={centerY - 6}
        textAnchor="middle"
        className="text-sm font-bold fill-white pointer-events-none select-none"
      >
        You
      </text>
    </g>

    {/* Draw nodes - IMPORTANT: Update onClick handler */}
    {nodes.map((node) => {
      const radius = getNodeRadius(node.connections.length);
      const isSelected = selectedNode === node.id;
      const isFavorite = favorites.has(node.id);
      const birthdaySoon = isBirthdaySoon(node.person.birthday);
      
      const useCakeShape = birthdaySoon;
      const cakeWidth = radius * 2.2;
      const cakeHeight = radius * 2.6;

      return (
        <g 
          key={node.id}
          transform={`translate(${node.x}, ${node.y})`}
        >
          {useCakeShape ? (
            <rect
              x={-cakeWidth / 2}
              y={-cakeHeight / 2}
              width={cakeWidth}
              height={cakeHeight}
              rx={8}
              ry={8}
              fill={isFavorite ? "#fef3c7" : "#fff5e6"}
              stroke={isFavorite ? "#f59e0b" : isSelected ? "#3b82f6" : "#ff9800"}
              strokeWidth={isFavorite ? "3" : isSelected ? "3" : "2.5"}
              className="cursor-pointer transition-all hover:stroke-orange-500"
              onClick={(e) => handleNodeClick(node.id, e)}
              onMouseEnter={() => setSelectedNode(node.id)}
              onMouseLeave={() => setSelectedNode(null)}
              onContextMenu={(e) => handleToggleFavorite(node.id, e)}
            />
          ) : (
            <circle
              cx={0}
              cy={0}
              r={radius}
              fill={isFavorite ? "#fef3c7" : "#ffffff"}
              stroke={isFavorite ? "#f59e0b" : isSelected ? "#3b82f6" : "#bfdbfe"}
              strokeWidth={isFavorite ? "3" : isSelected ? "3" : "2"}
              className="cursor-pointer transition-all hover:stroke-blue-400"
              onClick={(e) => handleNodeClick(node.id, e)}
              onMouseEnter={() => setSelectedNode(node.id)}
              onMouseLeave={() => setSelectedNode(null)}
              onContextMenu={(e) => handleToggleFavorite(node.id, e)}
            />
          )}

          {/* Keep all your existing text rendering code here */}
          {/* ... text elements ... */}
        </g>
      );
    })}
  </g>
</svg>
```

### Step 7: Add Zoom Controls UI (Optional - Add after the SVG, before empty state)

```jsx
{/* Zoom Controls */}
<div className="absolute bottom-6 right-6 flex flex-col gap-2 bg-white rounded-lg shadow-lg p-2 border border-gray-200">
  <button
    onClick={() => {
      const newScale = Math.min(MAX_ZOOM, transform.scale * 1.2);
      
      // Zoom toward viewport center
      const viewportCenterX = containerSize.width / 2;
      const viewportCenterY = containerSize.height / 2;
      
      const scaleRatio = newScale / transform.scale;
      const newX = viewportCenterX - (viewportCenterX - transform.x) * scaleRatio;
      const newY = viewportCenterY - (viewportCenterY - transform.y) * scaleRatio;
      
      setTransform(clampTransform({
        x: newX,
        y: newY,
        scale: newScale
      }));
    }}
    className="p-2 hover:bg-gray-100 rounded transition-colors"
    title="Zoom in"
  >
    <Plus className="h-5 w-5" />
  </button>
  
  <button
    onClick={() => {
      const newScale = Math.max(MIN_ZOOM, transform.scale / 1.2);
      
      // Zoom toward viewport center
      const viewportCenterX = containerSize.width / 2;
      const viewportCenterY = containerSize.height / 2;
      
      const scaleRatio = newScale / transform.scale;
      const newX = viewportCenterX - (viewportCenterX - transform.x) * scaleRatio;
      const newY = viewportCenterY - (viewportCenterY - transform.y) * scaleRatio;
      
      setTransform(clampTransform({
        x: newX,
        y: newY,
        scale: newScale
      }));
    }}
    className="p-2 hover:bg-gray-100 rounded transition-colors"
    title="Zoom out"
  >
    <Minus className="h-5 w-5" />
  </button>
  
  <button
    onClick={() => {
      setTransform({ x: 0, y: 0, scale: 1 });
    }}
    className="p-2 hover:bg-gray-100 rounded transition-colors"
    title="Reset view"
  >
    <RotateCcw className="h-5 w-5" />
  </button>
  
  <div className="text-xs text-gray-500 text-center px-1 py-1 border-t border-gray-200">
    {Math.round(transform.scale * 100)}%
  </div>
</div>
```

**Important:** Also add the lucide-react icons to your imports:
```typescript
import { Search, Settings, Plus, Minus, RotateCcw } from "lucide-react";
```

## Key Features Implemented

1. **Mouse Wheel Zoom**: Zoom in/out with scroll wheel, centered on cursor position
2. **Click and Drag Pan**: Click empty space and drag to pan around
3. **Pinch to Zoom**: Two-finger pinch on mobile devices
4. **Touch Pan**: Single finger drag on mobile
5. **Smart Boundaries**: Prevents panning too far from network content
6. **Zoom Limits**: Constrained between 0.3x and 3x
7. **Drag Prevention**: Distinguishes between click and drag on nodes
8. **Smooth Interaction**: Natural feeling zoom and pan
9. **Reset Button**: Quickly return to default view
10. **Zoom Display**: Shows current zoom percentage

## Testing Checklist

- [ ] Mouse wheel zoom works and centers on cursor
- [ ] Click and drag pans the view
- [ ] Node clicks still navigate (no accidental clicks while dragging)
- [ ] Touch pan works on mobile
- [ ] Pinch zoom works on mobile
- [ ] Can't pan beyond reasonable boundaries
- [ ] Zoom controls work
- [ ] Reset button returns to default view
- [ ] Performance is smooth with many nodes
- [ ] Right-click favorite toggle still works

## Performance Notes

- Transform is applied at the group level for efficiency
- Clamping calculations are optimized
- Touch events use `touchAction: 'none'` to prevent browser defaults
- All interactions feel native and responsive

## Troubleshooting

**Issue**: Nodes don't respond to clicks after panning
**Fix**: Ensure `handleNodeClick` checks `isDragging` state

**Issue**: Pan is too sensitive or not sensitive enough
**Fix**: Adjust drag calculation or add damping factor

**Issue**: Pinch zoom feels jerky
**Fix**: Adjust `PINCH_SENSITIVITY` constant (try 0.005 or 0.02)

**Issue**: Can pan too far away from network
**Fix**: Adjust padding in `getNetworkBounds` or clamping logic

## Important Notes

### Zoom Button Centering

The zoom control buttons (+ and -) use the same centering logic as the mouse wheel zoom handler. When you click these buttons, the zoom is centered on the viewport center, not on the origin (0,0). This ensures the network stays centered and doesn't move up and to the left during zoom.

The formula used is:
```typescript
const scaleRatio = newScale / transform.scale;
const newX = viewportCenterX - (viewportCenterX - transform.x) * scaleRatio;
const newY = viewportCenterY - (viewportCenterY - transform.y) * scaleRatio;
```

This keeps the point at the viewport center stationary while everything else scales around it.

