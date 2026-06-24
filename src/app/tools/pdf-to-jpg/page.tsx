'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { Image } from 'lucide-react';
import { pdfToImages } from '@/lib/converters';
import { UploadedFile, ConversionResult, ConverterOptions } from '@/lib/types';

export default function PdfToJpgPage() {
  const handleConvert = async (files: UploadedFile[], opts?: ConverterOptions): Promise<ConversionResult | ConversionResult[]> => {
    return pdfToImages(files[0].file, 'jpeg', 0.95, opts);
  };

  return (
    <ToolPageTemplate
      title="PDF to JPG"
      description="Convert PDF pages to JPEG images."
      icon={<Image className="h-7 w-7" />}
      multiple={false}
      accept={{ 'application/pdf': ['.pdf'] }}
      onConvert={handleConvert}
    />
  );
}
