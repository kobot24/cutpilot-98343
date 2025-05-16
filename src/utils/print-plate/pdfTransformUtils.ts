
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
  
  // Calculate center point of the element (critical for center-preserving rotation)
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  console.log(`PDF Transform - Center point: cx=${centerX}, cy=${centerY}`);
  
  // Calculate transformation matrix based on rotation angle
  // For PDF coordinate system, origin (0,0) is at the bottom left
  switch (rotationAngle) {
    case 90:
      // For 90° rotation: rotate around center
      console.log(`PDF Transform - Using 90° center-preserving transform`);
      return {
        // Corrected matrix for 90° center-preserving rotation
        matrix: [0, 1, -1, 0, centerX + height/2 - width/2, centerY - height/2 + width/2],
        swapDimensions
      };
      
    case 180:
      // For 180° rotation: rotate around center
      console.log(`PDF Transform - Using 180° center-preserving transform`);
      return {
        // Matrix for 180° center-preserving rotation
        matrix: [-1, 0, 0, -1, 2 * centerX, 2 * centerY],
        swapDimensions
      };
      
    case 270:
      // For 270° rotation: rotate around center
      console.log(`PDF Transform - Using 270° center-preserving transform`);
      return {
        // Corrected matrix for 270° center-preserving rotation
        matrix: [0, -1, 1, 0, centerX - height/2 + width/2, centerY + height/2 - width/2],
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
  // For 90° and 270° rotations, swap width and height
  if (rotation === 90 || rotation === 270) {
    return { width: height, height: width };
  }
  // For 0° and 180° rotations, keep original dimensions
  return { width, height };
};
