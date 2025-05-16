
import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { usePDFLoader } from '@/hooks/usePDFLoader';
import { PrintPlateSize } from './PrintPlateSettings';
import { getEffectiveDimensions } from '@/utils/print-plate/pdfTransformUtils';

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

export type PDFItemType = {
  id: string;
  pdfUrl: string;
  pdfData?: Uint8Array; // Added field to store actual PDF binary data
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  aspectRatio?: number;
  thumbnail?: string;
  dpi?: number;
};

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
        {item.pdfUrl ? (
          <Document
            file={item.pdfUrl}
            onLoadSuccess={handleDocumentLoadSuccess}
            onError={handleDocumentLoadError}
            loading={
              <div className="flex items-center justify-center w-full h-full">
                <div className="animate-pulse text-xs text-gray-400">Lädt...</div>
              </div>
            }
            error={
              <div className="flex items-center justify-center w-full h-full">
                <div className="text-xs text-red-400">Fehler</div>
              </div>
            }
            className="w-full h-full"
          >
            <Page
              pageNumber={1}
              width={pixelWidth}
              height={pixelHeight}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="pdf-page"
            />
          </Document>
        ) : item.thumbnail ? (
          // Fallback to thumbnail if PDF URL is not available
          <img 
            src={item.thumbnail} 
            alt="PDF preview" 
            className="w-full h-full object-contain"
          />
        ) : (
          // No preview available
          <div className="flex items-center justify-center w-full h-full bg-gray-100">
            <div className="text-xs text-gray-400">Keine Vorschau</div>
          </div>
        )}
        
        {/* Darkened overlay areas for parts that extend beyond plate boundaries */}
        {exceedsBoundaries && (
          <>
            {/* Left overflow */}
            {exceedsLeft && (
              <div 
                className="absolute top-0 left-0 bg-black/40 pointer-events-none z-10"
                style={{ 
                  width: `${clipLeft}px`,
                  height: '100%',
                }}
              />
            )}
            
            {/* Top overflow */}
            {exceedsTop && (
              <div 
                className="absolute top-0 left-0 bg-black/40 pointer-events-none z-10"
                style={{ 
                  width: '100%',
                  height: `${clipTop}px`,
                }}
              />
            )}
            
            {/* Right overflow */}
            {exceedsRight && (
              <div 
                className="absolute top-0 right-0 bg-black/40 pointer-events-none z-10"
                style={{ 
                  width: `${clipRight}px`,
                  height: '100%',
                }}
              />
            )}
            
            {/* Bottom overflow */}
            {exceedsBottom && (
              <div 
                className="absolute bottom-0 left-0 bg-black/40 pointer-events-none z-10"
                style={{ 
                  width: '100%',
                  height: `${clipBottom}px`,
                }}
              />
            )}
          </>
        )}
        
        {/* Item center marker for debugging */}
        {showDebug && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <div className="absolute top-0 bottom-0 w-0.5 bg-red-300 opacity-50"></div>
            <div className="absolute left-0 right-0 h-0.5 bg-red-300 opacity-50"></div>
          </div>
        )}
        
        {/* Physical size indicator when hovered */}
        {(isHovered || showDebug) && (
          <div className="absolute top-1 left-1 bg-white/80 text-xs px-2 py-1 rounded shadow-sm z-10">
            {item.width.toFixed(1)} × {item.height.toFixed(1)} cm
            {item.rotation !== 0 && <span className="ml-1 text-orange-500">({item.rotation}°)</span>}
            {item.dpi && <span className="ml-1 text-gray-500">({item.dpi} DPI)</span>}
            {showDebug && (
              <div className="text-[10px] text-gray-600 mt-1">
                x: {item.x.toFixed(2)}, y: {item.y.toFixed(2)}
              </div>
            )}
            
            {/* Add indicator if item exceeds plate boundaries */}
            {exceedsBoundaries && (
              <div className="text-[10px] text-red-600 mt-0.5 font-medium">
                Außerhalb der Druckplatte
              </div>
            )}
          </div>
        )}
        
        {isHovered && (
          <div className="absolute bottom-1 right-1 flex space-x-1 z-10">
            <button 
              className="bg-white/80 rounded p-1 shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                onRotate(index);
              }}
              title="Um 90° drehen"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-3 w-3 text-gray-600" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
            </button>
            <button 
              className="bg-white/80 rounded p-1 shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(index);
              }}
              title="Entfernen"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-3 w-3 text-gray-600" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
