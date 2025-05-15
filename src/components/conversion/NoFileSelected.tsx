
import React from 'react';

export const NoFileSelected = () => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-md">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-12 w-12 mb-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <h3 className="text-lg font-medium">Keine Datei ausgewählt</h3>
      <p className="text-sm">Wählen Sie eine Datei aus der Dateigalerie</p>
    </div>
  );
};
