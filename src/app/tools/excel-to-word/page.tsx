'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { ArrowRightLeft } from 'lucide-react';
import { excelToHtml } from '@/lib/converters/excel-converter';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function ExcelToWordPage() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    // Step 1: Convert Excel → styled HTML (preserves cell colors, borders, fonts)
    const htmlResult = await excelToHtml(files[0].file);
    const html = await htmlResult.file.text();

    // Step 2: Render the HTML visually using html2canvas (bundled in html2pdf.js)
    // then embed each rendered image in a Word document.
    // This approach preserves 100% visual fidelity: borders, cell fills, merged cells, etc.

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const html2pdfModule = (await import('html2pdf.js' as any)).default as any;
    void html2pdfModule; // We only need html2canvas which is bundled inside it

    // Access html2canvas via the global it registers when html2pdf.js loads
    // html2pdf.js bundles and exposes html2canvas as a named export/global
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let html2canvas: any = (window as any).html2canvas;

    if (!html2canvas) {
      // Fallback: render HTML using a blob URL + iframe screenshot approach
      // Build DOCX directly from the HTML string with full table styling
      const { htmlToDocx } = await import('@/lib/converters/docx-converter');
      return htmlToDocx(html, files[0].name);
    }

    // Create offscreen container with the Excel HTML
    const container = document.createElement('div');
    container.style.cssText = [
      'position:fixed',
      'left:-9999px',
      'top:0',
      'background:#ffffff',
      'padding:0',
      'margin:0',
      'font-family:Arial,Helvetica,sans-serif',
      'font-size:11px',
      'line-height:1.4',
    ].join(';');
    container.innerHTML = html;
    document.body.appendChild(container);

    let imageData: Uint8Array;
    let imgW: number;
    let imgH: number;

    try {
      const canvas: HTMLCanvasElement = await html2canvas(container, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to render Excel sheet'));
        }, 'image/jpeg', 0.92);
      });
      imageData = new Uint8Array(await blob.arrayBuffer());

      // Display size in DOCX pixels (canvas was at 2× so divide by 2)
      imgW = Math.round(canvas.width / 2);
      imgH = Math.round(canvas.height / 2);
    } finally {
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    }

    // Step 3: Embed rendered image into a DOCX document
    const { Document, Packer, Paragraph, ImageRun, SectionType } = await import('docx');

    // Fit within A4 page (595pt wide, 842pt tall) with 36pt margins each side
    const maxWidthPt = 595 - 72; // 523pt available
    const maxWidthPx = Math.round(maxWidthPt * 96 / 72); // ~697px

    let finalW = imgW;
    let finalH = imgH;
    if (finalW > maxWidthPx) {
      const ratio = maxWidthPx / finalW;
      finalW = maxWidthPx;
      finalH = Math.round(finalH * ratio);
    }

    // Page dimensions in twips
    const pageWidthTwips = Math.round(595 * 20);  // A4 width
    const pageHeightTwips = Math.round(Math.max(842, finalH * 72 / 96 + 72) * 20); // dynamic height
    const marginTwips = Math.round(36 * 20); // 36pt margins

    const doc = new Document({
      sections: [{
        properties: {
          type: SectionType.CONTINUOUS,
          page: {
            size: { width: pageWidthTwips, height: pageHeightTwips },
            margin: { top: marginTwips, right: marginTwips, bottom: marginTwips, left: marginTwips },
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
      description="Convert Excel spreadsheets to Word documents with full formatting — cell colors, borders, merged cells, and fonts preserved."
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
