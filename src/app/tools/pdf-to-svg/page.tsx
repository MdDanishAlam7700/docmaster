'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { FileCode } from 'lucide-react';
import { pdfToSvg } from '@/lib/converters';
import { UploadedFile, ConversionResult, ConverterOptions } from '@/lib/types';

export default function PdfToSvgPage() {
  const handleConvert = async (files: UploadedFile[], opts?: ConverterOptions): Promise<ConversionResult[]> => {
    return pdfToSvg(files[0].file, opts);
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
