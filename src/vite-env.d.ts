
/// <reference types="vite/client" />

// Add Buffer type definition for PDF handling
declare global {
  interface Window {
    Buffer: typeof Buffer;
  }
}

// Add module declarations for modules that might not have proper TypeScript definitions
declare module 'pdfjs-dist/build/pdf.worker.entry' {
  // Remove the default export declaration since the module doesn't have one
  const content: any;
  export = content;
}

// Add basic types for react-pdf
declare module 'react-pdf' {
  export function Document(props: any): JSX.Element;
  export function Page(props: any): JSX.Element;
  export const pdfjs: {
    GlobalWorkerOptions: {
      workerSrc: string;
    };
    version: string;
  };
}
