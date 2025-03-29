/**
 * Represents a rectangular area in a PDF for redaction
 */
export interface RedactionArea {
  /** Page number (1-indexed) */
  pageNumber: number;
  /** X-coordinate from left edge */
  x: number;
  /** Y-coordinate from top edge */
  y: number;
  /** Width of the redaction area */
  width: number;
  /** Height of the redaction area */
  height: number;
}

/**
 * Options for configuring redaction appearance and behavior
 */
export interface RedactionOptions {
  /** Color to use for redaction (hex format) */
  color: string;
  /** Opacity of the redaction (0-1) */
  opacity: number;
  /** Whether to remove the underlying content */
  removeContent: boolean;
  /** Whether to add a redaction annotation */
  addAnnotation: boolean;
}

/**
 * PDF document information
 */
export interface PdfInfo {
  /** Title of the PDF */
  title?: string;
  /** Author of the PDF */
  author?: string;
  /** Number of pages in the document */
  pageCount: number;
  /** Whether the PDF is encrypted */
  isEncrypted: boolean;
}

/**
 * PDF operation status with generic result type
 */
export interface PdfOperationStatus<T = unknown> {
  /** Whether the operation was successful */
  success: boolean;
  /** Error message if the operation failed */
  error?: string;
  /** Result data from the operation */
  result: T | null;
} 