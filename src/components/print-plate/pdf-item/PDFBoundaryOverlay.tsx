
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
  );
};
