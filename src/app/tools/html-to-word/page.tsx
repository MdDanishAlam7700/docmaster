'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { FileText } from 'lucide-react';
import { htmlToDocx } from '@/lib/converters/docx-converter';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function HtmlToWordPage() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    const html = await files[0].file.text();
    return htmlToDocx(html, files[0].name);
  };

  return (
    <ToolPageTemplate
      title="HTML to Word"
      description="Convert HTML pages to Word documents."
      icon={<FileText className="h-7 w-7" />}
      multiple={false}
      accept={{ 'text/html': ['.html', '.htm'] }}
      onConvert={handleConvert}
    />
  );
}
