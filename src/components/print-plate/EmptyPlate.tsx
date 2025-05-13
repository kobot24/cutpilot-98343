
export const EmptyPlate = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
      <div className="text-center">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-12 w-12 mx-auto mb-3" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" 
          />
        </svg>
        <p className="text-lg font-medium">Druckplatte ist leer</p>
        <p className="text-sm">
          Fügen Sie PDFs aus der Liste hinzu
        </p>
      </div>
    </div>
  );
};
