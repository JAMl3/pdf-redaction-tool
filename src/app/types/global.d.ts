import type * as PDFJSLib from 'pdfjs-dist';

declare global {
  interface Window {
    pdfjsWorker: Record<string, unknown>;
  }
  
  // eslint-disable-next-line no-var
  var pdfjsLib: typeof PDFJSLib;
} 