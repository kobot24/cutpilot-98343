
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
  
  // PDF koordinatensystem - (0,0) ist unten links
  // Wir rotieren um den Mittelpunkt des Objekts
  const centerX = x + (width / 2);
  const centerY = y + (height / 2);
  
  // Calculate transformation matrix based on rotation angle
  switch (rotationAngle) {
    case 90:
      // 90° im Uhrzeigersinn - korrigierte Matrix
      console.log(`PDF Transform - Rotiere 90° um Mittelpunkt (${centerX}, ${centerY})`);
      return {
        // Korrekte Matrix für 90° Drehung im PDF-Koordinatensystem
        // [0, 1, -1, 0, x + height, y] hat Probleme verursacht
        matrix: [0, 1, -1, 0, x + height, y],
        swapDimensions
      };
      
    case 180:
      // 180° im Uhrzeigersinn - korrigierte Matrix
      console.log(`PDF Transform - Rotiere 180° um Mittelpunkt (${centerX}, ${centerY})`);
      return {
        matrix: [-1, 0, 0, -1, x + width, y + height],
        swapDimensions
      };
      
    case 270:
      // 270° im Uhrzeigersinn - korrigierte Matrix
      console.log(`PDF Transform - Rotiere 270° um Mittelpunkt (${centerX}, ${centerY})`);
      return {
        // Korrekte Matrix für 270° Drehung
        matrix: [0, -1, 1, 0, x, y + width],
        swapDimensions
      };
      
    default:
      // 0° (keine Rotation)
      console.log(`PDF Transform - Keine Rotation, Standard-Matrix`);
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
