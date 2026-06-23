'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { FileText } from 'lucide-react';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function TextToPdfPage() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    const text = await files[0].file.text();
    const { default: jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const lines = pdf.splitTextToSize(text, 180);
    pdf.setFontSize(12);
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
      title="Text to PDF"
      description="Convert plain text files to PDF."
      icon={<FileText className="h-7 w-7" />}
      multiple={false}
      accept={{ 'text/plain': ['.txt'] }}
      onConvert={handleConvert}
    />
  );
}
