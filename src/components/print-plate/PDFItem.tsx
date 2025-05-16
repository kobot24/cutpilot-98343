
import { useState, useEffect, useRef } from 'react';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { usePDFLoader } from '@/hooks/usePDFLoader';

type PDFItemProps = {
  item: PDFItemType;
  index: number;
  scale: number;
  onDragStart: (index: number, e: React.MouseEvent) => void;
  onRotate: (index: number) => void;
  onRemove: (index: number) => void;
};

export type PDFItemType = {
  id: string;
  pdfUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  aspectRatio?: number;
  thumbnail?: string;
};

export const PDFItem = ({ item, index, scale, onDragStart, onRotate, onRemove }: PDFItemProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { handleDocumentLoadSuccess } = usePDFLoader({ pdfUrl: item.pdfUrl });
  
  // Convert item dimensions from percentages to pixels using the scale
  const pixelWidth = item.width * scale;
  const pixelHeight = item.height * scale;
  const pixelX = item.x * scale;
  const pixelY = item.y * scale;
  
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
      }}
      onMouseDown={(e) => onDragStart(index, e)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative flex-1 overflow-hidden">
        <Document
          file={item.pdfUrl}
          onLoadSuccess={handleDocumentLoadSuccess}
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
            scale={1}
          />
        </Document>
        
        {isHovered && (
          <div className="absolute bottom-1 right-1 flex space-x-1 z-10">
            <button 
              className="bg-white/80 rounded p-1 shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                onRotate(index);
              }}
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
