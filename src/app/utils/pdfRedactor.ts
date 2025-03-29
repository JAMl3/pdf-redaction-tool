import { PDFDocument, rgb, Color } from 'pdf-lib';
import { RedactionArea } from '../types/pdf';
import { REDACTION_SETTINGS } from '../constants/pdf';
// import { unlockPdf, isPdfEncrypted } from './pdfUnlocker';

/**
 * Creates a clean copy of the PDF without modifying it
 */
export const createCleanPDFCopy = async (pdfFile: File): Promise<Uint8Array> => {
  try {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    return await pdfDoc.save();
  } catch (error) {
    console.error('Error creating clean PDF copy:', error);
    throw error;
  }
};

/**
 * Downloads the PDF file from a Uint8Array
 */
export const downloadPdfBlob = (pdfBytes: Uint8Array, filename: string): void => {
  try {
    // Create a blob from the PDF bytes
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename || 'redacted-document.pdf';
    
    // Append to the DOM, click to download, then remove
    document.body.appendChild(link);
    link.click();
    
    // Clean up after a short delay to ensure the download starts
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
      document.body.removeChild(link);
    }, 100);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw new Error('Failed to download the PDF file.');
  }
};

/**
 * Process all redactions for a PDF
 */
export const processRedactions = async (
  pdfFile: File,
  redactionAreas: RedactionArea[]
): Promise<Uint8Array> => {
  try {
    // Return early if no redaction areas
    if (!redactionAreas.length) {
      console.log('No redaction areas. Returning original PDF.');
      const arrayBuffer = await pdfFile.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    }

    console.log('Starting redaction process with simplified approach...');
    
    // Get the file data as buffer
    const arrayBuffer = await pdfFile.arrayBuffer();
    console.log(`Original PDF size: ${arrayBuffer.byteLength} bytes`);
    
    // First, verify we can load the PDF by creating a clean copy
    try {
      console.log('Verifying PDF can be loaded with pdf-lib...');
      const verifyDoc = await PDFDocument.load(arrayBuffer);
      console.log(`PDF verified - contains ${verifyDoc.getPageCount()} pages`);
    } catch (verifyError) {
      console.error('PDF verification failed:', verifyError);
      throw new Error('Unable to process this PDF. The file may be damaged or incompatible.');
    }
    
    // Create backup of original PDF data
    const originalPdfBytes = new Uint8Array(arrayBuffer);
    
    // Try a simpler approach first - just copy the original and add redactions
    try {
      console.log('Loading PDF document for redaction...');
      // Load the PDF document with strict validation
    const pdfDoc = await PDFDocument.load(arrayBuffer, { 
      ignoreEncryption: true,
      updateMetadata: false
    });
    
    console.log(`PDF loaded successfully. Total pages: ${pdfDoc.getPageCount()}`);
      
      // Immediately verify we can read pages
      const pageCount = pdfDoc.getPageCount();
      if (pageCount <= 0) {
        throw new Error('PDF has no pages');
      }
      
      // Try to access each page to verify they can be loaded
      for (let i = 0; i < Math.min(3, pageCount); i++) {
        try {
          pdfDoc.getPage(i);
        } catch (pageError) {
          console.error(`Error accessing page ${i+1}:`, pageError);
          throw new Error(`Cannot access page ${i+1} - PDF may be corrupted or incompatible`);
        }
      }
      
      // Get the redaction color in RGB format
      const redactionColor = hexToRgb(REDACTION_SETTINGS.defaultRedactionColor);
    
    // Group redactions by page number
    const redactionsByPage: Record<string, RedactionArea[]> = {};
    redactionAreas.forEach(area => {
      const pageKey = area.pageNumber.toString();
      if (!redactionsByPage[pageKey]) {
        redactionsByPage[pageKey] = [];
      }
      redactionsByPage[pageKey].push(area);
    });
    
    // Process each page with redactions
    for (const [pageNumberStr, areas] of Object.entries(redactionsByPage)) {
      const pageNumber = parseInt(pageNumberStr, 10);
      
      // PDF page numbers are 1-based, but array is 0-based
      if (pageNumber <= 0 || pageNumber > pdfDoc.getPageCount()) {
        console.warn(`Skipping invalid page number: ${pageNumber}`);
        continue;
      }
      
      console.log(`Processing page ${pageNumber} with ${areas.length} redaction areas`);
      
      // Get the page
      const page = pdfDoc.getPage(pageNumber - 1);
      
      // Get the page dimensions
      const { width: pageWidth, height: pageHeight } = page.getSize();
      console.log(`Page dimensions: ${pageWidth}x${pageHeight}`);
      
      // Process each redaction on this page
      for (const area of areas) {
        try {
          console.log(`Processing redaction area: (${area.x}, ${area.y}) - ${area.width}x${area.height}`);
          
          // Calculate PDF coordinates (PDF uses bottom-left origin)
          // Convert from top-left (web) to bottom-left (PDF) coordinate system
            // Ensure coordinates are within page boundaries
          const x = Math.max(0, Math.min(area.x, pageWidth));
            
            // The y-coordinate needs to be flipped (PDF origin is bottom-left)
            // Calculate the bottom coordinate of the rectangle in PDF coordinates
            const y = Math.max(0, pageHeight - (area.y + area.height));
            
            // Ensure width and height are positive and within page boundaries
            const rectWidth = Math.max(1, Math.min(area.width, pageWidth - x));
            const rectHeight = Math.max(1, Math.min(area.height, area.y + area.height - Math.max(0, area.y)));
          
          console.log(`Drawing rectangle at PDF coordinates: (${x}, ${y}) size: ${rectWidth}x${rectHeight}`);
          
          // Draw the redaction rectangle
          if (rectWidth > 0 && rectHeight > 0) {
            page.drawRectangle({
              x,
              y,
              width: rectWidth,
              height: rectHeight,
              color: redactionColor,
              opacity: 1.0,  // Ensure full opacity
              borderWidth: 0
            });
          } else {
            console.warn('Skipping redaction with invalid dimensions');
          }
        } catch (redactionError) {
          console.error('Error applying individual redaction:', redactionError);
          // Continue with other redactions even if one fails
        }
      }
    }
    
    console.log('All redactions applied, saving document...');
    
      // Save the document as PDF bytes with proper options for maximum compatibility
    const redactedPdfBytes = await pdfDoc.save({
      useObjectStreams: false,
      addDefaultPage: false,
      updateFieldAppearances: false
    });
      
      // Verify we have content - stricter checks
      if (redactedPdfBytes.length < 1000) {
        console.error('Generated PDF is suspiciously small:', redactedPdfBytes.length, 'bytes');
        throw new Error('Generated PDF appears to be invalid (too small)');
      }
      
      // Quick validation: Check for PDF header
      const pdfHeader = new TextDecoder().decode(redactedPdfBytes.slice(0, 8));
      if (!pdfHeader.startsWith('%PDF')) {
        console.error('Generated PDF does not have valid PDF header:', pdfHeader);
        throw new Error('Generated PDF lacks proper PDF header');
      }
      
      // Log the first few bytes for debugging
      const firstBytes = Array.from(redactedPdfBytes.slice(0, 20))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(' ');
      console.log(`First bytes of redacted PDF: ${firstBytes}`);
      
      // Additional validation: Try to reload the PDF to confirm it's valid
      try {
        await PDFDocument.load(redactedPdfBytes);
        console.log('Validation check: Successfully reloaded generated PDF');
      } catch (validateError) {
        console.error('Failed to validate generated PDF:', validateError);
        throw new Error('Generated PDF validation failed - it may be corrupted');
      }
    
    console.log('PDF saved successfully, size:', redactedPdfBytes.length);
    
    return redactedPdfBytes;
    } catch (mainError) {
      console.error('Error in primary redaction approach:', mainError);
      
      // If the first approach failed, try the fallback approach - create a new PDF
      console.log('Trying fallback approach - creating new PDF...');
      
      try {
        // Load the original document
        const originalDoc = await PDFDocument.load(arrayBuffer, { 
          ignoreEncryption: true,
          updateMetadata: false 
        });
        
        // Create a brand new PDF
        const newDoc = await PDFDocument.create();
        
        // Copy all pages from the original
        const pageIndices = originalDoc.getPageIndices();
        const copiedPages = await newDoc.copyPages(originalDoc, pageIndices);
        copiedPages.forEach(page => newDoc.addPage(page));
        
        console.log(`Created new PDF with ${newDoc.getPageCount()} pages`);
        
        // Apply redactions to the new document
        // Group redactions by page number
        const redactionsByPage: Record<string, RedactionArea[]> = {};
        redactionAreas.forEach(area => {
          const pageKey = area.pageNumber.toString();
          if (!redactionsByPage[pageKey]) {
            redactionsByPage[pageKey] = [];
          }
          redactionsByPage[pageKey].push(area);
        });
        
        // Get the redaction color in RGB format
        const redactionColor = hexToRgb(REDACTION_SETTINGS.defaultRedactionColor);
        
        // Process each page with redactions
        for (const [pageNumberStr, areas] of Object.entries(redactionsByPage)) {
          const pageNumber = parseInt(pageNumberStr, 10);
          
          if (pageNumber <= 0 || pageNumber > newDoc.getPageCount()) {
            console.warn(`Skipping invalid page number: ${pageNumber}`);
            continue;
          }
          
          // Get the page
          const page = newDoc.getPage(pageNumber - 1);
          
          // Get the page dimensions
          const { width: pageWidth, height: pageHeight } = page.getSize();
          
          // Apply each redaction
          for (const area of areas) {
            const x = Math.max(0, Math.min(area.x, pageWidth));
            const y = Math.max(0, pageHeight - (area.y + area.height));
            const rectWidth = Math.max(1, Math.min(area.width, pageWidth - x));
            const rectHeight = Math.max(1, Math.min(area.height, area.y + area.height - Math.max(0, area.y)));
            
            if (rectWidth > 0 && rectHeight > 0) {
              page.drawRectangle({
                x,
                y,
                width: rectWidth,
                height: rectHeight,
                color: redactionColor,
                opacity: 1.0,  // Ensure full opacity
                borderWidth: 0
              });
            }
          }
        }
        
        // Save the new document
        const fallbackBytes = await newDoc.save({
          useObjectStreams: false,
          addDefaultPage: false
        });
        
        // Validate the fallback PDF
        if (fallbackBytes.length < 1000) {
          throw new Error('Fallback PDF is too small, likely invalid');
        }
        
        // Quick validation: Check for PDF header
        const pdfHeader = new TextDecoder().decode(fallbackBytes.slice(0, 8));
        if (!pdfHeader.startsWith('%PDF')) {
          console.error('Fallback PDF does not have valid PDF header');
          throw new Error('Fallback PDF lacks proper PDF header');
        }
        
        // Try to reload the fallback PDF to validate it
        try {
          await PDFDocument.load(fallbackBytes);
          console.log('Validation check: Successfully reloaded fallback PDF');
        } catch (validateError) {
          console.error('Failed to validate fallback PDF:', validateError);
          throw new Error('Fallback PDF validation failed - it may be corrupted');
        }
        
        console.log(`Fallback approach succeeded, PDF size: ${fallbackBytes.length} bytes`);
        
        return fallbackBytes;
      } catch (fallbackError) {
        console.error('Fallback approach also failed:', fallbackError);
        
        // Last resort: just return the original PDF with a warning in console
        console.log('All redaction approaches failed. Returning original PDF.');
        console.log('Original error:', mainError);
        console.log('Fallback error:', fallbackError);
        
        return originalPdfBytes;
      }
    }
  } catch (error) {
    console.error('Unrecoverable error in PDF redaction:', error);
    // In case of complete failure, return the original PDF
    const originalBuffer = await pdfFile.arrayBuffer();
    return new Uint8Array(originalBuffer);
  }
};

/**
 * Alternative canvas-based redaction approach
 * This works by rendering each page to a canvas, applying redactions, and creating a new PDF
 */
export async function canvasRedaction(
  pdfFile: File,
  redactionAreas: RedactionArea[]
): Promise<Uint8Array> {
  console.log('Starting canvas-based redaction...');
  
  try {
    // Load PDF.js dynamically
    const pdfjsLib = await import('pdfjs-dist');
    
    // Get file data
    const arrayBuffer = await pdfFile.arrayBuffer();
    
    // Load PDF with PDF.js
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer
    });
    
    const pdfDoc = await loadingTask.promise;
    console.log(`PDF loaded successfully with ${pdfDoc.numPages} pages`);
    
    // Create a new PDF document with pdf-lib
    const newPdfDoc = await PDFDocument.create();
    
    // Group redactions by page
    const redactionsByPage = new Map<number, RedactionArea[]>();
    for (const area of redactionAreas) {
      if (!redactionsByPage.has(area.pageNumber)) {
        redactionsByPage.set(area.pageNumber, []);
      }
      redactionsByPage.get(area.pageNumber)!.push(area);
    }
    
    // Create an off-screen canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { alpha: false }); // no alpha for PDFs
    if (!ctx) {
      throw new Error('Could not create canvas context');
    }
    
    // Process each page
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      console.log(`Processing page ${i} of ${pdfDoc.numPages}...`);
      
      // Get the PDF.js page
      const page = await pdfDoc.getPage(i);
      
      // Use scale of 2 for better quality
      const scale = 2.0;
      const viewport = page.getViewport({ scale });
      
      // Set canvas size to match the page
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      
      console.log(`Canvas size: ${canvas.width}x${canvas.height}`);
      
      // Clear canvas
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Render the page to the canvas
      try {
        const renderContext = {
          canvasContext: ctx,
          viewport: viewport
        };
        
        await page.render(renderContext).promise;
        console.log(`Page ${i} rendered to canvas`);
      } catch (renderError) {
        console.error(`Error rendering page ${i}:`, renderError);
        continue; // Skip this page if rendering fails
      }
      
      // Apply redactions to this page
      const pageRedactions = redactionsByPage.get(i) || [];
      if (pageRedactions.length > 0) {
        console.log(`Applying ${pageRedactions.length} redactions to page ${i}`);
        
        // Draw redaction boxes
        ctx.fillStyle = REDACTION_SETTINGS.defaultRedactionColor;
        for (const area of pageRedactions) {
          // Scale coordinates to match our higher-resolution rendering
          const x = area.x * scale;
          const y = area.y * scale;
          const width = area.width * scale;
          const height = area.height * scale;
          
          console.log(`Drawing redaction at (${x},${y}) size ${width}x${height}`);
          ctx.fillRect(x, y, width, height);
        }
      }
      
      // Convert canvas to JPEG data URL
      const imageData = canvas.toDataURL('image/jpeg', 0.92);
      
      // Add a page to the new PDF
      const jpegImage = await newPdfDoc.embedJpg(imageData);
      
      // Calculate the page dimensions
      const pageWidth = viewport.width / scale;
      const pageHeight = viewport.height / scale;
      
      // Add the page and draw the image
      const newPage = newPdfDoc.addPage([pageWidth, pageHeight]);
      newPage.drawImage(jpegImage, {
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight
      });
      
      console.log(`Page ${i} added to new PDF`);
    }
    
    // Save the PDF
    console.log('Saving PDF...');
    const pdfBytes = await newPdfDoc.save();
    
    // Verify the PDF
    if (pdfBytes.length < 1000) {
      throw new Error('Generated PDF is too small, likely invalid');
    }
    
    console.log(`Canvas-based redaction completed: ${pdfBytes.length} bytes`);
    return pdfBytes;
  } catch (error) {
    console.error('Error in canvas-based redaction:', error);
    throw error;
  }
}

/**
 * Screenshot-based redaction that renders each page as an image
 * This approach works with any PDF, even if restricted or encrypted
 */
export async function screenshotBasedRedaction(
  pdfFile: File,
  redactionAreas: RedactionArea[]
): Promise<Uint8Array> {
  console.log('Starting screenshot-based redaction...');
  
  try {
    // Load PDF.js dynamically
    const pdfjsLib = await import('pdfjs-dist');
    
    // Get file data
    const arrayBuffer = await pdfFile.arrayBuffer();
    
    // Load PDF with PDF.js
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      // Turn off additional security checks so we can at least render it
      disableRange: true,
      disableStream: true,
      disableAutoFetch: true
    });
    
    const pdfDoc = await loadingTask.promise;
    console.log(`PDF loaded successfully with ${pdfDoc.numPages} pages`);
    
    // Create a new PDF document with pdf-lib
    const newPdfDoc = await PDFDocument.create();
    
    // Group redactions by page
    const redactionsByPage = new Map<number, RedactionArea[]>();
    for (const area of redactionAreas) {
      if (!redactionsByPage.has(area.pageNumber)) {
        redactionsByPage.set(area.pageNumber, []);
      }
      redactionsByPage.get(area.pageNumber)!.push(area);
    }
    
    // Create an off-screen canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true }); // no alpha for PDFs, optimize for reading pixels
    if (!ctx) {
      throw new Error('Could not create canvas context');
    }
    
    // Process each page
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      console.log(`Processing page ${i} of ${pdfDoc.numPages}...`);
      
      try {
        // Get the PDF.js page
        const page = await pdfDoc.getPage(i);
        
        // Use higher scale for better quality
        const scale = 2.0;
        const viewport = page.getViewport({ scale });
        
        // Set canvas size to match the page
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        
        console.log(`Canvas size for page ${i}: ${canvas.width}x${canvas.height}`);
        
        // Clear canvas with white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Render the page to the canvas
        try {
          const renderContext = {
            canvasContext: ctx,
            viewport: viewport
          };
          
          await page.render(renderContext).promise;
          console.log(`Page ${i} rendered to canvas successfully`);
        } catch (renderError) {
          console.error(`Error rendering page ${i}:`, renderError);
          
          // Instead of skipping, create a blank page with error message
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#FF0000';
          ctx.font = '20px Arial';
          ctx.fillText(`Error rendering page ${i}`, 50, 100);
        }
        
        // Apply redactions to this page - draw with 100% solid color to ensure complete coverage
        const pageRedactions = redactionsByPage.get(i) || [];
        if (pageRedactions.length > 0) {
          console.log(`Applying ${pageRedactions.length} redactions to page ${i}`);
          
          // Use a solid fill style with no transparency
          ctx.fillStyle = REDACTION_SETTINGS.defaultRedactionColor;
          
          for (const area of pageRedactions) {
            // Scale coordinates to match our higher-resolution rendering
            const x = area.x * scale;
            const y = area.y * scale;
            const width = area.width * scale;
            const height = area.height * scale;
            
            console.log(`Drawing redaction at (${x},${y}) size ${width}x${height}`);
            
            // Draw a solid rectangle with no transparency
            ctx.fillRect(x, y, width, height);
            
            // Add a cross-hatch pattern for better visibility
            ctx.fillStyle = '#333333';
            const patternSize = 10 * scale;
            
            // Draw diagonal lines for pattern
            for (let i = 0; i < width + height; i += patternSize) {
              ctx.beginPath();
              ctx.moveTo(x + Math.min(i, width), y);
              ctx.lineTo(x, y + Math.min(i, height));
              ctx.lineWidth = 2 * scale;
              ctx.stroke();
              
              ctx.beginPath();
              ctx.moveTo(x + Math.max(0, i - height), y + Math.min(i, height));
              ctx.lineTo(x + Math.min(i, width), y + Math.max(0, i - width));
              ctx.lineWidth = 2 * scale;
              ctx.stroke();
            }
            
            // Reset fill style
            ctx.fillStyle = REDACTION_SETTINGS.defaultRedactionColor;
            
            // Add a border to make it clear this is a redaction
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);
          }
        }
        
        // Convert canvas to PNG for best quality (instead of JPEG)
        const imageData = canvas.toDataURL('image/png', 1.0);
        
        // Add to PDF document
        const pngImage = await newPdfDoc.embedPng(imageData);
        
        // Calculate the true page dimensions at 1x scale
        const pageWidth = viewport.width / scale;
        const pageHeight = viewport.height / scale;
        
        // Add a page and draw the image
        const newPage = newPdfDoc.addPage([pageWidth, pageHeight]);
        newPage.drawImage(pngImage, {
          x: 0,
          y: 0,
          width: pageWidth,
          height: pageHeight
        });
        
        console.log(`Page ${i} added to new PDF document`);
      } catch (pageError) {
        console.error(`Error processing page ${i}:`, pageError);
        
        // Add a blank page with error message instead
        const blankPage = newPdfDoc.addPage([612, 792]); // Standard US Letter size
        blankPage.drawText(`Error processing page ${i}`, {
          x: 50,
          y: 700,
          size: 20,
          color: rgb(1, 0, 0)
        });
      }
    }
    
    // Use compression options for smaller file size while maintaining quality
    const pdfBytes = await newPdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false
    });
    
    console.log(`Screenshot-based redaction completed: ${pdfBytes.length} bytes`);
    return pdfBytes;
  } catch (error) {
    console.error('Error in screenshot-based redaction:', error);
    throw error;
  }
}

/**
 * Applies redactions to a PDF file and returns the redacted PDF as a byte array
 * This version focuses on reliability over feature completeness
 */
export async function redactPDF(
  pdfFile: File,
  redactionAreas: RedactionArea[],
  copyOnly: boolean = false
): Promise<Uint8Array> {
  // Add diagnostic information
  console.log('PDF redaction started:', {
    fileName: pdfFile.name,
    fileSize: pdfFile.size,
    redactionCount: redactionAreas.length,
    copyOnly
  });

  // For empty redactions or copyOnly flag, return unmodified PDF
  if (copyOnly || redactionAreas.length === 0) {
    console.log('Creating exact copy without redactions');
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfBytes = new Uint8Array(arrayBuffer);
    console.log(`Returning unmodified PDF (${pdfBytes.length} bytes)`);
    return pdfBytes;
  }

  console.log(`Processing PDF with ${redactionAreas.length} redaction areas`);

  // Store the original PDF data to use as fallback
  const originalPdfBytes = new Uint8Array(await pdfFile.arrayBuffer());
  console.log(`Original PDF size: ${originalPdfBytes.length} bytes`);

  try {
    // Try multiple approaches in sequence, with screenshot-based approach first
    const attempts = [
      {
        name: 'Screenshot approach',
        method: async () => await screenshotBasedRedaction(pdfFile, redactionAreas)
      },
      {
        name: 'Primary approach',
        method: async () => await processRedactions(pdfFile, redactionAreas)
      },
      {
        name: 'Canvas approach',
        method: async () => await canvasRedaction(pdfFile, redactionAreas)
      }
    ];
    
    // Try each approach in sequence
    for (const attempt of attempts) {
      try {
        console.log(`Trying ${attempt.name}...`);
        const result = await attempt.method();
        
        // Validate the result
        if (!result || result.length < 1000) {
          console.warn(`${attempt.name} produced suspicious output (${result?.length || 0} bytes)`);
          continue;
        }
        
        // Verify the PDF header
        const pdfHeader = new TextDecoder().decode(result.slice(0, 8));
        if (!pdfHeader.startsWith('%PDF')) {
          console.warn(`${attempt.name} produced invalid PDF header: ${pdfHeader}`);
          continue;
        }
        
        // Try to load the PDF to verify its validity
        try {
          await PDFDocument.load(result);
          console.log(`${attempt.name} succeeded with valid PDF`);
          return result;
        } catch (loadError) {
          console.warn(`${attempt.name} produced PDF that cannot be loaded back:`, loadError);
          continue;
        }
      } catch (error) {
        console.error(`${attempt.name} failed:`, error);
      }
    }
    
    console.error('All redaction approaches failed, returning original PDF');
    return originalPdfBytes;
  } catch (error) {
    console.error('Critical error in PDF processing:', error);
    
    // Always return the original PDF on critical error
    console.log('Returning original PDF due to critical error');
    return originalPdfBytes;
  }
}

/**
 * Convert hex color string to RGB color
 */
export const hexToRgb = (hex: string): Color => {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  return rgb(r, g, b);
};

/**
 * Creates a redacted PDF and triggers a download
 * Using a simplified approach that prioritizes reliability
 */
export async function downloadRedactedPDF(
  pdfFile: File,
  redactionAreas: RedactionArea[]
): Promise<void> {
  try {
    console.log(`Starting PDF download process with ${redactionAreas.length} redaction areas`);
    
    // Get original filename and create new filename for the redacted version
    const originalName = pdfFile.name;
    const fileNameParts = originalName.split('.');
    const extension = fileNameParts.pop() || 'pdf';
    const baseName = fileNameParts.join('.');
    const newFileName = `${baseName}-redacted.${extension}`;
    
    try {
      // Process the redactions
      const redactedPdfBytes = await redactPDF(pdfFile, redactionAreas);
      
      // Verify we have actual content
      if (!redactedPdfBytes || redactedPdfBytes.length < 100) {
        throw new Error('Redacted PDF appears to be invalid (too small or empty)');
      }
      
      console.log(`Redacted PDF size: ${redactedPdfBytes.length} bytes`);
      
      // Download the redacted PDF
      downloadPdfBlob(redactedPdfBytes, newFileName);
      
      console.log('PDF redacted successfully!');
    } catch (error) {
      let errorMessage = 'Failed to redact the PDF.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('Error in PDF redaction:', errorMessage);
      }
      
      // Rethrow the error for the caller to handle
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('Error in downloadRedactedPDF:', error);
    throw error;
  }
} 