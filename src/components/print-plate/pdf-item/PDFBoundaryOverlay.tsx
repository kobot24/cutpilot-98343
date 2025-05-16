
import React from 'react';

type BoundaryOverlayProps = {
  exceedsBoundaries: boolean;
  exceedsLeft: boolean;
  exceedsTop: boolean;
  exceedsRight: boolean;
  exceedsBottom: boolean;
  clipLeft: number;
  clipTop: number;
  clipRight: number;
  clipBottom: number;
};

export const PDFBoundaryOverlay = ({
  exceedsBoundaries,
  exceedsLeft,
  exceedsTop,
  exceedsRight,
  exceedsBottom,
  clipLeft,
  clipTop,
  clipRight,
  clipBottom
}: BoundaryOverlayProps) => {
  if (!exceedsBoundaries) return null;
  
  return (
    <>
      {/* Top warning label if item exceeds boundaries */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full z-30 whitespace-nowrap">
        Außerhalb der Druckplatte
      </div>
      
      {/* Left overflow */}
      {exceedsLeft && (
        <div 
          className="absolute top-0 left-0 bg-red-500/30 border-r-2 border-red-600 pointer-events-none z-10"
          style={{ 
            width: `${clipLeft}px`,
            height: '100%',
          }}
        />
      )}
      
      {/* Top overflow */}
      {exceedsTop && (
        <div 
          className="absolute top-0 left-0 bg-red-500/30 border-b-2 border-red-600 pointer-events-none z-10"
          style={{ 
            width: '100%',
            height: `${clipTop}px`,
          }}
        />
      )}
      
      {/* Right overflow */}
      {exceedsRight && (
        <div 
          className="absolute top-0 right-0 bg-red-500/30 border-l-2 border-red-600 pointer-events-none z-10"
          style={{ 
            width: `${clipRight}px`,
            height: '100%',
          }}
        />
      )}
      
      {/* Bottom overflow */}
      {exceedsBottom && (
        <div 
          className="absolute bottom-0 left-0 bg-red-500/30 border-t-2 border-red-600 pointer-events-none z-10"
          style={{ 
            width: '100%',
            height: `${clipBottom}px`,
          }}
        />
      )}
    </>
  );
};
