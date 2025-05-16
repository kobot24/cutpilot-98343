
import { PDFItemType } from '@/components/print-plate/PDFItem';
import { PrintPlateSize } from '@/components/print-plate/PrintPlateSettings';
import { toast } from '@/components/ui/sonner';
import { fetchPDFDataFromUrl } from '@/utils/print-plate/pdfDataUtils';
import { getEffectiveDimensions } from '@/utils/print-plate/pdfTransformUtils';

/**
 * Hook for PDF item manipulation operations
 */
export const usePDFItemOperations = (
  items: PDFItemType[],
  setItems: React.Dispatch<React.SetStateAction<PDFItemType[]>>,
  plateSize: PrintPlateSize
) => {
  // Function to fit item to plate size
  const handleFitToPlate = (index: number) => {
    if (!items[index]) return;
    
    const item = items[index];
    
    // Get effective dimensions based on rotation
    const effectiveDim = getEffectiveDimensions(item.width, item.height, item.rotation);
    const itemAspectRatio = effectiveDim.height / effectiveDim.width;
    const plateAspectRatio = plateSize.height / plateSize.width;
    
    let newWidth, newHeight;
    
    if (itemAspectRatio > plateAspectRatio) {
      // Item is taller than plate (relative to width), so fit to height
      newHeight = plateSize.height * 0.9; // 90% of plate height
      newWidth = newHeight / itemAspectRatio;
    } else {
      // Item is wider than plate (relative to height), so fit to width
      newWidth = plateSize.width * 0.9; // 90% of plate width
      newHeight = newWidth * itemAspectRatio;
    }
    
    // Center the item
    const centerX = (plateSize.width - effectiveDim.width) / 2;
    const centerY = (plateSize.height - effectiveDim.height) / 2;
    
    // Apply dimensions based on rotation
    let updatedWidth, updatedHeight;
    
    // Richtige Dimensionen basierend auf Rotation setzen
    if (item.rotation === 90 || item.rotation === 270) {
      // Für 90° und 270° Rotation müssen wir die Dimensionen richtig zuweisen
      updatedWidth = item.width; // Original-Breite beibehalten
      updatedHeight = item.height; // Original-Höhe beibehalten
      
      // Die effektiven Dimensionen für die Skalierung verwenden
      const scaleFactor = Math.min(newWidth / effectiveDim.width, newHeight / effectiveDim.height);
      updatedWidth = item.width * scaleFactor;
      updatedHeight = item.height * scaleFactor;
    } else {
      // Für 0° und 180° einfach die neuen Dimensionen verwenden
      updatedWidth = newWidth;
      updatedHeight = newHeight;
    }
    
    // Zentrierung basierend auf effektiven Dimensionen
    const updatedCenterX = (plateSize.width - getEffectiveDimensions(updatedWidth, updatedHeight, item.rotation).width) / 2;
    const updatedCenterY = (plateSize.height - getEffectiveDimensions(updatedWidth, updatedHeight, item.rotation).height) / 2;
    
    const updatedItems = [...items];
    updatedItems[index] = {
      ...item,
      width: updatedWidth,
      height: updatedHeight,
      x: updatedCenterX,
      y: updatedCenterY
    };
    
    setItems(updatedItems);
    toast.success("Druckdatei an die Plattengröße angepasst");
  };

  // Verbesserte Rotation mit korrigierter Positionsbehandlung
  const handleRotateItem = (index: number) => {
    if (!items[index]) return;
    
    // Originalobjekt kopieren
    const item = { ...items[index] };
    
    // Aktuelle Mittelpunktkoordinaten berechnen
    const centerX = item.x + (getEffectiveDimensions(item.width, item.height, item.rotation).width / 2);
    const centerY = item.y + (getEffectiveDimensions(item.width, item.height, item.rotation).height / 2);
    
    // Um 90° im Uhrzeigersinn rotieren
    const oldRotation = item.rotation;
    item.rotation = (item.rotation + 90) % 360;
    
    console.log(`Rotation: ${oldRotation}° -> ${item.rotation}°`);
    console.log(`Vorher: x=${item.x}, y=${item.y}, w=${item.width}, h=${item.height}`);
    
    // Die effektiven Dimensionen nach der Rotation berechnen
    const effectiveDimAfter = getEffectiveDimensions(item.width, item.height, item.rotation);
    
    // Position so anpassen, dass der Mittelpunkt erhalten bleibt
    item.x = centerX - (effectiveDimAfter.width / 2);
    item.y = centerY - (effectiveDimAfter.height / 2);
    
    console.log(`Nachher: x=${item.x}, y=${item.y}, w=${item.width}, h=${item.height}`);
    console.log(`Effektive Dimensionen: ${effectiveDimAfter.width}x${effectiveDimAfter.height}`);
    
    // Ensure we have PDF data for rotated items (critical for export)
    if (item.pdfUrl) {
      fetchPDFDataFromUrl(item.pdfUrl)
        .catch(error => {
          console.error(`Failed to fetch PDF data for rotated item ${item.id}:`, error);
        });
    }
    
    // Update the items array with the rotated item
    const updatedItems = [...items];
    updatedItems[index] = item;
    setItems(updatedItems);
    
    toast.info(`Element um 90° gedreht (${item.rotation}°)`);
  };
  
  // Remove item
  const handleRemoveItem = (index: number) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
    toast.info("Element von der Druckplatte entfernt");
  };
  
  // Clear all items from the plate
  const handleClearPlate = () => {
    setItems([]);
    toast.info("Druckplatte geleert");
  };

  return {
    handleFitToPlate,
    handleRotateItem,
    handleRemoveItem,
    handleClearPlate
  };
};
