import * as pdfjsLib from 'pdfjs-dist';

// Get the actual PDF.js version from the library
const PDFJS_VERSION = pdfjsLib.version || '3.11.174'; // Fallback version just in case

// Configure worker URL - using only local path to avoid CORS issues
const PDF_WORKER_URL = '/pdf.worker.min.js';

// CMap URL - we'll use local path for these too to avoid CORS issues
const PDF_WORKER_CMAPS = '/cmaps/';

// Track initialization state
let isWorkerInitialized = false;
let initializationAttempted = false;

// Store a reference to the original getDocument function
const originalGetDocument = pdfjsLib.getDocument;

/**
 * Configure PDF.js worker with the given URL
 */
function setupWorker(): void {
  if (typeof window === 'undefined') return;

  try {
    console.log(`Setting up PDF.js ${PDFJS_VERSION} with worker: ${PDF_WORKER_URL}`);
    
    // Use direct assignment to avoid TypeScript issues
    // TypeScript doesn't like the any type but it's necessary here
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (pdfjsLib.GlobalWorkerOptions as any).workerSrc = PDF_WORKER_URL;
    
    console.log('Worker source set successfully');
  } catch (error) {
    console.error('Error setting up worker:', error);
    throw error; // Re-throw to handle failures properly
  }
}

/**
 * Initialize PDF.js worker
 */
export async function initPdfWorker(): Promise<boolean> {
  // Skip if already initialized
  if (isWorkerInitialized) {
    return true;
  }
  
  // Skip if in SSR
  if (typeof window === 'undefined') {
    return false;
  }

  // Prevent multiple initialization attempts
  if (initializationAttempted) {
    return isWorkerInitialized;
  }
  
  initializationAttempted = true;
  
  try {
    // Set the worker URL
    setupWorker();
    
    // Basic verification - wait a moment for worker to load
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // If we got here, mark as initialized
    isWorkerInitialized = true;
    console.log('PDF.js worker initialization successful');
    return true;
  } catch (error) {
    console.error('Error in worker initialization process:', error);
    
    // Last resort: try to use a non-worker approach
    try {
      console.warn('Worker setup failed. Attempting to configure without worker.');
      
      // Use the non-worker build or configure pdf.js to work without a worker
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (pdfjsLib as any).GlobalWorkerOptions.workerSrc = '';
      
      isWorkerInitialized = true;
      console.log('PDF.js configured without worker');
      return true;
    } catch (finalError) {
      console.error('Complete PDF.js initialization failure:', finalError);
      isWorkerInitialized = false;
      return false;
    }
  }
}

/**
 * Gets the initialization status of the PDF.js worker
 */
export function isPdfWorkerInitialized(): boolean {
  return isWorkerInitialized;
}

/**
 * A safer version of getDocument that includes proper settings
 */
export function safeGetDocument(params: Record<string, unknown>): ReturnType<typeof pdfjsLib.getDocument> {
  // Ensure we've attempted to initialize
  if (!initializationAttempted && typeof window !== 'undefined') {
    // Use the worker URL
    try {
      setupWorker();
      isWorkerInitialized = true;
    } catch (error) {
      console.error('Failed to setup fallback worker in safeGetDocument:', error);
    }
    initializationAttempted = true;
  }
  
  // Add reasonable default parameters
  const safeParams = {
    ...params,
    // CMap settings for proper text extraction
    CMapUrl: PDF_WORKER_CMAPS,
    cMapPacked: true
  };
  
  return originalGetDocument(safeParams);
}

// Initialize worker when this module is loaded in browser
if (typeof window !== 'undefined') {
  // Delayed initialization to ensure everything else is loaded
  setTimeout(() => {
    initPdfWorker().catch(error => {
      console.error('Background worker initialization failed:', error);
    });
  }, 200);
} 