'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { Code } from 'lucide-react';
import { UploadedFile, ConversionResult } from '@/lib/types';

const PDFJS_VERSION = '4.10.38';

export default function PdfToHtmlPage() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
    GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.mjs`;
    const bytes = await files[0].file.arrayBuffer();
    const pdf = await getDocument({ data: bytes }).promise;
    const pageContents: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const text = textContent.items.map((item: any) => item.str).join(' ');
      pageContents.push(`<h2>Page ${i}</h2><p>${text.replace(/\n/g, '<br>')}</p>`);
    }
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${files[0].name} - Converted</title>
  <style>body{font-family:sans-serif;max-width:800px;margin:0 auto;padding:20px;line-height:1.6}h2{color:#333;border-bottom:1px solid #ddd;padding-bottom:8px}</style>
</head>
<body>
  <h1>${files[0].name}</h1>
  <p class="meta">Converted on ${new Date().toLocaleDateString()}</p>
  ${pageContents.join('\n')}
</body>
</html>`;
    return {
      file: new Blob([html], { type: 'text/html' }),
      filename: files[0].name.replace(/\.[^.]+$/, '.html'),
      mimeType: 'text/html',
    };
  };

  return (
    <ToolPageTemplate
      title="PDF to HTML"
      description="Convert PDF to HTML web page format with preserved text layout."
      icon={<Code className="h-7 w-7" />}
      multiple={false}
      accept={{ 'application/pdf': ['.pdf'] }}
      onConvert={handleConvert}
    />
  );
}
