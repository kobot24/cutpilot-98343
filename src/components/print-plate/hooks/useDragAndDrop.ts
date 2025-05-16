
import { useState, useRef, MutableRefObject } from 'react';
import { PDFItemType } from '../PDFItem';

export const useDragAndDrop = (
  items: PDFItemType[],
  onItemsChange: (items: PDFItemType[]) => void,
  canvasRef: MutableRefObject<HTMLDivElement | null>
) => {
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const handleDragStart = (index: number, e: React.MouseEvent) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const item = items[index];
      
      setDraggedItem(index);
      setDragOffset({
        x: e.clientX - (rect.left + item.x),
        y: e.clientY - (rect.top + item.y)
      });
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedItem !== null && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const newX = e.clientX - rect.left - dragOffset.x;
      const newY = e.clientY - rect.top - dragOffset.y;
      
      // Make sure item stays within canvas bounds
      const item = items[draggedItem];
      const boundedX = Math.max(0, Math.min(newX, rect.width - item.width));
      const boundedY = Math.max(0, Math.min(newY, rect.height - item.height));
      
      const updatedItems = items.map((item, index) => 
        index === draggedItem 
          ? { ...item, x: boundedX, y: boundedY } 
          : item
      );
      
      onItemsChange(updatedItems);
    }
  };
  
  const handleMouseUp = () => {
    setDraggedItem(null);
  };
  
  return {
    draggedItem,
    handleDragStart,
    handleMouseMove,
    handleMouseUp
  };
};
