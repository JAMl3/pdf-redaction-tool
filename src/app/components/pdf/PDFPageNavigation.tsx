import React from 'react';

interface PDFPageNavigationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

/**
 * Component for navigating between PDF pages
 */
export const PDFPageNavigation: React.FC<PDFPageNavigationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false
}) => {
  // Handler for manually entering a page number
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= totalPages) {
      onPageChange(value);
    }
  };

  // Handler for clicking previous page button
  const handlePrevPage = () => {
    if (currentPage > 1 && !disabled) {
      onPageChange(currentPage - 1);
    }
  };

  // Handler for clicking next page button
  const handleNextPage = () => {
    if (currentPage < totalPages && !disabled) {
      onPageChange(currentPage + 1);
    }
  };

  // Handler for clicking first page button
  const handleFirstPage = () => {
    if (currentPage !== 1 && !disabled) {
      onPageChange(1);
    }
  };

  // Handler for clicking last page button
  const handleLastPage = () => {
    if (currentPage !== totalPages && !disabled) {
      onPageChange(totalPages);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowLeft':
        if (!e.ctrlKey) {
          handlePrevPage();
        } else {
          handleFirstPage();
        }
        e.preventDefault();
        break;
      case 'ArrowRight':
        if (!e.ctrlKey) {
          handleNextPage();
        } else {
          handleLastPage();
        }
        e.preventDefault();
        break;
      case 'Home':
        handleFirstPage();
        e.preventDefault();
        break;
      case 'End':
        handleLastPage();
        e.preventDefault();
        break;
      default:
        break;
    }
  };

  return (
    <div 
      className="flex items-center space-x-2" 
      tabIndex={0} 
      onKeyDown={handleKeyDown}
      role="navigation"
      aria-label="PDF page navigation"
    >
      {/* First page button */}
      <button
        onClick={handleFirstPage}
        disabled={currentPage === 1 || disabled}
        className={`p-1 rounded ${
          currentPage === 1 || disabled
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-700 hover:bg-gray-200'
        }`}
        aria-label="Go to first page"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      </button>
      
      {/* Previous page button */}
      <button
        onClick={handlePrevPage}
        disabled={currentPage === 1 || disabled}
        className={`p-1 rounded ${
          currentPage === 1 || disabled
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-700 hover:bg-gray-200'
        }`}
        aria-label="Go to previous page"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      {/* Page number input and total pages */}
      <div className="flex items-center space-x-1">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={currentPage}
          onChange={handleInputChange}
          disabled={disabled}
          className="w-12 p-1 text-center border border-gray-300 rounded bg-white text-black font-medium"
          aria-label="Current page number"
        />
        <span className="text-black font-medium">of {totalPages}</span>
      </div>
      
      {/* Next page button */}
      <button
        onClick={handleNextPage}
        disabled={currentPage === totalPages || disabled}
        className={`p-1 rounded ${
          currentPage === totalPages || disabled
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-700 hover:bg-gray-200'
        }`}
        aria-label="Go to next page"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      
      {/* Last page button */}
      <button
        onClick={handleLastPage}
        disabled={currentPage === totalPages || disabled}
        className={`p-1 rounded ${
          currentPage === totalPages || disabled
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-700 hover:bg-gray-200'
        }`}
        aria-label="Go to last page"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}; 