
// Import PDFItemType at the top of the file
import { PDFItemType } from '@/components/print-plate/pdf-item/PDFItemType';

// Cache for PDF data to prevent repeated fetches of the same PDF
const pdfDataCache = new Map<string, Uint8Array>();

/**
 * Clear the PDF data cache when it gets too large
 */
const checkAndCleanCache = () => {
  // If cache has more than 10 items, clear oldest ones
  if (pdfDataCache.size > 10) {
    // Get an iterator for the keys
    const keys = pdfDataCache.keys();
    // Remove the oldest 5 items
    for (let i = 0; i < 5; i++) {
      const nextKey = keys.next();
      if (!nextKey.done) {
        pdfDataCache.delete(nextKey.value);
      }
    }
    console.log(`PDF Data - Cache cleaned, current size: ${pdfDataCache.size}`);
  }
};

/**
 * Fetch PDF data from a URL with improved caching and reliability
 * @param url The URL to fetch PDF data from
 * @returns The PDF data as Uint8Array
 */
export const fetchPDFDataFromUrl = async (url: string): Promise<Uint8Array> => {
  // First check if we already have this PDF in cache
  if (pdfDataCache.has(url)) {
    console.log(`PDF Data - Using cached data for: ${url.substring(0, 20)}...`);
    return pdfDataCache.get(url)!;
  }
  
  try {
    console.log(`PDF Data - Fetching data from URL: ${url.substring(0, 30)}...`);
    
    // Add retry logic for more reliable fetching
    let response;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        response = await fetch(url, { 
          cache: 'no-store', // Ensure fresh data
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (response.ok) break;
        
        console.log(`PDF Data - Retry ${retryCount + 1}/${maxRetries} for ${url.substring(0, 20)}...`);
        retryCount++;
        await new Promise(r => setTimeout(r, 500 * retryCount)); // Exponential backoff
      } catch (fetchError) {
        console.error(`PDF Data - Fetch error (attempt ${retryCount + 1}):`, fetchError);
        retryCount++;
        if (retryCount >= maxRetries) throw fetchError;
        await new Promise(r => setTimeout(r, 500 * retryCount));
      }
    }
    
    if (!response || !response.ok) {
      throw new Error(`HTTP error! status: ${response?.status || 'unknown'}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const pdfBytes = new Uint8Array(arrayBuffer);
    
    console.log(`PDF Data - Successfully fetched ${pdfBytes.byteLength} bytes for ${url.substring(0, 20)}...`);
    
    // Store in cache with validation check
    if (pdfBytes.byteLength > 0) {
      pdfDataCache.set(url, pdfBytes);
      checkAndCleanCache();
    } else {
      console.error(`PDF Data - Zero-length PDF data received for ${url}`);
      throw new Error("Received empty PDF data");
    }
    
    return pdfBytes;
  } catch (error) {
    console.error(`PDF Data - Failed to fetch PDF from URL:`, error);
    throw error;
  }
};

/**
 * Get PDF data for an item - optimized to prevent unnecessary fetches
 * with improved reliability and error handling
 */
export const getPDFDataFromItem = async (item: PDFItemType): Promise<Uint8Array> => {
  if (!item.pdfUrl) {
    throw new Error(`No PDF URL available for item: ${item.id}`);
  }
  
  console.log(`PDF Data - Getting data for item: ${item.id} with URL: ${item.pdfUrl.substring(0, 20)}...`);
  
  try {
    return await fetchPDFDataFromUrl(item.pdfUrl);
  } catch (error) {
    console.error(`PDF Data - Error getting PDF data for item ${item.id}:`, error);
    throw error;
  }
};

/**
 * Prefetch PDF data for a URL to make it available in cache
 */
export const prefetchPDFData = async (url: string): Promise<void> => {
  if (!url || pdfDataCache.has(url)) return;
  
  try {
    console.log(`PDF Data - Prefetching data for: ${url.substring(0, 20)}...`);
    await fetchPDFDataFromUrl(url);
  } catch (error) {
    console.error(`PDF Data - Failed to prefetch PDF data:`, error);
  }
};

/**
 * Clear the PDF data cache
 */
export const clearPDFDataCache = (): void => {
  pdfDataCache.clear();
  console.log('PDF Data - Cache cleared');
};
