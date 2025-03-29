/**
 * Constants for PDF handling and redaction
 */

/**
 * Settings for redaction areas visualization and interactions
 */
export const REDACTION_SETTINGS = {
  // Visual styling for redaction areas
  fillStyle: 'rgba(0, 0, 0, 0.9)', // More opaque black fill to better hide text
  strokeStyle: '#ff0000', // Red border for selection
  lineWidth: 2, // Border width in pixels
  
  // Minimum size required for a valid redaction area (in pixels)
  minSelectionSize: 10,
  
  // Default redaction options
  defaultRedactionColor: '#000000', // Black
  defaultRedactionOpacity: 1.0,     // Fully opaque
  removeContent: true,              // By default, remove underlying content
  
  // Zoom settings
  minScale: 0.25,
  maxScale: 5.0,
  defaultScale: 1.0,
  zoomStep: 0.25,
  
  // Predefined zoom levels for dropdown selection
  zoomLevels: [
    { value: 0.5, label: '50%' },
    { value: 0.75, label: '75%' },
    { value: 1.0, label: '100%' },
    { value: 1.25, label: '125%' },
    { value: 1.5, label: '150%' },
    { value: 2.0, label: '200%' },
    { value: 3.0, label: '300%' },
    { value: 4.0, label: '400%' }
  ]
};

/**
 * PDF.js worker configuration
 */
export const PDF_WORKER_SETTINGS = {
  workerSrc: '/pdf.worker.min.js', // Path to the PDF.js worker relative to public
  useFakeWorker: true              // Whether to use fake worker implementation
};

/**
 * PDF operation messages
 */
export const PDF_MESSAGES = {
  loading: 'Loading PDF document...',
  rendering: 'Rendering page...',
  redacting: 'Applying redactions...',
  saving: 'Saving redacted document...',
  error: {
    loading: 'Error loading PDF document',
    rendering: 'Error rendering PDF page',
    redacting: 'Error applying redactions',
    saving: 'Error saving redacted document',
    unsupported: 'This PDF document is not supported'
  },
  success: {
    redacted: 'Redactions applied successfully',
    saved: 'Document saved successfully'
  }
};

// PDF.js version and configuration
export const PDF_JS_VERSION = '3.11.174';

// CDN sources for the PDF.js worker in order of preference
export const PDF_WORKER_URLS = [
  `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDF_JS_VERSION}/build/pdf.worker.min.js`,
  `https://unpkg.com/pdfjs-dist@${PDF_JS_VERSION}/build/pdf.worker.min.js`,
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDF_JS_VERSION}/pdf.worker.min.js`
];

// Default PDF worker URL (first one in the list)
export const DEFAULT_PDF_WORKER_URL = PDF_WORKER_URLS[0]; 