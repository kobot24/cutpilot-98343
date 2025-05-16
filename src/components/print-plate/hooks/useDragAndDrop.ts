
import { useRef, useState, useEffect } from 'react';
import { PDFItemType } from '../PDFItem';

export const useDragAndDrop = (
  items: PDFItemType[],
  onItemsChange: (items: PDFItemType[]) => void,
  canvasRef: React.RefObject<HTMLDivElement>,
  getScale: () => number
) => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [isSnapModeEnabled, setIsSnapModeEnabled] = useState(false);
  const dragOffsetX = useRef(0);
  const dragOffsetY = useRef(0);
  const snapThresholdCm = 0.5; // Snap threshold in cm

  // Track Option/Alt key press for snap mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt' || e.key === 'Option') {
        setIsSnapModeEnabled(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt' || e.key === 'Option') {
        setIsSnapModeEnabled(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
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
  };

  // Calculate snapping position for an item based on other items
  const calculateSnapPosition = (
    itemIndex: number,
    proposedX: number,
    proposedY: number
  ): { x: number; y: number } => {
    if (!isSnapModeEnabled) {
      return { x: proposedX, y: proposedY };
    }

    const draggedItem = items[itemIndex];
    const snapThresholdPx = snapThresholdCm;
    let snappedX = proposedX;
    let snappedY = proposedY;

    // Get right edge of dragged item
    const draggedRight = proposedX + draggedItem.width;
    // Get bottom edge of dragged item
    const draggedBottom = proposedY + draggedItem.height;

    // Check against other items for snapping
    for (let i = 0; i < items.length; i++) {
      if (i === itemIndex) continue; // Skip the item being dragged
      
      const otherItem = items[i];
      const otherRight = otherItem.x + otherItem.width;
      const otherBottom = otherItem.y + otherItem.height;
      
      // Snap left edge to right edge
      if (Math.abs(proposedX - otherRight) < snapThresholdPx) {
        snappedX = otherRight;
      }
      
      // Snap right edge to left edge
      if (Math.abs(draggedRight - otherItem.x) < snapThresholdPx) {
        snappedX = otherItem.x - draggedItem.width;
      }
      
      // Snap top edge to bottom edge
      if (Math.abs(proposedY - otherBottom) < snapThresholdPx) {
        snappedY = otherBottom;
      }
      
      // Snap bottom edge to top edge
      if (Math.abs(draggedBottom - otherItem.y) < snapThresholdPx) {
        snappedY = otherItem.y - draggedItem.height;
      }
      
      // Snap to align horizontally (top edges)
      if (Math.abs(proposedY - otherItem.y) < snapThresholdPx) {
        snappedY = otherItem.y;
      }
      
      // Snap to align horizontally (bottom edges)
      if (Math.abs(draggedBottom - otherBottom) < snapThresholdPx) {
        snappedY = otherBottom - draggedItem.height;
      }
      
      // Snap to align vertically (left edges)
      if (Math.abs(proposedX - otherItem.x) < snapThresholdPx) {
        snappedX = otherItem.x;
      }
      
      // Snap to align vertically (right edges)
      if (Math.abs(draggedRight - otherRight) < snapThresholdPx) {
        snappedX = otherRight - draggedItem.width;
      }
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
    }
  };

  return {
    handleDragStart,
    handleMouseMove,
    handleMouseUp,
    isSnapModeEnabled
  };
};
