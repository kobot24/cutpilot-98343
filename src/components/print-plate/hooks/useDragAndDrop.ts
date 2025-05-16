
import { useRef, useState, useEffect } from 'react';
import { PDFItemType } from '../PDFItem';
import { PrintPlateSize } from '../PrintPlateSettings';
import { toast } from '@/components/ui/sonner';

export const useDragAndDrop = (
  items: PDFItemType[],
  onItemsChange: (items: PDFItemType[]) => void,
  canvasRef: React.RefObject<HTMLDivElement>,
  getScale: () => number,
  plateSize: PrintPlateSize
) => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  // Change from temporary snap mode to persistent snap mode
  const [isSnapModeEnabled, setIsSnapModeEnabled] = useState(false);
  // New state for sticky behavior
  const [isStickySnapEnabled, setIsStickySnapEnabled] = useState(true);
  const [nearestSnapEdge, setNearestSnapEdge] = useState<{
    x: number | null;
    y: number | null;
    type: 'horizontal' | 'vertical' | null;
  }>({ x: null, y: null, type: null });
  
  const dragOffsetX = useRef(0);
  const dragOffsetY = useRef(0);
  // Increase snap threshold for more obvious snapping behavior
  const snapThresholdCm = 0.5; // Was 0.15, now 0.5 for stronger snapping effect

  // Track temporary snap toggle with Alt key
  const [isAltKeyPressed, setIsAltKeyPressed] = useState(false);

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

  // Check for Alt key status - use both keyboard and mouse events for better detection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt' || e.code === 'AltLeft' || e.code === 'AltRight') {
        setIsAltKeyPressed(true);
        console.log('Alt key pressed');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt' || e.code === 'AltLeft' || e.code === 'AltRight') {
        setIsAltKeyPressed(false);
        console.log('Alt key released');
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
      setIsAltKeyPressed(false);
      console.log('Window blur - reset alt key state');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    // Toggle snap mode with F2 key
    const toggleSnapMode = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        setIsSnapModeEnabled(prev => {
          const newState = !prev;
          console.log(`Snap mode ${newState ? 'enabled' : 'disabled'} via F2 toggle`);
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
    console.log(`Started dragging item ${index}, snap mode: ${isSnapModeEnabled || isAltKeyPressed ? 'active' : 'inactive'}`);
  };

  // Calculate snapping position for an item based on other items and plate edges
  const calculateSnapPosition = (
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

    // Check for snapping to plate edges
    // Snap to left edge
    const leftEdgeDist = Math.abs(proposedX);
    if (leftEdgeDist < closestSnapDistanceX) {
      closestSnapDistanceX = leftEdgeDist;
      closestSnapEdgeX = 0;
      snappedX = 0;
      didSnapX = true;
      console.log(`Snapped to left edge: ${snappedX}`);
    }
    
    // Snap to top edge
    const topEdgeDist = Math.abs(proposedY);
    if (topEdgeDist < closestSnapDistanceY) {
      closestSnapDistanceY = topEdgeDist;
      closestSnapEdgeY = 0;
      snappedY = 0;
      didSnapY = true;
      console.log(`Snapped to top edge: ${snappedY}`);
    }
    
    // Snap to right edge
    const rightEdgeDist = Math.abs(plateSize.width - draggedRight);
    if (rightEdgeDist < closestSnapDistanceX) {
      closestSnapDistanceX = rightEdgeDist;
      closestSnapEdgeX = plateSize.width;
      snappedX = plateSize.width - draggedItem.width;
      didSnapX = true;
      console.log(`Snapped to right edge: ${snappedX}`);
    }
    
    // Snap to bottom edge
    const bottomEdgeDist = Math.abs(plateSize.height - draggedBottom);
    if (bottomEdgeDist < closestSnapDistanceY) {
      closestSnapDistanceY = bottomEdgeDist;
      closestSnapEdgeY = plateSize.height;
      snappedY = plateSize.height - draggedItem.height;
      didSnapY = true;
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
        didSnapX = true;
        console.log(`Snapped left to right: ${snappedX}`);
      }
      
      // Snap right edge to left edge (tight snapping)
      const rightToLeftDist = Math.abs(draggedRight - otherItem.x);
      if (rightToLeftDist < closestSnapDistanceX) {
        closestSnapDistanceX = rightToLeftDist;
        closestSnapEdgeX = otherItem.x;
        snappedX = otherItem.x - draggedItem.width;
        didSnapX = true;
        console.log(`Snapped right to left: ${snappedX}`);
      }
      
      // Snap top edge to bottom edge (tight snapping)
      const topToBottomDist = Math.abs(proposedY - otherBottom);
      if (topToBottomDist < closestSnapDistanceY) {
        closestSnapDistanceY = topToBottomDist;
        closestSnapEdgeY = otherBottom;
        snappedY = otherBottom;
        didSnapY = true;
        console.log(`Snapped top to bottom: ${snappedY}`);
      }
      
      // Snap bottom edge to top edge (tight snapping)
      const bottomToTopDist = Math.abs(draggedBottom - otherItem.y);
      if (bottomToTopDist < closestSnapDistanceY) {
        closestSnapDistanceY = bottomToTopDist;
        closestSnapEdgeY = otherItem.y;
        snappedY = otherItem.y - draggedItem.height;
        didSnapY = true;
        console.log(`Snapped bottom to top: ${snappedY}`);
      }
      
      // Snap to align horizontally (top edges)
      const topEdgesAlignDist = Math.abs(proposedY - otherItem.y);
      if (topEdgesAlignDist < closestSnapDistanceY) {
        closestSnapDistanceY = topEdgesAlignDist;
        closestSnapEdgeY = otherItem.y;
        snappedY = otherItem.y;
        didSnapY = true;
        console.log(`Snapped top edges: ${snappedY}`);
      }
      
      // Snap to align horizontally (bottom edges)
      const bottomEdgesAlignDist = Math.abs(draggedBottom - otherBottom);
      if (bottomEdgesAlignDist < closestSnapDistanceY) {
        closestSnapDistanceY = bottomEdgesAlignDist;
        closestSnapEdgeY = otherBottom - draggedItem.height;
        snappedY = otherBottom - draggedItem.height;
        didSnapY = true;
        console.log(`Snapped bottom edges: ${snappedY}`);
      }
      
      // Snap to align vertically (left edges)
      const leftEdgesAlignDist = Math.abs(proposedX - otherItem.x);
      if (leftEdgesAlignDist < closestSnapDistanceX) {
        closestSnapDistanceX = leftEdgesAlignDist;
        closestSnapEdgeX = otherItem.x;
        snappedX = otherItem.x;
        didSnapX = true;
        console.log(`Snapped left edges: ${snappedX}`);
      }
      
      // Snap to align vertically (right edges)
      const rightEdgesAlignDist = Math.abs(draggedRight - otherRight);
      if (rightEdgesAlignDist < closestSnapDistanceX) {
        closestSnapDistanceX = rightEdgesAlignDist;
        closestSnapEdgeX = otherRight - draggedItem.width;
        snappedX = otherRight - draggedItem.width;
        didSnapX = true;
        console.log(`Snapped right edges: ${snappedX}`);
      }
    }
    
    // Update nearest snap edge for visual indicator
    setNearestSnapEdge({
      x: closestSnapEdgeX,
      y: closestSnapEdgeY,
      type: closestSnapDistanceX < closestSnapDistanceY ? 'vertical' : 'horizontal'
    });
    
    // If we found any snap points and sticky snap is enabled, display a toast notification
    if (isStickySnapEnabled && (didSnapX || didSnapY)) {
      // We only want to show this once when first snapping, not continuously
      if (!window.snapToastShown) {
        window.snapToastShown = true;
        setTimeout(() => {
          window.snapToastShown = false;
        }, 1000); // Reset after 1 second to prevent too many toasts
        
        // Only show toast if actually snapping (not just when Alt is held)
        if (isSnapModeEnabled) {
          // Don't show toast for every minor movement
          // toast.info("Element eingerastet", { duration: 500 });
        }
      }
    }
    
    // When sticky mode is active, return the snapped position
    // When not in sticky mode (or not snapped), return the original position
    return { 
      x: (isStickySnapEnabled && didSnapX) ? snappedX : proposedX, 
      y: (isStickySnapEnabled && didSnapY) ? snappedY : proposedY 
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || draggedItemIndex === null || !canvasRef.current) return;

    const scale = getScale();
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    // Calculate new position in cm (dividing by scale)
    const newX = (e.clientX - canvasRect.left - dragOffsetX.current) / scale;
    const newY = (e.clientY - canvasRect.top - dragOffsetY.current) / scale;
    
    // Apply snapping if enabled - with sticky behavior
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

  const toggleSnapMode = () => {
    setIsSnapModeEnabled(prev => !prev);
  };

  return {
    handleDragStart,
    handleMouseMove,
    handleMouseUp,
    isSnapModeEnabled,
    toggleSnapMode,
    nearestSnapEdge,
    isAltKeyPressed
  };
};
