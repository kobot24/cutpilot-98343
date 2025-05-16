/**
 * Fetch PDF data from a URL
 * @param url The URL to fetch PDF data from
 * @returns The PDF data as Uint8Array
 */
export const fetchPDFDataFromUrl = async (url: string): Promise<Uint8Array> => {
  console.log(`PDF Data - Fetching PDF from URL: ${url.substring(0, 50)}...`);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const pdfBytes = new Uint8Array(arrayBuffer);
    
    console.log(`PDF Data - Successfully fetched PDF: ${pdfBytes.byteLength} bytes`);
    return pdfBytes;
  } catch (error) {
    console.error(`PDF Data - Failed to fetch PDF from URL:`, error);
    throw error;
  }
};

/**
 * Get PDF data from item, fetching from URL if necessary
 * @param item The PDFItemType item
 * @returns The PDF data as Uint8Array
 */
export const getPDFDataFromItem = async (item: any): Promise<Uint8Array> => {
  console.log(`PDF Data - Getting PDF data for item: ${item.id}`);
  
  // Use cached data if available
  if (item.pdfData && item.pdfData.byteLength > 0) {
    console.log(`PDF Data - Using cached PDF data: ${item.pdfData.byteLength} bytes`);
    return item.pdfData;
  }
  
  // Otherwise fetch from URL
  if (item.pdfUrl) {
    return await fetchPDFDataFromUrl(item.pdfUrl);
  }
  
  throw new Error(`No PDF data or URL available for item: ${item.id}`);
};
