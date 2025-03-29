import { useState, useEffect, useRef } from 'react';
import { PDFDocumentProxy } from 'pdfjs-dist';
import { initPdfWorker, isPdfWorkerInitialized, safeGetDocument } from '../utils/pdfWorkerLoader';
import { PdfLoadError } from '../utils/errors';

// Interface for the hook result
interface UsePdfLoaderResult {
  pdfDocument: PDFDocumentProxy | null;
  totalPages: number;
  isLoading: boolean;
  loadingProgress: number; // 0-100
  error: Error | null;
  isPdfEncrypted: boolean;
  workerInitError: Error | null;
}

// Initialize worker at module level to ensure it's only done once
if (typeof window !== 'undefined') {
  // Initialize PDF.js with CDN worker
  initPdfWorker();
}

/**
 * Hook for loading and managing PDF documents
 * 
 * @param file The PDF file to load, or null
 * @returns State and methods for working with the PDF
 */
export function usePdfLoader(file: File | null): UsePdfLoaderResult {
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [error, setError] = useState<Error | null>(null);
  const [isPdfEncrypted, setIsPdfEncrypted] = useState<boolean>(false);
  const [workerInitError, setWorkerInitError] = useState<Error | null>(null);
  
  // Use a ref to track the current file to prevent loading canceled files
  const currentFileRef = useRef<File | null>(null);

  useEffect(() => {
    // Initialize PDF worker on first load if not already initialized
    if (!isPdfWorkerInitialized()) {
      initPdfWorker()
        .then(success => {
          if (!success) {
            console.warn('PDF worker initialization may not be complete');
            setWorkerInitError(new Error('PDF rendering might be limited'));
          }
        })
        .catch(err => {
          console.error('Failed to initialize PDF worker:', err);
          setWorkerInitError(new Error('Failed to initialize PDF renderer'));
        });
    }
  }, []);

  useEffect(() => {
    // Reset state if file is null
    if (!file) {
      setPdfDocument(null);
      setTotalPages(0);
      setError(null);
      setLoadingProgress(0);
      setIsPdfEncrypted(false);
      return;
    }

    // Skip if it's the same file (compare by name, size, and last modified)
    if (
      currentFileRef.current &&
      currentFileRef.current.name === file.name &&
      currentFileRef.current.size === file.size &&
      currentFileRef.current.lastModified === file.lastModified
    ) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingProgress(0);
    setIsPdfEncrypted(false);
    currentFileRef.current = file;

    // Function to create a new copy of the file data to prevent ArrayBuffer detachment
    const getFileArrayBuffer = async (): Promise<ArrayBuffer> => {
      return await file.arrayBuffer();
    };

    const loadPdf = async () => {
      try {
        // Ensure PDF.js worker is initialized
        if (!isPdfWorkerInitialized()) {
          await initPdfWorker();
        }
        
        setLoadingProgress(5);
        
        // Try to detect if PDF is encrypted before loading
        let isEncrypted = false;
        try {
          // Get a fresh copy of the array buffer for checking encryption
          const checkBuffer = await getFileArrayBuffer();
          setLoadingProgress(10);
          
          // Create a new loading task just to check encryption using the safe method
          const checkTask = safeGetDocument({
            data: new Uint8Array(checkBuffer),
            // Allow worker for better performance
            disableRange: true,
            disableAutoFetch: true,
            disableStream: true
          });
          
          await checkTask.promise;
        } catch (encryptionErr) {
          // If error message includes "encrypted", the PDF is likely encrypted
          if (encryptionErr instanceof Error && 
              encryptionErr.message.includes('encrypted')) {
            isEncrypted = true;
            console.log('Detected encrypted PDF, will use modified viewer settings');
          }
        }
        
        // Set encryption state
        setIsPdfEncrypted(isEncrypted);
        setLoadingProgress(20);
        
        // Get a fresh copy of the array buffer for the actual loading
        const loadBuffer = await getFileArrayBuffer();
        
        // Create a loading task with progress tracking using our safe method
        const loadingTask = safeGetDocument({
          data: new Uint8Array(loadBuffer),
          // Enable worker for better performance
          // Enable range requests for better performance with large PDFs
          rangeChunkSize: 65536,
          disableAutoFetch: false,
          disableStream: false,
          // If encrypted, try to load it anyway
          password: isEncrypted ? '' : undefined
        });
        
        // Track loading progress
        loadingTask.onProgress = (progressData: { loaded: number; total: number }) => {
          if (progressData.total > 0) {
            const percent = Math.min(
              20 + Math.round((progressData.loaded / progressData.total) * 80), 
              99
            ); // Cap at 99% until fully loaded
            setLoadingProgress(percent);
          }
        };
        
        // Load the document
        const pdf = await loadingTask.promise;
        
        // Only update state if this is still the current file
        if (currentFileRef.current === file) {
          setPdfDocument(pdf);
          setTotalPages(pdf.numPages);
          setLoadingProgress(100);
          setIsLoading(false);
        }
      } catch (err) {
        // Only update error state if this is still the current file
        if (currentFileRef.current === file) {
          console.error('Error loading PDF:', err);
          
          // More specific error message for encrypted PDFs
          let errorMessage = 'Failed to load PDF';
          
          if (err instanceof Error) {
            if (err.message.includes('encrypted')) {
              setIsPdfEncrypted(true);
              errorMessage = 'This PDF is encrypted. Some features may be limited.';
            } else if (err.message.includes('worker') || err.message.includes('Worker')) {
              errorMessage = 'PDF.js worker initialization failed. Try refreshing the page.';
            } else {
              errorMessage = `Failed to load PDF: ${err.message}`;
            }
          }
          
          setError(new PdfLoadError(errorMessage, err instanceof Error ? err : undefined));
          setIsLoading(false);
        }
      }
    };

    loadPdf();

    // Cleanup on unmount or when file changes
    return () => {
      if (pdfDocument) {
        try {
          // Explicitly destroy the document when possible
          (pdfDocument as { destroy?: () => void }).destroy?.();
        } catch (e) {
          console.error('Error cleaning up PDF document:', e);
        }
      }
    };
  }, [file]);

  return { 
    pdfDocument, 
    totalPages, 
    isLoading, 
    loadingProgress, 
    error, 
    isPdfEncrypted,
    workerInitError
  };
} 