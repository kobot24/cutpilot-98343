import { ColorSpace } from '@/utils/pdf/colorSpaceDetector';

export type UploadedFile = {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt: Date;
  convertedPdfUrl?: string;
  convertedPdfData?: string;
  colorSpace?: ColorSpace; // Detected color space (RGB, CMYK, Gray, Mixed, Unknown)
};
