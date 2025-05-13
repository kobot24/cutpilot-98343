
import { useRef, useState } from 'react';
import { PDFItem, PDFItemType } from './PDFItem';
import { EmptyPlate } from './EmptyPlate';

type PlateCanvasProps = {
  items: PDFItemType[];
  onItemsChange: (items: PDFItemType[]) => void;
};

export const PlateCanvas = ({ items, onItemsChange }: PlateCanvasProps) => {
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef<HTMLDivElement>(null);
  
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
  
  const handleRotateItem = (index: number) => {
    const updatedItems = items.map((item, i) => 
      i === index 
        ? { ...item, rotation: (item.rotation + 90) % 360 } 
        : item
    );
    onItemsChange(updatedItems);
  };
  
  const handleRemoveItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    onItemsChange(updatedItems);
  };

  return (
    <div 
      ref={canvasRef}
      className="w-full h-[60vh] bg-white print-plate relative border border-gray-200 rounded-lg overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {items.map((item, index) => (
        <PDFItem
          key={index}
          item={item}
          index={index}
          onDragStart={handleDragStart}
          onRotate={handleRotateItem}
          onRemove={handleRemoveItem}
        />
      ))}
      
      {items.length === 0 && <EmptyPlate />}
      
      <div className="absolute bottom-2 right-2 bg-white/80 text-xs px-2 py-1 rounded text-gray-500">
        60 × 40 cm
      </div>
    </div>
  );
};
