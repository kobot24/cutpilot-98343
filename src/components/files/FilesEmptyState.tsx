
import React from 'react';

export const FilesEmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center text-gray-400">
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
          d="M19 14l-7 7m0 0l-7-7m7 7V3"
        />
      </svg>
      <h3 className="text-lg font-medium">Keine Dateien</h3>
      <p className="text-sm">Laden Sie Dateien hoch, um hier anzuzeigen</p>
    </div>
  );
};
