'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { FileText } from 'lucide-react';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function WordToPdfPage() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    // ── 1. Convert DOCX → HTML via mammoth ───────────────────────────────────
    // mammoth faithfully preserves paragraph structure, headings, tables,
    // lists, and inline bold/italic.  We use the bodyHtml (.value) directly —
    // not the full HTML document — so we can wrap it in DocumentRenderer.
    const mammoth = await import('mammoth');
    const bytes = await files[0].file.arrayBuffer();
    const { value: bodyHtml } = await mammoth.convertToHtml({ arrayBuffer: bytes });

    // ── 2. Render via DocumentRenderer (React component) ─────────────────────
    // DocumentRenderer injects scoped print-grade CSS (tables with borders,
    // heading hierarchy, list indentation) and renders the mammoth HTML inside
    // an A4-proportioned container.  No app Tailwind variables leak in.
    const { createElement } = await import('react');
    const { DocumentRenderer } = await import('@/components/renderers/DocumentRenderer');
    const { captureComponent } = await import('@/lib/converters/render-capture');

    const { canvas, widthPx, heightPx } = await captureComponent(
      createElement(DocumentRenderer, { bodyHtml }),
      { scale: 2, maxWidthPx: 900 }, // A4 at 96dpi is ~794px; 900px gives breathing room
    );

    // ── 3. Build PDF with jsPDF ───────────────────────────────────────────────
    const { default: jsPDF } = await import('jspdf');

    const marginMm = 15;       // Word default is ~25mm; 15mm gives more content
    const pageWmm = 210;       // A4 portrait
    const pageHmm = 297;

    const availWmm = pageWmm - marginMm * 2;   // 180mm
    const availHmm = pageHmm - marginMm * 2;   // 267mm

    const availWpx = availWmm * 3.7795;
    const availHpx = availHmm * 3.7795;

    // Scale to fit width (Word docs are always portrait, so width is the constraint)
    const fitScale = Math.min(1, availWpx / widthPx);
    const imgWmm = (widthPx * fitScale) / 3.7795;
    const imgHmm = (heightPx * fitScale) / 3.7795;

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const sliceHpx = availHpx / fitScale; // content height per PDF page in canvas-px
    const totalPages = Math.ceil(heightPx / sliceHpx);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) pdf.addPage('a4', 'portrait');

      const srcY = Math.round(page * sliceHpx * 2); // ×2 for scale=2 canvas
      const srcH = Math.min(
        Math.round(sliceHpx * 2),
        canvas.height - srcY,
      );
      if (srcH <= 0) break;

      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = srcH;
      const ctx = sliceCanvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
      ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

      const sliceUrl = sliceCanvas.toDataURL('image/jpeg', 0.95);
      // Actual rendered mm height for this slice
      const sliceHmm = (srcH / 2) / 3.7795 * fitScale;
      pdf.addImage(sliceUrl, 'JPEG', marginMm, marginMm, imgWmm, sliceHmm);
    }

    const pdfBlob = pdf.output('blob');
    return {
      file: pdfBlob,
      filename: files[0].name.replace(/\.[^.]+$/, '.pdf'),
      mimeType: 'application/pdf',
    };
  };

  return (
    <ToolPageTemplate
      title="Word to PDF"
      description="Convert Word documents to PDF — tables with borders, headings, lists, and inline formatting are all preserved."
      icon={<FileText className="h-7 w-7" />}
      multiple={false}
      accept={{
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        'application/msword': ['.doc'],
      }}
      onConvert={handleConvert}
    />
  );
}
