import { initPdfWorker, isPdfWorkerInitialized } from './pdfWorkerLoader';

let setupAttempted = false;
let setupPromise: Promise<boolean> | null = null;

/**
 * Sets up the PDF.js worker for rendering PDFs
 * This is a convenience wrapper around the worker loader
 * that ensures setup happens only once and handles errors gracefully
 */
export async function setupPdfWorker(): Promise<boolean> {
  // Return early for server-side rendering
  if (typeof window === 'undefined') {
    return false;
  }
  
  // If already initialized, return the status
  if (isPdfWorkerInitialized()) {
    return true;
  }
  
  // If a setup is in progress, return that promise
  if (setupPromise) {
    return setupPromise;
  }
  
  // Only attempt setup once
  if (setupAttempted) {
    return isPdfWorkerInitialized();
  }
  
  setupAttempted = true;
  
  // Create and store the setup promise
  setupPromise = new Promise<boolean>(async (resolve) => {
    try {
      console.log('Setting up PDF.js worker...');
      const result = await initPdfWorker();
      
      if (result) {
        console.log('PDF.js worker setup completed successfully');
      } else {
        console.warn('PDF.js worker setup completed with fallback mode');
      }
      
      resolve(result);
    } catch (error) {
      console.error('Failed to set up PDF worker:', error);
      resolve(false);
    } finally {
      // Clear the promise after completion
      setupPromise = null;
    }
  });
  
  return setupPromise;
} 