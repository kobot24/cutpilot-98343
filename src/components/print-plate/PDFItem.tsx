
import { useState, useEffect, useRef } from 'react';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { usePDFLoader } from '@/hooks/usePDFLoader';
import { PrintPlateSize } from './PrintPlateSettings';
import { getEffectiveDimensions } from '@/utils/print-plate/pdfTransformUtils';
import { PDFItemDocument } from './PDFItemDocument';
import { PDFItemDebug } from './PDFItemDebug';
import { PDFItemInfo } from './PDFItemInfo';
import { PDFItemActions } from './PDFItemActions';

type PDFItemProps = {
  item: PDFItemType;
  index: number;
  scale: number;
  plateSize: PrintPlateSize;
  onDragStart: (index: number, e: React.MouseEvent) => void;
  onRotate: (index: number) => void;
  onRemove: (index: number) => void;
};

export type PDFItemType = {
  id: string;
  pdfUrl: string;
  pdfData?: Uint8Array;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  aspectRatio?: number;
  thumbnail?: string;
  dpi?: number;
};

export const PDFItem = ({ 
  item, 
  index, 
  scale, 
  plateSize, 
  onDragStart, 
  onRotate, 
  onRemove 
}: PDFItemProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { handleDocumentLoadSuccess } = usePDFLoader({ pdfUrl: item.pdfUrl });
  
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
        transformOrigin: 'center center',
      }}
      onMouseDown={(e) => onDragStart(index, e)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative flex-1 overflow-hidden">
        <PDFItemDocument
          pdfUrl={item.pdfUrl}
          width={pixelWidth}
          height={pixelHeight}
          onLoadSuccess={handleDocumentLoadSuccess}
        />
        
        {/* Debug and boundary overlays */}
        <PDFItemDebug
          item={item}
          showDebug={showDebug}
          exceedsBoundaries={exceedsBoundaries}
          clipLeft={clipLeft}
          clipTop={clipTop}
          clipRight={clipRight}
          clipBottom={clipBottom}
        />
        
        {/* Item information */}
        <PDFItemInfo
          item={item}
          isHovered={isHovered}
          showDebug={showDebug}
          exceedsBoundaries={exceedsBoundaries}
        />
        
        {/* Action buttons */}
        <PDFItemActions
          isHovered={isHovered}
          onRotate={() => onRotate(index)}
          onRemove={() => onRemove(index)}
        />
      </div>
    </div>
  );
};
