'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { Code } from 'lucide-react';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function HtmlToPdfPage() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    const html = await files[0].file.text();
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const parser = new DOMParser();
    const parsed = parser.parseFromString(html, 'text/html');
    const text = parsed.body.textContent || '';
    const lines = doc.splitTextToSize(text.replace(/\s+/g, ' ').trim(), 180);
    doc.setFontSize(11);
    doc.text(lines, 15, 15);
    const blob = new Blob([doc.output('arraybuffer')], { type: 'application/pdf' });
    return {
      file: blob,
      filename: files[0].name.replace(/\.[^.]+$/, '.pdf'),
      mimeType: 'application/pdf',
    };
  };

  return (
    <ToolPageTemplate
      title="HTML to PDF"
      description="Convert HTML web pages to PDF documents."
      icon={<Code className="h-7 w-7" />}
      multiple={false}
      accept={{ 'text/html': ['.html', '.htm'] }}
      onConvert={handleConvert}
    />
  );
}
