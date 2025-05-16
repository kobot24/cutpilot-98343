
import { useRef, useMemo, useState } from 'react';
import { PDFItem, PDFItemType } from './PDFItem';
import { EmptyPlate } from './EmptyPlate';
import { PrintPlateSize } from './PrintPlateSettings';
import { PlateGrid } from './components/PlateGrid';
import { PlateDimensions } from './components/PlateDimensions';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { usePlateItems } from './hooks/usePlateItems';

// Define a fixed scale factor (pixels per cm)
// Update scale factor to fit more items on the plate (was 3.7)
// For a 300cm plate width to properly fit 3x ~90cm items, we need a smaller scale
const PIXELS_PER_CM = 2.5;

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
    handleMouseUp,
    isSnapModeEnabled,
    nearestSnapEdge
  } = useDragAndDrop(
    items, 
    onItemsChange, 
    canvasRef, 
    getScale,
    plateSize
  );
  
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
          isSnapModeEnabled={isSnapModeEnabled}
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

            {/* Snap guidelines */}
            {isSnapModeEnabled && nearestSnapEdge.type === 'vertical' && nearestSnapEdge.x !== null && (
              <div 
                className="absolute top-0 bottom-0 w-px bg-green-500 z-20 pointer-events-none"
                style={{ left: `${nearestSnapEdge.x * PIXELS_PER_CM}px` }}
              />
            )}
            
            {isSnapModeEnabled && nearestSnapEdge.type === 'horizontal' && nearestSnapEdge.y !== null && (
              <div 
                className="absolute left-0 right-0 h-px bg-green-500 z-20 pointer-events-none"
                style={{ top: `${nearestSnapEdge.y * PIXELS_PER_CM}px` }}
              />
            )}

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
      
      {/* Keyboard shortcut info */}
      <div className="mt-2 text-xs text-gray-500">
        <p>Halte die <kbd className="px-1 py-0.5 bg-gray-100 border rounded">Alt</kbd>-Taste gedrückt für den Snap-Modus</p>
      </div>
    </div>
  );
};
