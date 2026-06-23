'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { FileText } from 'lucide-react';
import { docxToHtml } from '@/lib/converters/docx-converter';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function WordToPdfPage() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    const htmlResult = await docxToHtml(files[0].file);
    const html = await htmlResult.file.text();
    const { default: jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const lines = pdf.splitTextToSize(html.replace(/<[^>]*>/g, ''), 180);
    pdf.text(lines, 15, 15);
    const blob = new Blob([pdf.output('arraybuffer')], { type: 'application/pdf' });
    return {
      file: blob,
      filename: files[0].name.replace(/\.[^.]+$/, '.pdf'),
      mimeType: 'application/pdf',
    };
  };

  return (
    <ToolPageTemplate
      title="Word to PDF"
      description="Convert Word documents to PDF format."
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
