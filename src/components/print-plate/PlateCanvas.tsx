
import { useRef, useMemo, useState } from 'react';
import { PDFItem, PDFItemType } from './PDFItem';
import { EmptyPlate } from './EmptyPlate';
import { PrintPlateSize } from './PrintPlateSettings';
import { PlateGrid } from './components/PlateGrid';
import { PlateDimensions } from './components/PlateDimensions';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { usePlateItems } from './hooks/usePlateItems';

// Define a fixed scale factor (pixels per cm)
// This needs to be consistent across the app for accurate dimensions
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
  
  // State for snap visual feedback
  const [snapActivated, setSnapActivated] = useState(false);
  
  // Monitor Alt key for explicit visual feedback
  useEffect(() => {
    const handleAltDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt' || e.code === 'AltLeft' || e.code === 'AltRight') {
        setSnapActivated(true);
      }
    };
    
    const handleAltUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt' || e.code === 'AltLeft' || e.code === 'AltRight') {
        setSnapActivated(false);
      }
    };
    
    window.addEventListener('keydown', handleAltDown);
    window.addEventListener('keyup', handleAltUp);
    
    return () => {
      window.removeEventListener('keydown', handleAltDown);
      window.removeEventListener('keyup', handleAltUp);
    };
  }, []);

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
          isSnapModeEnabled={isSnapModeEnabled || snapActivated}
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

            {/* Snap guidelines - make them more visible */}
            {(isSnapModeEnabled || snapActivated) && nearestSnapEdge.type === 'vertical' && nearestSnapEdge.x !== null && (
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-green-500 z-20 pointer-events-none"
                style={{ 
                  left: `${nearestSnapEdge.x * PIXELS_PER_CM}px`,
                  opacity: 0.8
                }}
              />
            )}
            
            {(isSnapModeEnabled || snapActivated) && nearestSnapEdge.type === 'horizontal' && nearestSnapEdge.y !== null && (
              <div 
                className="absolute left-0 right-0 h-0.5 bg-green-500 z-20 pointer-events-none"
                style={{ 
                  top: `${nearestSnapEdge.y * PIXELS_PER_CM}px`,
                  opacity: 0.8
                }}
              />
            )}

            {/* Enhanced snap mode visual feedback */}
            {isSnapModeEnabled || snapActivated ? (
              <div className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full z-30">
                Snap-Modus aktiv
              </div>
            ) : null}

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
        <p className="mt-0.5">Alternative: Drücke <kbd className="px-1 py-0.5 bg-gray-100 border rounded">F2</kbd> zum Ein/Ausschalten des Snap-Modus</p>
      </div>
    </div>
  );
};
