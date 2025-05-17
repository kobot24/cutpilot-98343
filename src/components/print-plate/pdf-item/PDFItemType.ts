
// Define the PDFItemType interface in its own file
export type PDFItemType = {
  id: string;          // Unique identifier for this specific placement
  fileId?: string;     // Reference to the original file ID
  pdfUrl: string;
  // Removed pdfData field to improve memory management
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  aspectRatio?: number;
  thumbnail?: string;
  dpi?: number;
};
