
import { useRef, useState, useEffect } from 'react';
import { PDFItemType } from '../PDFItem';
import { PrintPlateSize } from '../PrintPlateSettings';

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
  const [nearestSnapEdge, setNearestSnapEdge] = useState<{
    x: number | null;
    y: number | null;
    type: 'horizontal' | 'vertical' | null;
  }>({ x: null, y: null, type: null });
  
  const dragOffsetX = useRef(0);
  const dragOffsetY = useRef(0);
  // Increase snap threshold for more obvious snapping behavior
  const snapThresholdCm = 0.5; // Was 0.15, now 0.5 for stronger snapping effect

  // Check for Alt key status - use both keyboard and mouse events for better detection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt' || e.code === 'AltLeft' || e.code === 'AltRight') {
        setIsSnapModeEnabled(true);
        console.log('Snap mode enabled (key down)');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt' || e.code === 'AltLeft' || e.code === 'AltRight') {
        setIsSnapModeEnabled(false);
        setNearestSnapEdge({ x: null, y: null, type: null });
        console.log('Snap mode disabled (key up)');
      }
    };

    // Check if the Alt key is already pressed when the component mounts
    const checkAltKey = () => {
      if (navigator.userAgent.indexOf('Mac') !== -1) {
        // For Mac
        if (navigator.userAgent.indexOf('Safari') !== -1) {
          console.log('Mac Safari detected - using option key detection');
        }
      }
    };
    
    checkAltKey();

    // Also handle blur/focus events to reset state when user switches tabs/windows
    const handleBlur = () => {
      setIsSnapModeEnabled(false);
      setNearestSnapEdge({ x: null, y: null, type: null });
      console.log('Window blur - reset snap mode');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    // Force manual activation for testing
    const forceSnapModeToggle = (e: KeyboardEvent) => {
      // Allow toggling snap mode with F2 key for testing
      if (e.key === 'F2') {
        setIsSnapModeEnabled(prev => {
          const newState = !prev;
          console.log(`Snap mode ${newState ? 'enabled' : 'disabled'} via F2 toggle`);
          return newState;
        });
      }
    };
    
    window.addEventListener('keydown', forceSnapModeToggle);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('keydown', forceSnapModeToggle);
    };
  }, []);

  const handleDragStart = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    
    const scale = getScale();
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const item = items[index];
    
    // Calculate offsets in pixels
    dragOffsetX.current = (e.clientX - canvasRect.left) - (item.x * scale);
    dragOffsetY.current = (e.clientY - canvasRect.top) - (item.y * scale);
    
    setDraggedItemIndex(index);
    setIsDragging(true);
    console.log(`Started dragging item ${index}, snap mode: ${isSnapModeEnabled ? 'active' : 'inactive'}`);
  };

  // Calculate snapping position for an item based on other items and plate edges
  const calculateSnapPosition = (
    itemIndex: number,
    proposedX: number,
    proposedY: number
  ): { x: number; y: number } => {
    if (!isSnapModeEnabled) {
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

    // Check for snapping to plate edges
    // Snap to left edge
    const leftEdgeDist = Math.abs(proposedX);
    if (leftEdgeDist < closestSnapDistanceX) {
      closestSnapDistanceX = leftEdgeDist;
      closestSnapEdgeX = 0;
      snappedX = 0;
      console.log(`Snapped to left edge: ${snappedX}`);
    }
    
    // Snap to top edge
    const topEdgeDist = Math.abs(proposedY);
    if (topEdgeDist < closestSnapDistanceY) {
      closestSnapDistanceY = topEdgeDist;
      closestSnapEdgeY = 0;
      snappedY = 0;
      console.log(`Snapped to top edge: ${snappedY}`);
    }
    
    // Snap to right edge
    const rightEdgeDist = Math.abs(plateSize.width - draggedRight);
    if (rightEdgeDist < closestSnapDistanceX) {
      closestSnapDistanceX = rightEdgeDist;
      closestSnapEdgeX = plateSize.width;
      snappedX = plateSize.width - draggedItem.width;
      console.log(`Snapped to right edge: ${snappedX}`);
    }
    
    // Snap to bottom edge
    const bottomEdgeDist = Math.abs(plateSize.height - draggedBottom);
    if (bottomEdgeDist < closestSnapDistanceY) {
      closestSnapDistanceY = bottomEdgeDist;
      closestSnapEdgeY = plateSize.height;
      snappedY = plateSize.height - draggedItem.height;
      console.log(`Snapped to bottom edge: ${snappedY}`);
    }

    // Check against other items for snapping
    for (let i = 0; i < items.length; i++) {
      if (i === itemIndex) continue; // Skip the item being dragged
      
      const otherItem = items[i];
      const otherRight = otherItem.x + otherItem.width;
      const otherBottom = otherItem.y + otherItem.height;
      
      // Snap left edge to right edge (tight snapping)
      const leftToRightDist = Math.abs(proposedX - otherRight);
      if (leftToRightDist < closestSnapDistanceX) {
        closestSnapDistanceX = leftToRightDist;
        closestSnapEdgeX = otherRight;
        snappedX = otherRight;
        console.log(`Snapped left to right: ${snappedX}`);
      }
      
      // Snap right edge to left edge (tight snapping)
      const rightToLeftDist = Math.abs(draggedRight - otherItem.x);
      if (rightToLeftDist < closestSnapDistanceX) {
        closestSnapDistanceX = rightToLeftDist;
        closestSnapEdgeX = otherItem.x;
        snappedX = otherItem.x - draggedItem.width;
        console.log(`Snapped right to left: ${snappedX}`);
      }
      
      // Snap top edge to bottom edge (tight snapping)
      const topToBottomDist = Math.abs(proposedY - otherBottom);
      if (topToBottomDist < closestSnapDistanceY) {
        closestSnapDistanceY = topToBottomDist;
        closestSnapEdgeY = otherBottom;
        snappedY = otherBottom;
        console.log(`Snapped top to bottom: ${snappedY}`);
      }
      
      // Snap bottom edge to top edge (tight snapping)
      const bottomToTopDist = Math.abs(draggedBottom - otherItem.y);
      if (bottomToTopDist < closestSnapDistanceY) {
        closestSnapDistanceY = bottomToTopDist;
        closestSnapEdgeY = otherItem.y;
        snappedY = otherItem.y - draggedItem.height;
        console.log(`Snapped bottom to top: ${snappedY}`);
      }
      
      // Snap to align horizontally (top edges)
      const topEdgesAlignDist = Math.abs(proposedY - otherItem.y);
      if (topEdgesAlignDist < closestSnapDistanceY) {
        closestSnapDistanceY = topEdgesAlignDist;
        closestSnapEdgeY = otherItem.y;
        snappedY = otherItem.y;
        console.log(`Snapped top edges: ${snappedY}`);
      }
      
      // Snap to align horizontally (bottom edges)
      const bottomEdgesAlignDist = Math.abs(draggedBottom - otherBottom);
      if (bottomEdgesAlignDist < closestSnapDistanceY) {
        closestSnapDistanceY = bottomEdgesAlignDist;
        closestSnapEdgeY = otherBottom - draggedItem.height;
        snappedY = otherBottom - draggedItem.height;
        console.log(`Snapped bottom edges: ${snappedY}`);
      }
      
      // Snap to align vertically (left edges)
      const leftEdgesAlignDist = Math.abs(proposedX - otherItem.x);
      if (leftEdgesAlignDist < closestSnapDistanceX) {
        closestSnapDistanceX = leftEdgesAlignDist;
        closestSnapEdgeX = otherItem.x;
        snappedX = otherItem.x;
        console.log(`Snapped left edges: ${snappedX}`);
      }
      
      // Snap to align vertically (right edges)
      const rightEdgesAlignDist = Math.abs(draggedRight - otherRight);
      if (rightEdgesAlignDist < closestSnapDistanceX) {
        closestSnapDistanceX = rightEdgesAlignDist;
        closestSnapEdgeX = otherRight - draggedItem.width;
        snappedX = otherRight - draggedItem.width;
        console.log(`Snapped right edges: ${snappedX}`);
      }
    }
    
    // Update nearest snap edge for visual indicator
    setNearestSnapEdge({
      x: closestSnapEdgeX,
      y: closestSnapEdgeY,
      type: closestSnapDistanceX < closestSnapDistanceY ? 'vertical' : 'horizontal'
    });
    
    // If we found any snap points, log them for debugging
    if (snappedX !== proposedX || snappedY !== proposedY) {
      console.log(`Snapped to X: ${snappedX}, Y: ${snappedY}`);
    }
    
    return { x: snappedX, y: snappedY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || draggedItemIndex === null || !canvasRef.current) return;

    const scale = getScale();
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    // Calculate new position in cm (dividing by scale)
    const newX = (e.clientX - canvasRect.left - dragOffsetX.current) / scale;
    const newY = (e.clientY - canvasRect.top - dragOffsetY.current) / scale;
    
    // Apply snapping if enabled
    const { x: snappedX, y: snappedY } = calculateSnapPosition(
      draggedItemIndex,
      newX,
      newY
    );
    
    // Update the item's position
    const updatedItems = items.map((item, index) =>
      index === draggedItemIndex
        ? { ...item, x: snappedX, y: snappedY }
        : item
    );
    
    onItemsChange(updatedItems);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      setDraggedItemIndex(null);
      setNearestSnapEdge({ x: null, y: null, type: null });
    }
  };

  return {
    handleDragStart,
    handleMouseMove,
    handleMouseUp,
    isSnapModeEnabled,
    nearestSnapEdge
  };
};
