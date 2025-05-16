
import { useRef, useState } from 'react';
import { PDFItemType } from '../PDFItem';

export const useDragAndDrop = (
  items: PDFItemType[],
  onItemsChange: (items: PDFItemType[]) => void,
  canvasRef: React.RefObject<HTMLDivElement>,
  getScale: () => number
) => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const dragOffsetX = useRef(0);
  const dragOffsetY = useRef(0);

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

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || draggedItemIndex === null || !canvasRef.current) return;

    const scale = getScale();
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    // Calculate new position in cm (dividing by scale)
    const newX = (e.clientX - canvasRect.left - dragOffsetX.current) / scale;
    const newY = (e.clientY - canvasRect.top - dragOffsetY.current) / scale;
    
    // Update the item's position
    const updatedItems = items.map((item, index) =>
      index === draggedItemIndex
        ? { ...item, x: newX, y: newY }
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
    handleMouseUp
  };
};
