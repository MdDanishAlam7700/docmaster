import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';
import { ConversionResult, ConverterOptions } from '@/lib/types';
import { changeExtension } from '@/lib/utils';
import { Document, Packer, Paragraph, TextRun, PageBreak } from 'docx';
export { docxToHtml, docxToText, htmlToDocx, textToDocx, textToHtml } from './docx-converter';
export { csvToExcel, excelToCsv, excelToHtml, excelToJson, htmlTableToExcel } from './excel-converter';
export { resizeImage, compressImage, cropImage, convertImageFormat } from './image-converter';

const PDFJS_VERSION = '4.10.38';

function pdfToBlob(bytes: Uint8Array): Blob {
  return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
}

export async function mergePdfs(files: File[]): Promise<ConversionResult> {
  const merged = await PDFDocument.create();
  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const pdf = await PDFDocument.load(bytes);
    const pages = await merged.copyPages(pdf, pdf.getPageIndices());
    pages.forEach(page => merged.addPage(page));
  }
  const bytes = await merged.save();
  return { file: pdfToBlob(bytes), filename: 'merged.pdf', mimeType: 'application/pdf' };
}

export async function splitPdf(file: File, ranges: string, options?: ConverterOptions): Promise<ConversionResult[]> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  const results: ConversionResult[] = [];
  const rangeParts = ranges.split(',').map(r => r.trim());
  const total = rangeParts.length;

  for (let i = 0; i < total; i++) {
    if (options?.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const part = rangeParts[i];
    const newPdf = await PDFDocument.create();
    let pageIndices: number[] = [];

    if (part.includes('-')) {
      const [start, end] = part.split('-').map(n => parseInt(n.trim()) - 1);
      for (let j = start; j <= Math.min(end, pdf.getPageCount() - 1); j++) {
        pageIndices.push(j);
      }
    } else {
      pageIndices = [parseInt(part.trim()) - 1];
    }

    const pages = await newPdf.copyPages(pdf, pageIndices.filter(p => p >= 0 && p < pdf.getPageCount()));
    pages.forEach(page => newPdf.addPage(page));
    const newBytes = await newPdf.save();
    results.push({
      file: new Blob([new Uint8Array(newBytes)], { type: 'application/pdf' }),
      filename: `split-${i + 1}.pdf`,
      mimeType: 'application/pdf',
    });
    options?.onProgress?.(Math.round(((i + 1) / total) * 100), `Processing range ${i + 1} of ${total}`);
  }
  return results;
}

export async function compressPdf(file: File, level: 'low' | 'medium' | 'high'): Promise<ConversionResult> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const compressed = await pdf.save({
    useObjectStreams: level === 'high',
    addDefaultPage: false,
  });
  return {
    file: new Blob([new Uint8Array(compressed)], { type: 'application/pdf' }),
    filename: changeExtension(file.name, 'pdf'),
    mimeType: 'application/pdf',
  };
}

export async function rotatePdf(file: File, angle: number): Promise<ConversionResult> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  const pages = pdf.getPages();
  pages.forEach(page => {
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees(currentRotation + angle));
  });
  const rotated = await pdf.save();
  return {
    file: new Blob([new Uint8Array(rotated)], { type: 'application/pdf' }),
    filename: changeExtension(file.name, 'pdf'),
    mimeType: 'application/pdf',
  };
}

export async function deletePages(file: File, pageNumbers: number[]): Promise<ConversionResult> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  const indices = pageNumbers.map(n => n - 1).filter(i => i >= 0 && i < pdf.getPageCount());
  indices.sort((a, b) => b - a).forEach(i => pdf.removePage(i));
  const modified = await pdf.save();
  return {
    file: new Blob([new Uint8Array(modified)], { type: 'application/pdf' }),
    filename: changeExtension(file.name, 'pdf'),
    mimeType: 'application/pdf',
  };
}

export async function extractPages(file: File, pageNumbers: number[]): Promise<ConversionResult> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  const newPdf = await PDFDocument.create();
  const indices = pageNumbers.map(n => n - 1).filter(i => i >= 0 && i < pdf.getPageCount());
  const pages = await newPdf.copyPages(pdf, indices);
  pages.forEach(page => newPdf.addPage(page));
  const extracted = await newPdf.save();
  return {
    file: new Blob([new Uint8Array(extracted)], { type: 'application/pdf' }),
    filename: changeExtension(file.name, 'pdf'),
    mimeType: 'application/pdf',
  };
}

export async function cropPdf(file: File, top: number, right: number, bottom: number, left: number): Promise<ConversionResult> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  const pages = pdf.getPages();
  pages.forEach(page => {
    const { width, height } = page.getSize();
    page.setCropBox(left, bottom, width - left - right, height - top - bottom);
  });
  const cropped = await pdf.save();
  return {
    file: new Blob([new Uint8Array(cropped)], { type: 'application/pdf' }),
    filename: changeExtension(file.name, 'pdf'),
    mimeType: 'application/pdf',
  };
}

export async function addPageNumbers(file: File, position: 'bottom-center' | 'bottom-left' | 'bottom-right' | 'top-center'): Promise<ConversionResult> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();

  pages.forEach((page, index) => {
    const { width, height } = page.getSize();
    const text = `${index + 1}`;
    const fontSize = 10;
    const textWidth = font.widthOfTextAtSize(text, fontSize);

    let x: number, y: number;
    switch (position) {
      case 'bottom-center': x = (width - textWidth) / 2; y = 30; break;
      case 'bottom-left': x = 30; y = 30; break;
      case 'bottom-right': x = width - textWidth - 30; y = 30; break;
      case 'top-center': x = (width - textWidth) / 2; y = height - 30; break;
      default: x = (width - textWidth) / 2; y = 30;
    }

    page.drawText(text, { x, y, size: fontSize, font, color: rgb(0.3, 0.3, 0.3) });
  });

  const numbered = await pdf.save();
  return {
    file: new Blob([new Uint8Array(numbered)], { type: 'application/pdf' }),
    filename: changeExtension(file.name, 'pdf'),
    mimeType: 'application/pdf',
  };
}

export async function addWatermark(file: File, text: string, opacity: number = 0.3, fontSize: number = 50): Promise<ConversionResult> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pages = pdf.getPages();

  pages.forEach(page => {
    const { width, height } = page.getSize();
    page.drawText(text, {
      x: width / 2 - (font.widthOfTextAtSize(text, fontSize)) / 2,
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(0.7, 0.7, 0.7),
      opacity,
    });
  });

  const watermarked = await pdf.save();
  return {
    file: new Blob([new Uint8Array(watermarked)], { type: 'application/pdf' }),
    filename: changeExtension(file.name, 'pdf'),
    mimeType: 'application/pdf',
  };
}

export async function protectPdf(_file: File, _password: string): Promise<ConversionResult> {
  throw new Error('Password protection is not available in the browser. pdf-lib does not support encryption on the client side.');
}

export async function unlockPdf(file: File, password?: string): Promise<ConversionResult> {
  const bytes = await file.arrayBuffer();
  const loadOptions = password ? { password } as any : {};
  const pdf = await PDFDocument.load(bytes, loadOptions);
  const modified = await pdf.save();
  return {
    file: new Blob([new Uint8Array(modified)], { type: 'application/pdf' }),
    filename: `unlocked_${file.name}`,
    mimeType: 'application/pdf',
  };
}

export async function ocrPdf(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<ConversionResult> {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
  GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.mjs`;
  const { createWorker } = await import('tesseract.js');

  const bytes = await file.arrayBuffer();
  const pdf = await getDocument({ data: bytes }).promise;
  const totalPages = pdf.numPages;

  const worker = await createWorker('eng');
  let fullText = '';

  try {
    for (let i = 1; i <= totalPages; i++) {
      onProgress?.(i, totalPages);

      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;
      await page.render({ canvasContext: ctx, viewport, canvas }).promise;

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error(`Failed to render page ${i} as image.`));
        }, 'image/png');
      });

      const { data: { text } } = await worker.recognize(blob);
      fullText += `--- Page ${i} of ${totalPages} ---\n${text.trim()}\n\n`;
    }
  } finally {
    await worker.terminate();
  }

  return {
    file: new Blob([fullText.trim()], { type: 'text/plain' }),
    filename: changeExtension(file.name, 'txt'),
    mimeType: 'text/plain',
  };
}

export async function flattenPdf(file: File): Promise<ConversionResult> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  const flattened = await pdf.save({ useObjectStreams: false });
  return {
    file: new Blob([new Uint8Array(flattened)], { type: 'application/pdf' }),
    filename: changeExtension(file.name, 'pdf'),
    mimeType: 'application/pdf',
  };
}

export async function pdfToDocx(file: File): Promise<ConversionResult> {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
  GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.mjs`;

  const bytes = await file.arrayBuffer();
  const pdf = await getDocument({ data: bytes }).promise;
  const paragraphs: Paragraph[] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    if (p > 1) {
      paragraphs.push(new Paragraph({ children: [new PageBreak()] }));
    }

    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const items: { str: string; x: number; y: number; height: number; fontName: string }[] = [];

    for (const item of content.items) {
      const it = item as any;
      if (!it.str) continue;
      items.push({
        str: it.str,
        x: it.transform[4],
        y: it.transform[5],
        height: it.height || 12,
        fontName: it.fontName || '',
      });
    }

    const Y_THRESHOLD = 3;
    const lines: typeof items[] = [];
    const sorted = [...items].sort((a, b) => b.y - a.y);

    for (const item of sorted) {
      let placed = false;
      for (const line of lines) {
        if (Math.abs(line[0].y - item.y) < Y_THRESHOLD) {
          line.push(item);
          placed = true;
          break;
        }
      }
      if (!placed) lines.push([item]);
    }

    for (const line of lines) {
      line.sort((a, b) => a.x - b.x);
    }

    for (const line of lines) {
      const textRuns: TextRun[] = [];
      for (const item of line) {
        const fontName = item.fontName;
        const isBold = /\b(Bold|BD|Black)\b/i.test(fontName);
        const isItalic = /\b(Italic|It|Oblique)\b/i.test(fontName);
        const cleanFont = fontName
          .replace(/^[A-Za-z0-9]+\+/, '')
          .replace(/-(Bold|Italic|Regular|BD|It|Oblique|Black|MT).*$/i, '')
          .replace(/[_-]/g, ' ')
          .trim();

        const size = Math.round((item.height || 12) * 2);

        textRuns.push(new TextRun({
          text: item.str,
          font: cleanFont || undefined,
          size: Math.max(size, 12),
          bold: isBold,
          italics: isItalic,
        }));
      }
      if (textRuns.length > 0) {
        paragraphs.push(new Paragraph({ children: textRuns }));
      }
    }
  }

  if (paragraphs.length === 0) {
    paragraphs.push(new Paragraph({ children: [new TextRun({ text: '' })] }));
  }

  const doc = new Document({ sections: [{ children: paragraphs }] });
  const buffer = await Packer.toBuffer(doc);
  return {
    file: new Blob([new Uint8Array(buffer)], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
    filename: changeExtension(file.name, 'docx'),
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
}

export async function extractPdfText(file: File): Promise<ConversionResult> {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
  GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.mjs`;

  const bytes = await file.arrayBuffer();
  const pdf = await getDocument({ data: bytes }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item: any) => item.str).join(' ');
    fullText += `--- Page ${i} ---\n${pageText}\n\n`;
  }

  return {
    file: new Blob([fullText], { type: 'text/plain' }),
    filename: changeExtension(file.name, 'txt'),
    mimeType: 'text/plain',
  };
}

export async function pdfToImages(file: File, format: 'png' | 'jpeg' = 'png', quality: number = 0.95, options?: ConverterOptions): Promise<ConversionResult[]> {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
  GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.mjs`;

  const bytes = await file.arrayBuffer();
  const pdf = await getDocument({ data: bytes }).promise;
  const results: ConversionResult[] = [];
  const total = pdf.numPages;

  for (let i = 1; i <= total; i++) {
    if (options?.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;

    await page.render({ canvasContext: ctx, viewport, canvas }).promise;

    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to render PDF page as image.'));
      }, mimeType, quality);
    });

    results.push({
      file: blob,
      filename: `${changeExtension(file.name, '')}_page-${i}.${format}`,
      mimeType,
    });
    options?.onProgress?.(Math.round((i / total) * 100), `Rendering page ${i} of ${total}`);
  }

  return results;
}

export async function imagesToPdf(files: File[], options?: ConverterOptions): Promise<ConversionResult> {
  const { default: jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const total = files.length;

  for (let i = 0; i < total; i++) {
    if (options?.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    if (i > 0) pdf.addPage();
    const bytes = await files[i].arrayBuffer();
    const img = await createImageBitmap(new Blob([bytes]));
    const ratio = Math.min(210 / img.width, 297 / img.height);
    const w = img.width * ratio;
    const h = img.height * ratio;
    const x = (210 - w) / 2;
    const y = (297 - h) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    img.close();
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(dataUrl, 'JPEG', x, y, w, h);
    options?.onProgress?.(Math.round(((i + 1) / total) * 100), `Processing image ${i + 1} of ${total}`);
  }

  const buffer = pdf.output('arraybuffer');
  const blob = new Blob([new Uint8Array(buffer)], { type: 'application/pdf' });
  return {
    file: blob,
    filename: 'images.pdf',
    mimeType: 'application/pdf',
  };
}

export async function imageToText(file: File): Promise<ConversionResult> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng');
  const bytes = await file.arrayBuffer();
  const blob = new Blob([bytes]);
  const { data: { text } } = await worker.recognize(blob);
  await worker.terminate();

  return {
    file: new Blob([text], { type: 'text/plain' }),
    filename: changeExtension(file.name, 'txt'),
    mimeType: 'text/plain',
  };
}
