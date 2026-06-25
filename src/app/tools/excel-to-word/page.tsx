'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { ArrowRightLeft } from 'lucide-react';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function ExcelToWordPage() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    const { excelToHtml } = await import('@/lib/converters/excel-converter');
    const { renderHtmlToCanvas } = await import('@/lib/converters/html-to-pdf');
    const { Document, Packer, Paragraph, ImageRun } = await import('docx');

    // Step 1: Convert Excel → richly styled HTML (cell colors, borders,
    //         merged cells, column widths, row heights, font styles)
    const htmlResult = await excelToHtml(files[0].file);
    const html = await htmlResult.file.text();

    // Step 2: Render the HTML visually using html2canvas (standalone package).
    //         This captures the exact visual appearance — borders, fills, etc.
    const canvas = await renderHtmlToCanvas(html, { scale: 2, maxWidthPx: 1200 });

    // Step 3: Export canvas to JPEG
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Canvas render failed'))),
        'image/jpeg',
        0.92,
      );
    });
    const imageData = new Uint8Array(await blob.arrayBuffer());

    // Step 4: Compute display size in DOCX
    // Canvas was rendered at 2× scale, so display size = canvas / 2
    const imgW = Math.round(canvas.width / 2);
    const imgH = Math.round(canvas.height / 2);

    // Fit within A4 page content area (595pt - 2×36pt margins = 523pt)
    // 1 pt = 96/72 px at screen resolution
    const maxWidthPx = Math.round(523 * 96 / 72);  // ≈ 697px
    const scale = imgW > maxWidthPx ? maxWidthPx / imgW : 1;
    const finalW = Math.round(imgW * scale);
    const finalH = Math.round(imgH * scale);

    // Step 5: DOCX page dimensions in twips (1pt = 20 twips)
    //         Use A4 portrait with 36pt (half-inch) margins
    const A4_W_TWIPS = 11906;   // 210mm × 56.69 twips/mm
    const A4_H_TWIPS = Math.max(16838, Math.round((finalH * 72 / 96 + 72) * 20));
    const MARGIN_TWIPS = 720;   // 36pt × 20 = 720 twips

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: { width: A4_W_TWIPS, height: A4_H_TWIPS },
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
                transformation: { width: finalW, height: finalH },
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
      description="Convert Excel spreadsheets to Word — all cell formatting, borders, colors, merged cells, and column widths are preserved."
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
