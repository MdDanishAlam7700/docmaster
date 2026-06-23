'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { Code } from 'lucide-react';
import { renderHtmlToPdf } from '@/lib/converters/html-to-pdf';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function HtmlToPdfPage() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    const html = await files[0].file.text();
    return renderHtmlToPdf(html, files[0].name);
  };

  return (
    <ToolPageTemplate
      title="HTML to PDF"
      description="Convert HTML web pages to PDF with full formatting preserved."
      icon={<Code className="h-7 w-7" />}
      multiple={false}
      accept={{ 'text/html': ['.html', '.htm'] }}
      onConvert={handleConvert}
    />
  );
}
