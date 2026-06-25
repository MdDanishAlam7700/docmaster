'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { Code } from 'lucide-react';
import { UploadedFile, ConversionResult, ConverterOptions } from '@/lib/types';

const PDFJS_VERSION = '6.0.227';

export default function PdfToHtmlPage() {
  const handleConvert = async (files: UploadedFile[], opts?: ConverterOptions): Promise<ConversionResult> => {
    const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
    GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.mjs`;

    const file = files[0].file;
    const bytes = await file.arrayBuffer();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pdf: any = null;

    try {
      pdf = await getDocument({ data: bytes }).promise;
      const total = pdf.numPages;
      const pageSections: string[] = [];

      for (let i = 1; i <= total; i++) {
        if (opts?.signal?.aborted) throw new DOMException('Aborted', 'AbortError');

        const page = await pdf.getPage(i);
        // Render at 1.5× — good balance of quality vs file size for HTML embedding
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;

        // White background for pages that may be transparent
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvasContext: ctx, viewport, canvas }).promise;

        // Embed as PNG for lossless quality (logos, text stay crisp)
        const dataUrl = canvas.toDataURL('image/png');

        // Natural page display width in CSS pixels (at 1× scale = 96dpi-equivalent)
        const displayWidth = Math.round(viewport.width / 1.5);
        const displayHeight = Math.round(viewport.height / 1.5);

        pageSections.push(`
    <section class="page" style="width:${displayWidth}px;height:${displayHeight}px">
      <img src="${dataUrl}" width="${displayWidth}" height="${displayHeight}" alt="Page ${i}" loading="lazy">
      <div class="page-label">Page ${i}</div>
    </section>`);

        opts?.onProgress?.(Math.round((i / total) * 100), `Rendering page ${i} of ${total}`);
      }

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${files[0].name} — Converted</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #525659;
      font-family: Arial, Helvetica, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 16px;
      gap: 24px;
    }
    header {
      color: #fff;
      text-align: center;
      font-size: 14px;
      opacity: 0.7;
    }
    .page {
      position: relative;
      background: #fff;
      box-shadow: 0 4px 24px rgba(0,0,0,0.45);
      overflow: hidden;
    }
    .page img {
      display: block;
      width: 100%;
      height: 100%;
    }
    .page-label {
      position: absolute;
      bottom: 6px;
      right: 8px;
      font-size: 11px;
      color: rgba(0,0,0,0.35);
      pointer-events: none;
    }
  </style>
</head>
<body>
  <header>${files[0].name} &mdash; ${total} page${total !== 1 ? 's' : ''} &mdash; Converted ${new Date().toLocaleDateString()}</header>
  ${pageSections.join('\n')}
</body>
</html>`;

      return {
        file: new Blob([html], { type: 'text/html' }),
        filename: files[0].name.replace(/\.[^.]+$/, '.html'),
        mimeType: 'text/html',
      };
    } finally {
      if (pdf) await pdf.destroy();
    }
  };

  return (
    <ToolPageTemplate
      title="PDF to HTML"
      description="Convert PDF to an HTML web page with full visual fidelity — preserves shapes, images, colors, and layout."
      icon={<Code className="h-7 w-7" />}
      multiple={false}
      accept={{ 'application/pdf': ['.pdf'] }}
      onConvert={handleConvert}
    />
  );
}
