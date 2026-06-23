'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { FileCode } from 'lucide-react';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function PdfToSvgPage() {
  const handleConvert = async (_files: UploadedFile[]): Promise<ConversionResult> => {
    throw new Error('PDF to SVG conversion requires server-side processing. Try the PDF to JPG or PDF to PNG tool instead.');
  };

  return (
    <ToolPageTemplate
      title="PDF to SVG"
      description="Convert PDF to scalable SVG vector graphics."
      icon={<FileCode className="h-7 w-7" />}
      multiple={false}
      accept={{ 'application/pdf': ['.pdf'] }}
      onConvert={handleConvert}
    />
  );
}
