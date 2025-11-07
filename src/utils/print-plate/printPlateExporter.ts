
import { PDFDocument } from 'pdf-lib';
import { PDFItemType } from '@/components/print-plate/pdf-item/PDFItemType';
import { PrintPlateSize } from '@/components/print-plate/PrintPlateSettings';
import { CM_TO_POINTS, convertDimensionsToPoints } from './pdfCoordinateUtils';
import { processPDFItem } from './pdfItemProcessor';
import { clearPDFDataCache } from './pdfDataUtils';
import { isTauri } from '../tauri';
import { saveFileDialog, writeBinaryFile, getDownloadDir } from '../tauriFileDialog';

export const exportPrintPlateToPDF = async (
  items: PDFItemType[],
  plateSize: PrintPlateSize
): Promise<Uint8Array | null> => {
  try {
    // Check for items
    if (!items || items.length === 0) {
      console.error('PDF Export - No items to export');
      return null;
    }
    
    // Validate that all items have unique IDs
    const itemIds = items.map(item => item.id);
    const uniqueIds = new Set(itemIds);
    if (uniqueIds.size !== items.length) {
      console.warn(`PDF Export - WARNING: Found ${items.length - uniqueIds.size} duplicate item IDs in ${items.length} total items`);
      console.log(`PDF Export - Item IDs: ${itemIds.join(', ')}`);
    }
    
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Set page size in points
    const { width: pageWidth, height: pageHeight } = convertDimensionsToPoints(
      plateSize.width, 
      plateSize.height
    );
    
    // Add a page with the specified dimensions
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    console.log(`PDF Export - Creating plate: ${plateSize.width}x${plateSize.height} cm`);
    console.log(`PDF Export - Page created with dimensions: ${pageWidth}x${pageHeight} points`);
    console.log(`PDF Export - Processing ${items.length} items`);

    // Track processed items
    const successfulItems: string[] = [];
    const failedItems: string[] = [];

    // Process each PDF item on the plate sequentially to avoid race conditions
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`PDF Export - Processing item ${i+1}/${items.length} with ID: ${item.id}`);
      
      if (!item.pdfUrl) {
        console.log(`PDF Export - Skipping item with no PDF URL: ${item.id}`);
        failedItems.push(item.id);
        continue;
      }
      
      // Process the item and track success/failure
      const success = await processPDFItem(pdfDoc, page, item, pageHeight);
      if (success) {
        successfulItems.push(item.id);
      } else {
        failedItems.push(item.id);
      }
      
      // Small delay between processing items to reduce memory pressure
      // Apply delay for ALL items including the last one
      await new Promise(r => setTimeout(r, 100));
    }
    
    // Add extra delay after processing all items to ensure everything is complete
    // This helps with the last item issue
    console.log('PDF Export - Adding final delay to ensure all items are processed');
    await new Promise(r => setTimeout(r, 300));
    
    // Check if any items were processed successfully
    if (successfulItems.length === 0) {
      console.error('PDF Export - No items were successfully processed');
      return null;
    }
    
    // Log processing results
    console.log(`PDF Export - Successfully processed ${successfulItems.length}/${items.length} items`);
    if (failedItems.length > 0) {
      console.warn(`PDF Export - Failed to process ${failedItems.length} items: ${failedItems.join(', ')}`);
    }
    
    // Serialize the PDF to bytes
    const pdfBytes = await pdfDoc.save();
    console.log(`PDF Export - Successfully created PDF: ${pdfBytes.byteLength} bytes with ${successfulItems.length} items`);
    
    // Clear the cache after export to free memory
    clearPDFDataCache();
    
    return pdfBytes;
  } catch (error) {
    console.error('Error creating Print Plate PDF:', error);
    // Clear the cache in case of error to prevent reusing potentially corrupted data
    clearPDFDataCache();
    return null;
  }
};

// Helper function to download PDF bytes as a file
export const downloadPDF = async (pdfBytes: Uint8Array, fileName: string = 'printplate.pdf') => {
  // Use Tauri save dialog if running in Tauri
  if (isTauri()) {
    try {
      const downloadDir = await getDownloadDir();
      const defaultPath = downloadDir ? `${downloadDir}/${fileName}` : fileName;

      const filePath = await saveFileDialog({
        defaultPath,
        filters: [
          {
            name: 'PDF Files',
            extensions: ['pdf']
          }
        ]
      });

      if (filePath) {
        const success = await writeBinaryFile(filePath, pdfBytes);
        if (success) {
          console.log(`PDF Export - File saved via Tauri: ${filePath} (${pdfBytes.byteLength} bytes)`);
        } else {
          console.error('PDF Export - Failed to write file via Tauri');
        }
      } else {
        console.log('PDF Export - Save cancelled by user');
      }
    } catch (error) {
      console.error('PDF Export - Error saving file via Tauri:', error);
    }
  } else {
    // Browser download (original implementation)
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log(`PDF Export - Download initiated for file: ${fileName} (${pdfBytes.byteLength} bytes)`);
  }
};
