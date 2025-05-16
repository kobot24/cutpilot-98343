import { useRef, useState, useEffect } from 'react';
import { PDFItem, PDFItemType } from './PDFItem';
import { EmptyPlate } from './EmptyPlate';
import { PrintPlateSize } from './PrintPlateSettings';

type PlateCanvasProps = {
  items: PDFItemType[];
  onItemsChange: (items: PDFItemType[]) => void;
  plateSize: PrintPlateSize;
};

export const PlateCanvas = ({ items, onItemsChange, plateSize }: PlateCanvasProps) => {
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef<HTMLDivElement>(null);

  // Calculate the scale factor based on the canvas size and the plate dimensions
  const getScale = (): number => {
    if (!canvasRef.current) return 1;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const canvasWidth = rect.width;
    const scaleX = canvasWidth / plateSize.width;
    
    return scaleX; // Use the width scale as the common scale factor
  };
  
  // Convert from cm to pixels
  const cmToPixels = (cm: number): number => {
    return cm * getScale();
  };
  
  // Convert from pixels to cm
  const pixelsToCm = (pixels: number): number => {
    return pixels / getScale();
  };
  
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

  // Calculate canvas height in pixels based on the aspect ratio of the plate
  const getCanvasHeight = (): number => {
    if (!canvasRef.current) return 0;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const aspectRatio = plateSize.height / plateSize.width;
    
    return rect.width * aspectRatio;
  };

  // Adjust item size and position when the plate size changes
  useEffect(() => {
    if (canvasRef.current && items.length > 0) {
      const rect = canvasRef.current.getBoundingClientRect();
      const canvasWidth = rect.width;
      const canvasHeight = getCanvasHeight();
      
      // Adjust items to fit the new canvas size
      const updatedItems = items.map(item => {
        // Keep the same relative position and size
        const relX = item.x / canvasWidth;
        const relY = item.y / canvasHeight;
        const relWidth = item.width / canvasWidth;
        const relHeight = item.height / canvasHeight;
        
        return {
          ...item,
          x: relX * canvasWidth,
          y: relY * canvasHeight,
          width: relWidth * canvasWidth,
          height: relHeight * canvasHeight
        };
      });
      
      onItemsChange(updatedItems);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plateSize]);

  return (
    <div className="print-plate-container">
      {/* Horizontal ruler */}
      <div className="ruler ruler-horizontal flex h-6 ml-6 mb-1 overflow-hidden select-none">
        {[...Array(Math.ceil(plateSize.width))].map((_, i) => (
          <div key={`h-${i}`} className="ruler-tick flex flex-col items-center" style={{ width: `${cmToPixels(1)}px` }}>
            <span className="text-xs">{i}</span>
            <div className="h-2 w-px bg-gray-300"></div>
          </div>
        ))}
      </div>

      <div className="flex">
        {/* Vertical ruler */}
        <div className="ruler ruler-vertical flex flex-col w-6 mr-1 overflow-hidden select-none">
          {[...Array(Math.ceil(plateSize.height))].map((_, i) => (
            <div key={`v-${i}`} className="ruler-tick flex items-center justify-end" style={{ height: `${cmToPixels(1)}px` }}>
              <span className="text-xs mr-1">{i}</span>
              <div className="w-2 h-px bg-gray-300"></div>
            </div>
          ))}
        </div>

        {/* Canvas */}
        <div 
          ref={canvasRef}
          className="w-full bg-white print-plate relative border border-gray-200 rounded"
          style={{ height: `${getCanvasHeight()}px` }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Grid lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {/* Vertical grid lines */}
            {[...Array(Math.ceil(plateSize.width))].map((_, i) => (
              <line 
                key={`v-grid-${i}`} 
                x1={cmToPixels(i)} 
                y1="0" 
                x2={cmToPixels(i)} 
                y2="100%" 
                stroke="#f0f0f0" 
                strokeWidth="1" 
              />
            ))}
            {/* Horizontal grid lines */}
            {[...Array(Math.ceil(plateSize.height))].map((_, i) => (
              <line 
                key={`h-grid-${i}`} 
                x1="0" 
                y1={cmToPixels(i)} 
                x2="100%" 
                y2={cmToPixels(i)} 
                stroke="#f0f0f0" 
                strokeWidth="1" 
              />
            ))}
          </svg>

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
            {plateSize.width} × {plateSize.height} cm
          </div>
        </div>
      </div>
    </div>
  );
};
