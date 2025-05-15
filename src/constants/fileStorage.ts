
// Constants for file storage limits
export const FILE_STORAGE_LIMITS = {
  MAX_FILES: 10,
  MAX_FILE_SIZE_MB: 50,
  MAX_FILE_SIZE_BYTES: 50 * 1024 * 1024, // 50MB in bytes
  MAX_IMAGE_MEGAPIXELS: 20, // ~4500x4500 pixels (reduziert von 25)
  LARGE_FILE_THRESHOLD_BYTES: 10 * 1024 * 1024, // 10MB threshold for large file handling
  MAX_FETCH_SIZE: 50 * 1024 * 1024, // 50MB max fetch size
};

// Progress tracking constants
export const PROGRESS_STEPS = {
  LOADING_IMAGE: 10,
  PROCESSING_IMAGE: 30,
  CREATING_PDF: 60,
  FINALIZING: 90,
  COMPLETE: 100,
};
