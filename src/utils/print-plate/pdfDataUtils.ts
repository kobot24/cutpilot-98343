
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
 * Fetch PDF data from a URL with caching
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
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const pdfBytes = new Uint8Array(arrayBuffer);
    
    // Store in cache
    pdfDataCache.set(url, pdfBytes);
    checkAndCleanCache();
    
    return pdfBytes;
  } catch (error) {
    console.error(`PDF Data - Failed to fetch PDF from URL:`, error);
    throw error;
  }
};

/**
 * Get PDF data for an item - optimized to prevent unnecessary fetches
 */
export const getPDFDataFromItem = async (item: any): Promise<Uint8Array> => {
  if (!item.pdfUrl) {
    throw new Error(`No PDF URL available for item: ${item.id}`);
  }
  
  return await fetchPDFDataFromUrl(item.pdfUrl);
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
