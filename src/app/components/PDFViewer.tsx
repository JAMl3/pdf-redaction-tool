import { useEffect, useRef, useState } from 'react';
import { usePdfLoader } from '../hooks/usePdfLoader';
import { RedactionArea } from '../types/pdf';
import { PDFCanvas } from './pdf/PDFCanvas';
import { PDFPageNavigation } from './pdf/PDFPageNavigation';
import { PDFZoomControls } from './pdf/PDFZoomControls';
import { RedactionAreasList } from './pdf/RedactionAreasList';
import { initPdfWorker, isPdfWorkerInitialized } from '../utils/pdfWorkerLoader';
import { unlockPdf } from '../utils/pdfUnlocker';

// Ensure PDF.js uses worker
if (typeof window !== 'undefined') {
  try {
    // Initialize PDF.js with worker
    if (!isPdfWorkerInitialized()) {
      initPdfWorker()
        .then(success => {
          console.log('PDF.js worker initialization result:', success ? 'Success' : 'Failed');
        })
        .catch(error => {
          console.error('PDF.js worker initialization error:', error);
        });
    }
  } catch (error) {
    console.error('Error initializing worker in PDFViewer component:', error);
  }
}

interface PDFViewerProps {
  file: File | null;
  onPageRendered?: (pageNumber: number, totalPages: number) => void;
  onSelectionChange?: (selections: RedactionArea[]) => void;
  onApplyRedactions?: () => void;
  onFileUpdate?: (file: File) => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ 
  file, 
  onPageRendered,
  onSelectionChange,
  onApplyRedactions,
  onFileUpdate
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { pdfDocument, totalPages, isLoading, loadingProgress, error, isPdfEncrypted, workerInitError } = usePdfLoader(file);
  
  // State for PDF viewing
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0); // Default to 100%
  const [redactionAreas, setRedactionAreas] = useState<RedactionArea[]>([]);
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isUnlocking, setIsUnlocking] = useState<boolean>(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  // Add the pageViewport state
  const [pageViewport, setPageViewport] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Ensure worker is initialized on component mount
  useEffect(() => {
    // Ensure CDN worker is properly initialized
    initPdfWorker();
  }, []);

  // Notify when page is rendered
  useEffect(() => {
    if (pdfDocument && onPageRendered) {
      onPageRendered(currentPage, totalPages);
    }
  }, [currentPage, totalPages, pdfDocument, onPageRendered]);

  // Reset to the first page when the document changes
  useEffect(() => {
    if (pdfDocument) {
      setCurrentPage(1);
      setRedactionAreas([]);
      // Reset scale to 100%
      setScale(1.0);
    }
  }, [pdfDocument]);

  // Handle new redaction area creation
  const handleRedactionAreaCreated = (area: RedactionArea) => {
    const updatedAreas = [...redactionAreas, area];
    setRedactionAreas(updatedAreas);
    
    if (onSelectionChange) {
      onSelectionChange(updatedAreas);
    }
  };

  // Handle canvas ready callback
  const handleCanvasReady = (width: number, height: number) => {
    console.debug(`Canvas dimensions: ${width}x${height} at scale ${scale}`);
    
    // Store original page dimensions for reference
    setPageViewport({
      width: width,
      height: height
    });
    
    // No auto-scaling, keep at 100%
    if (scale !== 1.0) {
      setScale(1.0);
    }
  };

  // Handle unlocking encrypted PDFs
  const handleUnlockPdf = async () => {
    if (!file) return;
    
    try {
      setIsUnlocking(true);
      setUnlockError(null);
      
      // Unlock the PDF
      const unlockedPdfBytes = await unlockPdf(file);
      
      // Create a new File object with the unlocked content
      const unlockedFile = new File(
        [unlockedPdfBytes], 
        file.name.replace('.pdf', '-unlocked.pdf'), 
        { type: 'application/pdf' }
      );
      
      // Update the file in the parent component
      if (onFileUpdate) {
        onFileUpdate(unlockedFile);
      }
      
      console.log('PDF unlocked successfully');
    } catch (error) {
      console.error('Error unlocking PDF:', error);
      setUnlockError(error instanceof Error ? error.message : 'Failed to unlock PDF');
    } finally {
      setIsUnlocking(false);
    }
  };

  // Error logging
  useEffect(() => {
    if (error) {
      console.error('PDF loading error details:', error);
    }
  }, [error]);

  // Update the handleCanvasError function to simply log errors since we don't display them
  const handleCanvasError = (error: Error) => {
    console.error('Canvas rendering error:', error);
  };

  // Add a function to calculate the initial scale based on the container size
  const calculateFitScale = (width: number, height: number): number => {
    if (!containerRef.current) return 1.0;
    
    // Get container dimensions (minus some padding)
    const containerWidth = containerRef.current.clientWidth - 100;
    const containerHeight = containerRef.current.clientHeight - 160; // Account for toolbar and some padding
    
    // Calculate scale to fit width and height
    const scaleX = containerWidth / width;
    const scaleY = containerHeight / height;
    
    // Return the smaller scale to ensure full visibility
    return Math.min(Math.min(scaleX, scaleY), 1.0); // Cap at 100% to avoid oversizing small PDFs
  };

  return (
    <div className="pdf-viewer-container relative border border-gray-300 rounded-lg overflow-hidden flex flex-col"
         ref={containerRef}>
      
      {/* Worker initialization error */}
      {workerInitError && (
        <div className="bg-amber-100 text-amber-800 p-2 text-sm border-b border-amber-200">
          <strong>Warning:</strong> {workerInitError.message} 
          <button 
            className="ml-2 text-amber-700 underline" 
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
        </div>
      )}
      
      {/* Encrypted PDF warning */}
      {isPdfEncrypted && (
        <div className="bg-yellow-100 text-yellow-800 p-3 text-sm border-b border-yellow-200 flex justify-between items-center">
          <div>
            <strong>Warning:</strong> This PDF is encrypted or has security restrictions. Redactions may not work properly.
          </div>
          <button
            onClick={handleUnlockPdf}
            disabled={isUnlocking}
            className={`px-3 py-1 rounded text-sm font-medium ${
              isUnlocking 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-yellow-600 text-white hover:bg-yellow-700'
            }`}
          >
            {isUnlocking ? 'Unlocking...' : 'Unlock PDF'}
          </button>
        </div>
      )}

      {/* Unlock error message */}
      {unlockError && (
        <div className="bg-red-100 text-red-800 p-2 text-sm border-b border-red-200">
          <strong>Error unlocking PDF:</strong> {unlockError}
        </div>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="p-8 text-center">
          <div className="mb-2">Loading PDF...</div>
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500">{loadingProgress}% complete</div>
        </div>
      )}
      
      {/* PDF content when loaded */}
      {!isLoading && pdfDocument && (
        <div className="pdf-content">
          {/* PDF toolbar - reduce padding */}
          <div className="pdf-toolbar flex items-center justify-between bg-gray-100 p-0 h-9 border-b border-gray-300 shadow-md text-sm">
            <div className="flex items-center gap-2 px-2">
              <PDFPageNavigation 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            
              <PDFZoomControls
                scale={scale}
                onZoomIn={() => setScale(prev => Math.min(prev + 0.25, 3.0))}
                onZoomOut={() => setScale(prev => Math.max(prev - 0.25, 0.5))}
                onZoomChange={(newScale) => {
                  if (newScale === -1) {
                    // This is the special "Fit to Page" option
                    // Calculate the fit scale using the previously defined function
                    if (containerRef.current && pageViewport.width > 0 && pageViewport.height > 0) {
                      const fitScale = calculateFitScale(pageViewport.width / scale, pageViewport.height / scale);
                      setScale(fitScale);
                    }
                  } else {
                    setScale(newScale);
                  }
                }}
                minScale={0.5}
                maxScale={3.0}
              />
            </div>
            
            <div>
              {onApplyRedactions && (
                <button 
                  onClick={() => {
                    if (onApplyRedactions) {
                      setIsProcessing(true);
                      setTimeout(() => {
                        onApplyRedactions();
                        setIsProcessing(false);
                      }, 100);
                    }
                  }}
                  disabled={isProcessing || redactionAreas.length === 0 || isPdfEncrypted}
                  className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                    redactionAreas.length > 0 && !isPdfEncrypted
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Apply Redactions
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          
          {/* Canvas and sidebar layout */}
          <div className="flex flex-grow overflow-hidden">
            {/* PDF canvas container - ensure proper scrolling */}
            <div className="pdf-canvas-container flex-grow overflow-auto bg-gray-100">
              <div className="flex justify-center py-0.5">
                <div className="pdf-page-container">
                  <PDFCanvas
                    pdfDocument={pdfDocument}
                    currentPage={currentPage}
                    scale={scale}
                    redactionAreas={redactionAreas}
                    onRedactionAreaCreated={handleRedactionAreaCreated}
                    enableDrawing={!isProcessing && !isPdfEncrypted}
                    onCanvasReady={handleCanvasReady}
                    onError={handleCanvasError}
                  />
                </div>
              </div>
            </div>
            
            {/* Sidebar with redaction areas list - reduce width */}
            <div className="redaction-sidebar w-56 border-l border-gray-300 bg-white overflow-y-auto">
              <div className="p-2 border-b border-gray-300 bg-gray-100">
                <h3 className="font-medium text-black text-sm">Redaction Areas</h3>
              </div>
              <RedactionAreasList 
                redactionAreas={redactionAreas}
                onRemoveArea={(index) => {
                  const updatedAreas = redactionAreas.filter((_, i) => i !== index);
                  setRedactionAreas(updatedAreas);
                  if (onSelectionChange) onSelectionChange(updatedAreas);
                }}
                onGotoArea={(area) => {
                  setCurrentPage(area.pageNumber);
                  // Future enhancement: scroll to the area
                }}
                currentPage={currentPage}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* File input prompt when no file is loaded */}
      {!file && !isLoading && !error && (
        <div className="p-8 text-center text-gray-500">
          <p>Upload a PDF file to begin redaction</p>
        </div>
      )}
    </div>
  );
};

export default PDFViewer; 