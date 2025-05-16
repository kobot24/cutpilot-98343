/**
 * Utility functions for PDF transformations, especially rotation
 */

/**
 * Get the transformation matrix for rotating and positioning a PDF element
 * @param x The x position in points (left)
 * @param y The y position in points (bottom in PDF coordinates)
 * @param width The width of the element in points
 * @param height The height of the element in points
 * @param rotationAngle The rotation angle in degrees (0, 90, 180, 270)
 * @returns The transformation matrix and adjusted dimensions
 */
export const getRotatedTransform = (
  x: number,
  y: number,
  width: number,
  height: number,
  rotationAngle: number
): { matrix: number[], swapDimensions: boolean } => {
  console.log(`PDF Transform - Calculating transform for rotation ${rotationAngle}°`);
  console.log(`PDF Transform - Original position: x=${x}, y=${y}, w=${width}, h=${height}`);
  
  // Whether dimensions should be swapped (width/height)
  const swapDimensions = rotationAngle === 90 || rotationAngle === 270;
  
  // Calculate transformation matrix based on rotation angle
  switch (rotationAngle) {
    case 90:
      // 90° clockwise: [0, 1, -1, 0, x + height, y]
      // This swaps x and y, negates x, and translates to keep in view
      console.log(`PDF Transform - Using 90° transform matrix: [0, 1, -1, 0, ${x + height}, ${y}]`);
      return {
        matrix: [0, 1, -1, 0, x + height, y],
        swapDimensions
      };
      
    case 180:
      // 180° clockwise: [-1, 0, 0, -1, x + width, y + height]
      // This negates both x and y, and translates to keep in view
      console.log(`PDF Transform - Using 180° transform matrix: [-1, 0, 0, -1, ${x + width}, ${y + height}]`);
      return {
        matrix: [-1, 0, 0, -1, x + width, y + height],
        swapDimensions
      };
      
    case 270:
      // 270° clockwise: [0, -1, 1, 0, x, y + width]
      // This swaps x and y, negates y, and translates to keep in view
      console.log(`PDF Transform - Using 270° transform matrix: [0, -1, 1, 0, ${x}, ${y + width}]`);
      return {
        matrix: [0, -1, 1, 0, x, y + width],
        swapDimensions
      };
      
    default:
      // 0° (no rotation): [1, 0, 0, 1, x, y]
      console.log(`PDF Transform - Using default transform matrix: [1, 0, 0, 1, ${x}, ${y}]`);
      return {
        matrix: [1, 0, 0, 1, x, y],
        swapDimensions
      };
  }
};

/**
 * Calculate the effective dimensions after rotation
 * @param width Original width
 * @param height Original height
 * @param rotation Rotation angle in degrees
 * @returns The effective dimensions after rotation
 */
export const getEffectiveDimensions = (
  width: number,
  height: number,
  rotation: number
): { width: number, height: number } => {
  if (rotation === 90 || rotation === 270) {
    // Swap dimensions for 90° and 270° rotations
    return { width: height, height: width };
  }
  return { width, height };
};
