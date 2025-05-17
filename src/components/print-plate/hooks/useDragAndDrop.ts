
import { useRef, useState, useEffect, useCallback } from 'react';
import { PDFItemType } from '../PDFItem';
import { PrintPlateSize } from '../PrintPlateSettings';
import { toast } from '@/components/ui/sonner';
import { throttle } from '@/utils/print-plate/throttleUtils';

export const useDragAndDrop = (
  items: PDFItemType[],
  onItemsChange: (items: PDFItemType[]) => void,
  canvasRef: React.RefObject<HTMLDivElement>,
  getScale: () => number,
  plateSize: PrintPlateSize
) => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [isSnapModeEnabled, setIsSnapModeEnabled] = useState(false);
  const [isStickySnapEnabled, setIsStickySnapEnabled] = useState(true);
  const [nearestSnapEdge, setNearestSnapEdge] = useState<{
    x: number | null;
    y: number | null;
    type: 'horizontal' | 'vertical' | null;
  }>({ x: null, y: null, type: null });
  
  const [lastSnapToastTime, setLastSnapToastTime] = useState(0);
  
  // Use refs to avoid recreating functions on every render
  const dragOffsetX = useRef(0);
  const dragOffsetY = useRef(0);
  const lastPosition = useRef({ x: 0, y: 0 });
  // Snap threshold in cm
  const snapThresholdCm = 0.5; 

  // Track temporary snap toggle with Alt key
  const [isAltKeyPressed, setIsAltKeyPressed] = useState(false);

  // Store draggedItem in a ref to avoid recreating functions
  const draggedItemRef = useRef<PDFItemType | null>(null);

  // Load snap mode preference from localStorage on initial mount
  useEffect(() => {
    const storedSnapModePreference = localStorage.getItem('snapModeEnabled');
    if (storedSnapModePreference !== null) {
      setIsSnapModeEnabled(storedSnapModePreference === 'true');
    }
  }, []);

  // Save snap mode preference when it changes
  useEffect(() => {
    localStorage.setItem('snapModeEnabled', String(isSnapModeEnabled));
  }, [isSnapModeEnabled]);

  // Check for Alt key status
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt' || e.code === 'AltLeft' || e.code === 'AltRight') {
        setIsAltKeyPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt' || e.code === 'AltLeft' || e.code === 'AltRight') {
        setIsAltKeyPressed(false);
      }
    };

    // Handle blur/focus events to reset state when user switches tabs/windows
    const handleBlur = () => {
      setIsAltKeyPressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    // Toggle snap mode with F2 key
    const toggleSnapMode = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        setIsSnapModeEnabled(prev => {
          const newState = !prev;
          toast.info(`Snap-Modus ${newState ? 'aktiviert' : 'deaktiviert'}`);
          return newState;
        });
      }
    };
    
    window.addEventListener('keydown', toggleSnapMode);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('keydown', toggleSnapMode);
    };
  }, []);

  // Simplify and optimize drag start
  const handleDragStart = useCallback((index: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    
    const scale = getScale();
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const item = items[index];
    
    // Store the dragged item in a ref for better performance
    draggedItemRef.current = { ...item };
    
    // Calculate offsets in pixels
    dragOffsetX.current = (e.clientX - canvasRect.left) - (item.x * scale);
    dragOffsetY.current = (e.clientY - canvasRect.top) - (item.y * scale);
    lastPosition.current = { x: item.x, y: item.y };
    
    setDraggedItemIndex(index);
    setIsDragging(true);
  }, [canvasRef, getScale, items]);

  // Optimized snap position calculation
  const calculateSnapPosition = useCallback(
    (
      itemIndex: number,
      proposedX: number,
      proposedY: number
    ): { x: number; y: number } => {
      // Use snap mode if it's enabled globally OR Alt key is pressed
      const shouldSnap = isSnapModeEnabled || isAltKeyPressed;
      
      if (!shouldSnap) {
        setNearestSnapEdge({ x: null, y: null, type: null });
        return { x: proposedX, y: proposedY };
      }

      const draggedItem = items[itemIndex];
      let snappedX = proposedX;
      let snappedY = proposedY;
      
      // Get item edges in cm
      const draggedRight = proposedX + draggedItem.width;
      const draggedBottom = proposedY + draggedItem.height;

      // Track closest snap for visualization purposes
      let closestSnapDistanceX = snapThresholdCm;
      let closestSnapDistanceY = snapThresholdCm;
      let closestSnapEdgeX = null;
      let closestSnapEdgeY = null;

      // Flag to track if we found any snap points
      let didSnapX = false;
      let didSnapY = false;

      // Check for snapping to plate edges (reduced calculations, only what's needed)
      // Snap to left edge
      const leftEdgeDist = Math.abs(proposedX);
      if (leftEdgeDist < closestSnapDistanceX) {
        closestSnapDistanceX = leftEdgeDist;
        closestSnapEdgeX = 0;
        snappedX = 0;
        didSnapX = true;
      }
      
      // Snap to right edge
      const rightEdgeDist = Math.abs(plateSize.width - draggedRight);
      if (rightEdgeDist < closestSnapDistanceX) {
        closestSnapDistanceX = rightEdgeDist;
        closestSnapEdgeX = plateSize.width;
        snappedX = plateSize.width - draggedItem.width;
        didSnapX = true;
      }
      
      // Snap to top edge
      const topEdgeDist = Math.abs(proposedY);
      if (topEdgeDist < closestSnapDistanceY) {
        closestSnapDistanceY = topEdgeDist;
        closestSnapEdgeY = 0;
        snappedY = 0;
        didSnapY = true;
      }
      
      // Snap to bottom edge
      const bottomEdgeDist = Math.abs(plateSize.height - draggedBottom);
      if (bottomEdgeDist < closestSnapDistanceY) {
        closestSnapDistanceY = bottomEdgeDist;
        closestSnapEdgeY = plateSize.height;
        snappedY = plateSize.height - draggedItem.height;
        didSnapY = true;
      }

      // Check against only the closest other items for snapping instead of all items
      // This is a significant optimization for plates with many items
      
      // First, identify items that are potentially close enough for snapping
      const potentialSnapItems = items
        .map((item, i) => ({ item, index: i }))
        .filter(({ item, index }) => {
          if (index === itemIndex) return false; // Skip the item being dragged
          
          // Quick proximity check using bounding boxes
          const itemRight = item.x + item.width;
          const itemBottom = item.y + item.height;
          const horizontalProximity = (
            (Math.abs(proposedX - item.x) < snapThresholdCm * 3) || 
            (Math.abs(draggedRight - itemRight) < snapThresholdCm * 3) ||
            (Math.abs(draggedRight - item.x) < snapThresholdCm * 3) ||
            (Math.abs(proposedX - itemRight) < snapThresholdCm * 3)
          );
          const verticalProximity = (
            (Math.abs(proposedY - item.y) < snapThresholdCm * 3) || 
            (Math.abs(draggedBottom - itemBottom) < snapThresholdCm * 3) ||
            (Math.abs(draggedBottom - item.y) < snapThresholdCm * 3) ||
            (Math.abs(proposedY - itemBottom) < snapThresholdCm * 3)
          );
          
          return horizontalProximity || verticalProximity;
        })
        .map(({ item }) => item);
      
      // Only check edges for items that are close enough
      for (const otherItem of potentialSnapItems) {
        const otherRight = otherItem.x + otherItem.width;
        const otherBottom = otherItem.y + otherItem.height;
        
        // Snap left edge to right edge
        const leftToRightDist = Math.abs(proposedX - otherRight);
        if (leftToRightDist < closestSnapDistanceX) {
          closestSnapDistanceX = leftToRightDist;
          closestSnapEdgeX = otherRight;
          snappedX = otherRight;
          didSnapX = true;
        }
        
        // Snap right edge to left edge
        const rightToLeftDist = Math.abs(draggedRight - otherItem.x);
        if (rightToLeftDist < closestSnapDistanceX) {
          closestSnapDistanceX = rightToLeftDist;
          closestSnapEdgeX = otherItem.x;
          snappedX = otherItem.x - draggedItem.width;
          didSnapX = true;
        }
        
        // Snap top edge to bottom edge
        const topToBottomDist = Math.abs(proposedY - otherBottom);
        if (topToBottomDist < closestSnapDistanceY) {
          closestSnapDistanceY = topToBottomDist;
          closestSnapEdgeY = otherBottom;
          snappedY = otherBottom;
          didSnapY = true;
        }
        
        // Snap bottom edge to top edge
        const bottomToTopDist = Math.abs(draggedBottom - otherItem.y);
        if (bottomToTopDist < closestSnapDistanceY) {
          closestSnapDistanceY = bottomToTopDist;
          closestSnapEdgeY = otherItem.y;
          snappedY = otherItem.y - draggedItem.height;
          didSnapY = true;
        }
        
        // Alignment snaps - only if they're already close in one dimension
        if (Math.abs(proposedY - otherItem.y) < snapThresholdCm * 2 || 
            Math.abs(draggedBottom - otherBottom) < snapThresholdCm * 2) {
          
          // Snap to align left edges
          const leftEdgesAlignDist = Math.abs(proposedX - otherItem.x);
          if (leftEdgesAlignDist < closestSnapDistanceX) {
            closestSnapDistanceX = leftEdgesAlignDist;
            closestSnapEdgeX = otherItem.x;
            snappedX = otherItem.x;
            didSnapX = true;
          }
          
          // Snap to align right edges
          const rightEdgesAlignDist = Math.abs(draggedRight - otherRight);
          if (rightEdgesAlignDist < closestSnapDistanceX) {
            closestSnapDistanceX = rightEdgesAlignDist;
            closestSnapEdgeX = otherRight - draggedItem.width;
            snappedX = otherRight - draggedItem.width;
            didSnapX = true;
          }
        }
        
        if (Math.abs(proposedX - otherItem.x) < snapThresholdCm * 2 || 
            Math.abs(draggedRight - otherRight) < snapThresholdCm * 2) {
            
          // Snap to align top edges
          const topEdgesAlignDist = Math.abs(proposedY - otherItem.y);
          if (topEdgesAlignDist < closestSnapDistanceY) {
            closestSnapDistanceY = topEdgesAlignDist;
            closestSnapEdgeY = otherItem.y;
            snappedY = otherItem.y;
            didSnapY = true;
          }
          
          // Snap to align bottom edges
          const bottomEdgesAlignDist = Math.abs(draggedBottom - otherBottom);
          if (bottomEdgesAlignDist < closestSnapDistanceY) {
            closestSnapDistanceY = bottomEdgesAlignDist;
            closestSnapEdgeY = otherBottom - draggedItem.height;
            snappedY = otherBottom - draggedItem.height;
            didSnapY = true;
          }
        }
      }
      
      // Update nearest snap edge for visual indicator (only when actually snapping)
      if (didSnapX && didSnapY) {
        setNearestSnapEdge({
          x: closestSnapDistanceX < closestSnapDistanceY ? closestSnapEdgeX : null,
          y: closestSnapDistanceY <= closestSnapDistanceX ? closestSnapEdgeY : null,
          type: closestSnapDistanceX < closestSnapDistanceY ? 'vertical' : 'horizontal'
        });
      } else if (didSnapX) {
        setNearestSnapEdge({
          x: closestSnapEdgeX,
          y: null,
          type: 'vertical'
        });
      } else if (didSnapY) {
        setNearestSnapEdge({
          x: null,
          y: closestSnapEdgeY,
          type: 'horizontal'
        });
      } else {
        setNearestSnapEdge({ x: null, y: null, type: null });
      }
      
      // When sticky mode is active, return the snapped position
      // When not in sticky mode (or not snapped), return the original position
      return { 
        x: (isStickySnapEnabled && didSnapX) ? snappedX : proposedX, 
        y: (isStickySnapEnabled && didSnapY) ? snappedY : proposedY 
      };
    },
    [
      isSnapModeEnabled,
      isAltKeyPressed,
      isStickySnapEnabled,
      items,
      plateSize.width,
      plateSize.height,
      snapThresholdCm
    ]
  );

  // Create a throttled mouse move handler using the throttle utility
  const throttledMouseMove = useCallback(
    throttle((e: React.MouseEvent) => {
      if (!isDragging || draggedItemIndex === null || !canvasRef.current) return;
      
      const scale = getScale();
      const canvasRect = canvasRef.current.getBoundingClientRect();
      
      // Calculate new position in cm (dividing by scale)
      const newX = (e.clientX - canvasRect.left - dragOffsetX.current) / scale;
      const newY = (e.clientY - canvasRect.top - dragOffsetY.current) / scale;
      
      // Skip updates if the position hasn't changed significantly
      if (Math.abs(newX - lastPosition.current.x) < 0.01 && 
          Math.abs(newY - lastPosition.current.y) < 0.01) {
        return;
      }
      
      // Apply snapping if enabled - with sticky behavior
      const { x: snappedX, y: snappedY } = calculateSnapPosition(
        draggedItemIndex,
        newX,
        newY
      );
      
      lastPosition.current = { x: snappedX, y: snappedY };
      
      // Update just the dragged item's position directly
      // This avoids recreating the entire items array for every move
      const updatedItems = items.map((item, index) =>
        index === draggedItemIndex
          ? { ...item, x: snappedX, y: snappedY }
          : item
      );
      
      onItemsChange(updatedItems);
    }, 16), // Throttle to roughly 60fps
    [isDragging, draggedItemIndex, canvasRef, getScale, calculateSnapPosition, items, onItemsChange]
  );

  // Simplified mouse move handler that just calls the throttled function
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    throttledMouseMove(e);
  }, [throttledMouseMove]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setDraggedItemIndex(null);
      setNearestSnapEdge({ x: null, y: null, type: null });
      draggedItemRef.current = null;
    }
  }, [isDragging]);

  const toggleSnapMode = useCallback(() => {
    setIsSnapModeEnabled(prev => !prev);
  }, []);

  return {
    handleDragStart,
    handleMouseMove,
    handleMouseUp,
    isSnapModeEnabled,
    toggleSnapMode,
    nearestSnapEdge,
    isAltKeyPressed,
    draggedItemIndex, // Export this so PDFItems can know if they're being dragged
    isDragging // Export this for use in optimizations
  };
};
