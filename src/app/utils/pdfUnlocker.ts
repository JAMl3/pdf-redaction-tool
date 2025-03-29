import { PDFDocument } from 'pdf-lib';

/**
 * Attempts to create an unlocked copy of a PDF by creating a new PDF
 * and copying all pages from the original document.
 * 
 * This works similarly to the Python example using PyPDF2:
 * It opens the PDF (ignoring encryption), extracts each page,
 * and creates a new document without the original restrictions.
 * 
 * @param pdfFile The original (potentially encrypted) PDF file
 * @returns A promise with the unlocked PDF as a Uint8Array
 */
export async function unlockPdf(pdfFile: File): Promise<Uint8Array> {
  try {
    console.log('Attempting to unlock PDF:', pdfFile.name);
    
    // Get the original PDF as array buffer
    const arrayBuffer = await pdfFile.arrayBuffer();
    
    // Load the original PDF, ignoring encryption 
    const originalPdfDoc = await PDFDocument.load(arrayBuffer, { 
      ignoreEncryption: true,
      updateMetadata: false
    });
    
    // Create a brand new PDF document
    const newPdfDoc = await PDFDocument.create();
    
    // Copy each page from the original document to the new document
    for (let i = 0; i < originalPdfDoc.getPageCount(); i++) {
      // Get current page from the original document
      const [copiedPage] = await newPdfDoc.copyPages(originalPdfDoc, [i]);
      
      // Add the copied page to the new document
      newPdfDoc.addPage(copiedPage);
    }
    
    // Save the new PDF without encryption
    const pdfBytes = await newPdfDoc.save();
    
    console.log('PDF unlocked successfully');
    return pdfBytes;
  } catch (error) {
    console.error('Error unlocking PDF:', error);
    throw new Error('Failed to unlock the PDF document.');
  }
}

/**
 * Check if a PDF is encrypted/has restrictions
 * @param pdfFile The PDF file to check
 * @returns A promise that resolves to true if the PDF is encrypted/secured
 */
export async function isPdfEncrypted(pdfFile: File): Promise<boolean> {
  try {
    const arrayBuffer = await pdfFile.arrayBuffer();
    
    // Try to load the PDF normally (without ignoring encryption)
    // If it succeeds without error, it's not encrypted
    await PDFDocument.load(arrayBuffer);
    
    // No error means not encrypted
    return false;
  } catch (error) {
    // If we get an error that mentions "encryption", it's likely encrypted
    if (error instanceof Error && 
        (error.message.includes('encrypt') || 
         error.message.includes('password') ||
         error.message.includes('permission'))) {
      return true;
    }
    
    // For other errors, it could be a corrupted file or other issues
    console.error('Error checking PDF encryption:', error);
    return false;
  }
} 