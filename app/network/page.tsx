"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Person, Relationship } from "@/types/database.types";
import Link from "next/link";
import { Search, Settings, Plus, Minus, RotateCcw } from "lucide-react";
import { getInitialsFromFullName, formatBirthday } from "@/lib/utils/contact-helpers";
import { ErrorFallback } from "@/components/error-fallback";

interface NetworkNode {
  id: string;
  person: Person;
  x: number;
  y: number;
  connections: string[]; // IDs of connected nodes
}

interface NetworkEdge {
  from: string;
  to: string;
}

export default function NetworkPage() {
  const router = useRouter();
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [edges, setEdges] = useState<NetworkEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState<Error | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [userProfile, setUserProfile] = useState<{ photo_url?: string | null; name?: string; email?: string } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const positionsInitialized = useRef(false);
  const favoritesInitialized = useRef(false);
  const [containerSize, setContainerSize] = useState({ width: typeof window !== 'undefined' ? window.innerWidth : 800, height: typeof window !== 'undefined' ? window.innerHeight - 200 : 600 });

  // Transform state for pan and zoom
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

  // Helper function to calculate node radius - now fixed for consistency
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getNodeRadius = (connectionsCount: number) => {
    return 45; // Fixed radius for container collision detection
  };

  // Calculate actual card height based on content
  const getCardHeight = (person: Person): number => {
    const photoRadius = 30;
    const topPadding = 18;
    const spaceAfterPhoto = 18;
    const lineHeight = 14;
    const spaceBeforeBirthday = 2;
    const birthdayLineHeight = 12;
    const bottomPadding = 8;
    
    const hasLastName = person.last_name || (person.name && person.name.split(' ').length > 1);
    const birthdaySoon = isBirthdaySoon(person.birthday);
    
    let height = topPadding + (photoRadius * 2) + spaceAfterPhoto + lineHeight;
    if (hasLastName) {
      height += lineHeight;
    }
    if (birthdaySoon && person.birthday) {
      height += spaceBeforeBirthday + birthdayLineHeight;
    }
    height += bottomPadding;
    
    return height;
  };

  // Calculate network boundaries for smart panning limits
  const getNetworkBounds = () => {
    if (nodes.length === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    nodes.forEach(node => {
      const cardHeight = getCardHeight(node.person);
      const cardWidth = 100;
      const halfWidth = cardWidth / 2;
      const halfHeight = cardHeight / 2;
      minX = Math.min(minX, node.x - halfWidth);
      maxX = Math.max(maxX, node.x + halfWidth);
      minY = Math.min(minY, node.y - halfHeight);
      maxY = Math.max(maxY, node.y + halfHeight);
    });

    // Add padding
    const padding = 75; // Cut in half for very tight spacing
    return {
      minX: minX - padding,
      maxX: maxX + padding,
      minY: minY - padding,
      maxY: maxY + padding
    };
  };

  // Clamp pan to keep content visible
  const clampTransform = (newTransform: { x: number; y: number; scale: number }) => {
    // Don't clamp at all if network is small or zoomed out
    if (nodes.length === 0 || newTransform.scale < 0.8) {
      return newTransform;
    }
    
    // Very lenient bounds - just prevent extreme values
    const maxOffset = 2000;
    
    return {
      x: Math.max(-maxOffset, Math.min(maxOffset, newTransform.x)),
      y: Math.max(-maxOffset, Math.min(maxOffset, newTransform.y)),
      scale: newTransform.scale
    };
  };

  // Calculate distance between two touch points
  const getTouchDistance = (touches: React.TouchList): number => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Get center point of two touches
  const getTouchCenter = (touches: React.TouchList): { x: number; y: number } => {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    };
  };

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

  // Load favorites from localStorage and set Tom as favorite (only once when nodes are first loaded)
  useEffect(() => {
    if (nodes.length === 0 || favoritesInitialized.current) return;
    
    const savedFavorites = localStorage.getItem("networkFavorites");
    let currentFavorites: string[] = [];
    
    if (savedFavorites) {
      try {
        currentFavorites = JSON.parse(savedFavorites);
        setFavorites(new Set(currentFavorites));
      } catch (e) {
        console.error("Error parsing favorites:", e);
      }
    }
    
    // Set Tom as favorite if not already set (only once)
    const tomPerson = nodes.find(n => {
      const firstName = n.person.first_name || n.person.name?.split(' ')[0] || '';
      return firstName.toLowerCase().includes("tom");
    });
    if (tomPerson && !currentFavorites.includes(tomPerson.id)) {
      const newFavs = [...currentFavorites, tomPerson.id];
      setFavorites(new Set(newFavs));
      localStorage.setItem("networkFavorites", JSON.stringify(newFavs));
    }
    
    favoritesInitialized.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length]); // Only depend on nodes.length, not the array itself - nodes is used but intentionally not in deps

  // Load data immediately
  useEffect(() => {
    async function loadNetwork() {
      // Reset errors
      setFatalError(null);
      
      try {
        const supabase = createClient();
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        
        if (!user) {
          setLoading(false);
          return;
        }

        // Load user profile (photo_url from metadata or localStorage)
        const userPhotoUrl = user.user_metadata?.photo_url || localStorage.getItem('userPhotoUrl');
        const userName = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'You';
        setUserProfile({
          photo_url: userPhotoUrl || null,
          name: userName,
          email: user.email || undefined
        });

        // Fetch all contacts
        const { data, error: personsError } = await (supabase as any)
          .from("persons")
          .select("*")
          .eq("user_id", user.id)
          .order("name");

        if (personsError) {
          console.error("Error fetching persons:", personsError);
          throw personsError;
        }

        const persons = (data || []) as Person[];

        // Debug: Log first person to see what fields are available
        if (persons && persons.length > 0) {
          console.log("Sample person data:", {
            name: persons[0].name,
            hasBirthday: 'birthday' in persons[0],
            birthday: persons[0].birthday,
            allFields: Object.keys(persons[0])
          });
        }

        if (!persons || persons.length === 0) {
          setNodes([]);
          setEdges([]);
          setLoading(false);
          return;
        }

        // Fetch all relationships
        const personIds = persons.map((p: any) => p.id);
        let relationships: Relationship[] = [];
        
        if (personIds.length > 0) {
          // Fetch relationships where any person is involved (as from_person or to_person)
          const { data: data1, error: error1 } = await (supabase as any)
            .from("relationships")
            .select("*")
            .in("from_person_id", personIds);

          if (error1) throw error1;

          const { data: data2, error: error2 } = await (supabase as any)
            .from("relationships")
            .select("*")
            .in("to_person_id", personIds);

          if (error2) throw error2;

          const rels1 = (data1 || []) as Relationship[];
          const rels2 = (data2 || []) as Relationship[];

          // Combine and deduplicate
          const allRels = [...rels1, ...rels2];
          const uniqueRels = allRels.filter((rel, index, self) =>
            index === self.findIndex((r) => r.id === rel.id)
          );
          relationships = uniqueRels;
        }

        // Build network nodes and edges
        const networkNodes: NetworkNode[] = [];
        const networkEdges: NetworkEdge[] = [];

        // Create a map of person IDs to connected person IDs
        const connectionMap = new Map<string, Set<string>>();

        // Process relationships
        relationships.forEach((rel: Relationship) => {
          const fromId = rel.from_person_id;
          const toId = rel.to_person_id;

          // Add bidirectional connections
          if (!connectionMap.has(fromId)) {
            connectionMap.set(fromId, new Set());
          }
          if (!connectionMap.has(toId)) {
            connectionMap.set(toId, new Set());
          }

          connectionMap.get(fromId)!.add(toId);
          connectionMap.get(toId)!.add(fromId);

          // Add edge
          networkEdges.push({ from: fromId, to: toId });
        });

        // Create nodes (positions will be calculated in useEffect)
        persons?.forEach((person: Person) => {
          networkNodes.push({
            id: person.id,
            person,
            x: typeof window !== 'undefined' ? window.innerWidth / 2 : 400, // Initialize to center, will be repositioned
            y: typeof window !== 'undefined' ? (window.innerHeight - 200) / 2 : 300, // Initialize to center, will be repositioned
            connections: Array.from(connectionMap.get(person.id) || []),
          });
        });

        setNodes(networkNodes);
        setEdges(networkEdges);
        positionsInitialized.current = false;
        favoritesInitialized.current = false; // Reset so favorites can be reloaded
        
        // Trigger positioning after a small delay to ensure DOM is ready
        // Try multiple times with increasing delays to ensure SVG is rendered
        const tryUpdateContainerSize = (attempt = 0) => {
          if (svgRef.current?.parentElement) {
            const rect = svgRef.current.parentElement.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              setContainerSize({ width: rect.width, height: rect.height });
              return;
            }
          }
          // Retry up to 5 times with increasing delays
          if (attempt < 5) {
            setTimeout(() => tryUpdateContainerSize(attempt + 1), 50 * (attempt + 1));
          }
        };
        setTimeout(() => tryUpdateContainerSize(), 100);
      } finally {
        setLoading(false);
      }
    }

    loadNetwork();
  }, []);

  // Get container size
  useEffect(() => {
    const updateSize = () => {
      if (svgRef.current?.parentElement) {
        const rect = svgRef.current.parentElement.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setContainerSize({ width: rect.width, height: rect.height });
        }
      } else {
        // Fallback: use window size
        if (typeof window !== 'undefined') {
          setContainerSize({ width: window.innerWidth, height: window.innerHeight - 200 });
        }
      }
    };

    // Initial size with multiple attempts to ensure container is ready
    const timer1 = setTimeout(updateSize, 0);
    const timer2 = setTimeout(updateSize, 50);
    const timer3 = setTimeout(updateSize, 100);
    
    window.addEventListener("resize", updateSize);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  // Toggle favorite status
  const handleToggleFavorite = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent node click
    const newFavorites = new Set(favorites);
    if (newFavorites.has(nodeId)) {
      newFavorites.delete(nodeId);
    } else {
      newFavorites.add(nodeId);
    }
    setFavorites(newFavorites);
    localStorage.setItem("networkFavorites", JSON.stringify(Array.from(newFavorites)));
    
    // Note: Repositioning will happen automatically via the positioning useEffect when favorites change
  };

  // Calculate positions when nodes are first loaded or container size changes
  useEffect(() => {
    if (nodes.length === 0) return;
    
    // Get actual container size with multiple fallbacks
    let width = containerSize.width;
    let height = containerSize.height;
    let usedFallback = false;
    
    // If containerSize not set, try to get it directly from the SVG element
    if ((width === 0 || height === 0) && svgRef.current?.parentElement) {
      const rect = svgRef.current.parentElement.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        width = rect.width;
        height = rect.height;
        usedFallback = true;
      }
    }
    
    // Final fallback to window size
    if (width === 0 || height === 0) {
      width = typeof window !== 'undefined' ? window.innerWidth : 800;
      height = typeof window !== 'undefined' ? window.innerHeight - 200 : 600;
      usedFallback = true;
    }
    
    // Force a minimum size to prevent issues
    width = Math.max(width, 800);
    height = Math.max(height, 600);
    
    // If containerSize just became valid (was 0, now has real value), force reposition
    const containerSizeJustBecameValid = containerSize.width > 0 && containerSize.height > 0 && !usedFallback;
    if (containerSizeJustBecameValid && positionsInitialized.current) {
      positionsInitialized.current = false; // Force reposition with correct size
    }

    // Calculate days since last contact for each node
    const now = new Date();
    const getDaysSinceContact = (lastContact: string | null): number => {
      if (!lastContact) return 999; // Very far if never contacted
      const contactDate = new Date(lastContact);
      const diffTime = now.getTime() - contactDate.getTime();
      return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    };

    setNodes((prevNodes) => {
      // Check if positions need initializing
      // If all nodes are at center (initial position), they need to be positioned
      const centerX = width / 2;
      const centerY = height / 2;
      const needsInit = !positionsInitialized.current || prevNodes.every(node => 
        Math.abs(node.x - centerX) < 10 && Math.abs(node.y - centerY) < 10
      );
      
      if (needsInit || favorites.size > 0) {
        positionsInitialized.current = true;
        
        // Sort nodes: favorites first, then by recency
        const sortedNodes = [...prevNodes].sort((a: any, b: any) => {
          const aIsFavorite = favorites.has(a.id);
          const bIsFavorite = favorites.has(b.id);
          
          if (aIsFavorite && !bIsFavorite) return -1;
          if (!aIsFavorite && bIsFavorite) return 1;
          
          // Both favorites or both not favorites - sort by recency
          const aDays = getDaysSinceContact(a.person.last_contact);
          const bDays = getDaysSinceContact(b.person.last_contact);
          return aDays - bDays;
        });

        if (sortedNodes.length === 0) return prevNodes;

        // Find the maximum node size to ensure no overlap with center badge
        // Use actual card dimensions (height and width) for accurate spacing
        const maxNodeSize = Math.max(
          ...sortedNodes.map(node => {
            const cardHeight = getCardHeight(node.person);
            const cardWidth = 100; // Fixed width
            // Use the larger dimension (diagonal) to ensure no overlap
            return Math.max(cardHeight / 2, cardWidth / 2);
          })
        );

        // Badge spacing constants - use actual card dimensions
        const badgeSize = maxNodeSize * 2; // Diameter based on largest card dimension
        const minSpacing = 12; // Increased spacing to prevent card overlap
        const totalContacts = sortedNodes.length;

        // Calculate minimum radius needed to prevent overlap
        const requiredCircumference = totalContacts * (badgeSize + minSpacing);
        const calculatedRadius = requiredCircumference / (2 * Math.PI);

        // Dynamic radius based on contact count - VERY TIGHT SPACING
        const getRadiusForContactCount = (count: number) => {
          if (count <= 6) return 90;    // Cut in half from 180
          if (count <= 12) return 75;   // Cut in half from 150
          // For many contacts, decrease radius to keep them grouped
          return Math.max(60, 90 - (count * 1.5)); // Cut in half
        };

        // Base radius from contact count
        let baseRadius = getRadiusForContactCount(totalContacts);

        // Use larger of: calculated radius (to prevent overlap) or dynamic radius
        baseRadius = Math.max(baseRadius, calculatedRadius);

        // Responsive adjustments based on viewport
        const viewportMaxRadius = Math.min(width, height) * 0.35; // 35% of smaller dimension
        const absoluteMaxRadius = 140; // Cut in half from 280
        const maxRadius = Math.min(viewportMaxRadius, absoluteMaxRadius);

        // Enforce maximum radius
        baseRadius = Math.min(baseRadius, maxRadius);

        // Ensure minimum distance from "You" node (100px card width + gap + max node size)
        const youCardSize = 100; // Card width/height
        const minDistance = youCardSize / 2 + 8 + maxNodeSize; // Increased gap to prevent overlap
        baseRadius = Math.max(baseRadius, minDistance);

        // Multi-ring layout for many contacts
        const contactsPerRing = 8;
        const useMultiRing = totalContacts > contactsPerRing && baseRadius >= maxRadius * 0.85;

        // If using multi-ring, recalculate first ring radius to fit contactsPerRing nicely
        let firstRingRadius = baseRadius;
        if (useMultiRing) {
          // Calculate optimal radius for first ring with contactsPerRing contacts
          const firstRingCircumference = contactsPerRing * (badgeSize + minSpacing);
          const optimalFirstRingRadius = firstRingCircumference / (2 * Math.PI);
          firstRingRadius = Math.max(minDistance, Math.min(optimalFirstRingRadius, maxRadius * 0.7));
        }

        // Distribute badges evenly around circle(s)
        return sortedNodes.map((node, index) => {
          let radius: number;
          let angle: number;

          if (useMultiRing) {
            // Multi-ring layout
            const ringIndex = Math.floor(index / contactsPerRing);
            const positionInRing = index % contactsPerRing;
            const contactsInRing = ringIndex === Math.floor((totalContacts - 1) / contactsPerRing)
              ? totalContacts - (ringIndex * contactsPerRing) // Last ring may have fewer contacts
              : contactsPerRing;

            // Each ring progressively further out, with spacing
            const ringSpacing = 60; // Increased spacing to prevent overlap between rings
            radius = firstRingRadius + (ringIndex * ringSpacing);
            
            // Clamp radius to maximum
            radius = Math.min(radius, maxRadius);

            // Calculate angle for this position in the ring
            const angleStep = (2 * Math.PI) / contactsInRing;
            angle = -Math.PI / 2 + (angleStep * positionInRing);
          } else {
            // Single ring layout
            radius = baseRadius;
            const angleStep = (2 * Math.PI) / totalContacts;
            angle = -Math.PI / 2 + (angleStep * index);
          }

          // Calculate x, y position using polar coordinates
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);

          return {
            ...node,
            x,
            y,
          };
        });
      }
      
      // Update positions based on new container size
      if (prevNodes.length === 0) return prevNodes;

      // Find the maximum node size - use actual card dimensions
      const maxNodeSize = Math.max(
        ...prevNodes.map(node => {
          const cardHeight = getCardHeight(node.person);
          const cardWidth = 100; // Fixed width
          // Use the larger dimension (diagonal) to ensure no overlap
          return Math.max(cardHeight / 2, cardWidth / 2);
        })
      );

      // Badge spacing constants - use actual card dimensions
      const badgeSize = maxNodeSize * 2; // Diameter based on largest card dimension
      const minSpacing = 12; // Increased spacing to prevent card overlap
      const totalContacts = prevNodes.length;

      // Calculate minimum radius needed to prevent overlap
      const requiredCircumference = totalContacts * (badgeSize + minSpacing);
      const calculatedRadius = requiredCircumference / (2 * Math.PI);

      // Dynamic radius based on contact count - VERY TIGHT SPACING
      const getRadiusForContactCount = (count: number) => {
        if (count <= 6) return 90;    // Cut in half from 180
        if (count <= 12) return 75;   // Cut in half from 150
        // For many contacts, decrease radius to keep them grouped
        return Math.max(60, 90 - (count * 1.5)); // Cut in half
      };

      // Base radius from contact count
      let baseRadius = getRadiusForContactCount(totalContacts);

      // Use larger of: calculated radius (to prevent overlap) or dynamic radius
      baseRadius = Math.max(baseRadius, calculatedRadius);

      // Responsive adjustments based on viewport
      const viewportMaxRadius = Math.min(width, height) * 0.35; // 35% of smaller dimension
      const absoluteMaxRadius = 140; // Cut in half from 280
      const maxRadius = Math.min(viewportMaxRadius, absoluteMaxRadius);

      // Enforce maximum radius
      baseRadius = Math.min(baseRadius, maxRadius);

      // Ensure minimum distance from "You" node (100px card width + gap + max node size)
      const youCardSize = 100; // Card width/height
      const minDistance = youCardSize / 2 + 8 + maxNodeSize; // Increased gap to prevent overlap
      baseRadius = Math.max(baseRadius, minDistance);

      // Multi-ring layout for many contacts
      const contactsPerRing = 8;
      const useMultiRing = totalContacts > contactsPerRing && baseRadius >= maxRadius * 0.85;

      // If using multi-ring, recalculate first ring radius to fit contactsPerRing nicely
      let firstRingRadius = baseRadius;
      if (useMultiRing) {
        // Calculate optimal radius for first ring with contactsPerRing contacts
        const firstRingCircumference = contactsPerRing * (badgeSize + minSpacing);
        const optimalFirstRingRadius = firstRingCircumference / (2 * Math.PI);
        firstRingRadius = Math.max(minDistance, Math.min(optimalFirstRingRadius, maxRadius * 0.7));
      }

      return prevNodes.map((node, index) => {
        let radius: number;
        let angle: number;

        if (useMultiRing) {
          // Multi-ring layout
          const ringIndex = Math.floor(index / contactsPerRing);
          const positionInRing = index % contactsPerRing;
          const contactsInRing = ringIndex === Math.floor((totalContacts - 1) / contactsPerRing)
            ? totalContacts - (ringIndex * contactsPerRing) // Last ring may have fewer contacts
            : contactsPerRing;

          // Each ring progressively further out, with spacing
          const ringSpacing = 45; // Cut in half for very tight spacing
          radius = firstRingRadius + (ringIndex * ringSpacing);
          
          // Clamp radius to maximum
          radius = Math.min(radius, maxRadius);

          // Calculate angle for this position in the ring
          const angleStep = (2 * Math.PI) / contactsInRing;
          angle = -Math.PI / 2 + (angleStep * positionInRing);
        } else {
          // Single ring layout
          radius = baseRadius;
          const angleStep = (2 * Math.PI) / totalContacts;
          angle = -Math.PI / 2 + (angleStep * index);
        }

        const newX = centerX + radius * Math.cos(angle);
        const newY = centerY + radius * Math.sin(angle);
        
        // Only update if position changed significantly
        if (Math.abs(node.x - newX) < 1 && Math.abs(node.y - newY) < 1) {
          return node;
        }
        return {
          ...node,
          x: newX,
          y: newY,
        };
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerSize.width, containerSize.height, nodes.length, favorites]);

  // Check if birthday is within one week
  const isBirthdaySoon = (birthday: string | null): boolean => {
    if (!birthday) return false;
    
    try {
      // Parse date string manually to avoid timezone issues
      // Format: YYYY-MM-DD
      const parts = birthday.split('-');
      if (parts.length !== 3) return false;
      
      const birthYear = parseInt(parts[0], 10);
      const birthMonth = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const birthDay = parseInt(parts[2], 10);
      
      if (isNaN(birthYear) || isNaN(birthMonth) || isNaN(birthDay)) return false;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const currentYear = today.getFullYear();
      
      // Set birthday to current year (using local time, not UTC)
      const birthdayThisYear = new Date(currentYear, birthMonth, birthDay);
      birthdayThisYear.setHours(0, 0, 0, 0);
      
      // If birthday already passed this year, check next year
      const birthdayToCheck = birthdayThisYear < today 
        ? new Date(currentYear + 1, birthMonth, birthDay)
        : birthdayThisYear;
      birthdayToCheck.setHours(0, 0, 0, 0);
      
      const diffTime = birthdayToCheck.getTime() - today.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      // Debug logging
      console.log('Birthday check:', {
        birthday,
        birthYear,
        birthMonth: birthMonth + 1, // Show 1-indexed for readability
        birthDay,
        today: today.toISOString(),
        birthdayThisYear: birthdayThisYear.toISOString(),
        birthdayToCheck: birthdayToCheck.toISOString(),
        diffDays,
        shouldShow: diffDays >= 0 && diffDays <= 7
      });
      
      return diffDays >= 0 && diffDays <= 7;
    } catch (error) {
      console.error('Error checking birthday:', error, birthday);
      return false;
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

  // Add global mouse up listener to handle drag ending outside SVG
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setDragStart(null);
    };
    
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length, containerSize]);

  if (fatalError) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <ErrorFallback 
          error={fatalError} 
          reset={() => window.location.reload()} 
          title="Network visualization failed"
          message="We couldn't load your network graph. Please try reloading the page."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading network...</div>
      </div>
    );
  }

  // Calculate center position for "You" node
  // Use actual container size or fallback to window size
  const centerX = containerSize.width > 0 
    ? containerSize.width / 2 
    : (typeof window !== 'undefined' ? window.innerWidth / 2 : 400);
  const centerY = containerSize.height > 0 
    ? containerSize.height / 2 
    : (typeof window !== 'undefined' ? (window.innerHeight - 200) / 2 : 300);

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-10">
        <div className="w-8" /> {/* Spacer */}
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Network</h1>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <Search className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Network Visualization */}
      <div className="flex-1 relative overflow-hidden bg-gray-50 dark:bg-gray-900">
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
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-gray-300 dark:text-gray-600 pointer-events-none"
              />
            );
          })}

          {/* Central "You" node - Rounded rectangle matching card style */}
          {(() => {
            const youCardWidth = 100;
            const youCardHeight = 90; // Reduced height since no name needed
            const photoRadius = 30;
            const photoY = 0; // Center vertically since no name below
            
            return (
              <g transform={`translate(${centerX}, ${centerY})`}>
                {/* Background card */}
            <rect
              x={-youCardWidth/2}
              y={-youCardHeight/2}
              width={youCardWidth}
              height={youCardHeight}
              rx={12}
              fill="currentColor"
              stroke="#3b82f6"
              strokeWidth="2.5"
              className="text-white dark:text-gray-800 cursor-pointer transition-all hover:stroke-blue-500"
            />

            {/* Definitions for photo/initials */}
            <defs>
              {/* Clip path for circular photo */}
              <clipPath id="clip-you">
                <circle cx={0} cy={photoY} r={photoRadius} />
              </clipPath>
              
              {/* Gradient for initials fallback */}
              <linearGradient id="gradient-you" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
            </defs>

            {/* Photo circle or initials */}
            {userProfile?.photo_url ? (
              <image
                href={userProfile.photo_url}
                x={-photoRadius}
                y={photoY - photoRadius}
                width={photoRadius * 2}
                height={photoRadius * 2}
                preserveAspectRatio="xMidYMid slice"
                clipPath="url(#clip-you)"
                className="pointer-events-none"
              />
            ) : (
              <>
                {/* Initials background circle */}
                <circle
                  cx={0}
                  cy={photoY}
                  r={photoRadius}
                  fill="url(#gradient-you)"
                  className="pointer-events-none"
                />
              </>
            )}
            
            {/* Photo border */}
            <circle
              cx={0}
              cy={photoY}
              r={photoRadius}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-blue-600 dark:text-blue-400 pointer-events-none"
            />
              </g>
            );
          })()}

          {/* Draw nodes - CLEAN LAYOUT */}
          {nodes.map((node) => {
            const isSelected = selectedNode === node.id;
            const isFavorite = favorites.has(node.id);
            const birthdaySoon = isBirthdaySoon(node.person.birthday);
            
            // Container dimensions - calculate dynamically based on content
            const containerWidth = 100;
            const photoRadius = 30;
            const topPadding = 18;
            const spaceAfterPhoto = 18;
            const lineHeight = 14;
            const spaceBeforeBirthday = 2;
            const birthdayLineHeight = 12;
            const bottomPadding = 8;
            
            const hasLastName = node.person.last_name || (node.person.name && node.person.name.split(' ').length > 1);
            
            // Calculate height based on actual content
            let containerHeight = topPadding + (photoRadius * 2) + spaceAfterPhoto + lineHeight;
            if (hasLastName) {
              containerHeight += lineHeight;
            }
            if (birthdaySoon && node.person.birthday) {
              containerHeight += spaceBeforeBirthday + birthdayLineHeight;
            }
            containerHeight += bottomPadding;
            
            const photoY = -containerHeight/2 + topPadding + photoRadius;
            const nameStartY = photoY + photoRadius + spaceAfterPhoto;
            const birthdayY = nameStartY + (hasLastName ? lineHeight * 2 : lineHeight) + spaceBeforeBirthday;

            return (
              <g 
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
              >
                {/* Background card */}
                <rect
                  x={-containerWidth/2}
                  y={-containerHeight/2}
                  width={containerWidth}
                  height={containerHeight}
                  rx={12}
                  fill="currentColor"
                  stroke={isFavorite ? "#f59e0b" : isSelected ? "#3b82f6" : "currentColor"}
                  strokeWidth={isFavorite ? "3" : isSelected ? "2.5" : "1.5"}
                  className="text-white dark:text-gray-800 stroke-gray-200 dark:stroke-gray-700 cursor-pointer transition-all hover:stroke-blue-400"
                  onClick={(e) => handleNodeClick(node.id, e)}
                  onMouseEnter={() => setSelectedNode(node.id)}
                  onMouseLeave={() => setSelectedNode(null)}
                  onContextMenu={(e) => handleToggleFavorite(node.id, e)}
                />

                {/* Definitions for photo/initials */}
                <defs>
                  {/* Clip path for circular photo */}
                  <clipPath id={`clip-${node.id}`}>
                    <circle cx={0} cy={photoY} r={photoRadius} />
                  </clipPath>
                  
                  {/* Gradient for initials fallback */}
                  <linearGradient id={`gradient-${node.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>

                {/* Photo circle or initials */}
                {node.person.photo_url ? (
                  <image
                    href={node.person.photo_url}
                    x={-photoRadius}
                    y={photoY - photoRadius}
                    width={photoRadius * 2}
                    height={photoRadius * 2}
                    preserveAspectRatio="xMidYMid slice"
                    clipPath={`url(#clip-${node.id})`}
                    className="pointer-events-none"
                  />
                ) : (
                  <>
                    {/* Initials background circle */}
                    <circle
                      cx={0}
                      cy={photoY}
                      r={photoRadius}
                      fill={`url(#gradient-${node.id})`}
                      className="pointer-events-none"
                    />
                    {/* Initials text */}
                    <text
                      x={0}
                      y={photoY + 8}
                      textAnchor="middle"
                      className="fill-white font-bold pointer-events-none select-none"
                      style={{ fontSize: "22px" }}
                    >
                      {getInitialsFromFullName(node.person.first_name || node.person.name || '?')}
                    </text>
                  </>
                )}
                
                {/* Photo border */}
                <circle
                  cx={0}
                  cy={photoY}
                  r={photoRadius}
                  fill="none"
                  stroke={isFavorite ? "#f59e0b" : "#e5e7eb"}
                  strokeWidth="2.5"
                  className="pointer-events-none"
                />

                {/* Favorite star badge */}
                {isFavorite && (
                  <>
                    <circle 
                      cx={photoRadius - 8} 
                      cy={photoY - photoRadius + 12} 
                      r={10} 
                      fill="#fbbf24" 
                      stroke="white" 
                      strokeWidth="2"
                      className="pointer-events-none"
                    />
                    <text 
                      x={photoRadius - 8} 
                      y={photoY - photoRadius + 17} 
                      textAnchor="middle" 
                      className="pointer-events-none select-none"
                      style={{ fontSize: "11px" }}
                    >
                      ⭐
                    </text>
                  </>
                )}

                {/* Name - first line */}
                <text
                  x={0}
                  y={nameStartY}
                  textAnchor="middle"
                  className="fill-gray-900 dark:fill-gray-100 font-semibold pointer-events-none select-none"
                  style={{ fontSize: "12px" }}
                >
                  {node.person.first_name || node.person.name?.split(' ')[0] || ''}
                </text>

                {/* Name - last line */}
                {(node.person.last_name || (node.person.name && node.person.name.split(' ').length > 1)) && (
                  <text
                    x={0}
                    y={nameStartY + lineHeight}
                    textAnchor="middle"
                    className="fill-gray-900 dark:fill-gray-100 font-semibold pointer-events-none select-none"
                    style={{ fontSize: "12px" }}
                  >
                    {node.person.last_name || node.person.name?.split(' ').slice(1).join(' ') || ''}
                  </text>
                )}

                {/* Birthday indicator */}
                {birthdaySoon && node.person.birthday && (
                  <text
                    x={0}
                    y={birthdayY}
                    textAnchor="middle"
                    className="fill-orange-600 dark:fill-orange-400 font-medium pointer-events-none select-none"
                    style={{ fontSize: "10px" }}
                  >
                    🎂 {formatBirthday(node.person.birthday)}
                  </text>
                )}
              </g>
            );
          })}
          </g>
        </svg>

        {/* Zoom Controls */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              const zoomFactor = 1.2;
              const newScale = Math.min(MAX_ZOOM, transform.scale * zoomFactor);
              
              // Get viewport center
              const vpCenterX = containerSize.width / 2;
              const vpCenterY = containerSize.height / 2;
              
              // Calculate world point at viewport center before zoom
              const worldCenterX = (vpCenterX - transform.x) / transform.scale;
              const worldCenterY = (vpCenterY - transform.y) / transform.scale;
              
              // Calculate new pan to keep world center at viewport center after zoom
              setTransform(clampTransform({
                x: vpCenterX - worldCenterX * newScale,
                y: vpCenterY - worldCenterY * newScale,
                scale: newScale
              }));
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-900 dark:text-white"
            title="Zoom in"
          >
            <Plus className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => {
              const zoomFactor = 1.2;
              const newScale = Math.max(MIN_ZOOM, transform.scale / zoomFactor);
              
              // Get viewport center
              const vpCenterX = containerSize.width / 2;
              const vpCenterY = containerSize.height / 2;
              
              // Calculate world point at viewport center before zoom
              const worldCenterX = (vpCenterX - transform.x) / transform.scale;
              const worldCenterY = (vpCenterY - transform.y) / transform.scale;
              
              // Calculate new pan to keep world center at viewport center after zoom
              setTransform(clampTransform({
                x: vpCenterX - worldCenterX * newScale,
                y: vpCenterY - worldCenterY * newScale,
                scale: newScale
              }));
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-900 dark:text-white"
            title="Zoom out"
          >
            <Minus className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => {
              // Reset to default centered view
              setTransform({ x: 0, y: 0, scale: 1 });
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-900 dark:text-white"
            title="Reset view"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
          
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center px-1 py-1 border-t border-gray-200 dark:border-gray-700">
            {Math.round(transform.scale * 100)}%
          </div>
        </div>

        {/* Empty state */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-4">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No contacts yet
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Start building your network by adding contacts
              </p>
              <Link href="/contacts/new">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Add Your First Contact
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
