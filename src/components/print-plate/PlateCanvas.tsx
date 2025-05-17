
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { PDFItem, PDFItemType } from './PDFItem';
import { EmptyPlate } from './EmptyPlate';
import { PrintPlateSize } from './PrintPlateSettings';
import { PlateGrid } from './components/PlateGrid';
import { PlateDimensions } from './components/PlateDimensions';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { usePlateItems } from './hooks/usePlateItems';
import { Button } from '../ui/button';

// Define a fixed scale factor (pixels per cm)
// This needs to be consistent across the app for accurate dimensions
const PIXELS_PER_CM = 2.5;

type PlateCanvasProps = {
  items: PDFItemType[];
  onItemsChange: (items: PDFItemType[]) => void;
  plateSize: PrintPlateSize;
  onFitToPlate?: (index: number) => void;
  exportMode?: boolean; // New prop to control export mode
};

export const PlateCanvas = ({ 
  items, 
  onItemsChange, 
  plateSize, 
  onFitToPlate,
  exportMode = false // Default to false 
}: PlateCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  // Calculate dimensions in pixels based on the fixed scale factor
  const canvasWidth = useMemo(() => plateSize.width * PIXELS_PER_CM, [plateSize.width]);
  const canvasHeight = useMemo(() => plateSize.height * PIXELS_PER_CM, [plateSize.height]);
  
  // Calculate scale (pixels per cm) for child components - memoize this function
  const getScale = useCallback((): number => {
    return PIXELS_PER_CM;
  }, []);
  
  // Use the custom hooks for drag-and-drop and item management
  const { 
    handleDragStart,
    handleMouseMove,
    handleMouseUp,
    isSnapModeEnabled,
    toggleSnapMode,
    nearestSnapEdge,
    isAltKeyPressed,
    draggedItemIndex,
    isDragging
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
  const scaleRatio = useMemo(() => Math.round(100 / PIXELS_PER_CM), []);

  // Add debug mode for development
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  // Toggle debug info with Ctrl+Shift+D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setShowDebugInfo(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Don't render UI controls in export mode
  if (exportMode) {
    return (
      <div className="print-plate-container">
        <div className="flex flex-col">
          <div 
            className="bg-white print-plate relative border-0"
            style={{ 
              width: `${canvasWidth}px`, 
              height: `${canvasHeight}px`
            }}
          >
            {/* Only render PDF Items in export mode */}
            {items.map((item, index) => (
              <PDFItem
                key={item.id || `pdf-item-${index}`}
                item={item}
                index={index}
                scale={PIXELS_PER_CM}
                plateSize={plateSize}
                onDragStart={() => {}}
                onRotate={() => {}}
                onRemove={() => {}}
                isDragging={false}
                exportMode={true}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="print-plate-container">
      <div className="flex flex-col">
        {/* Control bar with snap toggle */}
        <div className="flex justify-between items-center mb-2">
          <Button 
            variant={isSnapModeEnabled ? "default" : "outline"}
            size="sm"
            onClick={toggleSnapMode}
            className="text-xs"
          >
            {isSnapModeEnabled ? "Snap-Modus: An" : "Snap-Modus: Aus"}
          </Button>
          
          <div className="text-xs text-gray-500 self-end">
            Maßstab ca. 1:{scaleRatio}
          </div>
        </div>
        
        <PlateDimensions 
          plateSize={plateSize} 
          canvasHeight={canvasHeight}
          isSnapModeEnabled={isSnapModeEnabled || isAltKeyPressed}
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
            {/* Grid - pass exportMode prop */}
            <PlateGrid plateSize={plateSize} scale={getScale()} exportMode={exportMode} />

            {/* Snap guidelines - make them more visible */}
            {(isSnapModeEnabled || isAltKeyPressed) && nearestSnapEdge.type === 'vertical' && nearestSnapEdge.x !== null && (
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-green-500 z-20 pointer-events-none"
                style={{ 
                  left: `${nearestSnapEdge.x * PIXELS_PER_CM}px`,
                  opacity: 0.8
                }}
              />
            )}
            
            {(isSnapModeEnabled || isAltKeyPressed) && nearestSnapEdge.type === 'horizontal' && nearestSnapEdge.y !== null && (
              <div 
                className="absolute left-0 right-0 h-0.5 bg-green-500 z-20 pointer-events-none"
                style={{ 
                  top: `${nearestSnapEdge.y * PIXELS_PER_CM}px`,
                  opacity: 0.8
                }}
              />
            )}

            {/* Enhanced snap mode visual feedback */}
            {isSnapModeEnabled ? (
              <div className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full z-30">
                Snap-Modus aktiv
              </div>
            ) : isAltKeyPressed ? (
              <div className="absolute top-2 right-2 bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full z-30">
                Snap (temporär)
              </div>
            ) : null}

            {/* Debug info overlay */}
            {showDebugInfo && (
              <div className="absolute top-2 left-2 bg-black/80 text-white text-xs p-2 rounded z-40">
                <p>Debug Mode</p>
                <p>Items: {items.length}</p>
                {items.map((item, i) => (
                  <div key={i} className="mt-1 border-t border-gray-700 pt-1">
                    <p>Item {i}: x={item.x.toFixed(1)}, y={item.y.toFixed(1)}</p>
                    <p>w={item.width.toFixed(1)}, h={item.height.toFixed(1)}, rot={item.rotation}°</p>
                  </div>
                ))}
              </div>
            )}

            {/* PDF Items - Ensure each has a truly unique key */}
            {items.map((item, index) => (
              <PDFItem
                key={item.id || `pdf-item-${index}`}
                item={item}
                index={index}
                scale={PIXELS_PER_CM}
                plateSize={plateSize}
                onDragStart={handleDragStart}
                onRotate={handleRotateItem}
                onRemove={handleRemoveItem}
                isDragging={isDragging && draggedItemIndex === index}
              />
            ))}
            
            {items.length === 0 && <EmptyPlate />}
          </div>
        </div>
      </div>
      
      {/* Keyboard shortcut info */}
      <div className="mt-2 text-xs text-gray-500">
        <p>Drücke <kbd className="px-1 py-0.5 bg-gray-100 border rounded">F2</kbd> oder den Button oben, um den Snap-Modus ein/auszuschalten</p>
        <p className="mt-0.5">Temporärer Snap-Modus: Halte die <kbd className="px-1 py-0.5 bg-gray-100 border rounded">Alt</kbd>-Taste gedrückt</p>
        {showDebugInfo && <p className="mt-0.5 text-blue-500">Debug-Modus aktiv (Strg+Shift+D zum Ausschalten)</p>}
      </div>
    </div>
  );
};
