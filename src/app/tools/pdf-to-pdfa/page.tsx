'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { FileBadge } from 'lucide-react';
import { PDFDocument, rgb } from 'pdf-lib';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function PdfToPdfaPage() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    const bytes = await files[0].file.arrayBuffer();
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const saved = await pdf.save({ useObjectStreams: false });
    return {
      file: new Blob([new Uint8Array(saved)], { type: 'application/pdf' }),
      filename: files[0].name.replace(/\.[^.]+$/, '_pdfa.pdf'),
      mimeType: 'application/pdf',
    };
  };

  return (
    <ToolPageTemplate
      title="PDF to PDF/A"
      description="Convert standard PDF to PDF/A-1b compliant format for long-term archiving."
      icon={<FileBadge className="h-7 w-7" />}
      multiple={false}
      accept={{ 'application/pdf': ['.pdf'] }}
      onConvert={handleConvert}
    />
  );
}
