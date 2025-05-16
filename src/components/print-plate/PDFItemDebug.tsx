
import { PDFItemType } from './PDFItem';

type PDFItemDebugProps = {
  item: PDFItemType;
  showDebug: boolean;
  exceedsBoundaries: boolean;
  clipLeft: number;
  clipTop: number;
  clipRight: number;
  clipBottom: number;
};

export const PDFItemDebug = ({ 
  item, 
  showDebug, 
  exceedsBoundaries,
  clipLeft,
  clipTop,
  clipRight,
  clipBottom 
}: PDFItemDebugProps) => {
  // If we're not debugging, don't render anything
  if (!showDebug) return null;
  
  return (
    <>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        <div className="absolute top-0 bottom-0 w-0.5 bg-red-300 opacity-50"></div>
        <div className="absolute left-0 right-0 h-0.5 bg-red-300 opacity-50"></div>
      </div>

      {/* Show boundary indicators if the item exceeds boundaries */}
      {exceedsBoundaries && (
        <>
          {/* Left overflow */}
          {clipLeft > 0 && (
            <div 
              className="absolute top-0 left-0 bg-black/40 pointer-events-none z-10"
              style={{ 
                width: `${clipLeft}px`,
                height: '100%',
              }}
            />
          )}
          
          {/* Top overflow */}
          {clipTop > 0 && (
            <div 
              className="absolute top-0 left-0 bg-black/40 pointer-events-none z-10"
              style={{ 
                width: '100%',
                height: `${clipTop}px`,
              }}
            />
          )}
          
          {/* Right overflow */}
          {clipRight > 0 && (
            <div 
              className="absolute top-0 right-0 bg-black/40 pointer-events-none z-10"
              style={{ 
                width: `${clipRight}px`,
                height: '100%',
              }}
            />
          )}
          
          {/* Bottom overflow */}
          {clipBottom > 0 && (
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
    </>
  );
};
