
import { useState, useEffect } from 'react';

type PDFItemProps = {
  item: PDFItemType;
  index: number;
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

export const PDFItem = ({ item, index, onDragStart, onRotate, onRemove }: PDFItemProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div
      className="pdf-item absolute bg-white shadow-md border border-gray-200 flex flex-col"
      style={{
        left: `${item.x}px`,
        top: `${item.y}px`,
        width: `${item.width}px`,
        height: `${item.height}px`,
        transform: `rotate(${item.rotation}deg)`,
      }}
      onMouseDown={(e) => onDragStart(index, e)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative flex-1">
        <img 
          src={item.thumbnail || item.pdfUrl} 
          alt={`PDF ${index}`} 
          className="w-full h-full object-contain"
        />
        {(isHovered || window.innerWidth < 768) && (
          <div className="absolute bottom-1 right-1 flex space-x-1">
            <button 
              className="bg-white rounded p-1 shadow-sm border border-gray-200"
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
              className="bg-white rounded p-1 shadow-sm border border-gray-200"
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
