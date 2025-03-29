'use client';

import { useState, useEffect } from 'react';
import PDFUploader from './components/PDFUploader';
import PDFViewer from './components/PDFViewer';
import { RedactionArea } from './types/pdf';
import { downloadRedactedPDF } from './utils/pdfRedactor';
import { initPdfWorker, isPdfWorkerInitialized } from './utils/pdfWorkerLoader';

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [redactionAreas, setRedactionAreas] = useState<RedactionArea[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initialize PDF worker on page load
  useEffect(() => {
    const initializeWorker = async () => {
      try {
        if (!isPdfWorkerInitialized()) {
          await initPdfWorker();
        }
      } catch (error) {
        console.error('Error initializing PDF worker:', error);
      }
    };

    initializeWorker();
  }, []);

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setRedactionAreas([]);
    setError(null);
    setSuccessMessage(null);
  };

  const handleSelectionChange = (selections: RedactionArea[]) => {
    setRedactionAreas(selections);
  };

  const handleRedact = async () => {
    if (!uploadedFile || redactionAreas.length === 0) {
      setError('Please upload a PDF and select areas to redact');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setSuccessMessage(null);
      
      console.log(`Applying redactions to "${uploadedFile.name}" with ${redactionAreas.length} areas`);
      
      // Add a longer timeout for processing
      await new Promise((resolve) => {
        setTimeout(async () => {
          try {
            await downloadRedactedPDF(uploadedFile, redactionAreas);
            setSuccessMessage('PDF redacted successfully! Download complete.');
            resolve(null);
          } catch (err) {
            console.error('Error in PDF redaction:', err);
            
            // Determine the appropriate error message
            let errorMessage = 'An error occurred while redacting the PDF. Please try again.';
            
            if (err instanceof Error) {
              if (err.message.includes('encrypted')) {
                errorMessage = 'This PDF is encrypted and cannot be redacted. Please try a different PDF or remove the encryption first.';
              } else if (err.message.includes('invalid') || err.message.includes('corrupted') || err.message.includes('damaged')) {
                errorMessage = 'This PDF appears to be invalid or corrupted. Please try a different PDF.';
              } else if (err.message.includes('blank') || err.message.includes('empty')) {
                errorMessage = 'The resulting PDF was blank. Please try again with different redaction areas.';
              } else {
                // Use the actual error message for clarity
                errorMessage = `PDF redaction error: ${err.message}`;
              }
            }
            
            setError(errorMessage);
            resolve(null);
          }
        }, 200); // Give a bit of time for the UI to update
      });
    } catch (error) {
      console.error('Error in redaction process:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle updated file from the PDF viewer (e.g., after unlocking)
  const handleFileUpdate = (updatedFile: File) => {
    console.log('Received updated file:', updatedFile.name);
    setUploadedFile(updatedFile);
    setRedactionAreas([]);
    setError(null);
    setSuccessMessage('PDF successfully unlocked! You can now apply redactions.');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            PDF Redaction Tool
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {!uploadedFile ? (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                Upload a PDF to redact
              </h2>
              <PDFUploader onFileUpload={handleFileUpload} />
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  {uploadedFile.name}
                </h2>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setUploadedFile(null)}
                    disabled={isProcessing}
                    className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium 
                      ${isProcessing 
                        ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  >
                    Upload a different file
                  </button>
                </div>
              </div>

              {isProcessing && (
                <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing your redactions...
                  </p>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {successMessage}
                  </p>
                </div>
              )}

              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Draw rectangles on the document to mark areas for redaction. Then click &quot;Download Redacted PDF&quot; to get your redacted document.
                </p>
              </div>

              <PDFViewer 
                file={uploadedFile} 
                onSelectionChange={handleSelectionChange}
                onApplyRedactions={handleRedact}
                onFileUpdate={handleFileUpdate}
              />
            </>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white dark:bg-gray-800 shadow-inner">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            PDF Redaction Tool - Protect sensitive information in your documents
          </p>
        </div>
      </footer>
    </div>
  );
}

