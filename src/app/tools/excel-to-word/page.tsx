'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { ArrowRightLeft } from 'lucide-react';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function ExcelToWordPage() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    // ── 1. Parse Excel → typed SpreadsheetModel ──────────────────────────────
    const { parseExcelToModel } = await import('@/lib/converters/excel-to-model');
    const model = await parseExcelToModel(files[0].file);

    // ── 2. Render model via SpreadsheetRenderer → html2canvas ────────────────
    const { createElement } = await import('react');
    const { SpreadsheetRenderer } = await import('@/components/renderers/SpreadsheetRenderer');
    const { captureComponent, canvasToUint8Array } = await import('@/lib/converters/render-capture');

    const { canvas, widthPx, heightPx } = await captureComponent(
      createElement(SpreadsheetRenderer, { model }),
      { scale: 2, maxWidthPx: 2000 },
    );

    // ── 3. Export canvas to JPEG bytes ───────────────────────────────────────
    const imageData = await canvasToUint8Array(canvas, 'image/jpeg', 0.92);

    // ── 4. Size the DOCX page to the content dimensions ──────────────────────
    // A4 content area: 595pt wide (210mm) with 36pt margins = 523pt content
    const MAX_CONTENT_PT = 523;
    const MAX_CONTENT_PX = Math.round(MAX_CONTENT_PT * 96 / 72); // ≈ 697px

    const fitScale = widthPx > MAX_CONTENT_PX ? MAX_CONTENT_PX / widthPx : 1;
    const finalWpx = Math.round(widthPx * fitScale);
    const finalHpx = Math.round(heightPx * fitScale);

    // Convert px to twips for DOCX (1 CSS px = 72/96 pt = 15 twips)
    const finalWtwips = Math.round(finalWpx * 15);
    const finalHtwips = Math.round(finalHpx * 15);

    // Page size = content + margins (36pt = 720 twips each side)
    const MARGIN_TWIPS = 720;
    const pageWtwips = finalWtwips + MARGIN_TWIPS * 2;
    const pageHtwips = Math.max(16838, finalHtwips + MARGIN_TWIPS * 2); // min A4 height

    // ── 5. Build DOCX with one ImageRun per page ─────────────────────────────
    const { Document, Packer, Paragraph, ImageRun } = await import('docx');

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: { width: pageWtwips, height: pageHtwips },
            margin: {
              top: MARGIN_TWIPS,
              right: MARGIN_TWIPS,
              bottom: MARGIN_TWIPS,
              left: MARGIN_TWIPS,
            },
          },
        },
        children: [
          new Paragraph({
            children: [
              new ImageRun({
                data: imageData,
                transformation: { width: finalWpx, height: finalHpx },
                type: 'jpg',
              }),
            ],
            spacing: { before: 0, after: 0 },
          }),
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    const baseName = files[0].name.replace(/\.[^.]+$/, '');

    return {
      file: new Blob([new Uint8Array(buffer)], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }),
      filename: `${baseName}.docx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
  };

  return (
    <ToolPageTemplate
      title="Excel to Word"
      description="Convert Excel spreadsheets to Word — all cell formatting, borders, colors, merged cells, and column widths preserved exactly as in Excel."
      icon={<ArrowRightLeft className="h-7 w-7" />}
      multiple={false}
      accept={{
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        'application/vnd.ms-excel': ['.xls'],
      }}
      onConvert={handleConvert}
    />
  );
}
