/**
 * Base error class for PDF-related errors
 */
export class PdfError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'PdfError';
    
    // Maintain the stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error thrown when loading a PDF fails
 */
export class PdfLoadError extends PdfError {
  constructor(message: string, originalError?: Error) {
    super(message, originalError);
    this.name = 'PdfLoadError';
  }
}

/**
 * Error thrown when rendering a PDF fails
 */
export class PdfRenderError extends PdfError {
  constructor(message: string, originalError?: Error) {
    super(message, originalError);
    this.name = 'PdfRenderError';
  }
}

/**
 * Error thrown when PDF worker initialization fails
 */
export class PdfWorkerError extends PdfError {
  constructor(message: string, originalError?: Error) {
    super(message, originalError);
    this.name = 'PdfWorkerError';
  }
}

/**
 * Error thrown when redacting a PDF fails
 */
export class PdfRedactionError extends PdfError {
  constructor(message: string, originalError?: Error) {
    super(message, originalError);
    this.name = 'PdfRedactionError';
  }
} 