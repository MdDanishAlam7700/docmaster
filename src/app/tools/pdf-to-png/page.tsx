'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { Image } from 'lucide-react';
import { pdfToImages } from '@/lib/converters';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function PdfToPngPage() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult | ConversionResult[]> => {
    return pdfToImages(files[0].file, 'png');
  };

  return (
    <ToolPageTemplate
      title="PDF to PNG"
      description="Convert PDF pages to high-quality PNG images."
      icon={<Image className="h-7 w-7" />}
      multiple={false}
      accept={{ 'application/pdf': ['.pdf'] }}
      onConvert={handleConvert}
    />
  );
}
