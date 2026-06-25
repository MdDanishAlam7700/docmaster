'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { FileSpreadsheet } from 'lucide-react';
import { UploadedFile, ConversionResult, ConverterOptions } from '@/lib/types';

export default function ExcelToPdfPage() {
  const handleConvert = async (files: UploadedFile[], opts?: ConverterOptions): Promise<ConversionResult> => {
    // ── 1. Parse Excel → typed model ────────────────────────────────────────
    const { parseExcelToModel } = await import('@/lib/converters/excel-to-model');
    const model = await parseExcelToModel(files[0].file);
    opts?.onProgress?.(20, 'Parsed spreadsheet data');

    // ── 2. Render the model via React component → canvas ────────────────────
    // React's layout engine handles column widths, merged cells, borders, etc.
    const { createElement } = await import('react');
    const { SpreadsheetRenderer } = await import('@/components/renderers/SpreadsheetRenderer');
    const { captureComponent, canvasToBlob } = await import('@/lib/converters/render-capture');

    const { canvas, widthPx, heightPx } = await captureComponent(
      createElement(SpreadsheetRenderer, { model }),
      { scale: 2, maxWidthPx: 2000 },
    );
    opts?.onProgress?.(70, 'Rendered spreadsheet');

    // ── 3. Detect orientation from rendered content aspect ratio ─────────────
    const isLandscape = widthPx > heightPx * 0.9;

    // ── 4. Build PDF with jsPDF ──────────────────────────────────────────────
    const { default: jsPDF } = await import('jspdf');

    const marginMm = 8;
    const pageWmm = isLandscape ? 297 : 210;
    const pageHmm = isLandscape ? 210 : 297;

    // Available content area in mm → px (1mm = 3.7795px at 96dpi)
    const availW = (pageWmm - marginMm * 2) * 3.7795;
    const availH = (pageHmm - marginMm * 2) * 3.7795;

    // Scale image to fit within page
    const scaleW = Math.min(1, availW / widthPx);
    const scaleH = Math.min(1, availH / heightPx);
    const fitScale = Math.min(scaleW, scaleH);

    const imgWmm = (widthPx * fitScale) / 3.7795;
    const imgHmm = (heightPx * fitScale) / 3.7795;

    // How many pages does the content need?
    const pagesNeeded = Math.ceil(heightPx / (availH / fitScale));

    const pdf = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [pageWmm, pageHmm],
    });

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

    if (pagesNeeded <= 1) {
      // Single page — center vertically
      const yOffset = (pageHmm - imgHmm) / 2;
      pdf.addImage(dataUrl, 'JPEG', marginMm, yOffset, imgWmm, imgHmm);
    } else {
      // Multi-page — slice the canvas at page boundaries
      const sliceHeightPx = Math.round(availH / fitScale);
      for (let page = 0; page < pagesNeeded; page++) {
        if (page > 0) pdf.addPage([pageWmm, pageHmm]);

        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        const sliceHeightCanvas = Math.min(
          Math.round(sliceHeightPx * 2), // ×2 because scale=2
          canvas.height - page * Math.round(sliceHeightPx * 2),
        );
        sliceCanvas.height = sliceHeightCanvas;
        const ctx = sliceCanvas.getContext('2d')!;
        ctx.drawImage(
          canvas,
          0, page * Math.round(sliceHeightPx * 2),
          canvas.width, sliceHeightCanvas,
          0, 0,
          canvas.width, sliceHeightCanvas,
        );
        const sliceUrl = sliceCanvas.toDataURL('image/jpeg', 0.95);
        const sliceHmm = (sliceHeightCanvas / 2) / 3.7795 * fitScale;
        pdf.addImage(sliceUrl, 'JPEG', marginMm, marginMm, imgWmm, sliceHmm);
      }
    }

    opts?.onProgress?.(100, 'Done');

    const pdfBlob = pdf.output('blob');
    return {
      file: pdfBlob,
      filename: files[0].name.replace(/\.[^.]+$/, '.pdf'),
      mimeType: 'application/pdf',
    };
  };

  return (
    <ToolPageTemplate
      title="Excel to PDF"
      description="Convert Excel spreadsheets to PDF — every cell border, fill color, merged cell, column width, and font is preserved exactly as in Excel."
      icon={<FileSpreadsheet className="h-7 w-7" />}
      multiple={false}
      accept={{
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        'application/vnd.ms-excel': ['.xls'],
        'text/csv': ['.csv'],
      }}
      onConvert={handleConvert}
    />
  );
}
