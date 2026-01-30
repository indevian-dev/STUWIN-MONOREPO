import { PDFDocument } from 'pdf-lib';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
/**
 * Get total number of pages in a PDF
 */
export async function getTotalPages(pdfBuffer: Buffer): Promise<number> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    return pdfDoc.getPageCount();
  } catch (error) {
    ConsoleLogger.error('Error getting PDF page count:', error);
    throw new Error('Failed to extract page count from PDF');
  }
}

/**
 * Extract text from PDF
 * Note: pdf-lib doesn't extract text, this is a placeholder
 * For PDF with text extraction, we rely on Gemini API
 */
export async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();
    return `PDF document with ${pageCount} pages. Text extraction handled by Gemini AI.`;
  } catch (error) {
    ConsoleLogger.error('Error loading PDF:', error);
    throw new Error('Failed to load PDF');
  }
}

