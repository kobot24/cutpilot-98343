
import { PDFItemType } from '@/components/print-plate/PDFItem';
import { PrintPlateSize } from '@/components/print-plate/PrintPlateSettings';
import { getEffectiveDimensions } from '@/utils/print-plate/pdfTransformUtils';
import { packRowFirst, packColumnFirst } from './packingStrategies';

/**
 * Calculate sizing metrics for the items and plate
 */
export const calculateSizingMetrics = (items: PDFItemType[], plateSize: PrintPlateSize) => {
  // Calculate total area of all items
  const totalItemArea = items.reduce((total: number, item: PDFItemType) => {
    const effectiveDim = getEffectiveDimensions(item.width, item.height, item.rotation);
    return total + (effectiveDim.width * effectiveDim.height);
  }, 0);
  
  const plateArea = plateSize.width * plateSize.height;
  const fillRatio = totalItemArea / plateArea;
  
  // Find oversized items
  const oversizedItems = items.filter((item: PDFItemType) => {
    const effectiveDim = getEffectiveDimensions(item.width, item.height, item.rotation);
    return effectiveDim.width > plateSize.width || effectiveDim.height > plateSize.height;
  });
  
  return {
    totalItemArea,
    plateArea,
    fillRatio,
    oversizedItems
  };
};

/**
 * Determine optimal margins and spacing based on fill ratio
 */
export const determineOptimalSpacing = (fillRatio: number) => {
  // Choose appropriate margin and spacing based on fill ratio
  let MARGIN_CM = 0.5; // Default margin
  let SPACING_CM = 0.5; // Default spacing
  
  // Adjust margins and spacing based on fill ratio
  if (fillRatio > 0.8) {
    // If items are taking up a lot of space, use smaller margins
    MARGIN_CM = 0.2;
    SPACING_CM = 0.2;
  } else if (fillRatio > 0.6) {
    // Moderate space optimization
    MARGIN_CM = 0.3;
    SPACING_CM = 0.3;
  }
  
  return { MARGIN_CM, SPACING_CM };
};

/**
 * Try different packing strategies to find the best arrangement
 */
export const tryPackStrategies = (
  items: PDFItemType[], 
  plateSize: PrintPlateSize, 
  margin: number, 
  spacing: number
) => {
  // Make copies for each strategy
  const itemsForRowFirst = JSON.parse(JSON.stringify(items));
  const itemsForColumnFirst = JSON.parse(JSON.stringify(items));
  const itemsForOptimized = JSON.parse(JSON.stringify(items));
  
  // Try row-first packing (sort by width)
  itemsForRowFirst.sort((a: PDFItemType, b: PDFItemType) => {
    const aEffectiveDim = getEffectiveDimensions(a.width, a.height, a.rotation);
    const bEffectiveDim = getEffectiveDimensions(b.width, b.height, b.rotation);
    return bEffectiveDim.width - aEffectiveDim.width; // Widest first
  });
  const rowResult = packRowFirst(itemsForRowFirst, plateSize, margin, spacing);
  
  // Try column-first packing (sort by height)
  itemsForColumnFirst.sort((a: PDFItemType, b: PDFItemType) => {
    const aEffectiveDim = getEffectiveDimensions(a.width, a.height, a.rotation);
    const bEffectiveDim = getEffectiveDimensions(b.width, b.height, b.rotation);
    return bEffectiveDim.height - aEffectiveDim.height; // Tallest first
  });
  const columnResult = packColumnFirst(itemsForColumnFirst, plateSize, margin, spacing);
  
  // Try area-optimized packing (sort by area)
  itemsForOptimized.sort((a: PDFItemType, b: PDFItemType) => {
    const aEffectiveDim = getEffectiveDimensions(a.width, a.height, a.rotation);
    const bEffectiveDim = getEffectiveDimensions(b.width, b.height, b.rotation);
    const aArea = aEffectiveDim.width * aEffectiveDim.height;
    const bArea = bEffectiveDim.width * bEffectiveDim.height;
    return bArea - aArea; // Largest area first
  });
  const areaResult = packRowFirst(itemsForOptimized, plateSize, margin, spacing);
  
  // Choose the best result (most items placed)
  if (rowResult.itemsPlaced >= columnResult.itemsPlaced && rowResult.itemsPlaced >= areaResult.itemsPlaced) {
    return rowResult;
  } else if (columnResult.itemsPlaced >= rowResult.itemsPlaced && columnResult.itemsPlaced >= areaResult.itemsPlaced) {
    return columnResult;
  } else {
    return areaResult;
  }
};
