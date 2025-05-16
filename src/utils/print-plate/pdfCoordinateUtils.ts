
// Convert cm to points (PDF uses points as unit, 1 cm = 28.35 points)
export const CM_TO_POINTS = 28.35;

/**
 * Convert dimensions from centimeters to points
 * @param width Width in cm
 * @param height Height in cm
 * @returns Dimensions in points
 */
export const convertDimensionsToPoints = (width: number, height: number) => {
  return {
    width: width * CM_TO_POINTS,
    height: height * CM_TO_POINTS
  };
};

/**
 * Calculate PDF item position and dimensions in points
 * @param item The PDF item
 * @param pageHeight The PDF page height in points
 * @returns The position and dimensions in points
 */
export const calculateItemPositionInPoints = (item: any, pageHeight: number) => {
  // Calculate position and dimensions in PDF points
  const itemX = item.x * CM_TO_POINTS;
  
  // Fix: Correctly calculate Y position by flipping the coordinate system
  // In PDFs, the origin is at the bottom-left, but in our UI it's at the top-left
  const itemY = pageHeight - (item.y * CM_TO_POINTS) - (item.height * CM_TO_POINTS);
  
  const itemWidth = item.width * CM_TO_POINTS;
  const itemHeight = item.height * CM_TO_POINTS;
  
  // Get the center of the item for rotation calculations
  const itemCenterX = itemX + (itemWidth / 2);
  const itemCenterY = itemY + (itemHeight / 2);
  
  return {
    x: itemX,
    y: itemY,
    width: itemWidth,
    height: itemHeight,
    centerX: itemCenterX,
    centerY: itemCenterY
  };
};
