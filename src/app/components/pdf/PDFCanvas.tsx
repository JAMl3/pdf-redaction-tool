import React, { useRef, useEffect, useState } from 'react';
import { PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist';
import { RedactionArea } from '../../types/pdf';
import { REDACTION_SETTINGS } from '../../constants/pdf';

interface PDFCanvasProps {
  pdfDocument: PDFDocumentProxy | null;
  currentPage: number;
  scale: number;
  redactionAreas: RedactionArea[];
  onRedactionAreaCreated: (area: RedactionArea) => void;
  enableDrawing?: boolean;
  onCanvasReady?: (width: number, height: number) => void;
  onError?: (error: Error) => void;
}

/**
 * Component for rendering PDF pages with layered canvases for redaction
 */
export const PDFCanvas: React.FC<PDFCanvasProps> = ({
  pdfDocument,
  currentPage,
  scale,
  redactionAreas,
  onRedactionAreaCreated,
  enableDrawing = true,
  onCanvasReady,
  onError
}) => {
  // Refs for the two canvas elements
  const contentCanvasRef = useRef<HTMLCanvasElement>(null);
  const redactionCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Ref for currently active render task
  const renderTaskRef = useRef<RenderTask | null>(null);
  const pageRef = useRef<PDFPageProxy | null>(null);
  
  // State for drawing redaction areas
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentArea, setCurrentArea] = useState<RedactionArea | null>(null);
  const [pageViewport, setPageViewport] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [renderingError, setRenderingError] = useState<Error | null>(null);
  
  // Render the PDF content on the content canvas
  useEffect(() => {
    let mounted = true;
    let cleanupRender: (() => void) | undefined;
    
    const renderPage = async () => {
      // Set a flag to track rendering state
      let isRendering = true;
      
      try {
        // Clean up previous render operations first
        if (renderTaskRef.current) {
          console.log('Cancelling active render task before starting new one');
          try {
            await renderTaskRef.current.cancel();
            renderTaskRef.current = null;
          } catch (e) {
            console.warn('Error cancelling render task:', e);
          }
        }
        
        if (pageRef.current) {
          try {
            pageRef.current.cleanup();
            pageRef.current = null;
          } catch (e) {
            console.warn('Error cleaning up page:', e);
          }
        }
        
        console.log(`Getting page ${currentPage} from PDF document`);
        
        // Wait a bit to ensure any canceled tasks are fully cleaned up
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if we've been unmounted during the timeout
        if (!contentCanvasRef.current || !isRendering) return;
        
        try {
          // Create a new canvas element for this render to avoid race conditions
          const canvas = contentCanvasRef.current;
          const context = canvas.getContext('2d');
          
          if (!context) {
            console.error('Could not get canvas context');
            return;
          }
          
          // Clear the canvas first
          context.clearRect(0, 0, canvas.width, canvas.height);
          
          // Get the page - add null check for pdfDocument
          if (!pdfDocument) {
            throw new Error("PDF document is null");
          }
          const page = await pdfDocument.getPage(currentPage);
          
          // Check again if component is still mounted
          if (!contentCanvasRef.current || !isRendering) {
            page.cleanup();
            return;
          }
          
          pageRef.current = page;
          
          // Set up viewport
          const viewport = page.getViewport({ scale });
          console.log(`PDF viewport dimensions: ${viewport.width}x${viewport.height}`);
          
          // Update canvas dimensions
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          // Store viewport dimensions
          setPageViewport({ 
            width: viewport.width, 
            height: viewport.height 
          });
          
          if (onCanvasReady) {
            onCanvasReady(viewport.width, viewport.height);
          }
          
          // Ensure the redaction canvas has the same dimensions
          if (redactionCanvasRef.current) {
            redactionCanvasRef.current.width = viewport.width;
            redactionCanvasRef.current.height = viewport.height;
          }
          
          // Final check before rendering
          if (!contentCanvasRef.current || !isRendering) {
            page.cleanup();
            return;
          }
          
          console.log('Starting page rendering...');
          
          // Create a new render task with unique ID
          const renderTaskId = Date.now();
          console.log(`Creating render task #${renderTaskId}`);
          
          const renderTask = page.render({
            canvasContext: context,
            viewport,
            intent: 'display'
          });
          
          renderTaskRef.current = renderTask;
          
          // Wait for rendering to complete
          await renderTask.promise;
          
          // Check if this was the most recent render task
          if (renderTaskRef.current === renderTask) {
            renderTaskRef.current = null;
            console.log(`Render task #${renderTaskId} completed successfully`);
          }
        } catch (error) {
          // Only log errors that aren't caused by cancellation
          if (error instanceof Error && error.message !== 'Rendering cancelled') {
            console.error('Error rendering PDF page:', error);
            setRenderingError(error);
            
            if (onError) {
              onError(error);
            }
          }
        }
      } catch (error) {
        console.error('Error in initial page loading:', error);
        const err = error instanceof Error ? error : new Error('Unknown error rendering PDF');
        setRenderingError(err);
        
        if (onError) {
          onError(err);
        }
      }
      
      // Return a cleanup function for this render
      return () => {
        isRendering = false;
      };
    };
    
    // Use a more robust approach to handle rendering
    const startRender = async () => {
      if (cleanupRender) {
        cleanupRender();
        cleanupRender = undefined;
      }
      
      if (!pdfDocument || !contentCanvasRef.current || !mounted) return;
      
      console.log(`Initiating render for page ${currentPage} at scale ${scale}`);
      setRenderingError(null);
      
      // Use setTimeout to ensure we're not in the middle of a React render cycle
      setTimeout(async () => {
        if (!mounted) return;
        
        try {
          const cleanup = await renderPage();
          if (mounted) {
            cleanupRender = cleanup;
          } else if (cleanup) {
            cleanup();
          }
        } catch (err) {
          console.error('Failed to start rendering:', err);
        }
      }, 50);
    };
    
    startRender();
    
    return () => {
      mounted = false;
      if (cleanupRender) {
        cleanupRender();
      }
      
      // Cancel any pending render tasks
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
      
      // Clean up page
      if (pageRef.current) {
        try {
          pageRef.current.cleanup();
          pageRef.current = null;
        } catch {
          // Ignore cleanup errors on unmount
        }
      }
    };
  }, [pdfDocument, currentPage, scale]);
  
  // Draw existing redaction areas on the redaction canvas
  useEffect(() => {
    if (!redactionCanvasRef.current || !pageViewport.width || !pageViewport.height) return;
    
    const canvas = redactionCanvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    // Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Get redaction areas for the current page
    const currentPageAreas = redactionAreas.filter(area => area.pageNumber === currentPage);
    
    console.log(`Drawing ${currentPageAreas.length} redaction areas on page ${currentPage}`);
    
    // Draw all redaction areas for the current page
    currentPageAreas.forEach((area, index) => {
      console.log(`Drawing redaction area ${index+1}: (${area.x}, ${area.y}) - ${area.width}x${area.height}`);
      
      // Draw the redaction rectangle with more solid fill
      context.fillStyle = REDACTION_SETTINGS.fillStyle;
      context.fillRect(area.x, area.y, area.width, area.height);
      
      // Add a pattern overlay to ensure text is obscured
      context.fillStyle = 'rgba(0, 0, 0, 0.3)';
      for (let i = 0; i < area.width; i += 6) {
        for (let j = 0; j < area.height; j += 6) {
          context.fillRect(area.x + i, area.y + j, 3, 3);
        }
      }
      
      // Add a border to show the selection
      context.strokeStyle = REDACTION_SETTINGS.strokeStyle;
      context.lineWidth = REDACTION_SETTINGS.lineWidth;
      context.strokeRect(area.x, area.y, area.width, area.height);
    });
    
    // Draw the current area being created
    if (isDrawing && currentArea) {
      console.log(`Drawing active selection: (${currentArea.x}, ${currentArea.y}) - ${currentArea.width}x${currentArea.height}`);
      
      // Draw the current selection with more solid fill
      context.fillStyle = REDACTION_SETTINGS.fillStyle;
      context.fillRect(
        currentArea.x, 
        currentArea.y, 
        currentArea.width, 
        currentArea.height
      );
      
      // Add a pattern overlay to ensure text is obscured
      context.fillStyle = 'rgba(0, 0, 0, 0.3)';
      for (let i = 0; i < Math.abs(currentArea.width); i += 6) {
        for (let j = 0; j < Math.abs(currentArea.height); j += 6) {
          context.fillRect(
            currentArea.x + (currentArea.width > 0 ? i : -Math.abs(currentArea.width) + i), 
            currentArea.y + (currentArea.height > 0 ? j : -Math.abs(currentArea.height) + j), 
            3, 3
          );
        }
      }
      
      // Add a border
      context.strokeStyle = REDACTION_SETTINGS.strokeStyle;
      context.lineWidth = REDACTION_SETTINGS.lineWidth;
      context.strokeRect(
        currentArea.x, 
        currentArea.y, 
        currentArea.width, 
        currentArea.height
      );
    }
  }, [redactionAreas, currentPage, isDrawing, currentArea, pageViewport]);
  
  // Mouse handlers for drawing redaction areas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!enableDrawing || !redactionCanvasRef.current) return;
    
    const rect = redactionCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    console.log(`Mouse down at canvas coordinates: (${x}, ${y})`);
    
    setIsDrawing(true);
    setStartPos({ x, y });
    
    // Create initial selection point
    setCurrentArea({
      pageNumber: currentPage,
      x,
      y,
      width: 0,
      height: 0
    });
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos || !redactionCanvasRef.current) return;
    
    const rect = redactionCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Update current area
    setCurrentArea({
      pageNumber: currentPage,
      x: startPos.x,
      y: startPos.y,
      width: x - startPos.x,
      height: y - startPos.y
    });
  };
  
  const handleMouseUp = () => {
    if (!isDrawing || !currentArea) {
      setIsDrawing(false);
      return;
    }
    
    console.log(`Mouse up: Selection finished with dimensions: ${Math.abs(currentArea.width)}x${Math.abs(currentArea.height)}`);
    
    // Only add if area has some size
    const minSize = REDACTION_SETTINGS.minSelectionSize;
    if (Math.abs(currentArea.width) > minSize && 
        Math.abs(currentArea.height) > minSize) {
      
      // Normalize the area (ensure width/height are positive)
      const normalizedArea = {
        ...currentArea,
        x: currentArea.width < 0 
          ? currentArea.x + currentArea.width 
          : currentArea.x,
        y: currentArea.height < 0 
          ? currentArea.y + currentArea.height 
          : currentArea.y,
        width: Math.abs(currentArea.width),
        height: Math.abs(currentArea.height)
      };
      
      console.log(`Adding normalized redaction area: (${normalizedArea.x}, ${normalizedArea.y}) - ${normalizedArea.width}x${normalizedArea.height} on page ${normalizedArea.pageNumber}`);
      
      // Notify parent component
      onRedactionAreaCreated(normalizedArea);
    } else {
      console.log(`Redaction area too small (${Math.abs(currentArea.width)}x${Math.abs(currentArea.height)}), minimum size is ${minSize}px`);
    }
    
    setIsDrawing(false);
    setCurrentArea(null);
  };

  // Handle touch events for mobile devices
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!enableDrawing || !redactionCanvasRef.current || e.touches.length !== 1) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const rect = redactionCanvasRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    setIsDrawing(true);
    setStartPos({ x, y });
    
    setCurrentArea({
      pageNumber: currentPage,
      x,
      y,
      width: 0,
      height: 0
    });
  };
  
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos || !redactionCanvasRef.current || e.touches.length !== 1) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const rect = redactionCanvasRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    setCurrentArea({
      pageNumber: currentPage,
      x: startPos.x,
      y: startPos.y,
      width: x - startPos.x,
      height: y - startPos.y
    });
  };
  
  const handleTouchEnd = () => {
    handleMouseUp(); // Reuse the same logic as mouse up
  };
  
  // Render error message when renderingError exists
  useEffect(() => {
    if (renderingError && onError) {
      onError(renderingError);
    }
  }, [renderingError, onError]);
  
  return (
    <div ref={containerRef} className="relative">
      {/* Container with page style */}
      <div className="pdf-page bg-white shadow-lg rounded border border-gray-200">
        {/* Base canvas for PDF content */}
        <canvas 
          ref={contentCanvasRef}
          className="relative block z-0"
          aria-label="PDF content"
        />
        
        {/* Overlay canvas for redaction areas */}
        <canvas 
          ref={redactionCanvasRef}
          className={`absolute top-0 left-0 z-10 ${enableDrawing ? 'cursor-crosshair' : 'cursor-default'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          role="application"
          aria-label="Redaction drawing area"
        />
      </div>
    </div>
  );
}; 