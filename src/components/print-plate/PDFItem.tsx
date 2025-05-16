
import { useState, useEffect, useRef } from 'react';
import { pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { getEffectiveDimensions } from '@/utils/print-plate/pdfTransformUtils';
import { PrintPlateSize } from './PrintPlateSettings';
import { PDFItemType } from './pdf-item/PDFItemType';
import { PDFDocumentRenderer } from './pdf-item/PDFDocumentRenderer';
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
};

export type { PDFItemType } from './pdf-item/PDFItemType';

export const PDFItem = ({ item, index, scale, plateSize, onDragStart, onRotate, onRemove }: PDFItemProps) => {
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
    console.log(`PDF item ${item.id} loaded successfully`);
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

  return (
    <div
      ref={containerRef}
      className="pdf-item absolute flex flex-col cursor-move"
      style={{
        left: `${pixelX}px`,
        top: `${pixelY}px`,
        width: `${pixelWidth}px`,
        height: `${pixelHeight}px`,
        transform: `rotate(${item.rotation}deg)`,
        transformOrigin: 'center center', // Make sure rotation is around center
      }}
      onMouseDown={(e) => onDragStart(index, e)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative flex-1 overflow-hidden">
        <PDFDocumentRenderer
          pdfUrl={item.pdfUrl}
          thumbnail={item.thumbnail}
          pixelWidth={pixelWidth}
          pixelHeight={pixelHeight}
          onLoadSuccess={handleDocumentLoadSuccess}
          onLoadError={handleDocumentLoadError}
        />
        
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
        
        {/* Item controls */}
        <PDFItemControls
          isHovered={isHovered}
          onRotate={handleRotateClick}
          onRemove={handleRemoveClick}
        />
      </div>
    </div>
  );
};
