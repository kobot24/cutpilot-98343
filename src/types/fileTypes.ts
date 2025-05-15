
export type UploadedFile = {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt: Date;
  convertedPdfUrl?: string;
};
