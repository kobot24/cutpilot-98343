
import { useState, useEffect, useRef, memo } from 'react';
import { pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { getEffectiveDimensions } from '@/utils/print-plate/pdfTransformUtils';
import { PrintPlateSize } from './PrintPlateSettings';
import { PDFItemType } from './pdf-item/PDFItemType';
import OptimizedPDFDocumentRenderer from './pdf-item/OptimizedPDFDocumentRenderer';
import { PDFBoundaryOverlay } from './pdf-item/PDFBoundaryOverlay';
import { PDFItemControls } from './pdf-item/PDFItemControls';
import { PDFItemInfo } from './pdf-item/PDFItemInfo';
import { PDFDebugMarker } from './pdf-item/PDFDebugMarker';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

type PDFItemProps = {
  item: PDFItemType;
  index: number;
  scale: number;
  plateSize: PrintPlateSize;
  onDragStart: (index: number, e: React.MouseEvent) => void;
  onRotate: (index: number) => void;
  onRemove: (index: number) => void;
  isDragging?: boolean;
  exportMode?: boolean; // New prop to control export mode
};

export type { PDFItemType } from './pdf-item/PDFItemType';

// Use memo to prevent unnecessary re-renders
export const PDFItem = memo(({ 
  item, 
  index, 
  scale, 
  plateSize, 
  onDragStart, 
  onRotate, 
  onRemove,
  isDragging = false,
  exportMode = false // Default to false
}: PDFItemProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [errorLoading, setErrorLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Convert item dimensions from percentages to pixels using the scale
  const pixelWidth = item.width * scale;
  const pixelHeight = item.height * scale;
  const pixelX = item.x * scale;
  const pixelY = item.y * scale;

  // Calculate effective dimensions based on rotation
  const effectiveDimensions = getEffectiveDimensions(item.width, item.height, item.rotation);
  const effectiveWidth = effectiveDimensions.width;
  const effectiveHeight = effectiveDimensions.height;
  
  // Check if the item exceeds the plate boundaries
  const exceedsLeft = item.x < 0;
  const exceedsTop = item.y < 0;
  const exceedsRight = item.x + effectiveWidth > plateSize.width;
  const exceedsBottom = item.y + effectiveHeight > plateSize.height;
  const exceedsBoundaries = exceedsLeft || exceedsTop || exceedsRight || exceedsBottom;
  
  // Calculate the clipping for each edge (in px)
  const clipLeft = exceedsLeft ? Math.abs(item.x * scale) : 0;
  const clipTop = exceedsTop ? Math.abs(item.y * scale) : 0;
  const clipRight = exceedsRight ? Math.abs((item.x + effectiveWidth - plateSize.width) * scale) : 0;
  const clipBottom = exceedsBottom ? Math.abs((item.y + effectiveHeight - plateSize.height) * scale) : 0;
  
  // Toggle debug info with Ctrl+D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        setShowDebug(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  const handleDocumentLoadSuccess = () => {
    setErrorLoading(false);
  };

  const handleDocumentLoadError = (error: Error) => {
    console.error(`Error loading PDF item ${item.id}:`, error);
    setErrorLoading(true);
  };

  const handleRotateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRotate(index);
  };
  
  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(index);
  };

  // Use optimized CSS classes to improve rendering performance
  let itemClassNames = "pdf-item absolute flex flex-col";
  
  // In export mode, remove cursor and other UI-related styles
  if (!exportMode) {
    itemClassNames += " cursor-move";
  }
  
  if (isDragging) {
    itemClassNames += " will-change-transform";
  }

  return (
    <div
      ref={containerRef}
      className={itemClassNames}
      style={{
        left: `${pixelX}px`,
        top: `${pixelY}px`,
        width: `${pixelWidth}px`,
        height: `${pixelHeight}px`,
        transform: `rotate(${item.rotation}deg)`,
        transformOrigin: 'center center', // Make sure rotation is around center
        transition: isDragging ? 'none' : 'transform 0.1s ease-out', // Only add transition when not dragging
      }}
      onMouseDown={!exportMode ? (e) => onDragStart(index, e) : undefined}
      onMouseEnter={!exportMode ? () => setIsHovered(true) : undefined}
      onMouseLeave={!exportMode ? () => setIsHovered(false) : undefined}
    >
      <div className="relative flex-1 overflow-hidden">
        <OptimizedPDFDocumentRenderer
          pdfUrl={item.pdfUrl}
          thumbnail={item.thumbnail}
          pixelWidth={pixelWidth}
          pixelHeight={pixelHeight}
          isDragging={isDragging}
          onLoadSuccess={handleDocumentLoadSuccess}
          onLoadError={handleDocumentLoadError}
        />
        
        {/* In export mode, don't show any overlays or controls */}
        {!exportMode && (
          <>
            {/* Boundary overlay areas */}
            <PDFBoundaryOverlay
              exceedsBoundaries={exceedsBoundaries}
              exceedsLeft={exceedsLeft}
              exceedsTop={exceedsTop}
              exceedsRight={exceedsRight}
              exceedsBottom={exceedsBottom}
              clipLeft={clipLeft}
              clipTop={clipTop}
              clipRight={clipRight}
              clipBottom={clipBottom}
            />
            
            {/* Debug center marker */}
            <PDFDebugMarker showDebug={showDebug} />
            
            {/* Item info display */}
            <PDFItemInfo
              isHovered={isHovered}
              showDebug={showDebug}
              width={item.width}
              height={item.height}
              rotation={item.rotation}
              dpi={item.dpi}
              x={item.x}
              y={item.y}
              exceedsBoundaries={exceedsBoundaries}
            />
            
            {/* Item controls - only show when not dragging */}
            {!isDragging && (
              <PDFItemControls
                isHovered={isHovered}
                onRotate={handleRotateClick}
                onRemove={handleRemoveClick}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  // Only re-render if important props have changed
  const itemsEqual = prevProps.item.id === nextProps.item.id &&
                    prevProps.item.rotation === nextProps.item.rotation &&
                    Math.abs(prevProps.item.x - nextProps.item.x) < 0.01 &&
                    Math.abs(prevProps.item.y - nextProps.item.y) < 0.01 &&
                    Math.abs(prevProps.item.width - nextProps.item.width) < 0.01 &&
                    Math.abs(prevProps.item.height - nextProps.item.height) < 0.01;
                    
  return itemsEqual && 
         prevProps.scale === nextProps.scale &&
         prevProps.isDragging === nextProps.isDragging && 
         prevProps.exportMode === nextProps.exportMode && 
         prevProps.index === nextProps.index;
});
