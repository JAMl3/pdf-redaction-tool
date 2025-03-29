import React from 'react';

interface PDFPageNavigatorProps {
  currentPage: number;
  totalPages: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onPageChange: (page: number) => void;
}

/**
 * Component for navigating between PDF pages
 */
export const PDFPageNavigator: React.FC<PDFPageNavigatorProps> = ({
  currentPage,
  totalPages,
  onPreviousPage,
  onNextPage,
  onPageChange
}) => {
  // Handle direct page input
  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pageNumber = parseInt(e.target.value);
    if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
      onPageChange(pageNumber);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && currentPage > 1) {
      onPreviousPage();
    } else if (e.key === 'ArrowRight' && currentPage < totalPages) {
      onNextPage();
    }
  };

  return (
    <div 
      className="flex items-center space-x-2"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label="Page navigation"
      role="navigation"
    >
      <button
        onClick={onPreviousPage}
        disabled={currentPage <= 1}
        className="px-3 py-1 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
        aria-label="Previous page"
      >
        ←
      </button>
      
      <div className="flex items-center px-2 py-1">
        <span className="sr-only">Page</span>
        <input
          type="number"
          min={1}
          max={totalPages}
          value={currentPage}
          onChange={handlePageInputChange}
          className="w-12 text-center bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600"
          aria-label={`Page ${currentPage} of ${totalPages}`}
        />
        <span className="mx-1">of</span>
        <span>{totalPages}</span>
      </div>
      
      <button
        onClick={onNextPage}
        disabled={currentPage >= totalPages}
        className="px-3 py-1 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
        aria-label="Next page"
      >
        →
      </button>
    </div>
  );
}; 