import React from 'react';

interface PDFZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomChange: (scale: number) => void;
  minScale?: number;
  maxScale?: number;
}

/**
 * Component for controlling PDF zoom level with enhanced UI
 */
export const PDFZoomControls: React.FC<PDFZoomControlsProps> = ({
  scale,
  onZoomIn,
  onZoomOut,
  onZoomChange,
  minScale = 0.5,
  maxScale = 3.0
}) => {
  // Predefined zoom levels for dropdown
  const zoomLevels = [
    { value: 'fit', label: 'Fit to Page' },
    { value: 0.5, label: '50%' },
    { value: 0.75, label: '75%' },
    { value: 1.0, label: '100%' },
    { value: 1.25, label: '125%' },
    { value: 1.5, label: '150%' },
    { value: 2.0, label: '200%' },
    { value: 2.5, label: '250%' },
    { value: 3.0, label: '300%' },
  ];

  // Handle zoom level selection from dropdown
  const handleZoomSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    
    // Special case for 'fit' option
    if (value === 'fit') {
      // The actual fit calculation is done in the parent component
      // This just signals to use fit-to-page
      onZoomChange(-1); // Use -1 as a signal value for "fit to page"
      return;
    }
    
    const newScale = parseFloat(value);
    if (!isNaN(newScale) && newScale >= minScale && newScale <= maxScale) {
      onZoomChange(newScale);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === '+' || (e.key === '=' && e.ctrlKey)) {
      e.preventDefault();
      if (scale < maxScale) onZoomIn();
    } else if (e.key === '-' && e.ctrlKey) {
      e.preventDefault();
      if (scale > minScale) onZoomOut();
    } else if (e.key === '0' && e.ctrlKey) {
      e.preventDefault();
      onZoomChange(1.0); // Reset to 100%
    }
  };

  return (
    <div 
      className="flex items-center gap-1"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label="Zoom controls"
    >
      <button
        onClick={onZoomOut}
        disabled={scale <= minScale}
        className="p-1.5 bg-white hover:bg-gray-100 rounded border border-gray-300 disabled:opacity-50 disabled:hover:bg-white text-gray-700"
        aria-label="Zoom out"
        title="Zoom out (Ctrl+−)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>
      
      <select
        value={scale === -1 ? 'fit' : scale}
        onChange={handleZoomSelect}
        className="px-2 py-1.5 bg-white hover:bg-gray-50 rounded border border-gray-300 text-sm"
        aria-label="Select zoom level"
      >
        {zoomLevels.map((level) => (
          <option key={typeof level.value === 'string' ? level.value : level.value.toString()} value={level.value}>
            {level.label}
          </option>
        ))}
        
        {/* Show custom scale if not in predefined levels */}
        {scale !== -1 && !zoomLevels.find(level => level.value === scale) && (
          <option value={scale}>{Math.round(scale * 100)}%</option>
        )}
      </select>
      
      <button
        onClick={onZoomIn}
        disabled={scale >= maxScale}
        className="p-1.5 bg-white hover:bg-gray-100 rounded border border-gray-300 disabled:opacity-50 disabled:hover:bg-white text-gray-700"
        aria-label="Zoom in"
        title="Zoom in (Ctrl++)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}; 