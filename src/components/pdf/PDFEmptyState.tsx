
import React from 'react';

export const PDFEmptyState = () => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">PDF Vorschau</h3>
      </div>
      <div className="flex-1 bg-gray-100 border border-gray-200 rounded-lg overflow-hidden relative flex items-center justify-center">
        <div className="text-center p-4">
          <p className="mb-2 text-gray-500">Kein PDF verfügbar</p>
          <p className="text-sm text-gray-400">Bitte konvertieren Sie zuerst ein Bild</p>
        </div>
      </div>
    </div>
  );
};
