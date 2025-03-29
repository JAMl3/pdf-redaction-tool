import React from 'react';
import { RedactionOptions } from '../../types/pdf';

interface RedactionControlsProps {
  options: RedactionOptions;
  onOptionsChange: (options: RedactionOptions) => void;
  onApplyRedactions: () => void;
  onClearRedactions: () => void;
  redactionCount: number;
  isProcessing?: boolean;
}

/**
 * Component for controlling PDF redaction options
 */
export const RedactionControls: React.FC<RedactionControlsProps> = ({
  options,
  onOptionsChange,
  onApplyRedactions,
  onClearRedactions,
  redactionCount,
  isProcessing = false
}) => {
  // Handler for color change
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      color: e.target.value
    });
  };

  // Handler for opacity change
  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      opacity: parseFloat(e.target.value)
    });
  };

  // Handler for remove content toggle
  const handleRemoveContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      removeContent: e.target.checked
    });
  };

  // Handler for add annotation toggle
  const handleAddAnnotationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      addAnnotation: e.target.checked
    });
  };

  return (
    <div className="bg-white p-4 rounded shadow-md">
      <h3 className="text-lg font-medium mb-3">Redaction Options</h3>
      
      <div className="space-y-4">
        {/* Display number of redaction areas */}
        <div className="text-sm">
          <span className="font-medium">
            {redactionCount === 0 
              ? 'No redaction areas selected' 
              : `${redactionCount} redaction area${redactionCount !== 1 ? 's' : ''} selected`}
          </span>
        </div>
        
        {/* Redaction color picker */}
        <div className="flex items-center justify-between">
          <label htmlFor="redaction-color" className="block text-sm font-medium">
            Redaction Color:
          </label>
          <div className="flex items-center">
            <input
              id="redaction-color"
              type="color"
              value={options.color}
              onChange={handleColorChange}
              disabled={isProcessing}
              className="w-8 h-8 border border-gray-300 rounded"
              aria-label="Select redaction color"
            />
            <span className="ml-2 text-sm">{options.color}</span>
          </div>
        </div>
        
        {/* Opacity slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="redaction-opacity" className="block text-sm font-medium">
              Opacity:
            </label>
            <span className="text-sm">{Math.round(options.opacity * 100)}%</span>
          </div>
          <input
            id="redaction-opacity"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={options.opacity}
            onChange={handleOpacityChange}
            disabled={isProcessing}
            className="w-full"
            aria-label="Set redaction opacity"
          />
        </div>
        
        {/* Remove content checkbox */}
        <div className="flex items-center">
          <input
            id="remove-content"
            type="checkbox"
            checked={options.removeContent}
            onChange={handleRemoveContentChange}
            disabled={isProcessing}
            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <label htmlFor="remove-content" className="ml-2 block text-sm">
            Remove underlying content
          </label>
        </div>
        
        {/* Add annotation checkbox */}
        <div className="flex items-center">
          <input
            id="add-annotation"
            type="checkbox"
            checked={options.addAnnotation}
            onChange={handleAddAnnotationChange}
            disabled={isProcessing}
            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <label htmlFor="add-annotation" className="ml-2 block text-sm">
            Add redaction annotation
          </label>
        </div>
        
        {/* Action buttons */}
        <div className="flex space-x-2 pt-2">
          <button
            onClick={onApplyRedactions}
            disabled={redactionCount === 0 || isProcessing}
            className={`px-4 py-2 rounded text-white ${
              redactionCount === 0 || isProcessing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            aria-label="Apply redactions"
          >
            {isProcessing ? 'Processing...' : 'Apply Redactions'}
          </button>
          
          <button
            onClick={onClearRedactions}
            disabled={redactionCount === 0 || isProcessing}
            className={`px-4 py-2 rounded ${
              redactionCount === 0 || isProcessing
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            aria-label="Clear all redactions"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
}; 