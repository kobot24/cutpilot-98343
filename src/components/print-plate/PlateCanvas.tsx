
import { useRef, useMemo } from 'react';
import { PDFItem, PDFItemType } from './PDFItem';
import { EmptyPlate } from './EmptyPlate';
import { PrintPlateSize } from './PrintPlateSettings';
import { PlateGrid } from './components/PlateGrid';
import { PlateDimensions } from './components/PlateDimensions';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { usePlateItems } from './hooks/usePlateItems';

// Define a fixed scale factor (pixels per cm)
const PIXELS_PER_CM = 3.7; // Based on 1120px ÷ 300cm example

type PlateCanvasProps = {
  items: PDFItemType[];
  onItemsChange: (items: PDFItemType[]) => void;
  plateSize: PrintPlateSize;
  onFitToPlate?: (index: number) => void;
};

export const PlateCanvas = ({ items, onItemsChange, plateSize, onFitToPlate }: PlateCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  // Calculate dimensions in pixels based on the fixed scale factor
  const canvasWidth = useMemo(() => plateSize.width * PIXELS_PER_CM, [plateSize.width]);
  const canvasHeight = useMemo(() => plateSize.height * PIXELS_PER_CM, [plateSize.height]);
  
  // Calculate scale (pixels per cm) for child components
  const getScale = (): number => {
    return PIXELS_PER_CM;
  };
  
  // Use the custom hooks for drag-and-drop and item management
  const { 
    handleDragStart,
    handleMouseMove,
    handleMouseUp 
  } = useDragAndDrop(items, onItemsChange, canvasRef, getScale);
  
  const {
    handleRotateItem,
    handleRemoveItem
  } = usePlateItems(items, onItemsChange, plateSize, () => canvasHeight);

  // Calculate approximate scale ratio for display (1:X)
  const scaleRatio = Math.round(100 / PIXELS_PER_CM);

  return (
    <div className="print-plate-container">
      <div className="flex flex-col">
        {/* Scale indicator */}
        <div className="text-xs text-gray-500 mb-1 self-end">
          Maßstab ca. 1:{scaleRatio}
        </div>
        
        <PlateDimensions 
          plateSize={plateSize} 
          canvasHeight={canvasHeight} 
        />

        <div className="flex">
          {/* Canvas */}
          <div 
            ref={canvasRef}
            className="bg-white print-plate relative border border-gray-200 rounded overflow-auto"
            style={{ 
              width: `${canvasWidth}px`, 
              height: `${canvasHeight}px`,
              maxWidth: '100%',
              maxHeight: '70vh'
            }}
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
                scale={PIXELS_PER_CM}
                onDragStart={handleDragStart}
                onRotate={handleRotateItem}
                onRemove={handleRemoveItem}
                onFitToPlate={onFitToPlate}
              />
            ))}
            
            {items.length === 0 && <EmptyPlate />}
          </div>
        </div>
      </div>
    </div>
  );
};

