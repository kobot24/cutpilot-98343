
/// <reference types="vite/client" />

// Add Buffer type definition for PDF handling
declare global {
  interface Window {
    Buffer: typeof Buffer;
  }
}
