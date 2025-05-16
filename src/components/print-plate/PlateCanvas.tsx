
import { useRef } from 'react';
import { PDFItem, PDFItemType } from './PDFItem';
import { EmptyPlate } from './EmptyPlate';
import { PrintPlateSize } from './PrintPlateSettings';
import { PlateGrid } from './components/PlateGrid';
import { PlateDimensions } from './components/PlateDimensions';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { usePlateItems } from './hooks/usePlateItems';

type PlateCanvasProps = {
  items: PDFItemType[];
  onItemsChange: (items: PDFItemType[]) => void;
  plateSize: PrintPlateSize;
};

export const PlateCanvas = ({ items, onItemsChange, plateSize }: PlateCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  // Calculate the scale factor based on the canvas size and the plate dimensions
  const getScale = (): number => {
    if (!canvasRef.current) return 1;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const canvasWidth = rect.width;
    const scaleX = canvasWidth / plateSize.width;
    
    return scaleX; // Use the width scale as the common scale factor
  };

  // Calculate canvas height in pixels based on the aspect ratio of the plate
  const getCanvasHeight = (): number => {
    if (!canvasRef.current) return 0;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const aspectRatio = plateSize.height / plateSize.width;
    
    return rect.width * aspectRatio;
  };
  
  // Use the custom hooks for drag-and-drop and item management
  const { 
    handleDragStart,
    handleMouseMove,
    handleMouseUp 
  } = useDragAndDrop(items, onItemsChange, canvasRef);
  
  const {
    handleRotateItem,
    handleRemoveItem
  } = usePlateItems(items, onItemsChange, plateSize, getCanvasHeight);

  return (
    <div className="print-plate-container">
      <PlateDimensions 
        plateSize={plateSize} 
        canvasHeight={getCanvasHeight()} 
      />

      <div className="flex">
        {/* Height dimension on left - Part of PlateDimensions but rendered separately for layout */}
        <div className="flex flex-col items-center justify-center w-6 mr-1 text-sm text-gray-500 font-medium" style={{ height: `${getCanvasHeight()}px` }}>
          <div className="rotate-[-90deg] whitespace-nowrap">{plateSize.height} cm</div>
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
          {/* Grid */}
          <PlateGrid plateSize={plateSize} scale={getScale()} />

          {/* PDF Items */}
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
          
          {/* Size indicator in bottom right */}
          <div className="absolute bottom-2 right-2 bg-white/80 text-xs px-2 py-1 rounded text-gray-500">
            {plateSize.width} × {plateSize.height} cm
          </div>
        </div>
      </div>
    </div>
  );
};
