
import React from 'react';

type PDFItemControlsProps = {
  isHovered: boolean;
  onRotate: (e: React.MouseEvent) => void;
  onRemove: (e: React.MouseEvent) => void;
};

export const PDFItemControls = ({ isHovered, onRotate, onRemove }: PDFItemControlsProps) => {
  if (!isHovered) return null;
  
  return (
    <div className="absolute bottom-1 right-1 flex space-x-1 z-10">
      <button 
        className="bg-white/80 rounded p-1 shadow-sm"
        onClick={onRotate}
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
        onClick={onRemove}
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
  );
};
