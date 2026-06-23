'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { Presentation } from 'lucide-react';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function PdfToPowerPointPage() {
  const handleConvert = async (_files: UploadedFile[]): Promise<ConversionResult> => {
    throw new Error('PDF to PowerPoint conversion requires server-side processing and is not available in this browser-only version.');
  };

  return (
    <ToolPageTemplate
      title="PDF to PowerPoint"
      description="Convert PDF pages to PowerPoint slides."
      icon={<Presentation className="h-7 w-7" />}
      multiple={false}
      accept={{ 'application/pdf': ['.pdf'] }}
      onConvert={handleConvert}
    />
  );
}
