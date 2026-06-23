'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { Wrench } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function RepairPdf() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    const bytes = await files[0].file.arrayBuffer();
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const repaired = await pdf.save({ useObjectStreams: false });
    const uint8 = new Uint8Array(repaired);
    return {
      file: new Blob([uint8], { type: 'application/pdf' }),
      filename: files[0].name,
      mimeType: 'application/pdf',
    };
  };

  return (
    <ToolPageTemplate
      title="Repair PDF"
      description="Attempt to repair corrupted or damaged PDF files by reconstructing their internal structure."
      icon={<Wrench className="h-7 w-7" />}
      multiple={false}
      accept={{ 'application/pdf': ['.pdf'] }}
      onConvert={handleConvert}
    />
  );
}
