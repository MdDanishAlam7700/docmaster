'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { FileText } from 'lucide-react';
import { docxToHtml } from '@/lib/converters/docx-converter';
import { renderHtmlToPdf } from '@/lib/converters/html-to-pdf';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function WordToPdfPage() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    const htmlResult = await docxToHtml(files[0].file);
    const html = await htmlResult.file.text();
    return renderHtmlToPdf(html, files[0].name);
  };

  return (
    <ToolPageTemplate
      title="Word to PDF"
      description="Convert Word documents to PDF with full formatting preserved."
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
