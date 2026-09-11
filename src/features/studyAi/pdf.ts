/**
 * Adapted for Vite from MK-QuizFlow src/lib/pdf.ts.
 * Copyright (c) 2026 Kazi Musharraf, MIT License. CampusFlow modifications:
 * use Vite's worker URL and return the shared ExtractedPage shape.
 */
import type { ExtractedPage } from './models';

export const MAX_PDF_BYTES = 10 * 1024 * 1024;

export function validatePdfFile(file: File): string | null {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) return 'That file is not a PDF.';
  if (file.size === 0) return 'This file is empty.';
  if (file.size > MAX_PDF_BYTES) return 'This PDF is larger than 10 MB.';
  return null;
}

export async function extractPdf(file: File): Promise<ExtractedPage[]> {
  const error = validatePdfFile(file);
  if (error) throw new Error(error);
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
  const loadingTask = pdfjs.getDocument({ data: await file.arrayBuffer() });
  const document = await loadingTask.promise;
  const pages: ExtractedPage[] = [];
  try {
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items.map((item) => ('str' in item ? item.str : '')).join(' ').replace(/\s+/g, ' ').trim();
      pages.push({ pageNumber, text });
      page.cleanup();
    }
  } finally {
    await loadingTask.destroy();
  }
  return pages;
}

export const hasExtractableText = (pages: ExtractedPage[]) => pages.reduce((total, page) => total + page.text.length, 0) >= 20;
