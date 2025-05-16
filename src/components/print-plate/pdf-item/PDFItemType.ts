
// Define the PDFItemType interface in its own file
export type PDFItemType = {
  id: string;
  pdfUrl: string;
  pdfData?: Uint8Array; // Added field to store actual PDF binary data
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  aspectRatio?: number;
  thumbnail?: string;
  dpi?: number;
};
